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

function fixSnippet(snippet: string, options: { hasTrailingQuote: boolean; hasLeadingQuote: boolean; }, type: string) {
    let t = _.trim(snippet);
    if (_.startsWith(t, '{') || _.startsWith(t, '"') || _.endsWith(t, '}') || _.endsWith(t, '"') || _.endsWith(t, ','))
        return snippet;

    if (!options.hasLeadingQuote)
        snippet = '"' + snippet;
    if (!options.hasTrailingQuote && !_.endsWith(snippet, '.'))
        snippet = snippet + '"';

    if (type === "string") {
        snippet = snippet += ': ""'
    } else if (type === "object") {
        snippet = snippet += ': {}'
    } else if (type === "array") {
        snippet = snippet += ': []'
    }

    return snippet;
}

function makeSuggestion(item: { key: string; description: string; type: string }, options: { replacementPrefix: string; hasTrailingQuote: boolean; hasLeadingQuote: boolean }) {
    var description = item.description,
        leftLabel = item.type.substr(0, 1),
        type = 'variable';

    return {
        _search: item.key,
        text: item.key,
        snippet: fixSnippet(item.key, options, item.type),
        type: type,
        displayText: item.key,
        className: 'autocomplete-json-schema',
        description: description,
        //leftLabel: leftLabel,
    };
}

function renderReturnType(returnType: string) {
    if (returnType === null) {
        return;
    }
    return `Returns: ${returnType}`;
}

function schemaGet(schema: ISchemaInstance, path: string) {
    // ignore .data
    var p = (path  || '').split('/');
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

    var prefix = options.prefix;
    try {
        let cursor = options.editor.getLastCursor();
        let editor = options.editor;
        prefix = <any> editor.getTextInBufferRange(cursor.getCurrentWordBufferRange({ wordRegex: /^[\t ]*$|[^\s\/\\\(\)"':,\;<>~!@#\$%\^&\*\|\+=\[\]\{\}`\?]+|[\/\\\(\)"':,\;<>~!@#\$%\^&\*\|\+=\[\]\{\}`\?]+/ }));
    } catch (e) { }

    prefix = _.trim(prefix, ':{}," ');

    var context = getPath(options.editor, (line, column) =>
        options.bufferPosition.row === line && options.bufferPosition.column === column + 1);

    var {ranges, objectPaths} = getRanges(options.editor);
    var existingKeys = _(ranges).keys()
        .filter(z => _.startsWith(z + '/', context.path))
        .filter(z => z && z.indexOf('/') === -1)
        .value();

    var p = schemaProvider
        .getSchemaForEditor(options.editor)
        .flatMap(schema => schema.content)
        .map(schema => {
            // ignore .data
            var p = (context.path || '').split('/');
            var rootSchema = schema;

            var parentSchema;
            while (p.length) {
                let lastSchema = schema;
                let s = p.shift();
                if (schema.properties && schema.properties[s]) {
                    schema = schema.properties[s]
                } else if (schema.additionalProperties) {
                    schema = schema.additionalProperties;
                } else if (schema !== rootSchema) {
                    schema = <any>{};
                }
                if (schema.$ref) {
                    // This is the most common def case, may not always work
                    var childPath = _.trim(schema.$ref, '/#').split('/').join('.');
                    schema = _.get<ISchemaInstance>(rootSchema, childPath);
                }
            }

            var inferedType = "";
            if (typeof schema.type === "string" && schema.type === "object") {
                inferedType = "object";
            }

            var objectPath = _.find(objectPaths, (value, key) => key === context.path);
            if (objectPath && _.isArray(schema.type) && _.contains(schema.type, "object") && (options.bufferPosition.row == objectPath.line && options.bufferPosition.column + 1 > objectPath.column || options.bufferPosition.row > objectPath.line)) {
                inferedType = "object";
            }

            if (schema.enum && schema.enum.length) {
                return schema.enum.map(property => ({ key: property, type: 'enum', description: '' }));
            }

            if (inferedType === "object" && schema.properties && _.any(schema.properties)) {
                return _.keys(schema.properties)
                    .filter(z => !_.contains(existingKeys, z))
                    .map(property => {
                        var propertySchema = schema.properties[property];
                        return { key: property, type: typeof propertySchema.type === "string" ? <string> propertySchema.type : 'property', description: propertySchema.description }
                    });
            }

            var types: string[] = [];
            if (typeof schema.type === "string") {
                types = <any>[schema.type];
            } else if (_.isArray(types)) {
                types = <any>schema.type || [];
            }

            if (types.length > 1) {
                return _.map(types, type => {
                    if (type === "string") {
                        return { key: '""', type: "value", description: '' };
                    } else if (type === "object") {
                        var res = {};
                        _.each(schema.properties, (value, key) => {
                            if (value.type === "string")
                                res[key] = value.default || '';
                        });
                        return { key: JSON.stringify(res, null, options.editor.getTabLength()), type: "value", description: '' };
                    }
                });
            }

            return [];
        })
        .defaultIfEmpty([])
        .toPromise();

    var search = prefix;
    if (search === ".")
        search = "";

    //options.prefix = prefix;

    if (search)
        p = p.then(s =>
            filter(s, search, { key: 'key' }));

    var baseSuggestions = p.then(response => response.map(s => makeSuggestion(s, { replacementPrefix: prefix, hasLeadingQuote, hasTrailingQuote })));

    if (providers.length) {
        var workingOptions = <IAutocompleteProviderOptions>_.defaults({ prefix, replacementPrefix: prefix }, context, options);
        var workingProviders = _.filter(providers, z =>
            _.contains(z.fileMatchs, options.editor.getBuffer().getBaseName()) && z.pathMatch(context.path))
            .map(z => z.getSuggestions(workingOptions).then(suggestions =>
                _.each(suggestions, s => s.snippet = fixSnippet(s.snippet, { hasLeadingQuote, hasTrailingQuote }, 'other'))));
        if (workingProviders.length) {
            return Promise.all(workingProviders.concat([baseSuggestions]))
                .then(items =>
                    _.flatten(items));
        }
    }
    return baseSuggestions;
}

var providers: IAutocompleteProvider[] = [].concat(require('./providers/npm-provider')).concat(require('./providers/bower-provider'));

export var CompletionProvider = {
    selector: '.source.json',
    inclusionPriority: 2,
    excludeLowerPriority: false,
    getSuggestions,
    registerProvider: (provider) => {
        providers.push(provider);
    },
    onDidInsertSuggestion({editor, suggestion}: { editor: Atom.TextEditor; triggerPosition: any; suggestion: { text: string } }) {
        if (_.endsWith(suggestion.text, '.')) {
            _.defer(() => atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:activate"))
        }
    },
    dispose() { }
}
