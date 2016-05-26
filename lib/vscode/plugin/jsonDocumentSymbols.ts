/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Parser from './jsonParser';
import Strings from './utils/strings';

export class JSONDocumentSymbols {

    constructor() {
    }

    public compute(document: Atom.TextEditor, doc: Parser.JSONDocument): Promise<SymbolInformation[]> {

        let root = doc.root;
        if (!root) {
            return Promise.resolve(null);
        }

        // special handling for key bindings
        let resourceString = document.getURI();
        if ((resourceString === 'vscode://defaultsettings/keybindings.json') || Strings.endsWith(resourceString.toLowerCase(), '/user/keybindings.json')) {
            if (root.type === 'array') {
                let result: SymbolInformation[] = [];
                (<Parser.ArrayASTNode>root).items.forEach((item) => {
                    if (item.type === 'object') {
                        let property = (<Parser.ObjectASTNode>item).getFirstProperty('key');
                        if (property && property.value) {
                            let location = Location.create(document.getURI(), new Range(item.start, item.end));
                            result.push({ name: property.value.getValue(), kind: SymbolKind.Function, location: location });
                        }
                    }
                });
                return Promise.resolve(result);
            }
        }

        let collectOutlineEntries = (result: SymbolInformation[], node: Parser.ASTNode, containerName: string): SymbolInformation[] => {
            if (node.type === 'array') {
                (<Parser.ArrayASTNode>node).items.forEach((node: Parser.ASTNode) => {
                    collectOutlineEntries(result, node, containerName);
                });
            } else if (node.type === 'object') {
                let objectNode = <Parser.ObjectASTNode>node;

                objectNode.properties.forEach((property: Parser.PropertyASTNode) => {
                    let location = Location.create(document.getURI(), new Range(property.start, property.end));
                    let valueNode = property.value;
                    if (valueNode) {
                        let childContainerName = containerName ? containerName + '.' + property.key.name : property.key.name;
                        result.push({ name: property.key.getValue(), kind: this.getSymbolKind(valueNode.type), location: location, containerName: containerName });
                        collectOutlineEntries(result, valueNode, childContainerName);
                    }
                });
            }
            return result;
        };
        let result = collectOutlineEntries([], root, void 0);
        return Promise.resolve(result);
    }

    private getSymbolKind(nodeType: string): string {
        switch (nodeType) {
            case 'object':
            case 'string':
            case 'number':
            case 'array':
            case 'boolean':
                return nodeType;
            default: // 'null'
                return "variable";
        }
    }
}



export interface SymbolInformation {
    name: string;
    containerName?: string;
    kind: string;
    location: Location;
}

export interface IFormattingOptions {
    tabSize:number;
    insertSpaces:boolean;
}

export class Location {
    uri: URI;
    range: [number, number];
}

export interface Hover {
    htmlContent: HtmlContent.IHTMLContentElement[];

    range: [number, number];
}
