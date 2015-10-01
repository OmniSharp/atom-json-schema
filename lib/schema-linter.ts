var validator: (schema) => validatorResult;
(function(){
    var loophole = require("loophole");
    function allowUnsafe(fn) {
        return loophole.allowUnsafeEval(function () { return loophole.allowUnsafeNewFunction(function () { return fn(); }); });
    }

    allowUnsafe(() => validator = require('is-my-json-valid'));
})();

var Range = require('atom').Range;
import _ = require('lodash');
import {omni} from "./omni";
import {Observable, CompositeDisposable} from "rx";
import {schemaProvider} from "./schema-provider";
import {getRanges, ITokenRange} from "./helpers/get-ranges";

interface LinterError {
    type: string; // 'error' | 'warning'
    text?: string;
    html?: string;
    filePath?: string;
    range?: Range;
    line?: number;
    col?: number;
}

interface validatorResult {
    (data: any, options: any): void;
    errors: validatorError[];
}

interface validatorError {
    field: string;
    message: string;
    value: any;
}

function getWordAt(str: string, pos: number) {
    var wordLocation = {
        start: pos,
        end: pos
    }

    if (str === undefined) {
        return wordLocation;
    }

    while (pos < str.length && /\W/.test(str[pos])) {
        ++pos;
    }

    var left = str.slice(0, pos + 1).search(/\W(?!.*\W)/);
    var right = str.slice(pos).search(/(\W|$)/);

    wordLocation.start = left + 1;
    wordLocation.end = wordLocation.start + right;

    return wordLocation;
}

function mapValues(editor: Atom.TextEditor, ranges: { [key: string]: ITokenRange }, error: validatorError): LinterError {
    var range = ranges[error.field.replace('data.', '')];
    if (!range) {
        // TODO:  Should try and figure out some of these failures
        return null;
    }
    var line = range.section.start[0];
    var column = range.section.start[1];
    var text = editor.lineTextForBufferRow(line);
    var level = 'error';

    return {
        type: level,
        text: `${error.field} - ${error.message}`,
        filePath: editor.getPath(),
        line: line + 1,
        col: column + 1,
        range: new Range(range.value.start, range.value.end)
    };
}


var makeValidator = _.memoize(schema => {
    if (_.isEmpty(schema))
        return null;
    return validator(schema);
});

export var provider = [
    {
        grammarScopes: ['source.json'],
        scope: 'file',
        lintOnFly: true,
        lint: (editor: Atom.TextEditor) =>
            schemaProvider
                .getSchemaForEditor(editor)
                .flatMap(schema => schema.content)
                .map(schema => makeValidator(schema))
                .map(validate => {
                    var {ranges} = getRanges(editor);
                    try {
                        var text = editor.getText().replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').trim();
                        var data = JSON.parse(text);
                    } catch (e) {
                        // TODO: Should return a validation error that json is invalid?
                        return [];
                    }

                    var result = validate(data, { greedy: true });
                    if (validate.errors && validate.errors.length) {
                        return validate.errors.map(error => mapValues(editor, ranges, error)).filter(z => !!z);
                    }

                    return [];
                })
                .defaultIfEmpty([])
                .toPromise()
    }
];
