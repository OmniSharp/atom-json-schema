var validator: (schema) => validatorResult = require('is-my-json-valid');
var Range = require('atom').Range;
import _ = require('lodash');
import {omni} from "./omni";
import {Observable, CompositeDisposable} from "rx";
import {schemaProvider} from "./schema-provider";


interface LinterError {
    type: string; // 'error' | 'warning'
    text?: string;
    html?: string;
    filePath?: string,
    range?: Range
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

interface ITokenRange {
    path: string;
    section: { start: [number, number], end: [number, number] };
    value: { start: [number, number], end: [number, number] }
}

function getRanges(editor: Atom.TextEditor) {
    var doc = editor.getText();
    let token_regex = /"([-a-zA-Z0-9+]+)"[\s]*:$/;
    var open: string[] = [];
    let depth = 1;
    let line = 0;
    let lineStart = 0;
    var tokens = ['data'];
    var start: [number, number][] = [];
    var valueStart: [number, number][] = [];
    var current = null;
    var array = false;
    var string = false;

    var results: { [key: string] : ITokenRange } = {};


    for (var index = doc.indexOf('{') + 1; index < doc.lastIndexOf('}'); index++) {
        let char = doc[index];
        if (char === '\n') {
            line += 1;
            if (doc[index + 1] === '\r') {
                lineStart = index + 2;
            } else {
                lineStart = index + 1;
            }
        }

        if (string && char !== '"' && doc[index - 1] !== "\\") {
            continue;
        }

        if (!string && char === '"') {
            string = true;
        }

        if (string && char === '"') {
            string = false;
        }

        if (array && char !== ']') {
            continue;
        }

        if (char === '[') {
            array == true;
        }

        if (char === ']') {
            array == false;
        }

        if (char === '{') {
            depth += 1;
            tokens.push(open[open.length - 1]);
            start.push(start[start.length - 1]);
            valueStart.push(valueStart[valueStart.length - 1]);
        }

        if (char === ':') {
            let match = doc.substr(0, index + 1).match(token_regex);
            open.push(match[1]);
            start.push([line, index - match[0].length - lineStart]);
            valueStart.push([line, index - lineStart + 1]);
        }

        if (open.length && (char === '}' || (!array && char === ','))) {
            var path = tokens.concat([open.pop()]).join('.');
            results[path] = {
                path: path,
                section: {
                    start: start.pop(),
                    end: [line, index + 1 - lineStart]
                },
                value: {
                    start: valueStart.pop(),
                    end: [line, index - lineStart]
                }
            };
            open.pop();
        }

        if (char === '}') {
            depth -= 1;
            var path = tokens.join('.');
            results[path] = {
                path: path,
                section: {
                    start: start.pop(),
                    end: [line, index - lineStart]
                },
                value: {
                    start: valueStart.pop(),
                    end: [line, index - 1 - lineStart]
                }
            };
            tokens.pop();
        }
    }
    return results;
}

function mapValues(editor: Atom.TextEditor, ranges: { [key: string] : ITokenRange }, error: validatorError): LinterError {
    var range = ranges[error.field];
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
        range: new Range(range.section.start, range.section.end)
    };
}


var makeValidator = _.memoize(schema => validator(schema));

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
                    var ranges = getRanges(editor);
                    try {
                        var text = editor.getText().replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').trim();
                        var data = JSON.parse(text);
                    } catch (e) {
                        // TODO: Should return a validation error that json is invalid?
                        return [];
                    }

                    var result = validate(data, { greedy: true });
                    if (validate.errors && validate.errors.length) {
                        return validate.errors.map(error => mapValues(editor, ranges, error));
                    }

                    return [];
                })
                .toPromise()
    }
];
