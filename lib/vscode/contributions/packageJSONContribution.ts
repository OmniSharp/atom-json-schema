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

var LIMIT = 40;

export class PackageJSONContribution implements JSONWorker.IJSONWorkerContribution {

	private mostDependedOn = [ 'lodash', 'async', 'underscore', 'request', 'commander', 'express', 'debug', 'chalk', 'colors', 'q', 'coffee-script',
		'mkdirp', 'optimist', 'through2', 'yeoman-generator', 'moment', 'bluebird', 'glob', 'gulp-util', 'minimist', 'cheerio', 'jade', 'redis', 'node-uuid',
		'socket', 'io', 'uglify-js', 'winston', 'through', 'fs-extra', 'handlebars', 'body-parser', 'rimraf', 'mime', 'semver', 'mongodb', 'jquery',
		'grunt', 'connect', 'yosay', 'underscore', 'string', 'xml2js', 'ejs', 'mongoose', 'marked', 'extend', 'mocha', 'superagent', 'js-yaml', 'xtend',
		'shelljs', 'gulp', 'yargs', 'browserify', 'minimatch', 'react', 'less', 'prompt', 'inquirer', 'ws', 'event-stream', 'inherits', 'mysql', 'esprima',
		'jsdom', 'stylus', 'when', 'readable-stream', 'aws-sdk', 'concat-stream', 'chai', 'promise', 'wrench'];

	private requestService : IRequestService;

	private isPackageJSONFile(resource: URI): boolean {
		var path = resource.path;
		return Strings.endsWith(path, '/package.json');
	}

	public constructor(@IRequestService requestService: IRequestService) {
		this.requestService = requestService;
	}

	public collectDefaultSuggestions(resource: URI, result: JSONWorker.ISuggestionsCollector): Promise<any> {
		if (this.isPackageJSONFile(resource)) {
			var defaultValue = {
				'name': '{{name}}',
				'description': '{{description}}',
				'author': '{{author}}',
				'version': '{{1.0.0}}',
				'main': '{{pathToMain}}',
				'dependencies': {}
			};
			result.add({ type: 'module', displayText: `Default package.json`, snippet: JSON.stringify(defaultValue, null, '\t'), description: '' });
		}
		return null;
	}

	public collectPropertySuggestions(resource: URI, location: JSONLocation, currentWord: string, addValue: boolean, isLast:boolean, result: JSONWorker.ISuggestionsCollector) : Promise<any> {
		if (this.isPackageJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['devDependencies']) || location.matches(['optionalDependencies']) || location.matches(['peerDependencies']))) {
			var queryUrl : string;
			if (currentWord.length > 0) {
				queryUrl = 'https://skimdb.npmjs.com/registry/_design/app/_view/browseAll?group_level=1&limit=' + LIMIT + '&start_key=%5B%22' + encodeURIComponent(currentWord) + '%22%5D&end_key=%5B%22'+ encodeURIComponent(currentWord + 'z') + '%22,%7B%7D%5D';

				return this.requestService.makeRequest({
					url : queryUrl
				}).then((success) => {
					if (success.status === 200) {
						try {
							var obj = JSON.parse(success.responseText);
							if (obj && Array.isArray(obj.rows)) {
								var results = <{ key: string[]; }[]> obj.rows;
								for (var i = 0; i < results.length; i++) {
									var keys = results[i].key;
									if (Array.isArray(keys) && keys.length > 0) {
										var name = keys[0];
										var codeSnippet = JSON.stringify(name);
										if (addValue) {
											codeSnippet += ': "{{*}}"';
											if (!isLast) {
												codeSnippet += ',';
											}
										}
										result.add({ type: 'property', displayText: name, snippet: codeSnippet, description: '' });
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
						result.error(`Request to the NPM repository failed: ${success.responseText}`);
						return 0;
					}
				}, (error) => {
					result.error(`Request to the NPM repository failed: ${error.responseText}`);
					return 0;
				});
			} else {
				this.mostDependedOn.forEach((name) => {
					var codeSnippet = JSON.stringify(name);
					if (addValue) {
						codeSnippet += ': "{{*}}"';
						if (!isLast) {
							codeSnippet += ',';
						}
					}
					result.add({ type: 'property', displayText: name, snippet: codeSnippet, description: '' });
				});
				result.setAsIncomplete();
			}
		}
		return null;
	}

	public collectValueSuggestions(resource: URI, location: JSONLocation, currentKey: string, result: JSONWorker.ISuggestionsCollector): Promise<any> {
		if (this.isPackageJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['devDependencies']) || location.matches(['optionalDependencies']) || location.matches(['peerDependencies']))) {
			var queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(currentKey) + '/latest';

			return this.requestService.makeRequest({
				url : queryUrl
			}).then((success) => {
				try {
					var obj = JSON.parse(success.responseText);
					if (obj && obj.version) {
						var version = obj.version;
						var name = JSON.stringify(version);
						result.add({ type: 'class', displayText: name, snippet: name, description: `The currently latest version of the package` });
						name = JSON.stringify('^' + version);
						result.add({ type: 'class', displayText: name, snippet: name, description: `Matches the most recent major version (1.x.x)` });
						name = JSON.stringify('~' + version);
						result.add({ type: 'class', displayText: name, snippet: name, description: `Matches the most recent minor version (1.2.x)` });
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
		if (this.isPackageJSONFile(resource) && (location.matches(['dependencies', '*']) || location.matches(['devDependencies', '*']) || location.matches(['optionalDependencies', '*']) || location.matches(['peerDependencies', '*']))) {
			var pack = location.getSegments()[location.getSegments().length - 1];

			var htmlContent : HtmlContent.IHTMLContentElement[] = [];
			htmlContent.push({className: 'type', text: nls.localize('json.npm.package.hover', '{0}', pack) });

			var queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(pack) + '/latest';

			return this.requestService.makeRequest({
				url : queryUrl
			}).then((success) => {
				try {
					var obj = JSON.parse(success.responseText);
					if (obj) {
						if (obj.description) {
							htmlContent.push({className: 'documentation', text: obj.description });
						}
						if (obj.version) {
							htmlContent.push({className: 'documentation', text: `Latest version: ${obj.version}` });
						}
					}
				} catch (e) {
					// ignore
				}
				return htmlContent;
			}, (error) => {
				return htmlContent;
			});
		}
		return null;
	}
}