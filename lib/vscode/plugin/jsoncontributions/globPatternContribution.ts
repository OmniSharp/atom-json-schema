/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Strings from '../utils/strings';
import {IJSONWorkerContribution, ISuggestionsCollector} from '../jsonContributions';
import {JSONLocation} from '../jsonLocation';

let globProperties: Suggestion[] = [
    { type: "value", displayText: "Files by Extension", text: '"**/*.{{extension}}": true', description: `Match all files of a specific file extension.` },
    { type: "value", displayText: "Files with Multiple Extensions", text: '"**/*.{ext1,ext2,ext3}": true', description: `Match all files with any of the file extensions.` },
    { type: "value", displayText: "Files with Siblings by Name", text: '"**/*.{{source-extension}}": { "when": "$(basename).{{target-extension}}" }', description: `Match files that have siblings with the same name but a different extension.` },
    { type: "value", displayText: "Folder by Name (Top Level)", text: '"{{name}}": true', description: `Match a top level folder with a specific name.` },
    { type: "value", displayText: "Folders with Multiple Names (Top Level)", text: '"{folder1,folder2,folder3}": true', description: `Match multiple top level folders.` },
    { type: "value", displayText: "Folder by Name (Any Location)", text: '"**/{{name}}": true', description: `Match a folder with a specific name in any location.` },
];

let globValues: Suggestion[] = [
    { type: "value", displayText: "True", text: 'true', description: "Enable the pattern." },
    { type: "value", displayText: "False", text: 'false', description: "Disable the pattern." },
    { type: "value", displayText: "Files with Siblings by Name", text: '{ "when": "$(basename).{{extension}}" }', description: `Match files that have siblings with the same name but a different extension.` }
];

export class GlobPatternContribution implements IJSONWorkerContribution {

    constructor() {
    }

    private isSettingsFile(resource: string): boolean {
        return Strings.endsWith(resource, '/settings.json');
    }

    public collectDefaultSuggestions(resource: string, result: ISuggestionsCollector): Promise<any> {
        return null;
    }

    public collectPropertySuggestions(resource: string, location: JSONLocation, currentWord: string, addValue: boolean, isLast: boolean, result: ISuggestionsCollector): Promise<any> {
        if (this.isSettingsFile(resource) && (location.matches(['files.exclude']) || location.matches(['search.exclude']))) {
            globProperties.forEach((e) => result.add(e));
        }

        return null;
    }

    public collectValueSuggestions(resource: string, location: JSONLocation, currentKey: string, result: ISuggestionsCollector): Promise<any> {
        if (this.isSettingsFile(resource) && (location.matches(['files.exclude']) || location.matches(['search.exclude']))) {
            globValues.forEach((e) => result.add(e));
        }

        return null;
    }

    public getInfoContribution(resource: string, location: JSONLocation): Promise<MarkedString[]> {
        return null;
    }
}