import _ = require('lodash')
import {Subject, BehaviorSubject, Observable, CompositeDisposable} from 'rx';
import Promise = require('bluebird');
//var escape = require("escape-html");
var filter = require('fuzzaldrin').filter;
import {getPath, getRanges, ITokenRange} from "./helpers/get-ranges";
import {schemaProvider, ISchemaInstance} from "./schema-provider";

interface RequestOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
}

function fixSnippet(snippet: string, options: { hasTrailingQuote: boolean; hasLeadingQuote: boolean }) {
    if (!options.hasLeadingQuote)
        snippet = '"' + snippet;
    if (!options.hasTrailingQuote)
        snippet = snippet + '"';

    return snippet;
}

function makeSuggestion(item: { key: string; description: string; type: string }, options: { hasTrailingQuote: boolean; hasLeadingQuote: boolean }) {
    var description = item.description,
        leftLabel = item.type.substr(0, 1),
        type = 'variable';

    return {
        _search: item.key,
        snippet: fixSnippet(item.key, options),
        type: type,
        displayText: item.key,
        className: 'autocomplete-json-schema',
        description: description,
        //leftLabel: leftLabel,
    }
}

function renderReturnType(returnType: string) {
    if (returnType === null) {
        return;
    }
    return `Returns: ${returnType}`;
}

function schemaGet(schema: ISchemaInstance, path: string) {
    // ignore .data
    var p = path.split('.');
    var rootSchema = schema;
    while (p.length) {
        let s = p.shift();
        if (schema.properties && schema.properties[s]) {
            schema = schema.properties[s]
        } else if (schema.additionalProperties) {
            schema = schema.additionalProperties;
        }
        if (schema.$ref) {
            // This is the most common def case, may not always work
            var childPath = _.trim(schema.$ref, '/#').split('/').join('.');
            schema = _.get<ISchemaInstance>(rootSchema, childPath);
        }
    }
    return schema;
}

function getSuggestions(options: RequestOptions): Rx.IPromise<Suggestion[]> {
    /*var buffer = options.editor.getBuffer();
    var end = options.bufferPosition.column;
    var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
    var lastCharacterTyped = data[end - 1];

    if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
        return;
    }*/
    var line = options.editor.getBuffer().getLines()[options.bufferPosition.row];
    var hasLeadingQuote = false;
    for (var i = options.bufferPosition.column; i >= 0; i--) {
        let char = line[i];
        if (char === ',' || char === '}' || char === ':') {
            break;
        }

        if (char === '"') {
            hasLeadingQuote = true;
            break;
        }
    }
    var hasTrailingQuote = false;
    for (var i = options.bufferPosition.column; i < line.length; i++) {
        let char = line[i];
        if (char === ':' || char === '}' || char === ',' || char === '{') {
            break;
        }

        if (char === '"') {
            hasTrailingQuote = true;
            break;
        }
    }

    var context = getPath(options.editor, (line, column) =>
        options.bufferPosition.row === line && options.bufferPosition.column === column + 1);
    var existingKeys = _(getRanges(options.editor)).keys()
        .filter(z => _.startsWith(z.split('.').slice(1).join('.') + '.', context.path))
        .map(z => z.replace('data.' + context.path, ''))
        .filter(z => z && z.indexOf('.') === -1)
        .value();

    var p = schemaProvider
        .getSchemaForEditor(options.editor)
        .flatMap(schema => schema.content)
        .map(schema => schemaGet(schema, context.path))
        .map(schema => {
            if (schema.enum && schema.enum.length) {
                return schema.enum.map(property => ({ key: property, type: 'enum', description: undefined }));
            }

            if (schema.properties && _.any(schema.properties)) {
                return _.keys(schema.properties)
                    .filter(z => !_.contains(existingKeys, z))
                    .map(property => ({ key: property, type: 'property', description: schema.properties[property].description }));
            }

            return [];
        })
        .toPromise();

    var search = options.prefix;
    if (search === ".")
        search = "";

    if (search)
        p = p.then(s =>
            filter(s, search, { key: 'key' }));

    var baseSuggestions = p.then(response => response.map(s => makeSuggestion(s, { hasLeadingQuote, hasTrailingQuote })));

    if (providers.length) {
        var workingOptions = <IAutocompleteProviderOptions>_.extend({}, context, options);
        var workingProviders = _.filter(providers, z =>
            _.contains(z.fileMatchs, options.editor.getBuffer().getBaseName()) && z.pathMatch(context.path))
            .map(z => z.getSuggestions(workingOptions).then(suggestions =>
                _.each(suggestions, s => s.snippet = fixSnippet(s.snippet, { hasLeadingQuote, hasTrailingQuote }))));
        if (workingProviders.length) {
            return Promise.all(workingProviders.concat([baseSuggestions]))
                .then(items =>
                    _.flatten(items));
        }
    }
    return baseSuggestions;
}

var providers: IAutocompleteProvider[] = [].concat(require('./providers/npm-provider'));

export var CompletionProvider = {
    selector: '.source.json',
    inclusionPriority: 3,
    excludeLowerPriority: false,
    getSuggestions,
    registerProvider: (provider) => {
        providers.push(provider);
    },
    dispose() { }
}
