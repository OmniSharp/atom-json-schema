/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import {JSONLocation} from './jsonLocation';
import {ISuggestionsCollector} from './jsonCompletion';

export {ISuggestionsCollector} from './jsonCompletion';


export interface IJSONWorkerContribution {
	getInfoContribution(resource: string, location: JSONLocation) : Promise<MarkedString[]>;
	collectPropertySuggestions(resource: string, location: JSONLocation, currentWord: string, addValue: boolean, isLast:boolean, result: ISuggestionsCollector) : Promise<any>;
	collectValueSuggestions(resource: string, location: JSONLocation, propertyKey: string, result: ISuggestionsCollector): Promise<any>;
	collectDefaultSuggestions(resource: string, result: ISuggestionsCollector): Promise<any>;
	resolveSuggestion?(item: Suggestion): Promise<Suggestion>;
}