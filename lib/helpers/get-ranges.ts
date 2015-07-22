import {unique} from "lodash";

export interface ITokenRange {
    path: string;
    section: { start: [number, number], end: [number, number] };
    value: { start: [number, number], end: [number, number] }
}

function doGetRanges(editor: Atom.TextEditor, predicate: any): any {
    var doc = editor.getText();
    let token_regex = /"([-a-zA-Z0-9+\._]+)"[\s]*:$/;
    var open: string[] = [];
    let depth = 1;
    let line = 0;
    let lineStart = 0;
    var tokens = [];
    var start: [number, number][] = [];
    var valueStart: [number, number][] = [];
    var current = null;
    var isArray = false;
    var isString = false;

    if (!predicate) {
        var objectPaths: { [key: string]: { line: number; column: number; } } = {};
        var results: { [key: string]: ITokenRange; } = {};
    }

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

        if ((isString || isArray) && predicate && predicate(line, index - lineStart)) {
            if (char === '}' || char === ',') open.pop();
            return <any>{
                path: open.join('/'),
            };
        }

        if (isString && char !== '"' && doc[index - 1] !== "\\") {
            continue;
        }

        if (isString && char === '"') {
            isString = false;
        } else if (!isString && char === '"') {
            isString = true;
        }

        if (isArray && char !== ']') {
            continue;
        }

        if (char === '[') {
            isArray = true;
        }

        if (char === ']') {
            isArray = false;
        }

        if (char === '{') {
            depth += 1;
            tokens.push(open[open.length - 1]);
            start.push(start[start.length - 1]);
            if (objectPaths) {
                objectPaths[tokens.join('/')] = {
                    line: line,
                    column: index - lineStart,
                };
            }
            valueStart.push(valueStart[valueStart.length - 1]);
        }

        if (char === ':' && !(isString || isArray)) {
            let match = doc.substr(0, index + 1).match(token_regex);
            if (match) {
                open.push(match[1]);
                start.push([line, index - match[0].length - lineStart]);
                valueStart.push([line, index - lineStart + 1]);
            }
        }

        if (predicate && predicate(line, index - lineStart)) {
            if (char === '}' || char === ',') open.pop();
            return <any>{
                path: open.join('/'),
            };
        }

        if (open.length && (char === '}' || (!isArray && char === ','))) {
            var path = tokens.concat([open.pop()]).join('/');
            if (results) {
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
        }

        if (char === '}') {
            depth -= 1;
            var path = tokens.join('/');
            if (results) {
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
    }
    return { ranges: results, objectPaths };
}

export function getRanges(editor: Atom.TextEditor): { ranges: { [key: string]: ITokenRange }; objectPaths: { [key: string]: { line: number; column: number; } }; } {
    return doGetRanges(editor, undefined);
}

export function getPath(editor: Atom.TextEditor, predicate: (line: number, column: number) => boolean): { path: string; } {
    return doGetRanges(editor, predicate);
}
