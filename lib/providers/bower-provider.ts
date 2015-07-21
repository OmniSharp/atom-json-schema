import * as _ from "lodash";
import {Observable} from "rx";
var fetch: (url: string) => Rx.IPromise<IResult> = require('node-fetch');

interface IResult {
    json<T>(): T;
    text(): string;
}

interface BowerResult {
    name: string,
    url: string
}

interface BowerPackage {
    version: string;
}

interface GitHubTag {
    name: string;
}

function search(text) {
    var $get = fetch(`https://bower.herokuapp.com/packages/search/${text}`);
    return Observable
        .fromPromise<BowerResult[]>($get.then(res => res.json<BowerResult[]>()))
        .flatMap<BowerResult>(Observable.fromArray);
}

function searchPackage(text, name: string) {
    var $get = fetch(`https://bower.herokuapp.com/packages/${name}`);
    var toJson = (res: IResult) => res.json<BowerResult>();
    var getReleases = (res: BowerResult) => {
        if (!_.contains(res.url, 'github')) {
            return;
        }
        var url = res.url.replace('.git', '/tags').replace('git://github.com/', 'https://api.github.com/repos/');
        return fetch(url);
    };
    var getTags = (rel: GitHubTag) => rel.name.replace('v', '');
    return Observable
        .fromPromise<GitHubTag[]>($get.then(toJson).then(getReleases).then(res => res.json<GitHubTag[]>()))
        .flatMap(Observable.fromArray)
        .map(getTags);
}

function makeSuggestion(item: { name }) {
    var type = 'package';

    return {
        _search: item.name,
        snippet: item.name,
        type: type,
        displayText: item.name,
        className: 'autocomplete-json-schema',
    }
}

var packageName: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        return search(options.replacementPrefix)
            .filter(r=> _.contains(r.name, options.replacementPrefix))
            .map(makeSuggestion)
            .toArray()
            .toPromise();
    },
    fileMatchs: ['bower.json'],
    pathMatch(path) { return path === "dependencies" },
    dispose() { }
}

var packageVersion: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        var name = options.path.split('/');
        return searchPackage(options.replacementPrefix, name[name.length - 1])
            .map(tag => ({ name: `^${tag}` }))
            .map(makeSuggestion)
            .toArray()
            .toPromise();
    },
    fileMatchs: ['bower.json'],
    pathMatch(path) { return _.startsWith(path, "dependencies/"); },
    dispose() { }
}

var providers = [packageName, packageVersion];
export = providers;
