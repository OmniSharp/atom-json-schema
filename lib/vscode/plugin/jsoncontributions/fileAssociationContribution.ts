/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Strings from '../utils/strings';
import {IJSONWorkerContribution, ISuggestionsCollector} from '../jsonContributions';
import {JSONLocation} from '../jsonLocation';

let globProperties: Suggestion[] = [
    { type: "value", displayText: "Files with Extension", text: '"*.{{extension}}": "{{language}}"', description: "Map all files matching the glob pattern in their filename to the language with the given identifier." },
    { type: "value", displayText: "Files with Path", text: '"/{{path to file}}/*.{{extension}}": "{{language}}"', description: "Map all files matching the absolute path glob pattern in their path to the language with the given identifier." }
];

export class FileAssociationContribution implements IJSONWorkerContribution {
    private languageIds: string[];

    constructor() {
    }

    public setLanguageIds(ids: string[]): void {
        this.languageIds = ids;
    }

    private isSettingsFile(resource: string): boolean {
        return Strings.endsWith(resource, '/settings.json');
    }

    public collectDefaultSuggestions(resource: string, result: ISuggestionsCollector): Promise<any> {
        return null;
    }

    public collectPropertySuggestions(resource: string, location: JSONLocation, currentWord: string, addValue: boolean, isLast: boolean, result: ISuggestionsCollector): Promise<any> {
        if (this.isSettingsFile(resource) && location.matches(['files.associations'])) {
            globProperties.forEach((e) => result.add(e));
        }

        return null;
    }

    public collectValueSuggestions(resource: string, location: JSONLocation, currentKey: string, result: ISuggestionsCollector): Promise<any> {
        if (this.isSettingsFile(resource) && location.matches(['files.associations'])) {
            this.languageIds.forEach(l => {
                result.add({
                    type: "value",
                    displayText: l,
                    text: '"{{' + l + '}}"',
                });
            });
        }

        return null;
    }

    public getInfoContribution(resource: string, location: JSONLocation): Promise<MarkedString[]> {
        return null;
    }
}