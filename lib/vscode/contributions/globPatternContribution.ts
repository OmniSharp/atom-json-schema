/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import HtmlContent from '../common/htmlContent';
import Strings from '../common/strings';
import JSONWorker from '../jsonWorker';
import URI from '../common/uri';
import {JSONLocation} from '../parser/jsonLocation';

var globProperties:Suggestion[] = [
    { type: 'value', displayText: `Files by Extension`, snippet: '"**/*.{{extension}}": true', description: `Match all files of a specific file extension.`},
    { type: 'value', displayText: `Files with Multiple Extensions`, snippet: '"**/*.{ext1,ext2,ext3}": true', description: `Match all files with any of the file extensions.`},
    { type: 'value', displayText: `Files with Siblings by Name`, snippet: '"**/*.{{source-extension}}": { "when": "$(basename).{{target-extension}}" }', description: `Match files that have siblings with the same name but a different extension.`},
    { type: 'value', displayText: `Folder by Name (Top Level)`, snippet: '"{{name}}": true', description: `Match a top level folder with a specific name.`},
    { type: 'value', displayText: `Folders with Multiple Names (Top Level)`, snippet: '"{folder1,folder2,folder3}": true', description: `Match multiple top level folders.`},
    { type: 'value', displayText: `Folder by Name (Any Location)`, snippet: '"**/{{name}}": true', description: `Match a folder with a specific name in any location.`},
];

var globValues:Suggestion[] = [
    { type: 'value', displayText: `True`, snippet: 'true', description: `Enable the pattern.`},
    { type: 'value', displayText: `False`, snippet: 'false', description: `Disable the pattern.`},
    { type: 'value', displayText: `Files with Siblings by Name`, snippet: '{ "when": "$(basename).{{extension}}" }', description: `Match files that have siblings with the same name but a different extension.`}
];

export class GlobPatternContribution implements JSONWorker.IJSONWorkerContribution {

    constructor() {
    }

    private isSettingsFile(resource: URI): boolean {
        var path = resource.path;
        return Strings.endsWith(path, '/settings.json');
    }

    public collectDefaultSuggestions(resource: URI, result: JSONWorker.ISuggestionsCollector): Promise<any> {
        return null;
    }

    public collectPropertySuggestions(resource: URI, location: JSONLocation, currentWord: string, addValue: boolean, isLast:boolean, result: JSONWorker.ISuggestionsCollector) : Promise<any> {
        if (this.isSettingsFile(resource) && (location.matches(['files.exclude']) || location.matches(['search.exclude']))) {

            globProperties.forEach((e) => result.add(e));
        }

        return null;
    }

    public collectValueSuggestions(resource: URI, location: JSONLocation, currentKey: string, result: JSONWorker.ISuggestionsCollector): Promise<any> {
        if (this.isSettingsFile(resource) && (location.matches(['files.exclude']) || location.matches(['search.exclude']))) {

            globValues.forEach((e) => result.add(e));
        }

        return null;
    }

    public getInfoContribution(resource: URI, location: JSONLocation): Promise<HtmlContent.IHTMLContentElement[]> {
        return null;
    }
}
