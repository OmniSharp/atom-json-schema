/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Parser from './jsonParser';
import {Point} from "atom";
import TextBuffer from "text-buffer";
const Range = TextBuffer.Range;

export class JSONDocumentSymbols {

    constructor() {
    }

    public compute(document: Atom.TextEditor, doc: Parser.JSONDocument): Promise<SymbolInformation[]> {

        let root = doc.root;
        if (!root) {
            return Promise.resolve(null);
        }

        let collectOutlineEntries = (result: SymbolInformation[], node: Parser.ASTNode, containerName: string): SymbolInformation[] => {
            if (node.type === 'array') {
                (<Parser.ArrayASTNode>node).items.forEach((node: Parser.ASTNode) => {
                    collectOutlineEntries(result, node, containerName);
                });
            } else if (node.type === 'object') {
                let objectNode = <Parser.ObjectASTNode>node;

                objectNode.properties.forEach((property: Parser.PropertyASTNode) => {
                    let location = { uri: document.getURI(), range: new Range(property.start, property.end) };
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

export class Location {
    uri: string;
    range: TextBuffer.Range;
}
