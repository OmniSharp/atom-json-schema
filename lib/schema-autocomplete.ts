import _ from 'lodash';
import {Subject, BehaviorSubject, Observable} from 'rxjs';
import {CompositeDisposable} from './disposables';
//var escape = require("escape-html");
var filter = require('fuzzaldrin').filter;

import {JSONSchemaService, ISchemaAssociations} from './vscode/plugin/jsonSchemaService';
import {parse as parseJSON, ObjectASTNode, JSONDocument} from './vscode/plugin/jsonParser';
import {JSONCompletion} from './vscode/plugin/jsonCompletion';

const jsonSchemaService = new JSONSchemaService();
const jsonCompletion = new JSONCompletion(jsonSchemaService, []);

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

function getSuggestions(options: RequestOptions): Promise<Suggestion[]> {
    return jsonCompletion.doSuggest(options.editor, options.bufferPosition, parseJSON(options.editor.getText()))
        .then(x => x.items);
}

var providers: IAutocompleteProvider[] = [].concat(require('./providers/npm-provider')).concat(require('./providers/bower-provider'));

export var CompletionProvider = {
    selector: '.source.json',
    inclusionPriority: 2,
    excludeLowerPriority: false,
    getSuggestions,
    registerProvider: (provider: any) => {
        providers.push(provider);
    },
    onDidInsertSuggestion({editor, suggestion}: { editor: Atom.TextEditor; triggerPosition: any; suggestion: { text: string } }) {
        jsonCompletion.doResolve(<any>suggestion)
            .then(() => {
                if (_.endsWith(suggestion.text, '.')) {
                    _.defer(() => atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:activate"))
                }
            });
    },
    dispose() { }
}
