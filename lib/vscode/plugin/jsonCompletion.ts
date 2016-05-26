/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';


import Parser from './jsonParser';
import SchemaService from './jsonSchemaService';
import JsonSchema from './jsonSchema';
import {IJSONWorkerContribution} from './jsonContributions';
import TextBuffer from "text-buffer";
const Range = TextBuffer.Range;

export interface ISuggestionsCollector {
	add(suggestion: Suggestion): void;
	error(message:string): void;
	log(message:string): void;
	setAsIncomplete(): void;
}

export interface CompletionList {
    items: Suggestion[],
    isIncomplete: boolean;
}

export class JSONCompletion {

	private schemaService: SchemaService.IJSONSchemaService;
	private contributions: IJSONWorkerContribution[];
	private console: Console;

	constructor(schemaService: SchemaService.IJSONSchemaService, contributions: IJSONWorkerContribution[] = []) {
		this.schemaService = schemaService;
		this.contributions = contributions;
		this.console = console;
	}

	public doResolve(item: Suggestion) : Thenable<Suggestion> {
		for (let i = this.contributions.length - 1; i >= 0; i--) {
			if (this.contributions[i].resolveSuggestion) {
				let resolver = this.contributions[i].resolveSuggestion(item);
				if (resolver) {
					return resolver;
				}
			}
		}
		return Promise.resolve(item);
	}

	public doSuggest(document: Atom.TextEditor, textDocumentPosition: TextDocumentPosition, doc: Parser.JSONDocument): Thenable<CompletionList> {

		let offset = document.offsetAt(textDocumentPosition.position);
		let node = doc.getNodeFromOffsetEndInclusive(offset);

		let currentWord = this.getCurrentWord(document, offset);
		let overwriteRange = null;
		let result: CompletionList = {
			items: [],
			isIncomplete: false
		};

		if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
			overwriteRange = new Range(document.positionAt(node.start), document.positionAt(node.end));
		} else {
			overwriteRange = new Range(document.positionAt(offset - currentWord.length), textDocumentPosition.position);
		}

		let proposed: { [key: string]: boolean } = {};
		let collector: ISuggestionsCollector = {
			add: (suggestion: Suggestion) => {
				if (!proposed[suggestion.text]) {
					proposed[suggestion.text] = true;
					if (overwriteRange) {
						suggestion.text = TextEdit.replace(overwriteRange, suggestion.insertText);
					}

					result.items.push(suggestion);
				}
			},
			setAsIncomplete: () => {
				result.isIncomplete = true;
			},
			error: (message: string) => {
				this.console.error(message);
			},
			log: (message: string) => {
				this.console.log(message);
			}
		};

		return this.schemaService.getSchemaForResource(textDocumentPosition.uri, doc).then((schema) => {
			let collectionPromises: Thenable<any>[] = [];

			let addValue = true;
			let currentKey = '';

			let currentProperty: Parser.PropertyASTNode = null;
			if (node) {

				if (node.type === 'string') {
					let stringNode = <Parser.StringASTNode>node;
					if (stringNode.isKey) {
						addValue = !(node.parent && ((<Parser.PropertyASTNode>node.parent).value));
						currentProperty = node.parent ? <Parser.PropertyASTNode>node.parent : null;
						currentKey = document.getText().substring(node.start + 1, node.end - 1);
						if (node.parent) {
							node = node.parent.parent;
						}
					}
				}
			}

			// proposals for properties
			if (node && node.type === 'object') {
				// don't suggest keys when the cursor is just before the opening curly brace
				if (node.start === offset) {
					return result;
				}
				// don't suggest properties that are already present
				let properties = (<Parser.ObjectASTNode>node).properties;
				properties.forEach(p => {
					if (!currentProperty || currentProperty !== p) {
						proposed[p.key.value] = true;
					}
				});

				let isLast = properties.length === 0 || offset >= properties[properties.length - 1].start;
				if (schema) {
					// property proposals with schema
					this.getPropertySuggestions(schema, doc, node, addValue, isLast, collector);
				} else {
					// property proposals without schema
					this.getSchemaLessPropertySuggestions(doc, node, currentKey, currentWord, isLast, collector);
				}

				let location = node.getNodeLocation();
				this.contributions.forEach((contribution) => {
					let collectPromise = contribution.collectPropertySuggestions(textDocumentPosition.uri, location, currentWord, addValue, isLast, collector);
					if (collectPromise) {
						collectionPromises.push(collectPromise);
					}
				});

			}

			// proposals for values
			if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
				node = node.parent;
			}

			if (schema) {
				// value proposals with schema
				this.getValueSuggestions(schema, doc, node, offset, collector);
			} else {
				// value proposals without schema
				this.getSchemaLessValueSuggestions(doc, node, offset, document, collector);
			}

			if (!node) {
				this.contributions.forEach((contribution) => {
					let collectPromise = contribution.collectDefaultSuggestions(textDocumentPosition.uri, collector);
					if (collectPromise) {
						collectionPromises.push(collectPromise);
					}
				});
			} else {
				if ((node.type === 'property') && offset > (<Parser.PropertyASTNode> node).colonOffset) {
					let parentKey = (<Parser.PropertyASTNode>node).key.value;

					let valueNode = (<Parser.PropertyASTNode> node).value;
					if (!valueNode || offset <= valueNode.end) {
						let location = node.parent.getNodeLocation();
						this.contributions.forEach((contribution) => {
							let collectPromise = contribution.collectValueSuggestions(textDocumentPosition.uri, location, parentKey, collector);
							if (collectPromise) {
								collectionPromises.push(collectPromise);
							}
						});
					}
				}
			}
			return Promise.all(collectionPromises).then(() => result );
		});
	}

	private getPropertySuggestions(schema: SchemaService.ResolvedSchema, doc: Parser.JSONDocument, node: Parser.ASTNode, addValue: boolean, isLast: boolean, collector: ISuggestionsCollector): void {
		let matchingSchemas: Parser.IApplicableSchema[] = [];
		doc.validate(schema.schema, matchingSchemas, node.start);

		matchingSchemas.forEach((s) => {
			if (s.node === node && !s.inverted) {
				let schemaProperties = s.schema.properties;
				if (schemaProperties) {
					Object.keys(schemaProperties).forEach((key: string) => {
						let propertySchema = schemaProperties[key];
						collector.add({ type: "property", displayText: key, text: this.getTextForProperty(key, propertySchema, addValue, isLast), description: propertySchema.description || '' });
					});
				}
			}
		});
	}

	private getSchemaLessPropertySuggestions(doc: Parser.JSONDocument, node: Parser.ASTNode, currentKey: string, currentWord: string, isLast: boolean, collector: ISuggestionsCollector): void {
		let collectSuggestionsForSimilarObject = (obj: Parser.ObjectASTNode) => {
			obj.properties.forEach((p) => {
				let key = p.key.value;
				collector.add({ type: "property", displayText: key, text: this.getTextForSimilarProperty(key, p.value), description: '' });
			});
		};
		if (node.parent) {
			if (node.parent.type === 'property') {
				// if the object is a property value, check the tree for other objects that hang under a property of the same name
				let parentKey = (<Parser.PropertyASTNode>node.parent).key.value;
				doc.visit((n) => {
					if (n.type === 'property' && (<Parser.PropertyASTNode>n).key.value === parentKey && (<Parser.PropertyASTNode>n).value && (<Parser.PropertyASTNode>n).value.type === 'object') {
						collectSuggestionsForSimilarObject(<Parser.ObjectASTNode>(<Parser.PropertyASTNode>n).value);
					}
					return true;
				});
			} else if (node.parent.type === 'array') {
				// if the object is in an array, use all other array elements as similar objects
				(<Parser.ArrayASTNode>node.parent).items.forEach((n) => {
					if (n.type === 'object' && n !== node) {
						collectSuggestionsForSimilarObject(<Parser.ObjectASTNode>n);
					}
				});
			}
		}
		if (!currentKey && currentWord.length > 0) {
			collector.add({ type: "property", displayText: this.getLabelForValue(currentWord), text: this.getTextForProperty(currentWord, null, true, isLast), description: '' });
		}
	}

	private getSchemaLessValueSuggestions(doc: Parser.JSONDocument, node: Parser.ASTNode, offset: number, document: ITextDocument, collector: ISuggestionsCollector): void {
		let collectSuggestionsForValues = (value: Parser.ASTNode) => {
			if (!value.contains(offset)) {
				let content = this.getTextForMatchingNode(value, document);
				collector.add({ type: this.getSuggestionKind(value.type), displayText: content, text: content, description: '' });
			}
			if (value.type === 'boolean') {
				this.addBooleanSuggestion(!value.getValue(), collector);
			}
		};

		if (!node) {
			collector.add({ type: this.getSuggestionKind('object'), displayText: 'Empty object', text: '{\n\t{{}}\n}', description: '' });
			collector.add({ type: this.getSuggestionKind('array'), displayText: 'Empty array', text: '[\n\t{{}}\n]', description: '' });
		} else {
			if (node.type === 'property' && offset > (<Parser.PropertyASTNode>node).colonOffset) {
				let valueNode = (<Parser.PropertyASTNode>node).value;
				if (valueNode && offset > valueNode.end) {
					return;
				}
				// suggest values at the same key
				let parentKey = (<Parser.PropertyASTNode>node).key.value;
				doc.visit((n) => {
					if (n.type === 'property' && (<Parser.PropertyASTNode>n).key.value === parentKey && (<Parser.PropertyASTNode>n).value) {
						collectSuggestionsForValues((<Parser.PropertyASTNode>n).value);
					}
					return true;
				});
			}
			if (node.type === 'array') {
				if (node.parent && node.parent.type === 'property') {
					// suggest items of an array at the same key
					let parentKey = (<Parser.PropertyASTNode>node.parent).key.value;
					doc.visit((n) => {
						if (n.type === 'property' && (<Parser.PropertyASTNode>n).key.value === parentKey && (<Parser.PropertyASTNode>n).value && (<Parser.PropertyASTNode>n).value.type === 'array') {
							((<Parser.ArrayASTNode>(<Parser.PropertyASTNode>n).value).items).forEach((n) => {
								collectSuggestionsForValues(<Parser.ObjectASTNode>n);
							});
						}
						return true;
					});
				} else {
					// suggest items in the same array
					(<Parser.ArrayASTNode>node).items.forEach((n) => {
						collectSuggestionsForValues(<Parser.ObjectASTNode>n);
					});
				}
			}
		}
	}


	private getValueSuggestions(schema: SchemaService.ResolvedSchema, doc: Parser.JSONDocument, node: Parser.ASTNode, offset: number, collector: ISuggestionsCollector): void {

		if (!node) {
			this.addDefaultSuggestion(schema.schema, collector);
		} else {
			let parentKey: string = null;
			if (node && (node.type === 'property') && offset > (<Parser.PropertyASTNode>node).colonOffset) {
				let valueNode = (<Parser.PropertyASTNode>node).value;
				if (valueNode && offset > valueNode.end) {
					return; // we are past the value node
				}
				parentKey = (<Parser.PropertyASTNode>node).key.value;
				node = node.parent;
			}
			if (node && (parentKey !== null || node.type === 'array')) {
				let matchingSchemas: Parser.IApplicableSchema[] = [];
				doc.validate(schema.schema, matchingSchemas, node.start);

				matchingSchemas.forEach((s) => {
					if (s.node === node && !s.inverted && s.schema) {
						if (s.schema.items) {
							this.addDefaultSuggestion(s.schema.items, collector);
							this.addEnumSuggestion(s.schema.items, collector);
						}
						if (s.schema.properties) {
							let propertySchema = s.schema.properties[parentKey];
							if (propertySchema) {
								this.addDefaultSuggestion(propertySchema, collector);
								this.addEnumSuggestion(propertySchema, collector);
							}
						}
					}
				});

			}
		}
	}

	private addBooleanSuggestion(value: boolean, collector: ISuggestionsCollector): void {
		collector.add({ type: this.getSuggestionKind('boolean'), displayText: value ? 'true' : 'false', text: this.getTextForValue(value), description: '' });
	}

	private addNullSuggestion(collector: ISuggestionsCollector): void {
		collector.add({ type: this.getSuggestionKind('null'), displayText: 'null', text: 'null', description: '' });
	}

	private addEnumSuggestion(schema: JsonSchema.IJSONSchema, collector: ISuggestionsCollector): void {
		if (Array.isArray(schema.enum)) {
			schema.enum.forEach((enm) => collector.add({ type: this.getSuggestionKind(schema.type), displayText: this.getLabelForValue(enm), text: this.getTextForValue(enm), description: '' }));
		} else {
			if (this.isType(schema, 'boolean')) {
				this.addBooleanSuggestion(true, collector);
				this.addBooleanSuggestion(false, collector);
			}
			if (this.isType(schema, 'null')) {
				this.addNullSuggestion(collector);
			}
		}
		if (Array.isArray(schema.allOf)) {
			schema.allOf.forEach((s) => this.addEnumSuggestion(s, collector));
		}
		if (Array.isArray(schema.anyOf)) {
			schema.anyOf.forEach((s) => this.addEnumSuggestion(s, collector));
		}
		if (Array.isArray(schema.oneOf)) {
			schema.oneOf.forEach((s) => this.addEnumSuggestion(s, collector));
		}
	}

	private isType(schema: JsonSchema.IJSONSchema, type: string) {
		if (Array.isArray(schema.type)) {
			return schema.type.indexOf(type) !== -1;
		}
		return schema.type === type;
	}

	private addDefaultSuggestion(schema: JsonSchema.IJSONSchema, collector: ISuggestionsCollector): void {
		if (schema.default) {
			collector.add({
				type: this.getSuggestionKind(schema.type),
				displayText: this.getLabelForValue(schema.default),
				text: this.getTextForValue(schema.default),
				description: 'Default value',
			});
		}
		if (Array.isArray(schema.defaultSnippets)) {
			schema.defaultSnippets.forEach(s => {
				collector.add({
					type: "snippet",
					displayText: this.getLabelForSnippetValue(s.body),
					text: this.getTextForSnippetValue(s.body)
				});
			});
		}

		if (Array.isArray(schema.allOf)) {
			schema.allOf.forEach((s) => this.addDefaultSuggestion(s, collector));
		}
		if (Array.isArray(schema.anyOf)) {
			schema.anyOf.forEach((s) => this.addDefaultSuggestion(s, collector));
		}
		if (Array.isArray(schema.oneOf)) {
			schema.oneOf.forEach((s) => this.addDefaultSuggestion(s, collector));
		}
	}

	private getLabelForValue(value: any): string {
		let label = JSON.stringify(value);
		if (label.length > 57) {
			return label.substr(0, 57).trim() + '...';
		}
		return label;
	}

	private getLabelForSnippetValue(value: any): string {
		let label = JSON.stringify(value);
		label = label.replace(/\{\{|\}\}/g, '');
		if (label.length > 57) {
			return label.substr(0, 57).trim() + '...';
		}
		return label;
	}

	private getTextForValue(value: any): string {
		var text = JSON.stringify(value, null, '\t');
		text = text.replace(/[\\\{\}]/g, '\\$&');
		return text;
	}

	private getTextForSnippetValue(value: any): string {
		return JSON.stringify(value, null, '\t');
	}

	private getTextForEnumValue(value: any): string {
		let snippet = this.getTextForValue(value);
		switch (typeof value) {
			case 'object':
				if (value === null) {
					return '{{null}}';
				}
				return snippet;
			case 'string':
				return '"{{' + snippet.substr(1, snippet.length - 2) + '}}"';
			case 'number':
			case 'boolean':
				return '{{' + snippet + '}}';
		}
		return snippet;
	}

	private getSuggestionKind(type: any): string {
		if (Array.isArray(type)) {
			let array = <any[]>type;
			type = array.length > 0 ? array[0] : null;
		}
		if (!type) {
			return "value";
		}
		switch (type) {
			case 'string': return "value";
			case 'object': return "module";
			case 'property': return "property";
			default: return "value";
		}
	}


	private getTextForMatchingNode(node: Parser.ASTNode, document: ITextDocument): string {
		switch (node.type) {
			case 'array':
				return '[]';
			case 'object':
				return '{}';
			default:
				let content = document.getText().substr(node.start, node.end - node.start);
				return content;
		}
	}

	private getTextForProperty(key: string, propertySchema: JsonSchema.IJSONSchema, addValue: boolean, isLast: boolean): string {

		let result = this.getTextForValue(key);
		if (!addValue) {
			return result;
		}
		result += ': ';

		if (propertySchema) {
			let defaultVal = propertySchema.default;
			if (typeof defaultVal !== 'undefined') {
				result = result + this.getTextForEnumValue(defaultVal);
			} else if (propertySchema.enum && propertySchema.enum.length > 0) {
				result = result + this.getTextForEnumValue(propertySchema.enum[0]);
			} else {
				var type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
				switch (type) {
					case 'boolean':
						result += '{{false}}';
						break;
					case 'string':
						result += '"{{}}"';
						break;
					case 'object':
						result += '{\n\t{{}}\n}';
						break;
					case 'array':
						result += '[\n\t{{}}\n]';
						break;
					case 'number':
						result += '{{0}}';
						break;
					case 'null':
						result += '{{null}}';
						break;
					default:
						return result;
				}
			}
		} else {
			result += '{{0}}';
		}
		if (!isLast) {
			result += ',';
		}
		return result;
	}

	private getTextForSimilarProperty(key: string, templateValue: Parser.ASTNode): string {
		return this.getTextForValue(key);
	}

	private getCurrentWord(document: ITextDocument, offset: number) {
		var i = offset - 1;
		var text = document.getText();
		while (i >= 0 && ' \t\n\r\v":{[,'.indexOf(text.charAt(i)) === -1) {
			i--;
		}
		return text.substring(i+1, offset);
	}
}