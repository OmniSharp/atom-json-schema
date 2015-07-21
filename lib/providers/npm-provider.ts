import * as _ from "lodash";
import {Observable} from "rx";
var fetch: (url: string) => Rx.IPromise<IResult> = require('node-fetch');
var filter = require('fuzzaldrin').filter;

interface IResult {
    json<T>(): T;
    text(): string;
}

interface NpmResult {
    rows: { key: string; value: string; }[];
}

interface NpmPackage {
    version: string;
}

//https://skimdb.npmjs.com/registry/_design/app/_view/browseAll?group_level=1
function search(text) {
    return Observable.fromPromise<NpmResult>(
        fetch(`https://skimdb.npmjs.com/registry/_design/app/_view/browseAll?group_level=1&limit=100&start_key=%5B%22${encodeURIComponent(text) }%22,%7B%7D%5D&end_key=%5B%22${encodeURIComponent(text) }z%22,%7B%7D%5D`)
            .then(res => res.json<NpmResult>())
        )
        .flatMap(z =>
            Observable.from(z.rows));
}

//http://registry.npmjs.org/gulp/latest
function searchPackage(text, name: string) {
    return Observable.fromPromise<NpmPackage>(
        fetch(`http://registry.npmjs.org/${name}/latest`)
            .then(res => res.json<NpmPackage>())
        );
}

function makeSuggestion(item: { key: string }) {
    var type = 'package';

    return {
        _search: item.key,
        text: item.key,
        snippet: item.key,
        type: type,
        displayText: item.key,
        className: 'autocomplete-json-schema',
    }
}

var packageName: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        if (!options.replacementPrefix) return Promise.resolve([]);
        return <any>search(options.replacementPrefix)
            .map(makeSuggestion)
            .toArray()
            .toPromise();
    },
    fileMatchs: ['package.json'],
    pathMatch(path) {
        return path === "dependencies" || path === "devDependencies";
    },
    dispose() { }
    //getSuggestions: _.throttle(getSuggestions, 0),
    //onDidInsertSuggestion,
    //dispose
}

var packageVersion: IAutocompleteProvider = {
    getSuggestions(options: IAutocompleteProviderOptions) {
        var name = options.path.split('/');
        return <any>searchPackage(options.replacementPrefix, name[name.length - 1])
            .map(z => ({ key: `^${z.version}` }))
            .map(makeSuggestion)
            .toArray()
            .toPromise();
    },
    fileMatchs: ['package.json'],
    pathMatch(path) {
        return _.startsWith(path, "dependencies/") || _.startsWith(path, "devDependencies/");
    },
    dispose() { }
    //getSuggestions: _.throttle(getSuggestions, 0),
    //onDidInsertSuggestion,
    //dispose
}

var providers = [packageName, packageVersion];
export = providers;
