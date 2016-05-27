'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pad = pad;
exports.format = format;
exports.escape = escape;
exports.escapeRegExpCharacters = escapeRegExpCharacters;
exports.trim = trim;
exports.ltrim = ltrim;
exports.rtrim = rtrim;
exports.convertSimple2RegExpPattern = convertSimple2RegExpPattern;
exports.stripWildcards = stripWildcards;
exports.startsWith = startsWith;
exports.endsWith = endsWith;
exports.createRegExp = createRegExp;
exports.createSafeRegExp = createSafeRegExp;
exports.regExpLeadsToEndlessLoop = regExpLeadsToEndlessLoop;
exports.firstNonWhitespaceIndex = firstNonWhitespaceIndex;
exports.getLeadingWhitespace = getLeadingWhitespace;
exports.lastNonWhitespaceIndex = lastNonWhitespaceIndex;
exports.localeCompare = localeCompare;
exports.equalsIgnoreCase = equalsIgnoreCase;
exports.commonPrefixLength = commonPrefixLength;
exports.commonSuffixLength = commonSuffixLength;
exports.isFullWidthCharacter = isFullWidthCharacter;
exports.difference = difference;
exports.computeLineStarts = computeLineStarts;
exports.lcut = lcut;
exports.removeAnsiEscapeCodes = removeAnsiEscapeCodes;
exports.startsWithUTF8BOM = startsWithUTF8BOM;
exports.appendWithLimit = appendWithLimit;
exports.safeBtoa = safeBtoa;
exports.repeat = repeat;
var empty = exports.empty = '';
function pad(n, l) {
    var char = arguments.length <= 2 || arguments[2] === undefined ? '0' : arguments[2];

    var str = '' + n;
    var r = [str];
    for (var i = str.length; i < l; i++) {
        r.push(char);
    }
    return r.reverse().join('');
}
var _formatRegexp = /{(\d+)}/g;
function format(value) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    if (args.length === 0) {
        return value;
    }
    return value.replace(_formatRegexp, function (match, group) {
        var idx = parseInt(group, 10);
        return isNaN(idx) || idx < 0 || idx >= args.length ? match : args[idx];
    });
}
function escape(html) {
    return html.replace(/[<|>|&]/g, function (match) {
        switch (match) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            default:
                return match;
        }
    });
}
function escapeRegExpCharacters(value) {
    return value.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
}
function trim(haystack) {
    var needle = arguments.length <= 1 || arguments[1] === undefined ? ' ' : arguments[1];

    var trimmed = ltrim(haystack, needle);
    return rtrim(trimmed, needle);
}
function ltrim(haystack, needle) {
    if (!haystack || !needle) {
        return haystack;
    }
    var needleLen = needle.length;
    if (needleLen === 0 || haystack.length === 0) {
        return haystack;
    }
    var offset = 0,
        idx = -1;
    while ((idx = haystack.indexOf(needle, offset)) === offset) {
        offset = offset + needleLen;
    }
    return haystack.substring(offset);
}
function rtrim(haystack, needle) {
    if (!haystack || !needle) {
        return haystack;
    }
    var needleLen = needle.length,
        haystackLen = haystack.length;
    if (needleLen === 0 || haystackLen === 0) {
        return haystack;
    }
    var offset = haystackLen,
        idx = -1;
    while (true) {
        idx = haystack.lastIndexOf(needle, offset - 1);
        if (idx === -1 || idx + needleLen !== offset) {
            break;
        }
        if (idx === 0) {
            return '';
        }
        offset = idx;
    }
    return haystack.substring(0, offset);
}
function convertSimple2RegExpPattern(pattern) {
    return pattern.replace(/[\-\\\{\}\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&').replace(/[\*]/g, '.*');
}
function stripWildcards(pattern) {
    return pattern.replace(/\*/g, '');
}
function startsWith(haystack, needle) {
    if (haystack.length < needle.length) {
        return false;
    }
    for (var i = 0; i < needle.length; i++) {
        if (haystack[i] !== needle[i]) {
            return false;
        }
    }
    return true;
}
function endsWith(haystack, needle) {
    var diff = haystack.length - needle.length;
    if (diff > 0) {
        return haystack.lastIndexOf(needle) === diff;
    } else if (diff === 0) {
        return haystack === needle;
    } else {
        return false;
    }
}
function createRegExp(searchString, isRegex, matchCase, wholeWord, global) {
    if (searchString === '') {
        throw new Error('Cannot create regex from empty string');
    }
    if (!isRegex) {
        searchString = searchString.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&');
    }
    if (wholeWord) {
        if (!/\B/.test(searchString.charAt(0))) {
            searchString = '\\b' + searchString;
        }
        if (!/\B/.test(searchString.charAt(searchString.length - 1))) {
            searchString = searchString + '\\b';
        }
    }
    var modifiers = '';
    if (global) {
        modifiers += 'g';
    }
    if (!matchCase) {
        modifiers += 'i';
    }
    return new RegExp(searchString, modifiers);
}
function createSafeRegExp(searchString, isRegex, matchCase, wholeWord) {
    if (searchString === '') {
        return null;
    }
    var regex = null;
    try {
        regex = createRegExp(searchString, isRegex, matchCase, wholeWord, true);
    } catch (err) {
        return null;
    }
    try {
        if (regExpLeadsToEndlessLoop(regex)) {
            return null;
        }
    } catch (err) {
        return null;
    }
    return regex;
}
function regExpLeadsToEndlessLoop(regexp) {
    if (regexp.source === '^' || regexp.source === '^$' || regexp.source === '$') {
        return false;
    }
    var match = regexp.exec('');
    return match && regexp.lastIndex === 0;
}
var canNormalize = exports.canNormalize = typeof ''.normalize === 'function';
function firstNonWhitespaceIndex(str) {
    for (var i = 0, len = str.length; i < len; i++) {
        if (str.charAt(i) !== ' ' && str.charAt(i) !== '\t') {
            return i;
        }
    }
    return -1;
}
function getLeadingWhitespace(str) {
    for (var i = 0, len = str.length; i < len; i++) {
        if (str.charAt(i) !== ' ' && str.charAt(i) !== '\t') {
            return str.substring(0, i);
        }
    }
    return str;
}
function lastNonWhitespaceIndex(str) {
    var startIndex = arguments.length <= 1 || arguments[1] === undefined ? str.length - 1 : arguments[1];

    for (var i = startIndex; i >= 0; i--) {
        if (str.charAt(i) !== ' ' && str.charAt(i) !== '\t') {
            return i;
        }
    }
    return -1;
}
function localeCompare(strA, strB) {
    return strA.localeCompare(strB);
}
function isAsciiChar(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function equalsIgnoreCase(a, b) {
    var len1 = a.length,
        len2 = b.length;
    if (len1 !== len2) {
        return false;
    }
    for (var i = 0; i < len1; i++) {
        var codeA = a.charCodeAt(i),
            codeB = b.charCodeAt(i);
        if (codeA === codeB) {
            continue;
        } else if (isAsciiChar(codeA) && isAsciiChar(codeB)) {
            var diff = Math.abs(codeA - codeB);
            if (diff !== 0 && diff !== 32) {
                return false;
            }
        } else {
            if (String.fromCharCode(codeA).toLocaleLowerCase() !== String.fromCharCode(codeB).toLocaleLowerCase()) {
                return false;
            }
        }
    }
    return true;
}
function commonPrefixLength(a, b) {
    var i = void 0,
        len = Math.min(a.length, b.length);
    for (i = 0; i < len; i++) {
        if (a.charCodeAt(i) !== b.charCodeAt(i)) {
            return i;
        }
    }
    return len;
}
function commonSuffixLength(a, b) {
    var i = void 0,
        len = Math.min(a.length, b.length);
    var aLastIndex = a.length - 1;
    var bLastIndex = b.length - 1;
    for (i = 0; i < len; i++) {
        if (a.charCodeAt(aLastIndex - i) !== b.charCodeAt(bLastIndex - i)) {
            return i;
        }
    }
    return len;
}
function isFullWidthCharacter(charCode) {
    charCode = +charCode;
    return charCode >= 0x2E80 && charCode <= 0xD7AF || charCode >= 0xF900 && charCode <= 0xFAFF || charCode >= 0xFF01 && charCode <= 0xFF5E;
}
function difference(first, second) {
    var maxLenDelta = arguments.length <= 2 || arguments[2] === undefined ? 4 : arguments[2];

    var lengthDifference = Math.abs(first.length - second.length);
    if (lengthDifference > maxLenDelta) {
        return 0;
    }
    var LCS = [];
    var zeroArray = [];
    var i = void 0,
        j = void 0;
    for (i = 0; i < second.length + 1; ++i) {
        zeroArray.push(0);
    }
    for (i = 0; i < first.length + 1; ++i) {
        LCS.push(zeroArray);
    }
    for (i = 1; i < first.length + 1; ++i) {
        for (j = 1; j < second.length + 1; ++j) {
            if (first[i - 1] === second[j - 1]) {
                LCS[i][j] = LCS[i - 1][j - 1] + 1;
            } else {
                LCS[i][j] = Math.max(LCS[i - 1][j], LCS[i][j - 1]);
            }
        }
    }
    return LCS[first.length][second.length] - Math.sqrt(lengthDifference);
}
function computeLineStarts(text) {
    var regexp = /\r\n|\r|\n/g,
        ret = [0],
        match = void 0;
    while (match = regexp.exec(text)) {
        ret.push(regexp.lastIndex);
    }
    return ret;
}
function lcut(text, n) {
    if (text.length < n) {
        return text;
    }
    var segments = text.split(/\b/),
        count = 0;
    for (var i = segments.length - 1; i >= 0; i--) {
        count += segments[i].length;
        if (count > n) {
            segments.splice(0, i);
            break;
        }
    }
    return segments.join(empty).replace(/^\s/, empty);
}
var EL = /\x1B\x5B[12]?K/g;
var LF = /\xA/g;
var COLOR_START = /\x1b\[\d+m/g;
var COLOR_END = /\x1b\[0?m/g;
function removeAnsiEscapeCodes(str) {
    if (str) {
        str = str.replace(EL, '');
        str = str.replace(LF, '\n');
        str = str.replace(COLOR_START, '');
        str = str.replace(COLOR_END, '');
    }
    return str;
}
var __utf8_bom = 65279;
var UTF8_BOM_CHARACTER = exports.UTF8_BOM_CHARACTER = String.fromCharCode(__utf8_bom);
function startsWithUTF8BOM(str) {
    return str && str.length > 0 && str.charCodeAt(0) === __utf8_bom;
}
function appendWithLimit(first, second, maxLength) {
    var newLength = first.length + second.length;
    if (newLength > maxLength) {
        first = '...' + first.substr(newLength - maxLength);
    }
    if (second.length > maxLength) {
        first += second.substr(second.length - maxLength);
    } else {
        first += second;
    }
    return first;
}
function safeBtoa(str) {
    return btoa(encodeURIComponent(str));
}
function repeat(s, count) {
    var result = '';
    for (var i = 0; i < count; i++) {
        result += s;
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9jb21tb24vc3RyaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7UUFVQSxHLEdBQUEsRztRQW1CQSxNLEdBQUEsTTtRQWdCQSxNLEdBQUEsTTtRQWNBLHNCLEdBQUEsc0I7UUFTQSxJLEdBQUEsSTtRQVVBLEssR0FBQSxLO1FBd0JBLEssR0FBQSxLO1FBNkJBLDJCLEdBQUEsMkI7UUFJQSxjLEdBQUEsYztRQU9BLFUsR0FBQSxVO1FBaUJBLFEsR0FBQSxRO1FBV0EsWSxHQUFBLFk7UUE2QkEsZ0IsR0FBQSxnQjtRQXlCQSx3QixHQUFBLHdCO1FBeUJBLHVCLEdBQUEsdUI7UUFhQSxvQixHQUFBLG9CO1FBYUEsc0IsR0FBQSxzQjtRQVNBLGEsR0FBQSxhO1FBUUEsZ0IsR0FBQSxnQjtRQW1DQSxrQixHQUFBLGtCO1FBaUJBLGtCLEdBQUEsa0I7UUEwQ0Esb0IsR0FBQSxvQjtRQXlEQSxVLEdBQUEsVTtRQWdDQSxpQixHQUFBLGlCO1FBY0EsSSxHQUFBLEk7UUE0QkEscUIsR0FBQSxxQjtRQWlCQSxpQixHQUFBLGlCO1FBUUEsZSxHQUFBLGU7UUFlQSxRLEdBQUEsUTtRQUlBLE0sR0FBQSxNO0FBNWlCTyxJQUFNLHdCQUFRLEVBQWQ7QUFLUCxTQUFBLEdBQUEsQ0FBb0IsQ0FBcEIsRUFBK0IsQ0FBL0IsRUFBNEQ7QUFBQSxRQUFsQixJQUFrQix5REFBSCxHQUFHOztBQUMzRCxRQUFJLE1BQU0sS0FBSyxDQUFmO0FBQ0EsUUFBSSxJQUFJLENBQUMsR0FBRCxDQUFSO0FBRUEsU0FBSyxJQUFJLElBQUksSUFBSSxNQUFqQixFQUF5QixJQUFJLENBQTdCLEVBQWdDLEdBQWhDLEVBQXFDO0FBQ3BDLFVBQUUsSUFBRixDQUFPLElBQVA7QUFDQTtBQUVELFdBQU8sRUFBRSxPQUFGLEdBQVksSUFBWixDQUFpQixFQUFqQixDQUFQO0FBQ0E7QUFFRCxJQUFNLGdCQUFnQixVQUF0QjtBQVFBLFNBQUEsTUFBQSxDQUF1QixLQUF2QixF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dGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBlbXB0eSBzdHJpbmcuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgZW1wdHkgPSAnJztcclxuXHJcbi8qKlxyXG4gKiBAcmV0dXJucyB0aGUgcHJvdmlkZWQgbnVtYmVyIHdpdGggdGhlIGdpdmVuIG51bWJlciBvZiBwcmVjZWRpbmcgemVyb3MuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGFkKG46IG51bWJlciwgbDogbnVtYmVyLCBjaGFyOiBzdHJpbmcgPSAnMCcpOiBzdHJpbmcge1xyXG5cdGxldCBzdHIgPSAnJyArIG47XHJcblx0bGV0IHIgPSBbc3RyXTtcclxuXHJcblx0Zm9yIChsZXQgaSA9IHN0ci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdHIucHVzaChjaGFyKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiByLnJldmVyc2UoKS5qb2luKCcnKTtcclxufVxyXG5cclxuY29uc3QgX2Zvcm1hdFJlZ2V4cCA9IC97KFxcZCspfS9nO1xyXG5cclxuLyoqXHJcbiAqIEhlbHBlciB0byBwcm9kdWNlIGEgc3RyaW5nIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgYXJndW1lbnRzLiBJbnNlcnQgdmFyaWFibGUgc2VnbWVudHNcclxuICogaW50byB0aGUgc3RyaW5nIHVzaW5nIHRoZSB7bn0gbm90YXRpb24gd2hlcmUgTiBpcyB0aGUgaW5kZXggb2YgdGhlIGFyZ3VtZW50IGZvbGxvd2luZyB0aGUgc3RyaW5nLlxyXG4gKiBAcGFyYW0gdmFsdWUgc3RyaW5nIHRvIHdoaWNoIGZvcm1hdHRpbmcgaXMgYXBwbGllZFxyXG4gKiBAcGFyYW0gYXJncyByZXBsYWNlbWVudHMgZm9yIHtufS1lbnRyaWVzXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHZhbHVlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogc3RyaW5nIHtcclxuXHRpZiAoYXJncy5sZW5ndGggPT09IDApIHtcclxuXHRcdHJldHVybiB2YWx1ZTtcclxuXHR9XHJcblx0cmV0dXJuIHZhbHVlLnJlcGxhY2UoX2Zvcm1hdFJlZ2V4cCwgZnVuY3Rpb24obWF0Y2gsIGdyb3VwKSB7XHJcblx0XHRsZXQgaWR4ID0gcGFyc2VJbnQoZ3JvdXAsIDEwKTtcclxuXHRcdHJldHVybiBpc05hTihpZHgpIHx8IGlkeCA8IDAgfHwgaWR4ID49IGFyZ3MubGVuZ3RoID9cclxuXHRcdFx0bWF0Y2ggOlxyXG5cdFx0XHRhcmdzW2lkeF07XHJcblx0fSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb252ZXJ0cyBIVE1MIGNoYXJhY3RlcnMgaW5zaWRlIHRoZSBzdHJpbmcgdG8gdXNlIGVudGl0aWVzIGluc3RlYWQuIE1ha2VzIHRoZSBzdHJpbmcgc2FmZSBmcm9tXHJcbiAqIGJlaW5nIHVzZWQgZS5nLiBpbiBIVE1MRWxlbWVudC5pbm5lckhUTUwuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0cmV0dXJuIGh0bWwucmVwbGFjZSgvWzx8PnwmXS9nLCBmdW5jdGlvbihtYXRjaCkge1xyXG5cdFx0c3dpdGNoIChtYXRjaCkge1xyXG5cdFx0XHRjYXNlICc8JzogcmV0dXJuICcmbHQ7JztcclxuXHRcdFx0Y2FzZSAnPic6IHJldHVybiAnJmd0Oyc7XHJcblx0XHRcdGNhc2UgJyYnOiByZXR1cm4gJyZhbXA7JztcclxuXHRcdFx0ZGVmYXVsdDogcmV0dXJuIG1hdGNoO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG59XHJcblxyXG4vKipcclxuICogRXNjYXBlcyByZWd1bGFyIGV4cHJlc3Npb24gY2hhcmFjdGVycyBpbiBhIGdpdmVuIHN0cmluZ1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZVJlZ0V4cENoYXJhY3RlcnModmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0cmV0dXJuIHZhbHVlLnJlcGxhY2UoL1tcXC1cXFxcXFx7XFx9XFwqXFwrXFw/XFx8XFxeXFwkXFwuXFwsXFxbXFxdXFwoXFwpXFwjXFxzXS9nLCAnXFxcXCQmJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBvY2N1cnJlbmNlcyBvZiBuZWVkbGUgZnJvbSB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgaGF5c3RhY2suXHJcbiAqIEBwYXJhbSBoYXlzdGFjayBzdHJpbmcgdG8gdHJpbVxyXG4gKiBAcGFyYW0gbmVlZGxlIHRoZSB0aGluZyB0byB0cmltIChkZWZhdWx0IGlzIGEgYmxhbmspXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdHJpbShoYXlzdGFjazogc3RyaW5nLCBuZWVkbGU6IHN0cmluZyA9ICcgJyk6IHN0cmluZyB7XHJcblx0bGV0IHRyaW1tZWQgPSBsdHJpbShoYXlzdGFjaywgbmVlZGxlKTtcclxuXHRyZXR1cm4gcnRyaW0odHJpbW1lZCwgbmVlZGxlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIG9jY3VycmVuY2VzIG9mIG5lZWRsZSBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgaGF5c3RhY2suXHJcbiAqIEBwYXJhbSBoYXlzdGFjayBzdHJpbmcgdG8gdHJpbVxyXG4gKiBAcGFyYW0gbmVlZGxlIHRoZSB0aGluZyB0byB0cmltXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbHRyaW0oaGF5c3RhY2s/OiBzdHJpbmcsIG5lZWRsZT86IHN0cmluZyk6IHN0cmluZyB7XHJcblx0aWYgKCFoYXlzdGFjayB8fCAhbmVlZGxlKSB7XHJcblx0XHRyZXR1cm4gaGF5c3RhY2s7XHJcblx0fVxyXG5cclxuXHRsZXQgbmVlZGxlTGVuID0gbmVlZGxlLmxlbmd0aDtcclxuXHRpZiAobmVlZGxlTGVuID09PSAwIHx8IGhheXN0YWNrLmxlbmd0aCA9PT0gMCkge1xyXG5cdFx0cmV0dXJuIGhheXN0YWNrO1xyXG5cdH1cclxuXHJcblx0bGV0IG9mZnNldCA9IDAsXHJcblx0XHRpZHggPSAtMTtcclxuXHJcblx0d2hpbGUgKChpZHggPSBoYXlzdGFjay5pbmRleE9mKG5lZWRsZSwgb2Zmc2V0KSkgPT09IG9mZnNldCkge1xyXG5cdFx0b2Zmc2V0ID0gb2Zmc2V0ICsgbmVlZGxlTGVuO1xyXG5cdH1cclxuXHRyZXR1cm4gaGF5c3RhY2suc3Vic3RyaW5nKG9mZnNldCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBvY2N1cnJlbmNlcyBvZiBuZWVkbGUgZnJvbSB0aGUgZW5kIG9mIGhheXN0YWNrLlxyXG4gKiBAcGFyYW0gaGF5c3RhY2sgc3RyaW5nIHRvIHRyaW1cclxuICogQHBhcmFtIG5lZWRsZSB0aGUgdGhpbmcgdG8gdHJpbVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJ0cmltKGhheXN0YWNrPzogc3RyaW5nLCBuZWVkbGU/OiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdGlmICghaGF5c3RhY2sgfHwgIW5lZWRsZSkge1xyXG5cdFx0cmV0dXJuIGhheXN0YWNrO1xyXG5cdH1cclxuXHJcblx0bGV0IG5lZWRsZUxlbiA9IG5lZWRsZS5sZW5ndGgsXHJcblx0XHRoYXlzdGFja0xlbiA9IGhheXN0YWNrLmxlbmd0aDtcclxuXHJcblx0aWYgKG5lZWRsZUxlbiA9PT0gMCB8fCBoYXlzdGFja0xlbiA9PT0gMCkge1xyXG5cdFx0cmV0dXJuIGhheXN0YWNrO1xyXG5cdH1cclxuXHJcblx0bGV0IG9mZnNldCA9IGhheXN0YWNrTGVuLFxyXG5cdFx0aWR4ID0gLTE7XHJcblxyXG5cdHdoaWxlICh0cnVlKSB7XHJcblx0XHRpZHggPSBoYXlzdGFjay5sYXN0SW5kZXhPZihuZWVkbGUsIG9mZnNldCAtIDEpO1xyXG5cdFx0aWYgKGlkeCA9PT0gLTEgfHwgaWR4ICsgbmVlZGxlTGVuICE9PSBvZmZzZXQpIHtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0XHRpZiAoaWR4ID09PSAwKSB7XHJcblx0XHRcdHJldHVybiAnJztcclxuXHRcdH1cclxuXHRcdG9mZnNldCA9IGlkeDtcclxuXHR9XHJcblxyXG5cdHJldHVybiBoYXlzdGFjay5zdWJzdHJpbmcoMCwgb2Zmc2V0KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRTaW1wbGUyUmVnRXhwUGF0dGVybihwYXR0ZXJuOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdHJldHVybiBwYXR0ZXJuLnJlcGxhY2UoL1tcXC1cXFxcXFx7XFx9XFwrXFw/XFx8XFxeXFwkXFwuXFwsXFxbXFxdXFwoXFwpXFwjXFxzXS9nLCAnXFxcXCQmJykucmVwbGFjZSgvW1xcKl0vZywgJy4qJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdHJpcFdpbGRjYXJkcyhwYXR0ZXJuOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdHJldHVybiBwYXR0ZXJuLnJlcGxhY2UoL1xcKi9nLCAnJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIGlmIGhheXN0YWNrIHN0YXJ0cyB3aXRoIG5lZWRsZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzdGFydHNXaXRoKGhheXN0YWNrOiBzdHJpbmcsIG5lZWRsZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcblx0aWYgKGhheXN0YWNrLmxlbmd0aCA8IG5lZWRsZS5sZW5ndGgpIHtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbmVlZGxlLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRpZiAoaGF5c3RhY2tbaV0gIT09IG5lZWRsZVtpXSkge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgaWYgaGF5c3RhY2sgZW5kcyB3aXRoIG5lZWRsZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBlbmRzV2l0aChoYXlzdGFjazogc3RyaW5nLCBuZWVkbGU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG5cdGxldCBkaWZmID0gaGF5c3RhY2subGVuZ3RoIC0gbmVlZGxlLmxlbmd0aDtcclxuXHRpZiAoZGlmZiA+IDApIHtcclxuXHRcdHJldHVybiBoYXlzdGFjay5sYXN0SW5kZXhPZihuZWVkbGUpID09PSBkaWZmO1xyXG5cdH0gZWxzZSBpZiAoZGlmZiA9PT0gMCkge1xyXG5cdFx0cmV0dXJuIGhheXN0YWNrID09PSBuZWVkbGU7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZWdFeHAoc2VhcmNoU3RyaW5nOiBzdHJpbmcsIGlzUmVnZXg6IGJvb2xlYW4sIG1hdGNoQ2FzZTogYm9vbGVhbiwgd2hvbGVXb3JkOiBib29sZWFuLCBnbG9iYWw6Ym9vbGVhbik6IFJlZ0V4cCB7XHJcblx0aWYgKHNlYXJjaFN0cmluZyA9PT0gJycpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSByZWdleCBmcm9tIGVtcHR5IHN0cmluZycpO1xyXG5cdH1cclxuXHRpZiAoIWlzUmVnZXgpIHtcclxuXHRcdHNlYXJjaFN0cmluZyA9IHNlYXJjaFN0cmluZy5yZXBsYWNlKC9bXFwtXFxcXFxce1xcfVxcKlxcK1xcP1xcfFxcXlxcJFxcLlxcLFxcW1xcXVxcKFxcKVxcI1xcc10vZywgJ1xcXFwkJicpO1xyXG5cdH1cclxuXHRpZiAod2hvbGVXb3JkKSB7XHJcblx0XHRpZiAoIS9cXEIvLnRlc3Qoc2VhcmNoU3RyaW5nLmNoYXJBdCgwKSkpIHtcclxuXHRcdFx0c2VhcmNoU3RyaW5nID0gJ1xcXFxiJyArIHNlYXJjaFN0cmluZztcclxuXHRcdH1cclxuXHRcdGlmICghL1xcQi8udGVzdChzZWFyY2hTdHJpbmcuY2hhckF0KHNlYXJjaFN0cmluZy5sZW5ndGggLSAxKSkpIHtcclxuXHRcdFx0c2VhcmNoU3RyaW5nID0gc2VhcmNoU3RyaW5nICsgJ1xcXFxiJztcclxuXHRcdH1cclxuXHR9XHJcblx0bGV0IG1vZGlmaWVycyA9ICcnO1xyXG5cdGlmIChnbG9iYWwpIHtcclxuXHRcdG1vZGlmaWVycyArPSAnZyc7XHJcblx0fVxyXG5cdGlmICghbWF0Y2hDYXNlKSB7XHJcblx0XHRtb2RpZmllcnMgKz0gJ2knO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIG5ldyBSZWdFeHAoc2VhcmNoU3RyaW5nLCBtb2RpZmllcnMpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgcmVndWxhciBleHByZXNzaW9uIG9ubHkgaWYgaXQgaXMgdmFsaWQgYW5kIGl0IGRvZXNuJ3QgbGVhZCB0byBlbmRsZXNzIGxvb3AuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2FmZVJlZ0V4cChzZWFyY2hTdHJpbmc6c3RyaW5nLCBpc1JlZ2V4OmJvb2xlYW4sIG1hdGNoQ2FzZTpib29sZWFuLCB3aG9sZVdvcmQ6Ym9vbGVhbik6IFJlZ0V4cCB7XHJcblx0XHRpZiAoc2VhcmNoU3RyaW5nID09PSAnJykge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBUcnkgdG8gY3JlYXRlIGEgUmVnRXhwIG91dCBvZiB0aGUgcGFyYW1zXHJcblx0XHR2YXIgcmVnZXg6UmVnRXhwID0gbnVsbDtcclxuXHRcdHRyeSB7XHJcblx0XHRcdHJlZ2V4ID0gY3JlYXRlUmVnRXhwKHNlYXJjaFN0cmluZywgaXNSZWdleCwgbWF0Y2hDYXNlLCB3aG9sZVdvcmQsIHRydWUpO1xyXG5cdFx0fSBjYXRjaCAoZXJyKSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEd1YXJkIGFnYWluc3QgZW5kbGVzcyBsb29wIFJlZ0V4cHMgJiB3cmFwIGFyb3VuZCB0cnktY2F0Y2ggYXMgdmVyeSBsb25nIHJlZ2V4ZXMgcHJvZHVjZSBhbiBleGNlcHRpb24gd2hlbiBleGVjdXRlZCB0aGUgZmlyc3QgdGltZVxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0aWYgKHJlZ0V4cExlYWRzVG9FbmRsZXNzTG9vcChyZWdleCkpIHtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0fSBjYXRjaCAoZXJyKSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZWdleDtcclxuXHR9XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVnRXhwTGVhZHNUb0VuZGxlc3NMb29wKHJlZ2V4cDogUmVnRXhwKTogYm9vbGVhbiB7XHJcblx0Ly8gRXhpdCBlYXJseSBpZiBpdCdzIG9uZSBvZiB0aGVzZSBzcGVjaWFsIGNhc2VzIHdoaWNoIGFyZSBtZWFudCB0byBtYXRjaFxyXG5cdC8vIGFnYWluc3QgYW4gZW1wdHkgc3RyaW5nXHJcblx0aWYgKHJlZ2V4cC5zb3VyY2UgPT09ICdeJyB8fCByZWdleHAuc291cmNlID09PSAnXiQnIHx8IHJlZ2V4cC5zb3VyY2UgPT09ICckJykge1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHJcblx0Ly8gV2UgY2hlY2sgYWdhaW5zdCBhbiBlbXB0eSBzdHJpbmcuIElmIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gZG9lc24ndCBhZHZhbmNlXHJcblx0Ly8gKGUuZy4gZW5kcyBpbiBhbiBlbmRsZXNzIGxvb3ApIGl0IHdpbGwgbWF0Y2ggYW4gZW1wdHkgc3RyaW5nLlxyXG5cdGxldCBtYXRjaCA9IHJlZ2V4cC5leGVjKCcnKTtcclxuXHRyZXR1cm4gKG1hdGNoICYmIDxhbnk+cmVnZXhwLmxhc3RJbmRleCA9PT0gMCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGUgbm9ybWFsaXplKCkgbWV0aG9kIHJldHVybnMgdGhlIFVuaWNvZGUgTm9ybWFsaXphdGlvbiBGb3JtIG9mIGEgZ2l2ZW4gc3RyaW5nLiBUaGUgZm9ybSB3aWxsIGJlXHJcbiAqIHRoZSBOb3JtYWxpemF0aW9uIEZvcm0gQ2Fub25pY2FsIENvbXBvc2l0aW9uLlxyXG4gKlxyXG4gKiBAc2VlIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvbm9ybWFsaXplfVxyXG4gKi9cclxuZXhwb3J0IGxldCBjYW5Ob3JtYWxpemUgPSB0eXBlb2YgKCg8YW55PicnKS5ub3JtYWxpemUpID09PSAnZnVuY3Rpb24nO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgZmlyc3QgaW5kZXggb2YgdGhlIHN0cmluZyB0aGF0IGlzIG5vdCB3aGl0ZXNwYWNlLlxyXG4gKiBJZiBzdHJpbmcgaXMgZW1wdHkgb3IgY29udGFpbnMgb25seSB3aGl0ZXNwYWNlcywgcmV0dXJucyAtMVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGZpcnN0Tm9uV2hpdGVzcGFjZUluZGV4KHN0cjogc3RyaW5nKTogbnVtYmVyIHtcclxuXHRmb3IgKGxldCBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRpZiAoc3RyLmNoYXJBdChpKSAhPT0gJyAnICYmIHN0ci5jaGFyQXQoaSkgIT09ICdcXHQnKSB7XHJcblx0XHRcdHJldHVybiBpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gLTE7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBsZWFkaW5nIHdoaXRlc3BhY2Ugb2YgdGhlIHN0cmluZy5cclxuICogSWYgdGhlIHN0cmluZyBjb250YWlucyBvbmx5IHdoaXRlc3BhY2VzLCByZXR1cm5zIGVudGlyZSBzdHJpbmdcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMZWFkaW5nV2hpdGVzcGFjZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0aWYgKHN0ci5jaGFyQXQoaSkgIT09ICcgJyAmJiBzdHIuY2hhckF0KGkpICE9PSAnXFx0Jykge1xyXG5cdFx0XHRyZXR1cm4gc3RyLnN1YnN0cmluZygwLCBpKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHN0cjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgbGFzdCBpbmRleCBvZiB0aGUgc3RyaW5nIHRoYXQgaXMgbm90IHdoaXRlc3BhY2UuXHJcbiAqIElmIHN0cmluZyBpcyBlbXB0eSBvciBjb250YWlucyBvbmx5IHdoaXRlc3BhY2VzLCByZXR1cm5zIC0xXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGFzdE5vbldoaXRlc3BhY2VJbmRleChzdHI6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyID0gc3RyLmxlbmd0aCAtIDEpOiBudW1iZXIge1xyXG5cdGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpID49IDA7IGktLSkge1xyXG5cdFx0aWYgKHN0ci5jaGFyQXQoaSkgIT09ICcgJyAmJiBzdHIuY2hhckF0KGkpICE9PSAnXFx0Jykge1xyXG5cdFx0XHRyZXR1cm4gaTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIC0xO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9jYWxlQ29tcGFyZShzdHJBOiBzdHJpbmcsIHN0ckI6IHN0cmluZyk6IG51bWJlciB7XHJcblx0cmV0dXJuIHN0ckEubG9jYWxlQ29tcGFyZShzdHJCKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNBc2NpaUNoYXIoY29kZTogbnVtYmVyKTogYm9vbGVhbiB7XHJcblx0cmV0dXJuIChjb2RlID49IDk3ICYmIGNvZGUgPD0gMTIyKSB8fCAoY29kZSA+PSA2NSAmJiBjb2RlIDw9IDkwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsc0lnbm9yZUNhc2UoYTogc3RyaW5nLCBiOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHJcblx0bGV0IGxlbjEgPSBhLmxlbmd0aCxcclxuXHRcdGxlbjIgPSBiLmxlbmd0aDtcclxuXHJcblx0aWYgKGxlbjEgIT09IGxlbjIpIHtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuMTsgaSsrKSB7XHJcblxyXG5cdFx0bGV0IGNvZGVBID0gYS5jaGFyQ29kZUF0KGkpLFxyXG5cdFx0XHRjb2RlQiA9IGIuY2hhckNvZGVBdChpKTtcclxuXHJcblx0XHRpZiAoY29kZUEgPT09IGNvZGVCKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cclxuXHRcdH0gZWxzZSBpZiAoaXNBc2NpaUNoYXIoY29kZUEpICYmIGlzQXNjaWlDaGFyKGNvZGVCKSkge1xyXG5cdFx0XHRsZXQgZGlmZiA9IE1hdGguYWJzKGNvZGVBIC0gY29kZUIpO1xyXG5cdFx0XHRpZiAoZGlmZiAhPT0gMCAmJiBkaWZmICE9PSAzMikge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZUEpLnRvTG9jYWxlTG93ZXJDYXNlKCkgIT09IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZUIpLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiB0cnVlO1xyXG59XHJcblxyXG4vKipcclxuICogQHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgY29tbW9uIHByZWZpeCBvZiB0aGUgdHdvIHN0cmluZ3MuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tbW9uUHJlZml4TGVuZ3RoKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcclxuXHJcblx0bGV0IGk6IG51bWJlcixcclxuXHRcdGxlbiA9IE1hdGgubWluKGEubGVuZ3RoLCBiLmxlbmd0aCk7XHJcblxyXG5cdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0aWYgKGEuY2hhckNvZGVBdChpKSAhPT0gYi5jaGFyQ29kZUF0KGkpKSB7XHJcblx0XHRcdHJldHVybiBpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGxlbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIGNvbW1vbiBzdWZmaXggb2YgdGhlIHR3byBzdHJpbmdzLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1vblN1ZmZpeExlbmd0aChhOiBzdHJpbmcsIGI6IHN0cmluZyk6IG51bWJlciB7XHJcblxyXG5cdGxldCBpOiBudW1iZXIsXHJcblx0XHRsZW4gPSBNYXRoLm1pbihhLmxlbmd0aCwgYi5sZW5ndGgpO1xyXG5cclxuXHRsZXQgYUxhc3RJbmRleCA9IGEubGVuZ3RoIC0gMTtcclxuXHRsZXQgYkxhc3RJbmRleCA9IGIubGVuZ3RoIC0gMTtcclxuXHJcblx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRpZiAoYS5jaGFyQ29kZUF0KGFMYXN0SW5kZXggLSBpKSAhPT0gYi5jaGFyQ29kZUF0KGJMYXN0SW5kZXggLSBpKSkge1xyXG5cdFx0XHRyZXR1cm4gaTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBsZW47XHJcbn1cclxuXHJcbi8vIC0tLSB1bmljb2RlXHJcbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU3Vycm9nYXRlX3BhaXJcclxuLy8gUmV0dXJucyB0aGUgY29kZSBwb2ludCBzdGFydGluZyBhdCBhIHNwZWNpZmllZCBpbmRleCBpbiBhIHN0cmluZ1xyXG4vLyBDb2RlIHBvaW50cyBVKzAwMDAgdG8gVStEN0ZGIGFuZCBVK0UwMDAgdG8gVStGRkZGIGFyZSByZXByZXNlbnRlZCBvbiBhIHNpbmdsZSBjaGFyYWN0ZXJcclxuLy8gQ29kZSBwb2ludHMgVSsxMDAwMCB0byBVKzEwRkZGRiBhcmUgcmVwcmVzZW50ZWQgb24gdHdvIGNvbnNlY3V0aXZlIGNoYXJhY3RlcnNcclxuLy9leHBvcnQgZnVuY3Rpb24gZ2V0VW5pY29kZVBvaW50KHN0cjpzdHJpbmcsIGluZGV4Om51bWJlciwgbGVuOm51bWJlcik6bnVtYmVyIHtcclxuLy9cdGxldCBjaHJDb2RlID0gc3RyLmNoYXJDb2RlQXQoaW5kZXgpO1xyXG4vL1x0aWYgKDB4RDgwMCA8PSBjaHJDb2RlICYmIGNockNvZGUgPD0gMHhEQkZGICYmIGluZGV4ICsgMSA8IGxlbikge1xyXG4vL1x0XHRsZXQgbmV4dENockNvZGUgPSBzdHIuY2hhckNvZGVBdChpbmRleCArIDEpO1xyXG4vL1x0XHRpZiAoMHhEQzAwIDw9IG5leHRDaHJDb2RlICYmIG5leHRDaHJDb2RlIDw9IDB4REZGRikge1xyXG4vL1x0XHRcdHJldHVybiAoY2hyQ29kZSAtIDB4RDgwMCkgPDwgMTAgKyAobmV4dENockNvZGUgLSAweERDMDApICsgMHgxMDAwMDtcclxuLy9cdFx0fVxyXG4vL1x0fVxyXG4vL1x0cmV0dXJuIGNockNvZGU7XHJcbi8vfVxyXG4vL2V4cG9ydCBmdW5jdGlvbiBpc0xlYWRTdXJyb2dhdGUoY2hyOnN0cmluZykge1xyXG4vL1x0bGV0IGNockNvZGUgPSBjaHIuY2hhckNvZGVBdCgwKTtcclxuLy9cdHJldHVybiA7XHJcbi8vfVxyXG4vL1xyXG4vL2V4cG9ydCBmdW5jdGlvbiBpc1RyYWlsU3Vycm9nYXRlKGNocjpzdHJpbmcpIHtcclxuLy9cdGxldCBjaHJDb2RlID0gY2hyLmNoYXJDb2RlQXQoMCk7XHJcbi8vXHRyZXR1cm4gMHhEQzAwIDw9IGNockNvZGUgJiYgY2hyQ29kZSA8PSAweERGRkY7XHJcbi8vfVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVsbFdpZHRoQ2hhcmFjdGVyKGNoYXJDb2RlOm51bWJlcik6IGJvb2xlYW4ge1xyXG5cdC8vIERvIGEgY2hlYXAgdHJpY2sgdG8gYmV0dGVyIHN1cHBvcnQgd3JhcHBpbmcgb2Ygd2lkZSBjaGFyYWN0ZXJzLCB0cmVhdCB0aGVtIGFzIDIgY29sdW1uc1xyXG5cdC8vIGh0dHA6Ly9qcmdyYXBoaXgubmV0L3Jlc2VhcmNoL3VuaWNvZGVfYmxvY2tzLnBocFxyXG5cdC8vICAgICAgICAgIDJFODAg4oCUIDJFRkYgICBDSksgUmFkaWNhbHMgU3VwcGxlbWVudFxyXG5cdC8vICAgICAgICAgIDJGMDAg4oCUIDJGREYgICBLYW5neGkgUmFkaWNhbHNcclxuXHQvLyAgICAgICAgICAyRkYwIOKAlCAyRkZGICAgSWRlb2dyYXBoaWMgRGVzY3JpcHRpb24gQ2hhcmFjdGVyc1xyXG5cdC8vICAgICAgICAgIDMwMDAg4oCUIDMwM0YgICBDSksgU3ltYm9scyBhbmQgUHVuY3R1YXRpb25cclxuXHQvLyAgICAgICAgICAzMDQwIOKAlCAzMDlGICAgSGlyYWdhbmFcclxuXHQvLyAgICAgICAgICAzMEEwIOKAlCAzMEZGICAgS2F0YWthbmFcclxuXHQvLyAgICAgICAgICAzMTAwIOKAlCAzMTJGICAgQm9wb21vZm9cclxuXHQvLyAgICAgICAgICAzMTMwIOKAlCAzMThGICAgSGFuZ3VsIENvbXBhdGliaWxpdHkgSmFtb1xyXG5cdC8vICAgICAgICAgIDMxOTAg4oCUIDMxOUYgICBLYW5idW5cclxuXHQvLyAgICAgICAgICAzMUEwIOKAlCAzMUJGICAgQm9wb21vZm8gRXh0ZW5kZWRcclxuXHQvLyAgICAgICAgICAzMUYwIOKAlCAzMUZGICAgS2F0YWthbmEgUGhvbmV0aWMgRXh0ZW5zaW9uc1xyXG5cdC8vICAgICAgICAgIDMyMDAg4oCUIDMyRkYgICBFbmNsb3NlZCBDSksgTGV0dGVycyBhbmQgTW9udGhzXHJcblx0Ly8gICAgICAgICAgMzMwMCDigJQgMzNGRiAgIENKSyBDb21wYXRpYmlsaXR5XHJcblx0Ly8gICAgICAgICAgMzQwMCDigJQgNERCRiAgIENKSyBVbmlmaWVkIElkZW9ncmFwaHMgRXh0ZW5zaW9uIEFcclxuXHQvLyAgICAgICAgICA0REMwIOKAlCA0REZGICAgWWlqaW5nIEhleGFncmFtIFN5bWJvbHNcclxuXHQvLyAgICAgICAgICA0RTAwIOKAlCA5RkZGICAgQ0pLIFVuaWZpZWQgSWRlb2dyYXBoc1xyXG5cdC8vICAgICAgICAgIEEwMDAg4oCUIEE0OEYgICBZaSBTeWxsYWJsZXNcclxuXHQvLyAgICAgICAgICBBNDkwIOKAlCBBNENGICAgWWkgUmFkaWNhbHNcclxuXHQvLyAgICAgICAgICBBQzAwIOKAlCBEN0FGICAgSGFuZ3VsIFN5bGxhYmxlc1xyXG5cdC8vIFtJR05PUkVdIEQ4MDAg4oCUIERCN0YgICBIaWdoIFN1cnJvZ2F0ZXNcclxuXHQvLyBbSUdOT1JFXSBEQjgwIOKAlCBEQkZGICAgSGlnaCBQcml2YXRlIFVzZSBTdXJyb2dhdGVzXHJcblx0Ly8gW0lHTk9SRV0gREMwMCDigJQgREZGRiAgIExvdyBTdXJyb2dhdGVzXHJcblx0Ly8gW0lHTk9SRV0gRTAwMCDigJQgRjhGRiAgIFByaXZhdGUgVXNlIEFyZWFcclxuXHQvLyAgICAgICAgICBGOTAwIOKAlCBGQUZGICAgQ0pLIENvbXBhdGliaWxpdHkgSWRlb2dyYXBoc1xyXG5cdC8vIFtJR05PUkVdIEZCMDAg4oCUIEZCNEYgICBBbHBoYWJldGljIFByZXNlbnRhdGlvbiBGb3Jtc1xyXG5cdC8vIFtJR05PUkVdIEZCNTAg4oCUIEZERkYgICBBcmFiaWMgUHJlc2VudGF0aW9uIEZvcm1zLUFcclxuXHQvLyBbSUdOT1JFXSBGRTAwIOKAlCBGRTBGICAgVmFyaWF0aW9uIFNlbGVjdG9yc1xyXG5cdC8vIFtJR05PUkVdIEZFMjAg4oCUIEZFMkYgICBDb21iaW5pbmcgSGFsZiBNYXJrc1xyXG5cdC8vIFtJR05PUkVdIEZFMzAg4oCUIEZFNEYgICBDSksgQ29tcGF0aWJpbGl0eSBGb3Jtc1xyXG5cdC8vIFtJR05PUkVdIEZFNTAg4oCUIEZFNkYgICBTbWFsbCBGb3JtIFZhcmlhbnRzXHJcblx0Ly8gW0lHTk9SRV0gRkU3MCDigJQgRkVGRiAgIEFyYWJpYyBQcmVzZW50YXRpb24gRm9ybXMtQlxyXG5cdC8vICAgICAgICAgIEZGMDAg4oCUIEZGRUYgICBIYWxmd2lkdGggYW5kIEZ1bGx3aWR0aCBGb3Jtc1xyXG5cdC8vICAgICAgICAgICAgICAgW2h0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hhbGZ3aWR0aF9hbmRfZnVsbHdpZHRoX2Zvcm1zXVxyXG5cdC8vICAgICAgICAgICAgICAgb2Ygd2hpY2ggRkYwMSAtIEZGNUUgZnVsbHdpZHRoIEFTQ0lJIG9mIDIxIHRvIDdFXHJcblx0Ly8gW0lHTk9SRV0gICAgYW5kIEZGNjUgLSBGRkRDIGhhbGZ3aWR0aCBvZiBLYXRha2FuYSBhbmQgSGFuZ3VsXHJcblx0Ly8gW0lHTk9SRV0gRkZGMCDigJQgRkZGRiAgIFNwZWNpYWxzXHJcblx0Y2hhckNvZGUgPSArY2hhckNvZGU7IC8vIEBwZXJmXHJcblx0cmV0dXJuIChcclxuXHRcdChjaGFyQ29kZSA+PSAweDJFODAgJiYgY2hhckNvZGUgPD0gMHhEN0FGKVxyXG5cdFx0fHwgKGNoYXJDb2RlID49IDB4RjkwMCAmJiBjaGFyQ29kZSA8PSAweEZBRkYpXHJcblx0XHR8fCAoY2hhckNvZGUgPj0gMHhGRjAxICYmIGNoYXJDb2RlIDw9IDB4RkY1RSlcclxuXHQpO1xyXG59XHJcblxyXG4vKipcclxuICogQ29tcHV0ZXMgdGhlIGRpZmZlcmVuY2Ugc2NvcmUgZm9yIHR3byBzdHJpbmdzLiBNb3JlIHNpbWlsYXIgc3RyaW5ncyBoYXZlIGEgaGlnaGVyIHNjb3JlLlxyXG4gKiBXZSB1c2UgbGFyZ2VzdCBjb21tb24gc3Vic2VxdWVuY2UgZHluYW1pYyBwcm9ncmFtbWluZyBhcHByb2FjaCBidXQgcGVuYWxpemUgaW4gdGhlIGVuZCBmb3IgbGVuZ3RoIGRpZmZlcmVuY2VzLlxyXG4gKiBTdHJpbmdzIHRoYXQgaGF2ZSBhIGxhcmdlIGxlbmd0aCBkaWZmZXJlbmNlIHdpbGwgZ2V0IGEgYmFkIGRlZmF1bHQgc2NvcmUgMC5cclxuICogQ29tcGxleGl0eSAtIGJvdGggdGltZSBhbmQgc3BhY2UgTyhmaXJzdC5sZW5ndGggKiBzZWNvbmQubGVuZ3RoKVxyXG4gKiBEeW5hbWljIHByb2dyYW1taW5nIExDUyBjb21wdXRhdGlvbiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xvbmdlc3RfY29tbW9uX3N1YnNlcXVlbmNlX3Byb2JsZW1cclxuICpcclxuICogQHBhcmFtIGZpcnN0IGEgc3RyaW5nXHJcbiAqIEBwYXJhbSBzZWNvbmQgYSBzdHJpbmdcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBkaWZmZXJlbmNlKGZpcnN0OiBzdHJpbmcsIHNlY29uZDogc3RyaW5nLCBtYXhMZW5EZWx0YTogbnVtYmVyID0gNCk6IG51bWJlciB7XHJcblx0bGV0IGxlbmd0aERpZmZlcmVuY2UgPSBNYXRoLmFicyhmaXJzdC5sZW5ndGggLSBzZWNvbmQubGVuZ3RoKTtcclxuXHQvLyBXZSBvbmx5IGNvbXB1dGUgc2NvcmUgaWYgbGVuZ3RoIG9mIHRoZSBjdXJyZW50V29yZCBhbmQgbGVuZ3RoIG9mIGVudHJ5Lm5hbWUgYXJlIHNpbWlsYXIuXHJcblx0aWYgKGxlbmd0aERpZmZlcmVuY2UgPiBtYXhMZW5EZWx0YSkge1xyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cdC8vIEluaXRpYWxpemUgTENTIChsYXJnZXN0IGNvbW1vbiBzdWJzZXF1ZW5jZSkgbWF0cml4LlxyXG5cdGxldCBMQ1M6IG51bWJlcltdW10gPSBbXTtcclxuXHRsZXQgemVyb0FycmF5OiBudW1iZXJbXSA9IFtdO1xyXG5cdGxldCBpOiBudW1iZXIsIGo6IG51bWJlcjtcclxuXHRmb3IgKGkgPSAwOyBpIDwgc2Vjb25kLmxlbmd0aCArIDE7ICsraSkge1xyXG5cdFx0emVyb0FycmF5LnB1c2goMCk7XHJcblx0fVxyXG5cdGZvciAoaSA9IDA7IGkgPCBmaXJzdC5sZW5ndGggKyAxOyArK2kpIHtcclxuXHRcdExDUy5wdXNoKHplcm9BcnJheSk7XHJcblx0fVxyXG5cdGZvciAoaSA9IDE7IGkgPCBmaXJzdC5sZW5ndGggKyAxOyArK2kpIHtcclxuXHRcdGZvciAoaiA9IDE7IGogPCBzZWNvbmQubGVuZ3RoICsgMTsgKytqKSB7XHJcblx0XHRcdGlmIChmaXJzdFtpIC0gMV0gPT09IHNlY29uZFtqIC0gMV0pIHtcclxuXHRcdFx0XHRMQ1NbaV1bal0gPSBMQ1NbaSAtIDFdW2ogLSAxXSArIDE7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0TENTW2ldW2pdID0gTWF0aC5tYXgoTENTW2kgLSAxXVtqXSwgTENTW2ldW2ogLSAxXSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIExDU1tmaXJzdC5sZW5ndGhdW3NlY29uZC5sZW5ndGhdIC0gTWF0aC5zcXJ0KGxlbmd0aERpZmZlcmVuY2UpO1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyBhbiBhcnJheSBpbiB3aGljaCBldmVyeSBlbnRyeSBpcyB0aGUgb2Zmc2V0IG9mIGFcclxuICogbGluZS4gVGhlcmUgaXMgYWx3YXlzIG9uZSBlbnRyeSB3aGljaCBpcyB6ZXJvLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMaW5lU3RhcnRzKHRleHQ6IHN0cmluZyk6IG51bWJlcltdIHtcclxuXHRsZXQgcmVnZXhwID0gL1xcclxcbnxcXHJ8XFxuL2csXHJcblx0XHRyZXQ6IG51bWJlcltdID0gWzBdLFxyXG5cdFx0bWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheTtcclxuXHR3aGlsZSAoKG1hdGNoID0gcmVnZXhwLmV4ZWModGV4dCkpKSB7XHJcblx0XHRyZXQucHVzaChyZWdleHAubGFzdEluZGV4KTtcclxuXHR9XHJcblx0cmV0dXJuIHJldDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdpdmVuIGEgc3RyaW5nIGFuZCBhIG1heCBsZW5ndGggcmV0dXJucyBhIHNob3J0ZWQgdmVyc2lvbi4gU2hvcnRpbmdcclxuICogaGFwcGVucyBhdCBmYXZvcmFibGUgcG9zaXRpb25zIC0gc3VjaCBhcyB3aGl0ZXNwYWNlIG9yIHB1bmN0dWF0aW9uIGNoYXJhY3RlcnMuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gbGN1dCh0ZXh0OiBzdHJpbmcsIG46IG51bWJlcik6IHN0cmluZyB7XHJcblxyXG5cdGlmICh0ZXh0Lmxlbmd0aCA8IG4pIHtcclxuXHRcdHJldHVybiB0ZXh0O1xyXG5cdH1cclxuXHJcblx0bGV0IHNlZ21lbnRzID0gdGV4dC5zcGxpdCgvXFxiLyksXHJcblx0XHRjb3VudCA9IDA7XHJcblxyXG5cdGZvciAobGV0IGkgPSBzZWdtZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cdFx0Y291bnQgKz0gc2VnbWVudHNbaV0ubGVuZ3RoO1xyXG5cclxuXHRcdGlmIChjb3VudCA+IG4pIHtcclxuXHRcdFx0c2VnbWVudHMuc3BsaWNlKDAsIGkpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBzZWdtZW50cy5qb2luKGVtcHR5KS5yZXBsYWNlKC9eXFxzLywgZW1wdHkpO1xyXG59XHJcblxyXG4vLyBFc2NhcGUgY29kZXNcclxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlXHJcbmNvbnN0IEVMID0gL1xceDFCXFx4NUJbMTJdP0svZzsgLy8gRXJhc2UgaW4gbGluZVxyXG5jb25zdCBMRiA9IC9cXHhBL2c7IC8vIGxpbmUgZmVlZFxyXG5jb25zdCBDT0xPUl9TVEFSVCA9IC9cXHgxYlxcW1xcZCttL2c7IC8vIENvbG9yXHJcbmNvbnN0IENPTE9SX0VORCA9IC9cXHgxYlxcWzA/bS9nOyAvLyBDb2xvclxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUFuc2lFc2NhcGVDb2RlcyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0aWYgKHN0cikge1xyXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UoRUwsICcnKTtcclxuXHRcdHN0ciA9IHN0ci5yZXBsYWNlKExGLCAnXFxuJyk7XHJcblx0XHRzdHIgPSBzdHIucmVwbGFjZShDT0xPUl9TVEFSVCwgJycpO1xyXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UoQ09MT1JfRU5ELCAnJyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gc3RyO1xyXG59XHJcblxyXG4vLyAtLSBVVEYtOCBCT01cclxuXHJcbmNvbnN0IF9fdXRmOF9ib20gPSA2NTI3OTtcclxuXHJcbmV4cG9ydCBjb25zdCBVVEY4X0JPTV9DSEFSQUNURVIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKF9fdXRmOF9ib20pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0c1dpdGhVVEY4Qk9NKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XHJcblx0cmV0dXJuIChzdHIgJiYgc3RyLmxlbmd0aCA+IDAgJiYgc3RyLmNoYXJDb2RlQXQoMCkgPT09IF9fdXRmOF9ib20pO1xyXG59XHJcblxyXG4vKipcclxuICogQXBwZW5kcyB0d28gc3RyaW5ncy4gSWYgdGhlIGFwcGVuZGVkIHJlc3VsdCBpcyBsb25nZXIgdGhhbiBtYXhMZW5ndGgsXHJcbiAqIHRyaW1zIHRoZSBzdGFydCBvZiB0aGUgcmVzdWx0IGFuZCByZXBsYWNlcyBpdCB3aXRoICcuLi4nLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFdpdGhMaW1pdChmaXJzdDogc3RyaW5nLCBzZWNvbmQ6IHN0cmluZywgbWF4TGVuZ3RoOiBudW1iZXIpOiBzdHJpbmcge1xyXG5cdGNvbnN0IG5ld0xlbmd0aCA9IGZpcnN0Lmxlbmd0aCArIHNlY29uZC5sZW5ndGg7XHJcblx0aWYgKG5ld0xlbmd0aCA+IG1heExlbmd0aCkge1xyXG5cdFx0Zmlyc3QgPSAnLi4uJyArIGZpcnN0LnN1YnN0cihuZXdMZW5ndGggLSBtYXhMZW5ndGgpO1xyXG5cdH1cclxuXHRpZiAoc2Vjb25kLmxlbmd0aCA+IG1heExlbmd0aCkge1xyXG5cdFx0Zmlyc3QgKz0gc2Vjb25kLnN1YnN0cihzZWNvbmQubGVuZ3RoIC0gbWF4TGVuZ3RoKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0Zmlyc3QgKz0gc2Vjb25kO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGZpcnN0O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVCdG9hKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRyZXR1cm4gYnRvYShlbmNvZGVVUklDb21wb25lbnQoc3RyKSk7IC8vIHdlIHVzZSBlbmNvZGVVUklDb21wb25lbnQgYmVjYXVzZSBidG9hIGZhaWxzIGZvciBub24gTGF0aW4gMSB2YWx1ZXNcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdChzOnN0cmluZywgY291bnQ6IG51bWJlcik6IHN0cmluZyB7XHJcblx0dmFyIHJlc3VsdCA9ICcnO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG5cdFx0cmVzdWx0ICs9IHM7XHJcblx0fVxyXG5cdHJldHVybiByZXN1bHQ7XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
