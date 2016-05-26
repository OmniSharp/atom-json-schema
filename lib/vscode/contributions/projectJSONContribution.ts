/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import HtmlContent from '../common/htmlContent';
import Strings from '../common/strings';
import JSONWorker from '../jsonWorker';
import {JSONLocation} from '../parser/jsonLocation';
import URI from '../common/uri';

var LIMIT = 40;

export class ProjectJSONContribution implements JSONWorker.IJSONWorkerContribution {

    private requestService : IRequestService;

    public constructor(@IRequestService requestService: IRequestService) {
        this.requestService = requestService;
    }

    private isProjectJSONFile(resource: URI): boolean {
        var path = resource.path;
        return Strings.endsWith(path, '/project.json');
    }

    public collectDefaultSuggestions(resource: URI, result: JSONWorker.ISuggestionsCollector): Promise<any> {
        if (this.isProjectJSONFile(resource)) {
            var defaultValue = {
                'version': '{{1.0.0-*}}',
                'dependencies': {},
                'frameworks': {
                    'dnx451': {},
                    'dnxcore50': {}
                }
            };
            result.add({ type: 'snippet', text: `Default project.json`, snippet: JSON.stringify(defaultValue, null, '\t'), description: '' });
        }
        return null;
    }

    public collectPropertySuggestions(resource: URI, location: JSONLocation, currentWord: string, addValue: boolean, isLast:boolean, result: JSONWorker.ISuggestionsCollector) : Promise<any> {
        if (this.isProjectJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['frameworks', '*', 'dependencies']) || location.matches(['frameworks', '*', 'frameworkAssemblies']))) {
            var queryUrl : string;
            if (currentWord.length > 0) {
                queryUrl = 'https://www.nuget.org/api/v2/Packages?'
                    + '$filter=Id%20ge%20\''
                    + encodeURIComponent(currentWord)
                    + '\'%20and%20Id%20lt%20\''
                    + encodeURIComponent(currentWord + 'z')
                    + '\'%20and%20IsAbsoluteLatestVersion%20eq%20true'
                    + '&$select=Id,Version,Description&$format=json&$top=' + LIMIT;
            } else {
                queryUrl = 'https://www.nuget.org/api/v2/Packages?'
                    + '$filter=IsAbsoluteLatestVersion%20eq%20true'
                    + '&$orderby=DownloadCount%20desc&$top=' + LIMIT
                    + '&$select=Id,Version,DownloadCount,Description&$format=json';
            }

            return this.requestService.makeRequest({
                url : queryUrl
            }).then((success) => {
                if (success.status === 200) {
                    try {
                        var obj = JSON.parse(success.responseText);
                        if (Array.isArray(obj.d)) {
                            var results = <any[]> obj.d;
                            for (var i = 0; i < results.length; i++) {
                                var curr = results[i];
                                var name = curr.Id;
                                var version = curr.Version;
                                if (name) {
                                    var documentation = curr.Description;
                                    var typeLabel = curr.Version;
                                    var codeSnippet = JSON.stringify(name);
                                    if (addValue) {
                                        codeSnippet += ': "{{' + version + '}}"';
                                        if (!isLast) {
                                            codeSnippet += ',';
                                        }
                                    }
                                    result.add({ type: 'property', text: name, snippet: codeSnippet, className: typeLabel, description: documentation });
                                }
                            }
                            if (results.length === LIMIT) {
                                result.setAsIncomplete();
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                } else {
                    result.error(`Request to the nuget repository failed: ${success.responseText}`);
                    return 0;
                }
            }, (error) => {
                result.error(`Request to the nuget repository failed: ${error.responseText}`);
                return 0;
            });
        }
        return null;
    }

    public collectValueSuggestions(resource: URI, location: JSONLocation, currentKey: string, result: JSONWorker.ISuggestionsCollector): Promise<any> {
        if (this.isProjectJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['frameworks', '*', 'dependencies']) || location.matches(['frameworks', '*', 'frameworkAssemblies']))) {
            var queryUrl = 'https://www.myget.org/F/aspnetrelease/api/v2/Packages?'
                    + '$filter=Id%20eq%20\''
                    + encodeURIComponent(currentKey)
                    + '\'&$select=Version,IsAbsoluteLatestVersion&$format=json&$top=' + LIMIT;

            return this.requestService.makeRequest({
                url : queryUrl
            }).then((success) => {
                try {
                    var obj = JSON.parse(success.responseText);
                    if (Array.isArray(obj.d)) {
                        var results = <any[]> obj.d;
                        for (var i = 0; i < results.length; i++) {
                            var curr = results[i];
                            var version = curr.Version;
                            if (version) {
                                var name = JSON.stringify(version);
                                var isLatest = curr.IsAbsoluteLatestVersion === 'true';
                                var label = name;
                                var documentationLabel = '';
                                if (isLatest) {
                                    documentationLabel = `The currently latest version of the package`;
                                }
                                result.add({ type: 'class', text: label, snippet: name, description: documentationLabel });
                            }
                        }
                        if (results.length === LIMIT) {
                            result.setAsIncomplete();
                        }
                    }
                } catch (e) {
                    // ignore
                }
                return 0;
            }, (error) => {
                return 0;
            });
        }
        return null;
    }

    public getInfoContribution(resource: URI, location: JSONLocation): Promise<HtmlContent.IHTMLContentElement[]> {
        if (this.isProjectJSONFile(resource) && (location.matches(['dependencies', '*']) || location.matches(['frameworks', '*', 'dependencies', '*']) || location.matches(['frameworks', '*', 'frameworkAssemblies', '*']))) {
            var pack = location.getSegments()[location.getSegments().length - 1];

            var htmlContent : HtmlContent.IHTMLContentElement[] = [];
            htmlContent.push({className: 'type', text: pack });

            var queryUrl = 'https://www.myget.org/F/aspnetrelease/api/v2/Packages?'
                + '$filter=Id%20eq%20\''
                + encodeURIComponent(pack)
                + '\'%20and%20IsAbsoluteLatestVersion%20eq%20true'
                + '&$select=Version,Description&$format=json&$top=5';

            return this.requestService.makeRequest({
                url : queryUrl
            }).then((success) => {
                var content = success.responseText;
                if (content) {
                    try {
                        var obj = JSON.parse(content);
                        if (obj.d && obj.d[0]) {
                            var res = obj.d[0];
                            if (res.Description) {
                                htmlContent.push({className: 'documentation', text: res.Description });
                            }
                            if (res.Version) {
                                htmlContent.push({className: 'documentation', text: `Latest version: ${res.Version}` });
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                return htmlContent;
            }, (error) => {
                return htmlContent;
            });
        }
        return null;
    }
}
