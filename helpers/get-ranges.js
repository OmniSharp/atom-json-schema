'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getRanges = getRanges;
exports.getPath = getPath;
function doGetRanges(editor, predicate) {
    var doc = editor.getText();
    var token_regex = /"([-a-zA-Z0-9+\._]+)"[\s]*:$/;
    var open = [];
    var depth = 1;
    var line = 0;
    var lineStart = 0;
    var tokens = [];
    var start = [];
    var valueStart = [];
    var current = null;
    var isArray = false;
    var isString = false;
    if (!predicate) {
        var objectPaths = {};
        var results = {};
    }
    for (var index = doc.indexOf('{') + 1; index < doc.lastIndexOf('}'); index++) {
        var char = doc[index];
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
            return {
                path: open.join('/')
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
                    column: index - lineStart
                };
            }
            valueStart.push(valueStart[valueStart.length - 1]);
        }
        if (char === ':' && !(isString || isArray)) {
            var match = doc.substr(0, index + 1).match(token_regex);
            if (match) {
                open.push(match[1]);
                start.push([line, index - match[0].length - lineStart]);
                valueStart.push([line, index - lineStart + 1]);
            }
        }
        if (predicate && predicate(line, index - lineStart)) {
            if (char === '}' || char === ',') open.pop();
            return {
                path: open.join('/')
            };
        }
        if (open.length && (char === '}' || !isArray && char === ',')) {
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
    return { ranges: results, objectPaths: objectPaths };
}
function getRanges(editor) {
    return doGetRanges(editor, undefined);
}
function getPath(editor, predicate) {
    return doGetRanges(editor, predicate);
}
//# sourceMappingURL=data:application/json;base64,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QUFSLElBQWdCO0FBQ1osMEJBQU0sSUFETTtBQUVaLDZCQUFTO0FBQ0wsK0JBQU8sTUFBTSxHQUFOLEVBREY7QUFFTCw2QkFBSyxDQUFDLElBQUQsRUFBTyxRQUFRLFNBQWY7QUFGQSxxQkFGRztBQU1aLDJCQUFPO0FBQ0gsK0JBQU8sV0FBVyxHQUFYLEVBREo7QUFFSCw2QkFBSyxDQUFDLElBQUQsRUFBTyxRQUFRLENBQVIsR0FBWSxTQUFuQjtBQUZGO0FBTkssaUJBQWhCO0FBV0EsdUJBQU8sR0FBUDtBQUNIO0FBQ0o7QUFDSjtBQUNELFdBQU8sRUFBRSxRQUFRLE9BQVYsRUFBbUIsd0JBQW5CLEVBQVA7QUFDSDtBQUVELFNBQUEsU0FBQSxDQUEwQixNQUExQixFQUFpRDtBQUM3QyxXQUFPLFlBQVksTUFBWixFQUFvQixTQUFwQixDQUFQO0FBQ0g7QUFFRCxTQUFBLE9BQUEsQ0FBd0IsTUFBeEIsRUFBaUQsU0FBakQsRUFBcUc7QUFDakcsV0FBTyxZQUFZLE1BQVosRUFBb0IsU0FBcEIsQ0FBUDtBQUNIIiwiZmlsZSI6ImhlbHBlcnMvZ2V0LXJhbmdlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dW5pcXVlfSBmcm9tIFwibG9kYXNoXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElUb2tlblJhbmdlIHtcclxuICAgIHBhdGg6IHN0cmluZztcclxuICAgIHNlY3Rpb246IHsgc3RhcnQ6IFtudW1iZXIsIG51bWJlcl0sIGVuZDogW251bWJlciwgbnVtYmVyXSB9O1xyXG4gICAgdmFsdWU6IHsgc3RhcnQ6IFtudW1iZXIsIG51bWJlcl0sIGVuZDogW251bWJlciwgbnVtYmVyXSB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvR2V0UmFuZ2VzKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBwcmVkaWNhdGU6IGFueSk6IGFueSB7XHJcbiAgICB2YXIgZG9jID0gZWRpdG9yLmdldFRleHQoKTtcclxuICAgIGxldCB0b2tlbl9yZWdleCA9IC9cIihbLWEtekEtWjAtOStcXC5fXSspXCJbXFxzXSo6JC87XHJcbiAgICB2YXIgb3Blbjogc3RyaW5nW10gPSBbXTtcclxuICAgIGxldCBkZXB0aCA9IDE7XHJcbiAgICBsZXQgbGluZSA9IDA7XHJcbiAgICBsZXQgbGluZVN0YXJ0ID0gMDtcclxuICAgIHZhciB0b2tlbnMgPSBbXTtcclxuICAgIHZhciBzdGFydDogW251bWJlciwgbnVtYmVyXVtdID0gW107XHJcbiAgICB2YXIgdmFsdWVTdGFydDogW251bWJlciwgbnVtYmVyXVtdID0gW107XHJcbiAgICB2YXIgY3VycmVudCA9IG51bGw7XHJcbiAgICB2YXIgaXNBcnJheSA9IGZhbHNlO1xyXG4gICAgdmFyIGlzU3RyaW5nID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKCFwcmVkaWNhdGUpIHtcclxuICAgICAgICB2YXIgb2JqZWN0UGF0aHM6IHsgW2tleTogc3RyaW5nXTogeyBsaW5lOiBudW1iZXI7IGNvbHVtbjogbnVtYmVyOyB9IH0gPSB7fTtcclxuICAgICAgICB2YXIgcmVzdWx0czogeyBba2V5OiBzdHJpbmddOiBJVG9rZW5SYW5nZTsgfSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGluZGV4ID0gZG9jLmluZGV4T2YoJ3snKSArIDE7IGluZGV4IDwgZG9jLmxhc3RJbmRleE9mKCd9Jyk7IGluZGV4KyspIHtcclxuICAgICAgICBsZXQgY2hhciA9IGRvY1tpbmRleF07XHJcbiAgICAgICAgaWYgKGNoYXIgPT09ICdcXG4nKSB7XHJcbiAgICAgICAgICAgIGxpbmUgKz0gMTtcclxuICAgICAgICAgICAgaWYgKGRvY1tpbmRleCArIDFdID09PSAnXFxyJykge1xyXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXggKyAyO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKGlzU3RyaW5nIHx8IGlzQXJyYXkpICYmIHByZWRpY2F0ZSAmJiBwcmVkaWNhdGUobGluZSwgaW5kZXggLSBsaW5lU3RhcnQpKSB7XHJcbiAgICAgICAgICAgIGlmIChjaGFyID09PSAnfScgfHwgY2hhciA9PT0gJywnKSBvcGVuLnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gPGFueT57XHJcbiAgICAgICAgICAgICAgICBwYXRoOiBvcGVuLmpvaW4oJy8nKSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyAmJiBjaGFyICE9PSAnXCInICYmIGRvY1tpbmRleCAtIDFdICE9PSBcIlxcXFxcIikge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyAmJiBjaGFyID09PSAnXCInKSB7XHJcbiAgICAgICAgICAgIGlzU3RyaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICghaXNTdHJpbmcgJiYgY2hhciA9PT0gJ1wiJykge1xyXG4gICAgICAgICAgICBpc1N0cmluZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheSAmJiBjaGFyICE9PSAnXScpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2hhciA9PT0gJ1snKSB7XHJcbiAgICAgICAgICAgIGlzQXJyYXkgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNoYXIgPT09ICddJykge1xyXG4gICAgICAgICAgICBpc0FycmF5ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2hhciA9PT0gJ3snKSB7XHJcbiAgICAgICAgICAgIGRlcHRoICs9IDE7XHJcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKG9wZW5bb3Blbi5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgIHN0YXJ0LnB1c2goc3RhcnRbc3RhcnQubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICBpZiAob2JqZWN0UGF0aHMpIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdFBhdGhzW3Rva2Vucy5qb2luKCcvJyldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IGxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydCxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFsdWVTdGFydC5wdXNoKHZhbHVlU3RhcnRbdmFsdWVTdGFydC5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2hhciA9PT0gJzonICYmICEoaXNTdHJpbmcgfHwgaXNBcnJheSkpIHtcclxuICAgICAgICAgICAgbGV0IG1hdGNoID0gZG9jLnN1YnN0cigwLCBpbmRleCArIDEpLm1hdGNoKHRva2VuX3JlZ2V4KTtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICBvcGVuLnB1c2gobWF0Y2hbMV0pO1xyXG4gICAgICAgICAgICAgICAgc3RhcnQucHVzaChbbGluZSwgaW5kZXggLSBtYXRjaFswXS5sZW5ndGggLSBsaW5lU3RhcnRdKTtcclxuICAgICAgICAgICAgICAgIHZhbHVlU3RhcnQucHVzaChbbGluZSwgaW5kZXggLSBsaW5lU3RhcnQgKyAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwcmVkaWNhdGUgJiYgcHJlZGljYXRlKGxpbmUsIGluZGV4IC0gbGluZVN0YXJ0KSkge1xyXG4gICAgICAgICAgICBpZiAoY2hhciA9PT0gJ30nIHx8IGNoYXIgPT09ICcsJykgb3Blbi5wb3AoKTtcclxuICAgICAgICAgICAgcmV0dXJuIDxhbnk+e1xyXG4gICAgICAgICAgICAgICAgcGF0aDogb3Blbi5qb2luKCcvJyksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3Blbi5sZW5ndGggJiYgKGNoYXIgPT09ICd9JyB8fCAoIWlzQXJyYXkgJiYgY2hhciA9PT0gJywnKSkpIHtcclxuICAgICAgICAgICAgdmFyIHBhdGggPSB0b2tlbnMuY29uY2F0KFtvcGVuLnBvcCgpXSkuam9pbignLycpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0cykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c1twYXRoXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LnBvcCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IFtsaW5lLCBpbmRleCArIDEgLSBsaW5lU3RhcnRdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogdmFsdWVTdGFydC5wb3AoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBbbGluZSwgaW5kZXggLSBsaW5lU3RhcnRdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIG9wZW4ucG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjaGFyID09PSAnfScpIHtcclxuICAgICAgICAgICAgZGVwdGggLT0gMTtcclxuICAgICAgICAgICAgdmFyIHBhdGggPSB0b2tlbnMuam9pbignLycpO1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0cykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c1twYXRoXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LnBvcCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IFtsaW5lLCBpbmRleCAtIGxpbmVTdGFydF1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB2YWx1ZVN0YXJ0LnBvcCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IFtsaW5lLCBpbmRleCAtIDEgLSBsaW5lU3RhcnRdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHRva2Vucy5wb3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB7IHJhbmdlczogcmVzdWx0cywgb2JqZWN0UGF0aHMgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmdlcyhlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IHsgcmFuZ2VzOiB7IFtrZXk6IHN0cmluZ106IElUb2tlblJhbmdlIH07IG9iamVjdFBhdGhzOiB7IFtrZXk6IHN0cmluZ106IHsgbGluZTogbnVtYmVyOyBjb2x1bW46IG51bWJlcjsgfSB9OyB9IHtcclxuICAgIHJldHVybiBkb0dldFJhbmdlcyhlZGl0b3IsIHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXRoKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBwcmVkaWNhdGU6IChsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKSA9PiBib29sZWFuKTogeyBwYXRoOiBzdHJpbmc7IH0ge1xyXG4gICAgcmV0dXJuIGRvR2V0UmFuZ2VzKGVkaXRvciwgcHJlZGljYXRlKTtcclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
