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

interface Suggestion {
    //Either text or snippet is required
    text?: string;
    snippet?: string;
    displayText?: string;
    replacementPrefix?: string;
    type: string;
    leftLabel?: string;
    leftLabelHTML?: string;
    rightLabel?: string;
    rightLabelHTML?: string;
    iconHTML?: string;
    description?: string;
    descriptionMoreURL?: string;
    className?: string;
}

function makeSuggestion(item: { key: string; description: string; type: string }) {
    var description = item.description,
        leftLabel = item.type.substr(0, 1),
        type = 'variable';

    return {
        _search: item.key,
        snippet: `"${item.key}"`,
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

    var context = getPath(options.editor, (line, column) => options.bufferPosition.row === line && options.bufferPosition.column == column);
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
            if (context.isValue && schema.enum && schema.enum.length) {
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

    return p.then(response => response.map(s => makeSuggestion(s)))
}

export var CompletionProvider = {
    selector: '.source.json',
    //disableForSelector: 'source.json .comment',
    inclusionPriority: 3,
    excludeLowerPriority: false,
    getSuggestions,
    //getSuggestions: _.throttle(getSuggestions, 0),
    //onDidInsertSuggestion,
    //dispose
}
