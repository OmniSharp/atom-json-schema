'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.createScanner = createScanner;
exports.stripComments = stripComments;
exports.getParseErrorMessage = getParseErrorMessage;
exports.getLocation = getLocation;
exports.parse = parse;
exports.parseTree = parseTree;
exports.findNodeAtLocation = findNodeAtLocation;
exports.getNodeValue = getNodeValue;
exports.visit = visit;
var ScanError = exports.ScanError = undefined;
(function (ScanError) {
    ScanError[ScanError["None"] = 0] = "None";
    ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
    ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
    ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
    ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
    ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
})(ScanError || (exports.ScanError = ScanError = {}));
var SyntaxKind = exports.SyntaxKind = undefined;
(function (SyntaxKind) {
    SyntaxKind[SyntaxKind["Unknown"] = 0] = "Unknown";
    SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
    SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
    SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
    SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
    SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
    SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
    SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
    SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
    SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
    SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
    SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
    SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
    SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
    SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
    SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
    SyntaxKind[SyntaxKind["EOF"] = 16] = "EOF";
})(SyntaxKind || (exports.SyntaxKind = SyntaxKind = {}));
function createScanner(text) {
    var ignoreTrivia = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    var pos = 0,
        len = text.length,
        value = '',
        tokenOffset = 0,
        token = SyntaxKind.Unknown,
        scanError = ScanError.None;
    function scanHexDigits(count, exact) {
        var digits = 0;
        var value = 0;
        while (digits < count || !exact) {
            var ch = text.charCodeAt(pos);
            if (ch >= CharacterCodes._0 && ch <= CharacterCodes._9) {
                value = value * 16 + ch - CharacterCodes._0;
            } else if (ch >= CharacterCodes.A && ch <= CharacterCodes.F) {
                value = value * 16 + ch - CharacterCodes.A + 10;
            } else if (ch >= CharacterCodes.a && ch <= CharacterCodes.f) {
                value = value * 16 + ch - CharacterCodes.a + 10;
            } else {
                break;
            }
            pos++;
            digits++;
        }
        if (digits < count) {
            value = -1;
        }
        return value;
    }
    function setPosition(newPosition) {
        pos = newPosition;
        value = '';
        tokenOffset = 0;
        token = SyntaxKind.Unknown;
        scanError = ScanError.None;
    }
    function scanNumber() {
        var start = pos;
        if (text.charCodeAt(pos) === CharacterCodes._0) {
            pos++;
        } else {
            pos++;
            while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                pos++;
            }
        }
        if (pos < text.length && text.charCodeAt(pos) === CharacterCodes.dot) {
            pos++;
            if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                pos++;
                while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                }
            } else {
                scanError = ScanError.UnexpectedEndOfNumber;
                return text.substring(start, pos);
            }
        }
        var end = pos;
        if (pos < text.length && (text.charCodeAt(pos) === CharacterCodes.E || text.charCodeAt(pos) === CharacterCodes.e)) {
            pos++;
            if (pos < text.length && text.charCodeAt(pos) === CharacterCodes.plus || text.charCodeAt(pos) === CharacterCodes.minus) {
                pos++;
            }
            if (pos < text.length && isDigit(text.charCodeAt(pos))) {
                pos++;
                while (pos < text.length && isDigit(text.charCodeAt(pos))) {
                    pos++;
                }
                end = pos;
            } else {
                scanError = ScanError.UnexpectedEndOfNumber;
            }
        }
        return text.substring(start, end);
    }
    function scanString() {
        var result = '',
            start = pos;
        while (true) {
            if (pos >= len) {
                result += text.substring(start, pos);
                scanError = ScanError.UnexpectedEndOfString;
                break;
            }
            var ch = text.charCodeAt(pos);
            if (ch === CharacterCodes.doubleQuote) {
                result += text.substring(start, pos);
                pos++;
                break;
            }
            if (ch === CharacterCodes.backslash) {
                result += text.substring(start, pos);
                pos++;
                if (pos >= len) {
                    scanError = ScanError.UnexpectedEndOfString;
                    break;
                }
                ch = text.charCodeAt(pos++);
                switch (ch) {
                    case CharacterCodes.doubleQuote:
                        result += '\"';
                        break;
                    case CharacterCodes.backslash:
                        result += '\\';
                        break;
                    case CharacterCodes.slash:
                        result += '/';
                        break;
                    case CharacterCodes.b:
                        result += '\b';
                        break;
                    case CharacterCodes.f:
                        result += '\f';
                        break;
                    case CharacterCodes.n:
                        result += '\n';
                        break;
                    case CharacterCodes.r:
                        result += '\r';
                        break;
                    case CharacterCodes.t:
                        result += '\t';
                        break;
                    case CharacterCodes.u:
                        var ch = scanHexDigits(4, true);
                        if (ch >= 0) {
                            result += String.fromCharCode(ch);
                        } else {
                            scanError = ScanError.InvalidUnicode;
                        }
                        break;
                    default:
                        scanError = ScanError.InvalidEscapeCharacter;
                }
                start = pos;
                continue;
            }
            if (isLineBreak(ch)) {
                result += text.substring(start, pos);
                scanError = ScanError.UnexpectedEndOfString;
                break;
            }
            pos++;
        }
        return result;
    }
    function scanNext() {
        value = '';
        scanError = ScanError.None;
        tokenOffset = pos;
        if (pos >= len) {
            tokenOffset = len;
            return token = SyntaxKind.EOF;
        }
        var code = text.charCodeAt(pos);
        if (isWhiteSpace(code)) {
            do {
                pos++;
                value += String.fromCharCode(code);
                code = text.charCodeAt(pos);
            } while (isWhiteSpace(code));
            return token = SyntaxKind.Trivia;
        }
        if (isLineBreak(code)) {
            pos++;
            value += String.fromCharCode(code);
            if (code === CharacterCodes.carriageReturn && text.charCodeAt(pos) === CharacterCodes.lineFeed) {
                pos++;
                value += '\n';
            }
            return token = SyntaxKind.LineBreakTrivia;
        }
        switch (code) {
            case CharacterCodes.openBrace:
                pos++;
                return token = SyntaxKind.OpenBraceToken;
            case CharacterCodes.closeBrace:
                pos++;
                return token = SyntaxKind.CloseBraceToken;
            case CharacterCodes.openBracket:
                pos++;
                return token = SyntaxKind.OpenBracketToken;
            case CharacterCodes.closeBracket:
                pos++;
                return token = SyntaxKind.CloseBracketToken;
            case CharacterCodes.colon:
                pos++;
                return token = SyntaxKind.ColonToken;
            case CharacterCodes.comma:
                pos++;
                return token = SyntaxKind.CommaToken;
            case CharacterCodes.doubleQuote:
                pos++;
                value = scanString();
                return token = SyntaxKind.StringLiteral;
            case CharacterCodes.slash:
                var start = pos - 1;
                if (text.charCodeAt(pos + 1) === CharacterCodes.slash) {
                    pos += 2;
                    while (pos < len) {
                        if (isLineBreak(text.charCodeAt(pos))) {
                            break;
                        }
                        pos++;
                    }
                    value = text.substring(start, pos);
                    return token = SyntaxKind.LineCommentTrivia;
                }
                if (text.charCodeAt(pos + 1) === CharacterCodes.asterisk) {
                    pos += 2;
                    var safeLength = len - 1;
                    var commentClosed = false;
                    while (pos < safeLength) {
                        var ch = text.charCodeAt(pos);
                        if (ch === CharacterCodes.asterisk && text.charCodeAt(pos + 1) === CharacterCodes.slash) {
                            pos += 2;
                            commentClosed = true;
                            break;
                        }
                        pos++;
                    }
                    if (!commentClosed) {
                        pos++;
                        scanError = ScanError.UnexpectedEndOfComment;
                    }
                    value = text.substring(start, pos);
                    return token = SyntaxKind.BlockCommentTrivia;
                }
                value += String.fromCharCode(code);
                pos++;
                return token = SyntaxKind.Unknown;
            case CharacterCodes.minus:
                value += String.fromCharCode(code);
                pos++;
                if (pos === len || !isDigit(text.charCodeAt(pos))) {
                    return token = SyntaxKind.Unknown;
                }
            case CharacterCodes._0:
            case CharacterCodes._1:
            case CharacterCodes._2:
            case CharacterCodes._3:
            case CharacterCodes._4:
            case CharacterCodes._5:
            case CharacterCodes._6:
            case CharacterCodes._7:
            case CharacterCodes._8:
            case CharacterCodes._9:
                value += scanNumber();
                return token = SyntaxKind.NumericLiteral;
            default:
                while (pos < len && isUnknownContentCharacter(code)) {
                    pos++;
                    code = text.charCodeAt(pos);
                }
                if (tokenOffset !== pos) {
                    value = text.substring(tokenOffset, pos);
                    switch (value) {
                        case 'true':
                            return token = SyntaxKind.TrueKeyword;
                        case 'false':
                            return token = SyntaxKind.FalseKeyword;
                        case 'null':
                            return token = SyntaxKind.NullKeyword;
                    }
                    return token = SyntaxKind.Unknown;
                }
                value += String.fromCharCode(code);
                pos++;
                return token = SyntaxKind.Unknown;
        }
    }
    function isUnknownContentCharacter(code) {
        if (isWhiteSpace(code) || isLineBreak(code)) {
            return false;
        }
        switch (code) {
            case CharacterCodes.closeBrace:
            case CharacterCodes.closeBracket:
            case CharacterCodes.openBrace:
            case CharacterCodes.openBracket:
            case CharacterCodes.doubleQuote:
            case CharacterCodes.colon:
            case CharacterCodes.comma:
                return false;
        }
        return true;
    }
    function scanNextNonTrivia() {
        var result = void 0;
        do {
            result = scanNext();
        } while (result >= SyntaxKind.LineCommentTrivia && result <= SyntaxKind.Trivia);
        return result;
    }
    return {
        setPosition: setPosition,
        getPosition: function getPosition() {
            return pos;
        },
        scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
        getToken: function getToken() {
            return token;
        },
        getTokenValue: function getTokenValue() {
            return value;
        },
        getTokenOffset: function getTokenOffset() {
            return tokenOffset;
        },
        getTokenLength: function getTokenLength() {
            return pos - tokenOffset;
        },
        getTokenError: function getTokenError() {
            return scanError;
        }
    };
}
function isWhiteSpace(ch) {
    return ch === CharacterCodes.space || ch === CharacterCodes.tab || ch === CharacterCodes.verticalTab || ch === CharacterCodes.formFeed || ch === CharacterCodes.nonBreakingSpace || ch === CharacterCodes.ogham || ch >= CharacterCodes.enQuad && ch <= CharacterCodes.zeroWidthSpace || ch === CharacterCodes.narrowNoBreakSpace || ch === CharacterCodes.mathematicalSpace || ch === CharacterCodes.ideographicSpace || ch === CharacterCodes.byteOrderMark;
}
function isLineBreak(ch) {
    return ch === CharacterCodes.lineFeed || ch === CharacterCodes.carriageReturn || ch === CharacterCodes.lineSeparator || ch === CharacterCodes.paragraphSeparator;
}
function isDigit(ch) {
    return ch >= CharacterCodes._0 && ch <= CharacterCodes._9;
}
var CharacterCodes;
(function (CharacterCodes) {
    CharacterCodes[CharacterCodes["nullCharacter"] = 0] = "nullCharacter";
    CharacterCodes[CharacterCodes["maxAsciiCharacter"] = 127] = "maxAsciiCharacter";
    CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
    CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
    CharacterCodes[CharacterCodes["lineSeparator"] = 8232] = "lineSeparator";
    CharacterCodes[CharacterCodes["paragraphSeparator"] = 8233] = "paragraphSeparator";
    CharacterCodes[CharacterCodes["nextLine"] = 133] = "nextLine";
    CharacterCodes[CharacterCodes["space"] = 32] = "space";
    CharacterCodes[CharacterCodes["nonBreakingSpace"] = 160] = "nonBreakingSpace";
    CharacterCodes[CharacterCodes["enQuad"] = 8192] = "enQuad";
    CharacterCodes[CharacterCodes["emQuad"] = 8193] = "emQuad";
    CharacterCodes[CharacterCodes["enSpace"] = 8194] = "enSpace";
    CharacterCodes[CharacterCodes["emSpace"] = 8195] = "emSpace";
    CharacterCodes[CharacterCodes["threePerEmSpace"] = 8196] = "threePerEmSpace";
    CharacterCodes[CharacterCodes["fourPerEmSpace"] = 8197] = "fourPerEmSpace";
    CharacterCodes[CharacterCodes["sixPerEmSpace"] = 8198] = "sixPerEmSpace";
    CharacterCodes[CharacterCodes["figureSpace"] = 8199] = "figureSpace";
    CharacterCodes[CharacterCodes["punctuationSpace"] = 8200] = "punctuationSpace";
    CharacterCodes[CharacterCodes["thinSpace"] = 8201] = "thinSpace";
    CharacterCodes[CharacterCodes["hairSpace"] = 8202] = "hairSpace";
    CharacterCodes[CharacterCodes["zeroWidthSpace"] = 8203] = "zeroWidthSpace";
    CharacterCodes[CharacterCodes["narrowNoBreakSpace"] = 8239] = "narrowNoBreakSpace";
    CharacterCodes[CharacterCodes["ideographicSpace"] = 12288] = "ideographicSpace";
    CharacterCodes[CharacterCodes["mathematicalSpace"] = 8287] = "mathematicalSpace";
    CharacterCodes[CharacterCodes["ogham"] = 5760] = "ogham";
    CharacterCodes[CharacterCodes["_"] = 95] = "_";
    CharacterCodes[CharacterCodes["$"] = 36] = "$";
    CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
    CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
    CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
    CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
    CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
    CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
    CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
    CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
    CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
    CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
    CharacterCodes[CharacterCodes["a"] = 97] = "a";
    CharacterCodes[CharacterCodes["b"] = 98] = "b";
    CharacterCodes[CharacterCodes["c"] = 99] = "c";
    CharacterCodes[CharacterCodes["d"] = 100] = "d";
    CharacterCodes[CharacterCodes["e"] = 101] = "e";
    CharacterCodes[CharacterCodes["f"] = 102] = "f";
    CharacterCodes[CharacterCodes["g"] = 103] = "g";
    CharacterCodes[CharacterCodes["h"] = 104] = "h";
    CharacterCodes[CharacterCodes["i"] = 105] = "i";
    CharacterCodes[CharacterCodes["j"] = 106] = "j";
    CharacterCodes[CharacterCodes["k"] = 107] = "k";
    CharacterCodes[CharacterCodes["l"] = 108] = "l";
    CharacterCodes[CharacterCodes["m"] = 109] = "m";
    CharacterCodes[CharacterCodes["n"] = 110] = "n";
    CharacterCodes[CharacterCodes["o"] = 111] = "o";
    CharacterCodes[CharacterCodes["p"] = 112] = "p";
    CharacterCodes[CharacterCodes["q"] = 113] = "q";
    CharacterCodes[CharacterCodes["r"] = 114] = "r";
    CharacterCodes[CharacterCodes["s"] = 115] = "s";
    CharacterCodes[CharacterCodes["t"] = 116] = "t";
    CharacterCodes[CharacterCodes["u"] = 117] = "u";
    CharacterCodes[CharacterCodes["v"] = 118] = "v";
    CharacterCodes[CharacterCodes["w"] = 119] = "w";
    CharacterCodes[CharacterCodes["x"] = 120] = "x";
    CharacterCodes[CharacterCodes["y"] = 121] = "y";
    CharacterCodes[CharacterCodes["z"] = 122] = "z";
    CharacterCodes[CharacterCodes["A"] = 65] = "A";
    CharacterCodes[CharacterCodes["B"] = 66] = "B";
    CharacterCodes[CharacterCodes["C"] = 67] = "C";
    CharacterCodes[CharacterCodes["D"] = 68] = "D";
    CharacterCodes[CharacterCodes["E"] = 69] = "E";
    CharacterCodes[CharacterCodes["F"] = 70] = "F";
    CharacterCodes[CharacterCodes["G"] = 71] = "G";
    CharacterCodes[CharacterCodes["H"] = 72] = "H";
    CharacterCodes[CharacterCodes["I"] = 73] = "I";
    CharacterCodes[CharacterCodes["J"] = 74] = "J";
    CharacterCodes[CharacterCodes["K"] = 75] = "K";
    CharacterCodes[CharacterCodes["L"] = 76] = "L";
    CharacterCodes[CharacterCodes["M"] = 77] = "M";
    CharacterCodes[CharacterCodes["N"] = 78] = "N";
    CharacterCodes[CharacterCodes["O"] = 79] = "O";
    CharacterCodes[CharacterCodes["P"] = 80] = "P";
    CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
    CharacterCodes[CharacterCodes["R"] = 82] = "R";
    CharacterCodes[CharacterCodes["S"] = 83] = "S";
    CharacterCodes[CharacterCodes["T"] = 84] = "T";
    CharacterCodes[CharacterCodes["U"] = 85] = "U";
    CharacterCodes[CharacterCodes["V"] = 86] = "V";
    CharacterCodes[CharacterCodes["W"] = 87] = "W";
    CharacterCodes[CharacterCodes["X"] = 88] = "X";
    CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
    CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
    CharacterCodes[CharacterCodes["ampersand"] = 38] = "ampersand";
    CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
    CharacterCodes[CharacterCodes["at"] = 64] = "at";
    CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
    CharacterCodes[CharacterCodes["bar"] = 124] = "bar";
    CharacterCodes[CharacterCodes["caret"] = 94] = "caret";
    CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
    CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
    CharacterCodes[CharacterCodes["closeParen"] = 41] = "closeParen";
    CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
    CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
    CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
    CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
    CharacterCodes[CharacterCodes["equals"] = 61] = "equals";
    CharacterCodes[CharacterCodes["exclamation"] = 33] = "exclamation";
    CharacterCodes[CharacterCodes["greaterThan"] = 62] = "greaterThan";
    CharacterCodes[CharacterCodes["lessThan"] = 60] = "lessThan";
    CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
    CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
    CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
    CharacterCodes[CharacterCodes["openParen"] = 40] = "openParen";
    CharacterCodes[CharacterCodes["percent"] = 37] = "percent";
    CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
    CharacterCodes[CharacterCodes["question"] = 63] = "question";
    CharacterCodes[CharacterCodes["semicolon"] = 59] = "semicolon";
    CharacterCodes[CharacterCodes["singleQuote"] = 39] = "singleQuote";
    CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
    CharacterCodes[CharacterCodes["tilde"] = 126] = "tilde";
    CharacterCodes[CharacterCodes["backspace"] = 8] = "backspace";
    CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
    CharacterCodes[CharacterCodes["byteOrderMark"] = 65279] = "byteOrderMark";
    CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
    CharacterCodes[CharacterCodes["verticalTab"] = 11] = "verticalTab";
})(CharacterCodes || (CharacterCodes = {}));
function stripComments(text, replaceCh) {
    var _scanner = createScanner(text),
        parts = [],
        kind = void 0,
        offset = 0,
        pos = void 0;
    do {
        pos = _scanner.getPosition();
        kind = _scanner.scan();
        switch (kind) {
            case SyntaxKind.LineCommentTrivia:
            case SyntaxKind.BlockCommentTrivia:
            case SyntaxKind.EOF:
                if (offset !== pos) {
                    parts.push(text.substring(offset, pos));
                }
                if (replaceCh !== void 0) {
                    parts.push(_scanner.getTokenValue().replace(/[^\r\n]/g, replaceCh));
                }
                offset = _scanner.getPosition();
                break;
        }
    } while (kind !== SyntaxKind.EOF);
    return parts.join('');
}
var ParseErrorCode = exports.ParseErrorCode = undefined;
(function (ParseErrorCode) {
    ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 0] = "InvalidSymbol";
    ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 1] = "InvalidNumberFormat";
    ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 2] = "PropertyNameExpected";
    ParseErrorCode[ParseErrorCode["ValueExpected"] = 3] = "ValueExpected";
    ParseErrorCode[ParseErrorCode["ColonExpected"] = 4] = "ColonExpected";
    ParseErrorCode[ParseErrorCode["CommaExpected"] = 5] = "CommaExpected";
    ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 6] = "CloseBraceExpected";
    ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 7] = "CloseBracketExpected";
    ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 8] = "EndOfFileExpected";
})(ParseErrorCode || (exports.ParseErrorCode = ParseErrorCode = {}));
function getParseErrorMessage(errorCode) {
    switch (errorCode) {
        case ParseErrorCode.InvalidSymbol:
            return 'Invalid symbol';
        case ParseErrorCode.InvalidNumberFormat:
            return 'Invalid number format';
        case ParseErrorCode.PropertyNameExpected:
            return 'Property name expected';
        case ParseErrorCode.ValueExpected:
            return 'Value expected';
        case ParseErrorCode.ColonExpected:
            return 'Colon expected';
        case ParseErrorCode.CommaExpected:
            return 'Comma expected';
        case ParseErrorCode.CloseBraceExpected:
            return 'Closing brace expected';
        case ParseErrorCode.CloseBracketExpected:
            return 'Closing bracket expected';
        case ParseErrorCode.EndOfFileExpected:
            return 'End of file expected';
        default:
            return '';
    }
}
function getLiteralNodeType(value) {
    switch (typeof value === "undefined" ? "undefined" : _typeof(value)) {
        case 'boolean':
            return 'boolean';
        case 'number':
            return 'number';
        case 'string':
            return 'string';
        default:
            return 'null';
    }
}
function getLocation(text, position) {
    var segments = [];
    var earlyReturnException = new Object();
    var previousNode = void 0;
    var previousNodeInst = {
        value: void 0,
        offset: void 0,
        length: void 0,
        type: void 0
    };
    var isAtPropertyKey = false;
    function setPreviousNode(value, offset, length, type) {
        previousNodeInst.value = value;
        previousNodeInst.offset = offset;
        previousNodeInst.length = length;
        previousNodeInst.type = type;
        previousNodeInst.columnOffset = void 0;
        previousNode = previousNodeInst;
    }
    try {
        visit(text, {
            onObjectBegin: function onObjectBegin(offset, length) {
                if (position <= offset) {
                    throw earlyReturnException;
                }
                previousNode = void 0;
                isAtPropertyKey = position > offset;
                segments.push('');
            },
            onObjectProperty: function onObjectProperty(name, offset, length) {
                if (position < offset) {
                    throw earlyReturnException;
                }
                setPreviousNode(name, offset, length, 'property');
                segments[segments.length - 1] = name;
                if (position <= offset + length) {
                    throw earlyReturnException;
                }
            },
            onObjectEnd: function onObjectEnd(offset, length) {
                if (position <= offset) {
                    throw earlyReturnException;
                }
                previousNode = void 0;
                segments.pop();
            },
            onArrayBegin: function onArrayBegin(offset, length) {
                if (position <= offset) {
                    throw earlyReturnException;
                }
                previousNode = void 0;
                segments.push(0);
            },
            onArrayEnd: function onArrayEnd(offset, length) {
                if (position <= offset) {
                    throw earlyReturnException;
                }
                previousNode = void 0;
                segments.pop();
            },
            onLiteralValue: function onLiteralValue(value, offset, length) {
                if (position < offset) {
                    throw earlyReturnException;
                }
                setPreviousNode(value, offset, length, getLiteralNodeType(value));
                if (position <= offset + length) {
                    throw earlyReturnException;
                }
            },
            onSeparator: function onSeparator(sep, offset, length) {
                if (position <= offset) {
                    throw earlyReturnException;
                }
                if (sep === ':' && previousNode.type === 'property') {
                    previousNode.columnOffset = offset;
                    isAtPropertyKey = false;
                    previousNode = void 0;
                } else if (sep === ',') {
                    var last = segments[segments.length - 1];
                    if (typeof last === 'number') {
                        segments[segments.length - 1] = last + 1;
                    } else {
                        isAtPropertyKey = true;
                        segments[segments.length - 1] = '';
                    }
                    previousNode = void 0;
                }
            }
        });
    } catch (e) {
        if (e !== earlyReturnException) {
            throw e;
        }
    }
    if (segments[segments.length - 1] === '') {
        segments.pop();
    }
    return {
        path: segments,
        previousNode: previousNode,
        isAtPropertyKey: isAtPropertyKey,
        matches: function matches(pattern) {
            var k = 0;
            for (var i = 0; k < pattern.length && i < segments.length; i++) {
                if (pattern[k] === segments[i] || pattern[k] === '*') {
                    k++;
                } else if (pattern[k] !== '**') {
                    return false;
                }
            }
            return k === pattern.length;
        }
    };
}
function parse(text) {
    var errors = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
    var options = arguments[2];

    var currentProperty = null;
    var currentParent = [];
    var previousParents = [];
    function onValue(value) {
        if (Array.isArray(currentParent)) {
            currentParent.push(value);
        } else if (currentProperty) {
            currentParent[currentProperty] = value;
        }
    }
    var visitor = {
        onObjectBegin: function onObjectBegin() {
            var object = {};
            onValue(object);
            previousParents.push(currentParent);
            currentParent = object;
            currentProperty = null;
        },
        onObjectProperty: function onObjectProperty(name) {
            currentProperty = name;
        },
        onObjectEnd: function onObjectEnd() {
            currentParent = previousParents.pop();
        },
        onArrayBegin: function onArrayBegin() {
            var array = [];
            onValue(array);
            previousParents.push(currentParent);
            currentParent = array;
            currentProperty = null;
        },
        onArrayEnd: function onArrayEnd() {
            currentParent = previousParents.pop();
        },
        onLiteralValue: onValue,
        onError: function onError(error) {
            errors.push({ error: error });
        }
    };
    visit(text, visitor, options);
    return currentParent[0];
}
function parseTree(text) {
    var errors = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
    var options = arguments[2];

    var currentParent = { type: 'array', offset: -1, length: -1, children: [] };
    function ensurePropertyComplete(endOffset) {
        if (currentParent.type === 'property') {
            currentParent.length = endOffset - currentParent.offset;
            currentParent = currentParent.parent;
        }
    }
    function onValue(valueNode) {
        currentParent.children.push(valueNode);
        ensurePropertyComplete(valueNode.offset + valueNode.length);
        return valueNode;
    }
    var visitor = {
        onObjectBegin: function onObjectBegin(offset) {
            currentParent = onValue({ type: 'object', offset: offset, length: -1, parent: currentParent, children: [] });
        },
        onObjectProperty: function onObjectProperty(name, offset, length) {
            currentParent = onValue({ type: 'property', offset: offset, length: -1, parent: currentParent, children: [] });
            currentParent.children.push({ type: 'string', value: name, offset: offset, length: length, parent: currentParent });
        },
        onObjectEnd: function onObjectEnd(offset, length) {
            ensurePropertyComplete(offset);
            currentParent.length = offset + length - currentParent.offset;
            currentParent = currentParent.parent;
        },
        onArrayBegin: function onArrayBegin(offset, length) {
            currentParent = onValue({ type: 'array', offset: offset, length: -1, parent: currentParent, children: [] });
        },
        onArrayEnd: function onArrayEnd(offset, length) {
            currentParent.length = offset + length - currentParent.offset;
            currentParent = currentParent.parent;
        },
        onLiteralValue: function onLiteralValue(value, offset, length) {
            onValue({ type: getLiteralNodeType(value), offset: offset, length: length, parent: currentParent, value: value });
        },
        onSeparator: function onSeparator(sep, offset, length) {
            if (currentParent.type === 'property') {
                if (sep === ':') {
                    currentParent.columnOffset = offset;
                } else if (sep === ',') {
                    ensurePropertyComplete(offset);
                }
            }
        },
        onError: function onError(error) {
            errors.push({ error: error });
        }
    };
    visit(text, visitor, options);
    var result = currentParent.children[0];
    if (result) {
        delete result.parent;
    }
    return result;
}
function findNodeAtLocation(root, path) {
    if (!root) {
        return void 0;
    }
    var node = root;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = path[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var segment = _step.value;

            if (typeof segment === 'string') {
                if (node.type !== 'object') {
                    return void 0;
                }
                var found = false;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = node.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var propertyNode = _step2.value;

                        if (propertyNode.children[0].value === segment) {
                            node = propertyNode.children[1];
                            found = true;
                            break;
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                if (!found) {
                    return void 0;
                }
            } else {
                var index = segment;
                if (node.type !== 'array' || index < 0 || index >= node.children.length) {
                    return void 0;
                }
                node = node.children[index];
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return node;
}
function getNodeValue(node) {
    if (node.type === 'array') {
        return node.children.map(getNodeValue);
    } else if (node.type === 'object') {
        var obj = {};
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = node.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var prop = _step3.value;

                obj[prop.children[0].value] = getNodeValue(prop.children[1]);
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return obj;
    }
    return node.value;
}
function visit(text, visitor, options) {
    var _scanner = createScanner(text, false);
    function toNoArgVisit(visitFunction) {
        return visitFunction ? function () {
            return visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength());
        } : function () {
            return true;
        };
    }
    function toOneArgVisit(visitFunction) {
        return visitFunction ? function (arg) {
            return visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength());
        } : function () {
            return true;
        };
    }
    var onObjectBegin = toNoArgVisit(visitor.onObjectBegin),
        onObjectProperty = toOneArgVisit(visitor.onObjectProperty),
        onObjectEnd = toNoArgVisit(visitor.onObjectEnd),
        onArrayBegin = toNoArgVisit(visitor.onArrayBegin),
        onArrayEnd = toNoArgVisit(visitor.onArrayEnd),
        onLiteralValue = toOneArgVisit(visitor.onLiteralValue),
        onSeparator = toOneArgVisit(visitor.onSeparator),
        onError = toOneArgVisit(visitor.onError);
    var disallowComments = options && options.disallowComments;
    function scanNext() {
        while (true) {
            var token = _scanner.scan();
            switch (token) {
                case SyntaxKind.LineCommentTrivia:
                case SyntaxKind.BlockCommentTrivia:
                    if (disallowComments) {
                        handleError(ParseErrorCode.InvalidSymbol);
                    }
                    break;
                case SyntaxKind.Unknown:
                    handleError(ParseErrorCode.InvalidSymbol);
                    break;
                case SyntaxKind.Trivia:
                case SyntaxKind.LineBreakTrivia:
                    break;
                default:
                    return token;
            }
        }
    }
    function handleError(error) {
        var skipUntilAfter = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
        var skipUntil = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

        onError(error);
        if (skipUntilAfter.length + skipUntil.length > 0) {
            var token = _scanner.getToken();
            while (token !== SyntaxKind.EOF) {
                if (skipUntilAfter.indexOf(token) !== -1) {
                    scanNext();
                    break;
                } else if (skipUntil.indexOf(token) !== -1) {
                    break;
                }
                token = scanNext();
            }
        }
    }
    function parseString(isValue) {
        if (_scanner.getToken() !== SyntaxKind.StringLiteral) {
            return false;
        }
        var value = _scanner.getTokenValue();
        if (isValue) {
            onLiteralValue(value);
        } else {
            onObjectProperty(value);
        }
        scanNext();
        return true;
    }
    function parseLiteral() {
        switch (_scanner.getToken()) {
            case SyntaxKind.NumericLiteral:
                var value = 0;
                try {
                    value = JSON.parse(_scanner.getTokenValue());
                    if (typeof value !== 'number') {
                        handleError(ParseErrorCode.InvalidNumberFormat);
                        value = 0;
                    }
                } catch (e) {
                    handleError(ParseErrorCode.InvalidNumberFormat);
                }
                onLiteralValue(value);
                break;
            case SyntaxKind.NullKeyword:
                onLiteralValue(null);
                break;
            case SyntaxKind.TrueKeyword:
                onLiteralValue(true);
                break;
            case SyntaxKind.FalseKeyword:
                onLiteralValue(false);
                break;
            default:
                return false;
        }
        scanNext();
        return true;
    }
    function parseProperty() {
        if (!parseString(false)) {
            handleError(ParseErrorCode.PropertyNameExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken]);
            return false;
        }
        if (_scanner.getToken() === SyntaxKind.ColonToken) {
            onSeparator(':');
            scanNext();
            if (!parseValue()) {
                handleError(ParseErrorCode.ValueExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken]);
            }
        } else {
            handleError(ParseErrorCode.ColonExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken]);
        }
        return true;
    }
    function parseObject() {
        if (_scanner.getToken() !== SyntaxKind.OpenBraceToken) {
            return false;
        }
        onObjectBegin();
        scanNext();
        var needsComma = false;
        while (_scanner.getToken() !== SyntaxKind.CloseBraceToken && _scanner.getToken() !== SyntaxKind.EOF) {
            if (_scanner.getToken() === SyntaxKind.CommaToken) {
                if (!needsComma) {
                    handleError(ParseErrorCode.ValueExpected, [], []);
                }
                onSeparator(',');
                scanNext();
            } else if (needsComma) {
                handleError(ParseErrorCode.CommaExpected, [], []);
            }
            if (!parseProperty()) {
                handleError(ParseErrorCode.ValueExpected, [], [SyntaxKind.CloseBraceToken, SyntaxKind.CommaToken]);
            }
            needsComma = true;
        }
        onObjectEnd();
        if (_scanner.getToken() !== SyntaxKind.CloseBraceToken) {
            handleError(ParseErrorCode.CloseBraceExpected, [SyntaxKind.CloseBraceToken], []);
        } else {
            scanNext();
        }
        return true;
    }
    function parseArray() {
        if (_scanner.getToken() !== SyntaxKind.OpenBracketToken) {
            return false;
        }
        onArrayBegin();
        scanNext();
        var needsComma = false;
        while (_scanner.getToken() !== SyntaxKind.CloseBracketToken && _scanner.getToken() !== SyntaxKind.EOF) {
            if (_scanner.getToken() === SyntaxKind.CommaToken) {
                if (!needsComma) {
                    handleError(ParseErrorCode.ValueExpected, [], []);
                }
                onSeparator(',');
                scanNext();
            } else if (needsComma) {
                handleError(ParseErrorCode.CommaExpected, [], []);
            }
            if (!parseValue()) {
                handleError(ParseErrorCode.ValueExpected, [], [SyntaxKind.CloseBracketToken, SyntaxKind.CommaToken]);
            }
            needsComma = true;
        }
        onArrayEnd();
        if (_scanner.getToken() !== SyntaxKind.CloseBracketToken) {
            handleError(ParseErrorCode.CloseBracketExpected, [SyntaxKind.CloseBracketToken], []);
        } else {
            scanNext();
        }
        return true;
    }
    function parseValue() {
        return parseArray() || parseObject() || parseString(true) || parseLiteral();
    }
    scanNext();
    if (_scanner.getToken() === SyntaxKind.EOF) {
        return true;
    }
    if (!parseValue()) {
        handleError(ParseErrorCode.ValueExpected, [], []);
        return false;
    }
    if (_scanner.getToken() !== SyntaxKind.EOF) {
        handleError(ParseErrorCode.EndOfFileExpected, [], []);
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9jb21tb24vanNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7Ozs7UUF3RUEsYSxHQUFBLGE7UUE4ZkEsYSxHQUFBLGE7UUE2Q0Esb0IsR0FBQSxvQjtRQWtFQSxXLEdBQUEsVztRQThIQSxLLEdBQUEsSztRQWtEQSxTLEdBQUEsUztRQTZEQSxrQixHQUFBLGtCO1FBZ0NBLFksR0FBQSxZO1FBaUJBLEssR0FBQSxLO0FBajlCQSxJQUFZLHlDQUFaO0FBQUEsQ0FBQSxVQUFZLFNBQVosRUFBcUI7QUFDakIsY0FBQSxVQUFBLE1BQUEsSUFBQSxDQUFBLElBQUEsTUFBQTtBQUNBLGNBQUEsVUFBQSx3QkFBQSxJQUFBLENBQUEsSUFBQSx3QkFBQTtBQUNBLGNBQUEsVUFBQSx1QkFBQSxJQUFBLENBQUEsSUFBQSx1QkFBQTtBQUNBLGNBQUEsVUFBQSx1QkFBQSxJQUFBLENBQUEsSUFBQSx1QkFBQTtBQUNBLGNBQUEsVUFBQSxnQkFBQSxJQUFBLENBQUEsSUFBQSxnQkFBQTtBQUNBLGNBQUEsVUFBQSx3QkFBQSxJQUFBLENBQUEsSUFBQSx3QkFBQTtBQUNILENBUEQsRUFBWSxzQkFBQSxTQUFBLEdBQUEsWUFBUyxFQUFULENBQVo7QUFTQSxJQUFZLDJDQUFaO0FBQUEsQ0FBQSxVQUFZLFVBQVosRUFBc0I7QUFDbEIsZUFBQSxXQUFBLFNBQUEsSUFBQSxDQUFBLElBQUEsU0FBQTtBQUNBLGVBQUEsV0FBQSxnQkFBQSxJQUFBLENBQUEsSUFBQSxnQkFBQTtBQUNBLGVBQUEsV0FBQSxpQkFBQSxJQUFBLENBQUEsSUFBQSxpQkFBQTtBQUNBLGVBQUEsV0FBQSxrQkFBQSxJQUFBLENBQUEsSUFBQSxrQkFBQTtBQUNBLGVBQUEsV0FBQSxtQkFBQSxJQUFBLENBQUEsSUFBQSxtQkFBQTtBQUNBLGVBQUEsV0FBQSxZQUFBLElBQUEsQ0FBQSxJQUFBLFlBQUE7QUFDQSxlQUFBLFdBQUEsWUFBQSxJQUFBLENBQUEsSUFBQSxZQUFBO0FBQ0Es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LG1CQUFBLGVBQUEsVUFBQSxJQUFBLEdBQUEsSUFBQSxVQUFBO0FBR0EsbUJBQUEsZUFBQSxPQUFBLElBQUEsRUFBQSxJQUFBLE9BQUE7QUFDQSxtQkFBQSxlQUFBLGtCQUFBLElBQUEsR0FBQSxJQUFBLGtCQUFBO0FBQ0EsbUJBQUEsZUFBQSxRQUFBLElBQUEsSUFBQSxJQUFBLFFBQUE7QUFDQSxtQkFBQSxlQUFBLFFBQUEsSUFBQSxJQUFBLElBQUEsUUFBQTtBQUNBLG1CQUFBLGVBQUEsU0FBQSxJQUFBLElBQUEsSUFBQSxTQUFBO0FBQ0EsbUJBQUEsZUFBQSxTQUFBLElBQUEsSUFBQSxJQUFBLFNBQUE7QUFDQSxtQkFBQSxlQUFBLGlCQUFBLElBQUEsSUFBQSxJQUFBLGlCQUFBO0FBQ0EsbUJBQUEsZUFBQSxnQkFBQSxJQUFBLElBQUEsSUFBQSxnQkFBQTtBQUNBLG1CQUFBLGVBQUEsZUFBQSxJQUFBLElBQUEsSUFBQSxlQUFBO0FBQ0EsbUJBQUEsZUFBQSxhQUFBLElBQUEsSUFBQSxJQUFBLGFBQUE7QUFDQSxtQkFBQSxlQUFBLGtCQUFBLElBQUEsSUFBQSxJQUFBLGtCQUFBO0FBQ0EsbUJBQUEsZUFBQSxXQUFBLElBQUEsSUFBQSxJQUFBLFdBQUE7QUFDQSxtQkFBQSxlQUFBLFdBQUEsSUFBQSxJQUFBLElBQUEsV0FBQTtBQUNBLG1CQUFBLGVBQUEsZ0JBQUEsSUFBQSxJQUFBLElBQUEsZ0JBQUE7QUFDQSxtQkFBQSxlQUFBLG9CQUFBLElBQUEsSUFBQSxJQUFBLG9CQUFBO0FBQ0EsbUJBQUEsZUFBQSxrQkFBQSxJQUFBLEtBQUEsSUFBQSxrQkFBQTtBQUNBLG1CQUFBLGVBQUEsbUJBQUEsSUFBQSxJQUFBLElBQUEsbUJBQUE7QUFDQSxtQkFBQSxlQUFBLE9BQUEsSUFBQSxJQUFBLElBQUEsT0FBQTtBQUVBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFFQSxtQkFBQSxlQUFBLElBQUEsSUFBQSxFQUFBLElBQUEsSUFBQTtBQUNBLG1CQUFBLGVBQUEsSUFBQSxJQUFBLEVBQUEsSUFBQSxJQUFBO0FBQ0EsbUJBQUEsZUFBQSxJQUFBLElBQUEsRUFBQSxJQUFBLElBQUE7QUFDQSxtQkFBQSxlQUFBLElBQUEsSUFBQSxFQUFBLElBQUEsSUFBQTtBQUNBLG1CQUFBLGVBQUEsSUFBQSxJQUFBLEVBQUEsSUFBQSxJQUFBO0FBQ0EsbUJBQUEsZUFBQSxJQUFBLElBQUEsRUFBQSxJQUFBLElBQUE7QUFDQSxtQkFBQSxlQUFBLElBQUEsSUFBQSxFQUFBLElBQUEsSUFBQTtBQUNBLG1CQUFBLGVBQUEsSUFBQSxJQUFBLEVBQUEsSUFBQSxJQUFBO0FBQ0EsbUJBQUEsZUFBQSxJQUFBLElBQUEsRUFBQSxJQUFBLElBQUE7QUFDQSxtQkFBQSxlQUFBLElBQUEsSUFBQSxFQUFBLElBQUEsSUFBQTtBQUVBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxHQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEdBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsR0FBQSxJQUFBLEdBQUE7QUFFQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBQ0EsbUJBQUEsZUFBQSxHQUFBLElBQUEsRUFBQSxJQUFBLEdBQUE7QUFDQSxtQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLElBQUEsR0FBQTtBQUNBLG1CQUFBLGVBQUEsR0FBQSxJQUFBLEVBQUEsSUFBQSxHQUFBO0FBRUEsbUJBQUEsZUFBQSxXQUFBLElBQUEsRUFBQSxJQUFBLFdBQUE7QUFDQSxtQkFBQSxlQUFBLFVBQUEsSUFBQSxFQUFBLElBQUEsVUFBQTtBQUNBLG1CQUFBLGVBQUEsSUFBQSxJQUFBLEVBQUEsSUFBQSxJQUFBO0FBQ0EsbUJBQUEsZUFBQSxXQUFBLElBQUEsRUFBQSxJQUFBLFdBQUE7QUFDQSxtQkFBQSxlQUFBLEtBQUEsSUFBQSxHQUFBLElBQUEsS0FBQTtBQUNBLG1CQUFBLGVBQUEsT0FBQSxJQUFBLEVBQUEsSUFBQSxPQUFBO0FBQ0EsbUJBQUEsZUFBQSxZQUFBLElBQUEsR0FBQSxJQUFBLFlBQUE7QUFDQSxtQkFBQSxlQUFBLGNBQUEsSUFBQSxFQUFBLElBQUEsY0FBQTtBQUNBLG1CQUFBLGVBQUEsWUFBQSxJQUFBLEVBQUEsSUFBQSxZQUFBO0FBQ0EsbUJBQUEsZUFBQSxPQUFBLElBQUEsRUFBQSxJQUFBLE9BQUE7QUFDQSxtQkFBQSxlQUFBLE9BQUEsSUFBQSxFQUFBLElBQUEsT0FBQTtBQUNBLG1CQUFBLGVBQUEsS0FBQSxJQUFBLEVBQUEsSUFBQSxLQUFBO0FBQ0EsbUJBQUEsZUFBQSxhQUFBLElBQUEsRUFBQSxJQUFBLGFBQUE7QUFDQSxtQkFBQSxlQUFBLFFBQUEsSUFBQSxFQUFBLElBQUEsUUFBQTtBQUNBLG1CQUFBLGVBQUEsYUFBQSxJQUFBLEVBQUEsSUFBQSxhQUFBO0FBQ0EsbUJBQUEsZUFBQSxhQUFBLElBQUEsRUFBQSxJQUFBLGFBQUE7QUFDQSxtQkFBQSxlQUFBLFVBQUEsSUFBQSxFQUFBLElBQUEsVUFBQTtBQUNBLG1CQUFBLGVBQUEsT0FBQSxJQUFBLEVBQUEsSUFBQSxPQUFBO0FBQ0EsbUJBQUEsZUFBQSxXQUFBLElBQUEsR0FBQSxJQUFBLFdBQUE7QUFDQSxtQkFBQSxlQUFBLGFBQUEsSUFBQSxFQUFBLElBQUEsYUFBQTtBQUNBLG1CQUFBLGVBQUEsV0FBQSxJQUFBLEVBQUEsSUFBQSxXQUFBO0FBQ0EsbUJBQUEsZUFBQSxTQUFBLElBQUEsRUFBQSxJQUFBLFNBQUE7QUFDQSxtQkFBQSxlQUFBLE1BQUEsSUFBQSxFQUFBLElBQUEsTUFBQTtBQUNBLG1CQUFBLGVBQUEsVUFBQSxJQUFBLEVBQUEsSUFBQSxVQUFBO0FBQ0EsbUJBQUEsZUFBQSxXQUFBLElBQUEsRUFBQSxJQUFBLFdBQUE7QUFDQSxtQkFBQSxlQUFBLGFBQUEsSUFBQSxFQUFBLElBQUEsYUFBQTtBQUNBLG1CQUFBLGVBQUEsT0FB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ZS9jb21tb24vanNvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5leHBvcnQgZW51bSBTY2FuRXJyb3Ige1xyXG4gICAgTm9uZSxcclxuICAgIFVuZXhwZWN0ZWRFbmRPZkNvbW1lbnQsXHJcbiAgICBVbmV4cGVjdGVkRW5kT2ZTdHJpbmcsXHJcbiAgICBVbmV4cGVjdGVkRW5kT2ZOdW1iZXIsXHJcbiAgICBJbnZhbGlkVW5pY29kZSxcclxuICAgIEludmFsaWRFc2NhcGVDaGFyYWN0ZXJcclxufVxyXG5cclxuZXhwb3J0IGVudW0gU3ludGF4S2luZCB7XHJcbiAgICBVbmtub3duID0gMCxcclxuICAgIE9wZW5CcmFjZVRva2VuLFxyXG4gICAgQ2xvc2VCcmFjZVRva2VuLFxyXG4gICAgT3BlbkJyYWNrZXRUb2tlbixcclxuICAgIENsb3NlQnJhY2tldFRva2VuLFxyXG4gICAgQ29tbWFUb2tlbixcclxuICAgIENvbG9uVG9rZW4sXHJcbiAgICBOdWxsS2V5d29yZCxcclxuICAgIFRydWVLZXl3b3JkLFxyXG4gICAgRmFsc2VLZXl3b3JkLFxyXG4gICAgU3RyaW5nTGl0ZXJhbCxcclxuICAgIE51bWVyaWNMaXRlcmFsLFxyXG4gICAgTGluZUNvbW1lbnRUcml2aWEsXHJcbiAgICBCbG9ja0NvbW1lbnRUcml2aWEsXHJcbiAgICBMaW5lQnJlYWtUcml2aWEsXHJcbiAgICBUcml2aWEsXHJcbiAgICBFT0ZcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBzY2FubmVyIG9iamVjdCwgcmVwcmVzZW50aW5nIGEgSlNPTiBzY2FubmVyIGF0IGEgcG9zaXRpb24gaW4gdGhlIGlucHV0IHN0cmluZy5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSlNPTlNjYW5uZXIge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSBzY2FuIHBvc2l0aW9uIHRvIGEgbmV3IG9mZnNldC4gQSBjYWxsIHRvICdzY2FuJyBpcyBuZWVkZWQgdG8gZ2V0IHRoZSBmaXJzdCB0b2tlbi5cclxuICAgICAqL1xyXG4gICAgc2V0UG9zaXRpb24ocG9zOiBudW1iZXIpOiB2b2lkO1xyXG4gICAgLyoqXHJcbiAgICAgKiBSZWFkIHRoZSBuZXh0IHRva2VuLiBSZXR1cm5zIHRoZSB0b2xlbiBjb2RlLlxyXG4gICAgICovXHJcbiAgICBzY2FuKCk6IFN5bnRheEtpbmQ7XHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgc2NhbiBwb3NpdGlvbiwgd2hpY2ggaXMgYWZ0ZXIgdGhlIGxhc3QgcmVhZCB0b2tlbi5cclxuICAgICAqL1xyXG4gICAgZ2V0UG9zaXRpb24oKTogbnVtYmVyO1xyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBsYXN0IHJlYWQgdG9rZW4uXHJcbiAgICAgKi9cclxuICAgIGdldFRva2VuKCk6IFN5bnRheEtpbmQ7XHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGxhc3QgcmVhZCB0b2tlbiB2YWx1ZS4gVGhlIHZhbHVlIGZvciBzdHJpbmdzIGlzIHRoZSBkZWNvZGVkIHN0cmluZyBjb250ZW50LiBGb3IgbnVtYmVycyBpdHMgb2YgdHlwZSBudW1iZXIsIGZvciBib29sZWFuIGl0J3MgdHJ1ZSBvciBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgZ2V0VG9rZW5WYWx1ZSgpOiBzdHJpbmc7XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBzdGFydCBvZmZzZXQgb2YgdGhlIGxhc3QgcmVhZCB0b2tlbi5cclxuICAgICAqL1xyXG4gICAgZ2V0VG9rZW5PZmZzZXQoKTogbnVtYmVyO1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbGVuZ3RoIG9mIHRoZSBsYXN0IHJlYWQgdG9rZW4uXHJcbiAgICAgKi9cclxuICAgIGdldFRva2VuTGVuZ3RoKCk6IG51bWJlcjtcclxuICAgIC8qKlxyXG4gICAgICogQW4gZXJyb3IgY29kZSBvZiB0aGUgbGFzdCBzY2FuLlxyXG4gICAgICovXHJcbiAgICBnZXRUb2tlbkVycm9yKCk6IFNjYW5FcnJvcjtcclxufVxyXG4vKipcclxuICogQ3JlYXRlcyBhIEpTT04gc2Nhbm5lciBvbiB0aGUgZ2l2ZW4gdGV4dC5cclxuICogSWYgaWdub3JlVHJpdmlhIGlzIHNldCwgd2hpdGVzcGFjZXMgb3IgY29tbWVudHMgYXJlIGlnbm9yZWQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2Nhbm5lcih0ZXh0OiBzdHJpbmcsIGlnbm9yZVRyaXZpYTogYm9vbGVhbiA9IGZhbHNlKTogSlNPTlNjYW5uZXIge1xyXG5cclxuICAgIGxldCBwb3MgPSAwLFxyXG4gICAgICAgIGxlbiA9IHRleHQubGVuZ3RoLFxyXG4gICAgICAgIHZhbHVlOiBzdHJpbmcgPSAnJyxcclxuICAgICAgICB0b2tlbk9mZnNldCA9IDAsXHJcbiAgICAgICAgdG9rZW46IFN5bnRheEtpbmQgPSBTeW50YXhLaW5kLlVua25vd24sXHJcbiAgICAgICAgc2NhbkVycm9yOiBTY2FuRXJyb3IgPSBTY2FuRXJyb3IuTm9uZTtcclxuXHJcbiAgICBmdW5jdGlvbiBzY2FuSGV4RGlnaXRzKGNvdW50OiBudW1iZXIsIGV4YWN0PzogYm9vbGVhbik6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IGRpZ2l0cyA9IDA7XHJcbiAgICAgICAgbGV0IHZhbHVlID0gMDtcclxuICAgICAgICB3aGlsZSAoZGlnaXRzIDwgY291bnQgfHwgIWV4YWN0KSB7XHJcbiAgICAgICAgICAgIGxldCBjaCA9IHRleHQuY2hhckNvZGVBdChwb3MpO1xyXG4gICAgICAgICAgICBpZiAoY2ggPj0gQ2hhcmFjdGVyQ29kZXMuXzAgJiYgY2ggPD0gQ2hhcmFjdGVyQ29kZXMuXzkpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKiAxNiArIGNoIC0gQ2hhcmFjdGVyQ29kZXMuXzA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoY2ggPj0gQ2hhcmFjdGVyQ29kZXMuQSAmJiBjaCA8PSBDaGFyYWN0ZXJDb2Rlcy5GKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICogMTYgKyBjaCAtIENoYXJhY3RlckNvZGVzLkEgKyAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChjaCA+PSBDaGFyYWN0ZXJDb2Rlcy5hICYmIGNoIDw9IENoYXJhY3RlckNvZGVzLmYpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKiAxNiArIGNoIC0gQ2hhcmFjdGVyQ29kZXMuYSArIDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgIGRpZ2l0cysrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGlnaXRzIDwgY291bnQpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldFBvc2l0aW9uKG5ld1Bvc2l0aW9uOiBudW1iZXIpIHtcclxuICAgICAgICBwb3MgPSBuZXdQb3NpdGlvbjtcclxuICAgICAgICB2YWx1ZSA9ICcnO1xyXG4gICAgICAgIHRva2VuT2Zmc2V0ID0gMDtcclxuICAgICAgICB0b2tlbiA9IFN5bnRheEtpbmQuVW5rbm93bjtcclxuICAgICAgICBzY2FuRXJyb3IgPSBTY2FuRXJyb3IuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzY2FuTnVtYmVyKCk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gcG9zO1xyXG4gICAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQocG9zKSA9PT0gQ2hhcmFjdGVyQ29kZXMuXzApIHtcclxuICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgIHdoaWxlIChwb3MgPCB0ZXh0Lmxlbmd0aCAmJiBpc0RpZ2l0KHRleHQuY2hhckNvZGVBdChwb3MpKSkge1xyXG4gICAgICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHBvcyA8IHRleHQubGVuZ3RoICYmIHRleHQuY2hhckNvZGVBdChwb3MpID09PSBDaGFyYWN0ZXJDb2Rlcy5kb3QpIHtcclxuICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgIGlmIChwb3MgPCB0ZXh0Lmxlbmd0aCAmJiBpc0RpZ2l0KHRleHQuY2hhckNvZGVBdChwb3MpKSkge1xyXG4gICAgICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAocG9zIDwgdGV4dC5sZW5ndGggJiYgaXNEaWdpdCh0ZXh0LmNoYXJDb2RlQXQocG9zKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNjYW5FcnJvciA9IFNjYW5FcnJvci5VbmV4cGVjdGVkRW5kT2ZOdW1iZXI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGVuZCA9IHBvcztcclxuICAgICAgICBpZiAocG9zIDwgdGV4dC5sZW5ndGggJiYgKHRleHQuY2hhckNvZGVBdChwb3MpID09PSBDaGFyYWN0ZXJDb2Rlcy5FIHx8IHRleHQuY2hhckNvZGVBdChwb3MpID09PSBDaGFyYWN0ZXJDb2Rlcy5lKSkge1xyXG4gICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgaWYgKHBvcyA8IHRleHQubGVuZ3RoICYmIHRleHQuY2hhckNvZGVBdChwb3MpID09PSBDaGFyYWN0ZXJDb2Rlcy5wbHVzIHx8IHRleHQuY2hhckNvZGVBdChwb3MpID09PSBDaGFyYWN0ZXJDb2Rlcy5taW51cykge1xyXG4gICAgICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHBvcyA8IHRleHQubGVuZ3RoICYmIGlzRGlnaXQodGV4dC5jaGFyQ29kZUF0KHBvcykpKSB7XHJcbiAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgIHdoaWxlIChwb3MgPCB0ZXh0Lmxlbmd0aCAmJiBpc0RpZ2l0KHRleHQuY2hhckNvZGVBdChwb3MpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZW5kID0gcG9zO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2NhbkVycm9yID0gU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZk51bWJlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGV4dC5zdWJzdHJpbmcoc3RhcnQsIGVuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2NhblN0cmluZygpOiBzdHJpbmcge1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gJycsXHJcbiAgICAgICAgICAgIHN0YXJ0ID0gcG9zO1xyXG5cclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICBpZiAocG9zID49IGxlbikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHRleHQuc3Vic3RyaW5nKHN0YXJ0LCBwb3MpO1xyXG4gICAgICAgICAgICAgICAgc2NhbkVycm9yID0gU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZlN0cmluZztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBjaCA9IHRleHQuY2hhckNvZGVBdChwb3MpO1xyXG4gICAgICAgICAgICBpZiAoY2ggPT09IENoYXJhY3RlckNvZGVzLmRvdWJsZVF1b3RlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyk7XHJcbiAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjaCA9PT0gQ2hhcmFjdGVyQ29kZXMuYmFja3NsYXNoKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyk7XHJcbiAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgIGlmIChwb3MgPj0gbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NhbkVycm9yID0gU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZlN0cmluZztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNoID0gdGV4dC5jaGFyQ29kZUF0KHBvcysrKTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLmRvdWJsZVF1b3RlOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcXCInO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLmJhY2tzbGFzaDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXFxcJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5zbGFzaDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcvJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5iOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xcYic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuZjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXGYnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLm46XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnXFxuJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5yOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1xccic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMudDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLnU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaCA9IHNjYW5IZXhEaWdpdHMoNCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuRXJyb3IgPSBTY2FuRXJyb3IuSW52YWxpZFVuaWNvZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkVycm9yID0gU2NhbkVycm9yLkludmFsaWRFc2NhcGVDaGFyYWN0ZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGFydCA9IHBvcztcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc0xpbmVCcmVhayhjaCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB0ZXh0LnN1YnN0cmluZyhzdGFydCwgcG9zKTtcclxuICAgICAgICAgICAgICAgIHNjYW5FcnJvciA9IFNjYW5FcnJvci5VbmV4cGVjdGVkRW5kT2ZTdHJpbmc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb3MrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzY2FuTmV4dCgpOiBTeW50YXhLaW5kIHtcclxuXHJcbiAgICAgICAgdmFsdWUgPSAnJztcclxuICAgICAgICBzY2FuRXJyb3IgPSBTY2FuRXJyb3IuTm9uZTtcclxuXHJcbiAgICAgICAgdG9rZW5PZmZzZXQgPSBwb3M7XHJcblxyXG4gICAgICAgIGlmIChwb3MgPj0gbGVuKSB7XHJcbiAgICAgICAgICAgIC8vIGF0IHRoZSBlbmRcclxuICAgICAgICAgICAgdG9rZW5PZmZzZXQgPSBsZW47XHJcbiAgICAgICAgICAgIHJldHVybiB0b2tlbiA9IFN5bnRheEtpbmQuRU9GO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNvZGUgPSB0ZXh0LmNoYXJDb2RlQXQocG9zKTtcclxuICAgICAgICAvLyB0cml2aWE6IHdoaXRlc3BhY2VcclxuICAgICAgICBpZiAoaXNXaGl0ZVNwYWNlKGNvZGUpKSB7XHJcbiAgICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgICAgICAgICAgIGNvZGUgPSB0ZXh0LmNoYXJDb2RlQXQocG9zKTtcclxuICAgICAgICAgICAgfSB3aGlsZSAoaXNXaGl0ZVNwYWNlKGNvZGUpKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0b2tlbiA9IFN5bnRheEtpbmQuVHJpdmlhO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdHJpdmlhOiBuZXdsaW5lc1xyXG4gICAgICAgIGlmIChpc0xpbmVCcmVhayhjb2RlKSkge1xyXG4gICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgdmFsdWUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IENoYXJhY3RlckNvZGVzLmNhcnJpYWdlUmV0dXJuICYmIHRleHQuY2hhckNvZGVBdChwb3MpID09PSBDaGFyYWN0ZXJDb2Rlcy5saW5lRmVlZCkge1xyXG4gICAgICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSArPSAnXFxuJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG9rZW4gPSBTeW50YXhLaW5kLkxpbmVCcmVha1RyaXZpYTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN3aXRjaCAoY29kZSkge1xyXG4gICAgICAgICAgICAvLyB0b2tlbnM6IFtde306LFxyXG4gICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLm9wZW5CcmFjZTpcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5PcGVuQnJhY2VUb2tlbjtcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5jbG9zZUJyYWNlOlxyXG4gICAgICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW4gPSBTeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbjtcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5vcGVuQnJhY2tldDpcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5PcGVuQnJhY2tldFRva2VuO1xyXG4gICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLmNsb3NlQnJhY2tldDpcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5DbG9zZUJyYWNrZXRUb2tlbjtcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5jb2xvbjpcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5Db2xvblRva2VuO1xyXG4gICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLmNvbW1hOlxyXG4gICAgICAgICAgICAgICAgcG9zKys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW4gPSBTeW50YXhLaW5kLkNvbW1hVG9rZW47XHJcblxyXG4gICAgICAgICAgICAvLyBzdHJpbmdzXHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuZG91YmxlUXVvdGU6XHJcbiAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc2NhblN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsO1xyXG5cclxuICAgICAgICAgICAgLy8gY29tbWVudHNcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5zbGFzaDpcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IHBvcyAtIDE7XHJcbiAgICAgICAgICAgICAgICAvLyBTaW5nbGUtbGluZSBjb21tZW50XHJcbiAgICAgICAgICAgICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KHBvcyArIDEpID09PSBDaGFyYWN0ZXJDb2Rlcy5zbGFzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcyArPSAyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAocG9zIDwgbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0xpbmVCcmVhayh0ZXh0LmNoYXJDb2RlQXQocG9zKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcysrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0ZXh0LnN1YnN0cmluZyhzdGFydCwgcG9zKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW4gPSBTeW50YXhLaW5kLkxpbmVDb21tZW50VHJpdmlhO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIE11bHRpLWxpbmUgY29tbWVudFxyXG4gICAgICAgICAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChwb3MgKyAxKSA9PT0gQ2hhcmFjdGVyQ29kZXMuYXN0ZXJpc2spIHtcclxuICAgICAgICAgICAgICAgICAgICBwb3MgKz0gMjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNhZmVMZW5ndGggPSBsZW4gLSAxOyAvLyBGb3IgbG9va2FoZWFkLlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb21tZW50Q2xvc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHBvcyA8IHNhZmVMZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoID0gdGV4dC5jaGFyQ29kZUF0KHBvcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggPT09IENoYXJhY3RlckNvZGVzLmFzdGVyaXNrICYmIHRleHQuY2hhckNvZGVBdChwb3MgKyAxKSA9PT0gQ2hhcmFjdGVyQ29kZXMuc2xhc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudENsb3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghY29tbWVudENsb3NlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkVycm9yID0gU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZkNvbW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHRleHQuc3Vic3RyaW5nKHN0YXJ0LCBwb3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbiA9IFN5bnRheEtpbmQuQmxvY2tDb21tZW50VHJpdmlhO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8ganVzdCBhIHNpbmdsZSBzbGFzaFxyXG4gICAgICAgICAgICAgICAgdmFsdWUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5Vbmtub3duO1xyXG5cclxuICAgICAgICAgICAgLy8gbnVtYmVyc1xyXG4gICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLm1pbnVzOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvcyA9PT0gbGVuIHx8ICFpc0RpZ2l0KHRleHQuY2hhckNvZGVBdChwb3MpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbiA9IFN5bnRheEtpbmQuVW5rbm93bjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gZm91bmQgYSBtaW51cywgZm9sbG93ZWQgYnkgYSBudW1iZXIgc29cclxuICAgICAgICAgICAgLy8gd2UgZmFsbCB0aHJvdWdoIHRvIHByb2NlZWQgd2l0aCBzY2FubmluZ1xyXG4gICAgICAgICAgICAvLyBudW1iZXJzXHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzA6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzE6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzI6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzM6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzQ6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzU6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzY6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzc6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzg6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuXzk6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSArPSBzY2FuTnVtYmVyKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW4gPSBTeW50YXhLaW5kLk51bWVyaWNMaXRlcmFsO1xyXG4gICAgICAgICAgICAvLyBsaXRlcmFscyBhbmQgdW5rbm93biBzeW1ib2xzXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyBpcyBhIGxpdGVyYWw/IFJlYWQgdGhlIGZ1bGwgd29yZC5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChwb3MgPCBsZW4gJiYgaXNVbmtub3duQ29udGVudENoYXJhY3Rlcihjb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSB0ZXh0LmNoYXJDb2RlQXQocG9zKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0b2tlbk9mZnNldCAhPT0gcG9zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0ZXh0LnN1YnN0cmluZyh0b2tlbk9mZnNldCwgcG9zKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBrZXl3b3JkczogdHJ1ZSwgZmFsc2UsIG51bGxcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RydWUnOiByZXR1cm4gdG9rZW4gPSBTeW50YXhLaW5kLlRydWVLZXl3b3JkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdmYWxzZSc6IHJldHVybiB0b2tlbiA9IFN5bnRheEtpbmQuRmFsc2VLZXl3b3JkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudWxsJzogcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5OdWxsS2V5d29yZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5Vbmtub3duO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gc29tZVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcclxuICAgICAgICAgICAgICAgIHBvcysrO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuID0gU3ludGF4S2luZC5Vbmtub3duO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc1Vua25vd25Db250ZW50Q2hhcmFjdGVyKGNvZGU6IENoYXJhY3RlckNvZGVzKSB7XHJcbiAgICAgICAgaWYgKGlzV2hpdGVTcGFjZShjb2RlKSB8fCBpc0xpbmVCcmVhayhjb2RlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaCAoY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLmNsb3NlQnJhY2U6XHJcbiAgICAgICAgICAgIGNhc2UgQ2hhcmFjdGVyQ29kZXMuY2xvc2VCcmFja2V0OlxyXG4gICAgICAgICAgICBjYXNlIENoYXJhY3RlckNvZGVzLm9wZW5CcmFjZTpcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5vcGVuQnJhY2tldDpcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5kb3VibGVRdW90ZTpcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5jb2xvbjpcclxuICAgICAgICAgICAgY2FzZSBDaGFyYWN0ZXJDb2Rlcy5jb21tYTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHNjYW5OZXh0Tm9uVHJpdmlhKCk6IFN5bnRheEtpbmQge1xyXG4gICAgICAgIGxldCByZXN1bHQ6IFN5bnRheEtpbmQ7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBzY2FuTmV4dCgpO1xyXG4gICAgICAgIH0gd2hpbGUgKHJlc3VsdCA+PSBTeW50YXhLaW5kLkxpbmVDb21tZW50VHJpdmlhICYmIHJlc3VsdCA8PSBTeW50YXhLaW5kLlRyaXZpYSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNldFBvc2l0aW9uOiBzZXRQb3NpdGlvbixcclxuICAgICAgICBnZXRQb3NpdGlvbjogKCkgPT4gcG9zLFxyXG4gICAgICAgIHNjYW46IGlnbm9yZVRyaXZpYSA/IHNjYW5OZXh0Tm9uVHJpdmlhIDogc2Nhbk5leHQsXHJcbiAgICAgICAgZ2V0VG9rZW46ICgpID0+IHRva2VuLFxyXG4gICAgICAgIGdldFRva2VuVmFsdWU6ICgpID0+IHZhbHVlLFxyXG4gICAgICAgIGdldFRva2VuT2Zmc2V0OiAoKSA9PiB0b2tlbk9mZnNldCxcclxuICAgICAgICBnZXRUb2tlbkxlbmd0aDogKCkgPT4gcG9zIC0gdG9rZW5PZmZzZXQsXHJcbiAgICAgICAgZ2V0VG9rZW5FcnJvcjogKCkgPT4gc2NhbkVycm9yXHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1doaXRlU3BhY2UoY2g6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGNoID09PSBDaGFyYWN0ZXJDb2Rlcy5zcGFjZSB8fCBjaCA9PT0gQ2hhcmFjdGVyQ29kZXMudGFiIHx8IGNoID09PSBDaGFyYWN0ZXJDb2Rlcy52ZXJ0aWNhbFRhYiB8fCBjaCA9PT0gQ2hhcmFjdGVyQ29kZXMuZm9ybUZlZWQgfHxcclxuICAgICAgICBjaCA9PT0gQ2hhcmFjdGVyQ29kZXMubm9uQnJlYWtpbmdTcGFjZSB8fCBjaCA9PT0gQ2hhcmFjdGVyQ29kZXMub2doYW0gfHwgY2ggPj0gQ2hhcmFjdGVyQ29kZXMuZW5RdWFkICYmIGNoIDw9IENoYXJhY3RlckNvZGVzLnplcm9XaWR0aFNwYWNlIHx8XHJcbiAgICAgICAgY2ggPT09IENoYXJhY3RlckNvZGVzLm5hcnJvd05vQnJlYWtTcGFjZSB8fCBjaCA9PT0gQ2hhcmFjdGVyQ29kZXMubWF0aGVtYXRpY2FsU3BhY2UgfHwgY2ggPT09IENoYXJhY3RlckNvZGVzLmlkZW9ncmFwaGljU3BhY2UgfHwgY2ggPT09IENoYXJhY3RlckNvZGVzLmJ5dGVPcmRlck1hcms7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzTGluZUJyZWFrKGNoOiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBjaCA9PT0gQ2hhcmFjdGVyQ29kZXMubGluZUZlZWQgfHwgY2ggPT09IENoYXJhY3RlckNvZGVzLmNhcnJpYWdlUmV0dXJuIHx8IGNoID09PSBDaGFyYWN0ZXJDb2Rlcy5saW5lU2VwYXJhdG9yIHx8IGNoID09PSBDaGFyYWN0ZXJDb2Rlcy5wYXJhZ3JhcGhTZXBhcmF0b3I7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRGlnaXQoY2g6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGNoID49IENoYXJhY3RlckNvZGVzLl8wICYmIGNoIDw9IENoYXJhY3RlckNvZGVzLl85O1xyXG59XHJcblxyXG5lbnVtIENoYXJhY3RlckNvZGVzIHtcclxuICAgIG51bGxDaGFyYWN0ZXIgPSAwLFxyXG4gICAgbWF4QXNjaWlDaGFyYWN0ZXIgPSAweDdGLFxyXG5cclxuICAgIGxpbmVGZWVkID0gMHgwQSwgICAgICAgICAgICAgIC8vIFxcblxyXG4gICAgY2FycmlhZ2VSZXR1cm4gPSAweDBELCAgICAgICAgLy8gXFxyXHJcbiAgICBsaW5lU2VwYXJhdG9yID0gMHgyMDI4LFxyXG4gICAgcGFyYWdyYXBoU2VwYXJhdG9yID0gMHgyMDI5LFxyXG5cclxuICAgIC8vIFJFVklFVzogZG8gd2UgbmVlZCB0byBzdXBwb3J0IHRoaXM/ICBUaGUgc2Nhbm5lciBkb2Vzbid0LCBidXQgb3VyIElUZXh0IGRvZXMuICBUaGlzIHNlZW1zXHJcbiAgICAvLyBsaWtlIGFuIG9kZCBkaXNwYXJpdHk/ICAoT3IgbWF5YmUgaXQncyBjb21wbGV0ZWx5IGZpbmUgZm9yIHRoZW0gdG8gYmUgZGlmZmVyZW50KS5cclxuICAgIG5leHRMaW5lID0gMHgwMDg1LFxyXG5cclxuICAgIC8vIFVuaWNvZGUgMy4wIHNwYWNlIGNoYXJhY3RlcnNcclxuICAgIHNwYWNlID0gMHgwMDIwLCAgIC8vIFwiIFwiXHJcbiAgICBub25CcmVha2luZ1NwYWNlID0gMHgwMEEwLCAgIC8vXHJcbiAgICBlblF1YWQgPSAweDIwMDAsXHJcbiAgICBlbVF1YWQgPSAweDIwMDEsXHJcbiAgICBlblNwYWNlID0gMHgyMDAyLFxyXG4gICAgZW1TcGFjZSA9IDB4MjAwMyxcclxuICAgIHRocmVlUGVyRW1TcGFjZSA9IDB4MjAwNCxcclxuICAgIGZvdXJQZXJFbVNwYWNlID0gMHgyMDA1LFxyXG4gICAgc2l4UGVyRW1TcGFjZSA9IDB4MjAwNixcclxuICAgIGZpZ3VyZVNwYWNlID0gMHgyMDA3LFxyXG4gICAgcHVuY3R1YXRpb25TcGFjZSA9IDB4MjAwOCxcclxuICAgIHRoaW5TcGFjZSA9IDB4MjAwOSxcclxuICAgIGhhaXJTcGFjZSA9IDB4MjAwQSxcclxuICAgIHplcm9XaWR0aFNwYWNlID0gMHgyMDBCLFxyXG4gICAgbmFycm93Tm9CcmVha1NwYWNlID0gMHgyMDJGLFxyXG4gICAgaWRlb2dyYXBoaWNTcGFjZSA9IDB4MzAwMCxcclxuICAgIG1hdGhlbWF0aWNhbFNwYWNlID0gMHgyMDVGLFxyXG4gICAgb2doYW0gPSAweDE2ODAsXHJcblxyXG4gICAgXyA9IDB4NUYsXHJcbiAgICAkID0gMHgyNCxcclxuXHJcbiAgICBfMCA9IDB4MzAsXHJcbiAgICBfMSA9IDB4MzEsXHJcbiAgICBfMiA9IDB4MzIsXHJcbiAgICBfMyA9IDB4MzMsXHJcbiAgICBfNCA9IDB4MzQsXHJcbiAgICBfNSA9IDB4MzUsXHJcbiAgICBfNiA9IDB4MzYsXHJcbiAgICBfNyA9IDB4MzcsXHJcbiAgICBfOCA9IDB4MzgsXHJcbiAgICBfOSA9IDB4MzksXHJcblxyXG4gICAgYSA9IDB4NjEsXHJcbiAgICBiID0gMHg2MixcclxuICAgIGMgPSAweDYzLFxyXG4gICAgZCA9IDB4NjQsXHJcbiAgICBlID0gMHg2NSxcclxuICAgIGYgPSAweDY2LFxyXG4gICAgZyA9IDB4NjcsXHJcbiAgICBoID0gMHg2OCxcclxuICAgIGkgPSAweDY5LFxyXG4gICAgaiA9IDB4NkEsXHJcbiAgICBrID0gMHg2QixcclxuICAgIGwgPSAweDZDLFxyXG4gICAgbSA9IDB4NkQsXHJcbiAgICBuID0gMHg2RSxcclxuICAgIG8gPSAweDZGLFxyXG4gICAgcCA9IDB4NzAsXHJcbiAgICBxID0gMHg3MSxcclxuICAgIHIgPSAweDcyLFxyXG4gICAgcyA9IDB4NzMsXHJcbiAgICB0ID0gMHg3NCxcclxuICAgIHUgPSAweDc1LFxyXG4gICAgdiA9IDB4NzYsXHJcbiAgICB3ID0gMHg3NyxcclxuICAgIHggPSAweDc4LFxyXG4gICAgeSA9IDB4NzksXHJcbiAgICB6ID0gMHg3QSxcclxuXHJcbiAgICBBID0gMHg0MSxcclxuICAgIEIgPSAweDQyLFxyXG4gICAgQyA9IDB4NDMsXHJcbiAgICBEID0gMHg0NCxcclxuICAgIEUgPSAweDQ1LFxyXG4gICAgRiA9IDB4NDYsXHJcbiAgICBHID0gMHg0NyxcclxuICAgIEggPSAweDQ4LFxyXG4gICAgSSA9IDB4NDksXHJcbiAgICBKID0gMHg0QSxcclxuICAgIEsgPSAweDRCLFxyXG4gICAgTCA9IDB4NEMsXHJcbiAgICBNID0gMHg0RCxcclxuICAgIE4gPSAweDRFLFxyXG4gICAgTyA9IDB4NEYsXHJcbiAgICBQID0gMHg1MCxcclxuICAgIFEgPSAweDUxLFxyXG4gICAgUiA9IDB4NTIsXHJcbiAgICBTID0gMHg1MyxcclxuICAgIFQgPSAweDU0LFxyXG4gICAgVSA9IDB4NTUsXHJcbiAgICBWID0gMHg1NixcclxuICAgIFcgPSAweDU3LFxyXG4gICAgWCA9IDB4NTgsXHJcbiAgICBZID0gMHg1OSxcclxuICAgIFogPSAweDVhLFxyXG5cclxuICAgIGFtcGVyc2FuZCA9IDB4MjYsICAgICAgICAgICAgIC8vICZcclxuICAgIGFzdGVyaXNrID0gMHgyQSwgICAgICAgICAgICAgIC8vICpcclxuICAgIGF0ID0gMHg0MCwgICAgICAgICAgICAgICAgICAgIC8vIEBcclxuICAgIGJhY2tzbGFzaCA9IDB4NUMsICAgICAgICAgICAgIC8vIFxcXHJcbiAgICBiYXIgPSAweDdDLCAgICAgICAgICAgICAgICAgICAvLyB8XHJcbiAgICBjYXJldCA9IDB4NUUsICAgICAgICAgICAgICAgICAvLyBeXHJcbiAgICBjbG9zZUJyYWNlID0gMHg3RCwgICAgICAgICAgICAvLyB9XHJcbiAgICBjbG9zZUJyYWNrZXQgPSAweDVELCAgICAgICAgICAvLyBdXHJcbiAgICBjbG9zZVBhcmVuID0gMHgyOSwgICAgICAgICAgICAvLyApXHJcbiAgICBjb2xvbiA9IDB4M0EsICAgICAgICAgICAgICAgICAvLyA6XHJcbiAgICBjb21tYSA9IDB4MkMsICAgICAgICAgICAgICAgICAvLyAsXHJcbiAgICBkb3QgPSAweDJFLCAgICAgICAgICAgICAgICAgICAvLyAuXHJcbiAgICBkb3VibGVRdW90ZSA9IDB4MjIsICAgICAgICAgICAvLyBcIlxyXG4gICAgZXF1YWxzID0gMHgzRCwgICAgICAgICAgICAgICAgLy8gPVxyXG4gICAgZXhjbGFtYXRpb24gPSAweDIxLCAgICAgICAgICAgLy8gIVxyXG4gICAgZ3JlYXRlclRoYW4gPSAweDNFLCAgICAgICAgICAgLy8gPlxyXG4gICAgbGVzc1RoYW4gPSAweDNDLCAgICAgICAgICAgICAgLy8gPFxyXG4gICAgbWludXMgPSAweDJELCAgICAgICAgICAgICAgICAgLy8gLVxyXG4gICAgb3BlbkJyYWNlID0gMHg3QiwgICAgICAgICAgICAgLy8ge1xyXG4gICAgb3BlbkJyYWNrZXQgPSAweDVCLCAgICAgICAgICAgLy8gW1xyXG4gICAgb3BlblBhcmVuID0gMHgyOCwgICAgICAgICAgICAgLy8gKFxyXG4gICAgcGVyY2VudCA9IDB4MjUsICAgICAgICAgICAgICAgLy8gJVxyXG4gICAgcGx1cyA9IDB4MkIsICAgICAgICAgICAgICAgICAgLy8gK1xyXG4gICAgcXVlc3Rpb24gPSAweDNGLCAgICAgICAgICAgICAgLy8gP1xyXG4gICAgc2VtaWNvbG9uID0gMHgzQiwgICAgICAgICAgICAgLy8gO1xyXG4gICAgc2luZ2xlUXVvdGUgPSAweDI3LCAgICAgICAgICAgLy8gJ1xyXG4gICAgc2xhc2ggPSAweDJGLCAgICAgICAgICAgICAgICAgLy8gL1xyXG4gICAgdGlsZGUgPSAweDdFLCAgICAgICAgICAgICAgICAgLy8gflxyXG5cclxuICAgIGJhY2tzcGFjZSA9IDB4MDgsICAgICAgICAgICAgIC8vIFxcYlxyXG4gICAgZm9ybUZlZWQgPSAweDBDLCAgICAgICAgICAgICAgLy8gXFxmXHJcbiAgICBieXRlT3JkZXJNYXJrID0gMHhGRUZGLFxyXG4gICAgdGFiID0gMHgwOSwgICAgICAgICAgICAgICAgICAgLy8gXFx0XHJcbiAgICB2ZXJ0aWNhbFRhYiA9IDB4MEIsICAgICAgICAgICAvLyBcXHZcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBKU09OIHdpdGggSmF2YVNjcmlwdC1zdHlsZSBjb21tZW50cyBhbmQgcmVtb3ZlXHJcbiAqIHRoZW0uIE9wdGlvbmFsbHkgcmVwbGFjZXMgZXZlcnkgbm9uZS1uZXdsaW5lIGNoYXJhY3RlclxyXG4gKiBvZiBjb21tZW50cyB3aXRoIGEgcmVwbGFjZUNoYXJhY3RlclxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQ29tbWVudHModGV4dDogc3RyaW5nLCByZXBsYWNlQ2g/OiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cclxuICAgIGxldCBfc2Nhbm5lciA9IGNyZWF0ZVNjYW5uZXIodGV4dCksXHJcbiAgICAgICAgcGFydHM6IHN0cmluZ1tdID0gW10sXHJcbiAgICAgICAga2luZDogU3ludGF4S2luZCxcclxuICAgICAgICBvZmZzZXQgPSAwLFxyXG4gICAgICAgIHBvczogbnVtYmVyO1xyXG5cclxuICAgIGRvIHtcclxuICAgICAgICBwb3MgPSBfc2Nhbm5lci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICAgIGtpbmQgPSBfc2Nhbm5lci5zY2FuKCk7XHJcbiAgICAgICAgc3dpdGNoIChraW5kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5MaW5lQ29tbWVudFRyaXZpYTpcclxuICAgICAgICAgICAgY2FzZSBTeW50YXhLaW5kLkJsb2NrQ29tbWVudFRyaXZpYTpcclxuICAgICAgICAgICAgY2FzZSBTeW50YXhLaW5kLkVPRjpcclxuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgIT09IHBvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2godGV4dC5zdWJzdHJpbmcob2Zmc2V0LCBwb3MpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlQ2ggIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpLnJlcGxhY2UoL1teXFxyXFxuXS9nLCByZXBsYWNlQ2gpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG9mZnNldCA9IF9zY2FubmVyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9IHdoaWxlIChraW5kICE9PSBTeW50YXhLaW5kLkVPRik7XHJcblxyXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJycpO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlRXJyb3Ige1xyXG4gICAgZXJyb3I6IFBhcnNlRXJyb3JDb2RlO1xyXG59XHJcblxyXG5leHBvcnQgZW51bSBQYXJzZUVycm9yQ29kZSB7XHJcbiAgICBJbnZhbGlkU3ltYm9sLFxyXG4gICAgSW52YWxpZE51bWJlckZvcm1hdCxcclxuICAgIFByb3BlcnR5TmFtZUV4cGVjdGVkLFxyXG4gICAgVmFsdWVFeHBlY3RlZCxcclxuICAgIENvbG9uRXhwZWN0ZWQsXHJcbiAgICBDb21tYUV4cGVjdGVkLFxyXG4gICAgQ2xvc2VCcmFjZUV4cGVjdGVkLFxyXG4gICAgQ2xvc2VCcmFja2V0RXhwZWN0ZWQsXHJcbiAgICBFbmRPZkZpbGVFeHBlY3RlZFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyc2VFcnJvck1lc3NhZ2UoZXJyb3JDb2RlOiBQYXJzZUVycm9yQ29kZSk6IHN0cmluZyB7XHJcbiAgICBzd2l0Y2ggKGVycm9yQ29kZSkge1xyXG4gICAgICAgIGNhc2UgUGFyc2VFcnJvckNvZGUuSW52YWxpZFN5bWJvbDogcmV0dXJuICdJbnZhbGlkIHN5bWJvbCc7XHJcbiAgICAgICAgY2FzZSBQYXJzZUVycm9yQ29kZS5JbnZhbGlkTnVtYmVyRm9ybWF0OiByZXR1cm4gJ0ludmFsaWQgbnVtYmVyIGZvcm1hdCc7XHJcbiAgICAgICAgY2FzZSBQYXJzZUVycm9yQ29kZS5Qcm9wZXJ0eU5hbWVFeHBlY3RlZDogcmV0dXJuICdQcm9wZXJ0eSBuYW1lIGV4cGVjdGVkJztcclxuICAgICAgICBjYXNlIFBhcnNlRXJyb3JDb2RlLlZhbHVlRXhwZWN0ZWQ6IHJldHVybiAnVmFsdWUgZXhwZWN0ZWQnO1xyXG4gICAgICAgIGNhc2UgUGFyc2VFcnJvckNvZGUuQ29sb25FeHBlY3RlZDogcmV0dXJuICdDb2xvbiBleHBlY3RlZCc7XHJcbiAgICAgICAgY2FzZSBQYXJzZUVycm9yQ29kZS5Db21tYUV4cGVjdGVkOiByZXR1cm4gJ0NvbW1hIGV4cGVjdGVkJztcclxuICAgICAgICBjYXNlIFBhcnNlRXJyb3JDb2RlLkNsb3NlQnJhY2VFeHBlY3RlZDogcmV0dXJuICdDbG9zaW5nIGJyYWNlIGV4cGVjdGVkJztcclxuICAgICAgICBjYXNlIFBhcnNlRXJyb3JDb2RlLkNsb3NlQnJhY2tldEV4cGVjdGVkOiByZXR1cm4gJ0Nsb3NpbmcgYnJhY2tldCBleHBlY3RlZCc7XHJcbiAgICAgICAgY2FzZSBQYXJzZUVycm9yQ29kZS5FbmRPZkZpbGVFeHBlY3RlZDogcmV0dXJuICdFbmQgb2YgZmlsZSBleHBlY3RlZCc7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBOb2RlVHlwZSA9IFwib2JqZWN0XCIgfCBcImFycmF5XCIgfCBcInByb3BlcnR5XCIgfCBcInN0cmluZ1wiIHwgXCJudW1iZXJcIiB8IFwiYm9vbGVhblwiIHwgXCJudWxsXCI7XHJcblxyXG5mdW5jdGlvbiBnZXRMaXRlcmFsTm9kZVR5cGUodmFsdWU6IGFueSk6IE5vZGVUeXBlIHtcclxuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XHJcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6IHJldHVybiAnYm9vbGVhbic7XHJcbiAgICAgICAgY2FzZSAnbnVtYmVyJzogcmV0dXJuICdudW1iZXInO1xyXG4gICAgICAgIGNhc2UgJ3N0cmluZyc6IHJldHVybiAnc3RyaW5nJztcclxuICAgICAgICBkZWZhdWx0OiByZXR1cm4gJ251bGwnO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE5vZGUge1xyXG4gICAgdHlwZTogTm9kZVR5cGU7XHJcbiAgICB2YWx1ZT86IGFueTtcclxuICAgIG9mZnNldDogbnVtYmVyO1xyXG4gICAgbGVuZ3RoOiBudW1iZXI7XHJcbiAgICBjb2x1bW5PZmZzZXQ/OiBudW1iZXI7XHJcbiAgICBwYXJlbnQ/OiBOb2RlO1xyXG4gICAgY2hpbGRyZW4/OiBOb2RlW107XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFNlZ21lbnQgPSBzdHJpbmcgfCBudW1iZXI7XHJcbmV4cG9ydCB0eXBlIEpTT05QYXRoID0gU2VnbWVudFtdO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBMb2NhdGlvbiB7XHJcbiAgICAvKipcclxuICAgICAqIFRoZSBwcmV2aW91cyBwcm9wZXJ0eSBrZXkgb3IgbGl0ZXJhbCB2YWx1ZSAoc3RyaW5nLCBudW1iZXIsIGJvb2xlYW4gb3IgbnVsbCkgb3IgdW5kZWZpbmVkLlxyXG4gICAgICovXHJcbiAgICBwcmV2aW91c05vZGU/OiBOb2RlO1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcGF0aCBkZXNjcmliaW5nIHRoZSBsb2NhdGlvbiBpbiB0aGUgSlNPTiBkb2N1bWVudC4gVGhlIHBhdGggY29uc2lzdHMgb2YgYSBzZXF1ZW5jZSBzdHJpbmdzXHJcbiAgICAgKiByZXByZXNlbnRpbmcgYW4gb2JqZWN0IHByb3BlcnR5IG9yIG51bWJlcnMgZm9yIGFycmF5IGluZGljZXMuXHJcbiAgICAgKi9cclxuICAgIHBhdGg6IEpTT05QYXRoO1xyXG4gICAgLyoqXHJcbiAgICAgKiBNYXRjaGVzIHRoZSBsb2NhdGlvbnMgcGF0aCBhZ2FpbnN0IGEgcGF0dGVybiBjb25zaXN0aW5nIG9mIHN0cmluZ3MgKGZvciBwcm9wZXJ0aWVzKSBhbmQgbnVtYmVycyAoZm9yIGFycmF5IGluZGljZXMpLlxyXG4gICAgICogJyonIHdpbGwgbWF0Y2ggYSBzaW5nbGUgc2VnbWVudCwgb2YgYW55IHByb3BlcnR5IG5hbWUgb3IgaW5kZXguXHJcbiAgICAgKiAnKionIHdpbGwgbWF0Y2ggYSBzZXF1ZWNlIG9mIHNlZ21lbnRzIG9yIG5vIHNlZ21lbnQsIG9mIGFueSBwcm9wZXJ0eSBuYW1lIG9yIGluZGV4LlxyXG4gICAgICovXHJcbiAgICBtYXRjaGVzOiAocGF0dGVybnM6IEpTT05QYXRoKSA9PiBib29sZWFuO1xyXG4gICAgLyoqXHJcbiAgICAgKiBJZiBzZXQsIHRoZSBsb2NhdGlvbidzIG9mZnNldCBpcyBhdCBhIHByb3BlcnR5IGtleS5cclxuICAgICAqL1xyXG4gICAgaXNBdFByb3BlcnR5S2V5OiBib29sZWFuO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZvciBhIGdpdmVuIG9mZnNldCwgZXZhbHVhdGUgdGhlIGxvY2F0aW9uIGluIHRoZSBKU09OIGRvY3VtZW50LiBFYWNoIHNlZ21lbnQgaW4gdGhlIGxvY2F0aW9uIHBhdGggaXMgZWl0aGVyIGEgcHJvcGVydHkgbmFtZSBvciBhbiBhcnJheSBpbmRleC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhdGlvbih0ZXh0OiBzdHJpbmcsIHBvc2l0aW9uOiBudW1iZXIpOiBMb2NhdGlvbiB7XHJcbiAgICBsZXQgc2VnbWVudHM6IGFueVtdID0gW107IC8vIHN0cmluZ3Mgb3IgbnVtYmVyc1xyXG4gICAgbGV0IGVhcmx5UmV0dXJuRXhjZXB0aW9uID0gbmV3IE9iamVjdCgpO1xyXG4gICAgbGV0IHByZXZpb3VzTm9kZTogTm9kZSA9IHZvaWQgMDtcclxuICAgIGNvbnN0IHByZXZpb3VzTm9kZUluc3Q6IE5vZGUgPSB7XHJcbiAgICAgICAgdmFsdWU6IHZvaWQgMCxcclxuICAgICAgICBvZmZzZXQ6IHZvaWQgMCxcclxuICAgICAgICBsZW5ndGg6IHZvaWQgMCxcclxuICAgICAgICB0eXBlOiB2b2lkIDBcclxuICAgIH07XHJcbiAgICBsZXQgaXNBdFByb3BlcnR5S2V5ID0gZmFsc2U7XHJcbiAgICBmdW5jdGlvbiBzZXRQcmV2aW91c05vZGUodmFsdWU6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCB0eXBlOiBOb2RlVHlwZSkge1xyXG4gICAgICAgIHByZXZpb3VzTm9kZUluc3QudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICBwcmV2aW91c05vZGVJbnN0Lm9mZnNldCA9IG9mZnNldDtcclxuICAgICAgICBwcmV2aW91c05vZGVJbnN0Lmxlbmd0aCA9IGxlbmd0aDtcclxuICAgICAgICBwcmV2aW91c05vZGVJbnN0LnR5cGUgPSB0eXBlO1xyXG4gICAgICAgIHByZXZpb3VzTm9kZUluc3QuY29sdW1uT2Zmc2V0ID0gdm9pZCAwO1xyXG4gICAgICAgIHByZXZpb3VzTm9kZSA9IHByZXZpb3VzTm9kZUluc3Q7XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgICB2aXNpdCh0ZXh0LCB7XHJcbiAgICAgICAgICAgIG9uT2JqZWN0QmVnaW46IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSBvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlYXJseVJldHVybkV4Y2VwdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByZXZpb3VzTm9kZSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIGlzQXRQcm9wZXJ0eUtleSA9IHBvc2l0aW9uID4gb2Zmc2V0O1xyXG4gICAgICAgICAgICAgICAgc2VnbWVudHMucHVzaCgnJyk7IC8vIHB1c2ggYSBwbGFjZWhvbGRlciAod2lsbCBiZSByZXBsYWNlZCBvciByZW1vdmVkKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbk9iamVjdFByb3BlcnR5OiAobmFtZTogc3RyaW5nLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8IG9mZnNldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVhcmx5UmV0dXJuRXhjZXB0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2V0UHJldmlvdXNOb2RlKG5hbWUsIG9mZnNldCwgbGVuZ3RoLCAncHJvcGVydHknKTtcclxuICAgICAgICAgICAgICAgIHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSBvZmZzZXQgKyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlYXJseVJldHVybkV4Y2VwdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25PYmplY3RFbmQ6IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSBvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlYXJseVJldHVybkV4Y2VwdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByZXZpb3VzTm9kZSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnBvcCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkFycmF5QmVnaW46IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSBvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlYXJseVJldHVybkV4Y2VwdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByZXZpb3VzTm9kZSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goMCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uQXJyYXlFbmQ6IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSBvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlYXJseVJldHVybkV4Y2VwdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByZXZpb3VzTm9kZSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnBvcCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkxpdGVyYWxWYWx1ZTogKHZhbHVlOiBhbnksIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uIDwgb2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZWFybHlSZXR1cm5FeGNlcHRpb247XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZXRQcmV2aW91c05vZGUodmFsdWUsIG9mZnNldCwgbGVuZ3RoLCBnZXRMaXRlcmFsTm9kZVR5cGUodmFsdWUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPD0gb2Zmc2V0ICsgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZWFybHlSZXR1cm5FeGNlcHRpb247XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uU2VwYXJhdG9yOiAoc2VwOiBzdHJpbmcsIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uIDw9IG9mZnNldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVhcmx5UmV0dXJuRXhjZXB0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNlcCA9PT0gJzonICYmIHByZXZpb3VzTm9kZS50eXBlID09PSAncHJvcGVydHknKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNOb2RlLmNvbHVtbk9mZnNldCA9IG9mZnNldDtcclxuICAgICAgICAgICAgICAgICAgICBpc0F0UHJvcGVydHlLZXkgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c05vZGUgPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlcCA9PT0gJywnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxhc3QgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGxhc3QgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdID0gbGFzdCArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNBdFByb3BlcnR5S2V5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0gPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNOb2RlID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgaWYgKGUgIT09IGVhcmx5UmV0dXJuRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gJycpIHtcclxuICAgICAgICBzZWdtZW50cy5wb3AoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcGF0aDogc2VnbWVudHMsXHJcbiAgICAgICAgcHJldmlvdXNOb2RlLFxyXG4gICAgICAgIGlzQXRQcm9wZXJ0eUtleSxcclxuICAgICAgICBtYXRjaGVzOiAocGF0dGVybjogc3RyaW5nW10pID0+IHtcclxuICAgICAgICAgICAgbGV0IGsgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgayA8IHBhdHRlcm4ubGVuZ3RoICYmIGkgPCBzZWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhdHRlcm5ba10gPT09IHNlZ21lbnRzW2ldIHx8IHBhdHRlcm5ba10gPT09ICcqJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGsrKztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocGF0dGVybltrXSAhPT0gJyoqJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gayA9PT0gcGF0dGVybi5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQYXJzZU9wdGlvbnMge1xyXG4gICAgZGlzYWxsb3dDb21tZW50cz86IGJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQYXJzZXMgdGhlIGdpdmVuIHRleHQgYW5kIHJldHVybnMgdGhlIG9iamVjdCB0aGUgSlNPTiBjb250ZW50IHJlcHJlc2VudHMuIE9uIGludmFsaWQgaW5wdXQsIHRoZSBwYXJzZXIgdHJpZXMgdG8gYmUgYXMgZmF1bHQgdG9sZXJhbnQgYXMgcG9zc2libGUsIGJ1dCBzdGlsbCByZXR1cm4gYSByZXN1bHQuXHJcbiAqIFRoZXJlZm9yZSBhbHdheXMgY2hlY2sgdGhlIGVycm9ycyBsaXN0IHRvIGZpbmQgb3V0IGlmIHRoZSBpbnB1dCB3YXMgdmFsaWQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UodGV4dDogc3RyaW5nLCBlcnJvcnM6IFBhcnNlRXJyb3JbXSA9IFtdLCBvcHRpb25zPzogUGFyc2VPcHRpb25zKTogYW55IHtcclxuICAgIGxldCBjdXJyZW50UHJvcGVydHk6IHN0cmluZyA9IG51bGw7XHJcbiAgICBsZXQgY3VycmVudFBhcmVudDogYW55ID0gW107XHJcbiAgICBsZXQgcHJldmlvdXNQYXJlbnRzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgIGZ1bmN0aW9uIG9uVmFsdWUodmFsdWU6IGFueSkge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnRQYXJlbnQpKSB7XHJcbiAgICAgICAgICAgICg8YW55W10+Y3VycmVudFBhcmVudCkucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50UHJvcGVydHkpIHtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudFtjdXJyZW50UHJvcGVydHldID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB2aXNpdG9yOiBKU09OVmlzaXRvciA9IHtcclxuICAgICAgICBvbk9iamVjdEJlZ2luOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBvYmplY3QgPSB7fTtcclxuICAgICAgICAgICAgb25WYWx1ZShvYmplY3QpO1xyXG4gICAgICAgICAgICBwcmV2aW91c1BhcmVudHMucHVzaChjdXJyZW50UGFyZW50KTtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IG9iamVjdDtcclxuICAgICAgICAgICAgY3VycmVudFByb3BlcnR5ID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uT2JqZWN0UHJvcGVydHk6IChuYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgY3VycmVudFByb3BlcnR5ID0gbmFtZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uT2JqZWN0RW5kOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBwcmV2aW91c1BhcmVudHMucG9wKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkFycmF5QmVnaW46ICgpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFycmF5OiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBvblZhbHVlKGFycmF5KTtcclxuICAgICAgICAgICAgcHJldmlvdXNQYXJlbnRzLnB1c2goY3VycmVudFBhcmVudCk7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBhcnJheTtcclxuICAgICAgICAgICAgY3VycmVudFByb3BlcnR5ID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uQXJyYXlFbmQ6ICgpID0+IHtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IHByZXZpb3VzUGFyZW50cy5wb3AoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uTGl0ZXJhbFZhbHVlOiBvblZhbHVlLFxyXG4gICAgICAgIG9uRXJyb3I6IChlcnJvcjogUGFyc2VFcnJvckNvZGUpID0+IHtcclxuICAgICAgICAgICAgZXJyb3JzLnB1c2goeyBlcnJvcjogZXJyb3IgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHZpc2l0KHRleHQsIHZpc2l0b3IsIG9wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGN1cnJlbnRQYXJlbnRbMF07XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUGFyc2VzIHRoZSBnaXZlbiB0ZXh0IGFuZCByZXR1cm5zIGEgdHJlZSByZXByZXNlbnRhdGlvbiB0aGUgSlNPTiBjb250ZW50LiBPbiBpbnZhbGlkIGlucHV0LCB0aGUgcGFyc2VyIHRyaWVzIHRvIGJlIGFzIGZhdWx0IHRvbGVyYW50IGFzIHBvc3NpYmxlLCBidXQgc3RpbGwgcmV0dXJuIGEgcmVzdWx0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVHJlZSh0ZXh0OiBzdHJpbmcsIGVycm9yczogUGFyc2VFcnJvcltdID0gW10sIG9wdGlvbnM/OiBQYXJzZU9wdGlvbnMpOiBOb2RlIHtcclxuICAgIGxldCBjdXJyZW50UGFyZW50OiBOb2RlID0geyB0eXBlOiAnYXJyYXknLCBvZmZzZXQ6IC0xLCBsZW5ndGg6IC0xLCBjaGlsZHJlbjogW10gfTsgLy8gYXJ0aWZpY2lhbCByb290XHJcblxyXG4gICAgZnVuY3Rpb24gZW5zdXJlUHJvcGVydHlDb21wbGV0ZShlbmRPZmZzZXQ6IG51bWJlcikge1xyXG4gICAgICAgIGlmIChjdXJyZW50UGFyZW50LnR5cGUgPT09ICdwcm9wZXJ0eScpIHtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5sZW5ndGggPSBlbmRPZmZzZXQgLSBjdXJyZW50UGFyZW50Lm9mZnNldDtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblZhbHVlKHZhbHVlTm9kZTogTm9kZSk6IE5vZGUge1xyXG4gICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCh2YWx1ZU5vZGUpO1xyXG4gICAgICAgIGVuc3VyZVByb3BlcnR5Q29tcGxldGUodmFsdWVOb2RlLm9mZnNldCArIHZhbHVlTm9kZS5sZW5ndGgpO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZU5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHZpc2l0b3I6IEpTT05WaXNpdG9yID0ge1xyXG4gICAgICAgIG9uT2JqZWN0QmVnaW46IChvZmZzZXQ6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gb25WYWx1ZSh7IHR5cGU6ICdvYmplY3QnLCBvZmZzZXQsIGxlbmd0aDogLTEsIHBhcmVudDogY3VycmVudFBhcmVudCwgY2hpbGRyZW46IFtdIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25PYmplY3RQcm9wZXJ0eTogKG5hbWU6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBvblZhbHVlKHsgdHlwZTogJ3Byb3BlcnR5Jywgb2Zmc2V0LCBsZW5ndGg6IC0xLCBwYXJlbnQ6IGN1cnJlbnRQYXJlbnQsIGNoaWxkcmVuOiBbXSB9KTtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoKHsgdHlwZTogJ3N0cmluZycsIHZhbHVlOiBuYW1lLCBvZmZzZXQsIGxlbmd0aCwgcGFyZW50OiBjdXJyZW50UGFyZW50IH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25PYmplY3RFbmQ6IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgZW5zdXJlUHJvcGVydHlDb21wbGV0ZShvZmZzZXQpO1xyXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50Lmxlbmd0aCA9IG9mZnNldCArIGxlbmd0aCAtIGN1cnJlbnRQYXJlbnQub2Zmc2V0O1xyXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkFycmF5QmVnaW46IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IG9uVmFsdWUoeyB0eXBlOiAnYXJyYXknLCBvZmZzZXQsIGxlbmd0aDogLTEsIHBhcmVudDogY3VycmVudFBhcmVudCwgY2hpbGRyZW46IFtdIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25BcnJheUVuZDogKG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50Lmxlbmd0aCA9IG9mZnNldCArIGxlbmd0aCAtIGN1cnJlbnRQYXJlbnQub2Zmc2V0O1xyXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkxpdGVyYWxWYWx1ZTogKHZhbHVlOiBhbnksIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBvblZhbHVlKHsgdHlwZTogZ2V0TGl0ZXJhbE5vZGVUeXBlKHZhbHVlKSwgb2Zmc2V0LCBsZW5ndGgsIHBhcmVudDogY3VycmVudFBhcmVudCwgdmFsdWUgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvblNlcGFyYXRvcjogKHNlcDogc3RyaW5nLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRQYXJlbnQudHlwZSA9PT0gJ3Byb3BlcnR5Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlcCA9PT0gJzonKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhcmVudC5jb2x1bW5PZmZzZXQgPSBvZmZzZXQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlcCA9PT0gJywnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5zdXJlUHJvcGVydHlDb21wbGV0ZShvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbkVycm9yOiAoZXJyb3I6IFBhcnNlRXJyb3JDb2RlKSA9PiB7XHJcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKHsgZXJyb3I6IGVycm9yIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB2aXNpdCh0ZXh0LCB2aXNpdG9yLCBvcHRpb25zKTtcclxuXHJcbiAgICBsZXQgcmVzdWx0ID0gY3VycmVudFBhcmVudC5jaGlsZHJlblswXTtcclxuICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICBkZWxldGUgcmVzdWx0LnBhcmVudDtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kTm9kZUF0TG9jYXRpb24ocm9vdDogTm9kZSwgcGF0aDogSlNPTlBhdGgpOiBOb2RlIHtcclxuICAgIGlmICghcm9vdCkge1xyXG4gICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICB9XHJcbiAgICBsZXQgbm9kZSA9IHJvb3Q7XHJcbiAgICBmb3IgKGxldCBzZWdtZW50IG9mIHBhdGgpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHNlZ21lbnQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgIT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eU5vZGUgb2Ygbm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5Tm9kZS5jaGlsZHJlblswXS52YWx1ZSA9PT0gc2VnbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBwcm9wZXJ0eU5vZGUuY2hpbGRyZW5bMV07XHJcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSA8bnVtYmVyPnNlZ21lbnQ7XHJcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgIT09ICdhcnJheScgfHwgaW5kZXggPCAwIHx8IGluZGV4ID49IG5vZGUuY2hpbGRyZW4ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuW2luZGV4XTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm9kZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVWYWx1ZShub2RlOiBOb2RlKTogYW55IHtcclxuICAgIGlmIChub2RlLnR5cGUgPT09ICdhcnJheScpIHtcclxuICAgICAgICByZXR1cm4gbm9kZS5jaGlsZHJlbi5tYXAoZ2V0Tm9kZVZhbHVlKTtcclxuICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGxldCBvYmogPSB7fTtcclxuICAgICAgICBmb3IgKGxldCBwcm9wIG9mIG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgb2JqW3Byb3AuY2hpbGRyZW5bMF0udmFsdWVdID0gZ2V0Tm9kZVZhbHVlKHByb3AuY2hpbGRyZW5bMV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5vZGUudmFsdWU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUGFyc2VzIHRoZSBnaXZlbiB0ZXh0IGFuZCBpbnZva2VzIHRoZSB2aXNpdG9yIGZ1bmN0aW9ucyBmb3IgZWFjaCBvYmplY3QsIGFycmF5IGFuZCBsaXRlcmFsIHJlYWNoZWQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmlzaXQodGV4dDogc3RyaW5nLCB2aXNpdG9yOiBKU09OVmlzaXRvciwgb3B0aW9ucz86IFBhcnNlT3B0aW9ucyk6IGFueSB7XHJcblxyXG4gICAgbGV0IF9zY2FubmVyID0gY3JlYXRlU2Nhbm5lcih0ZXh0LCBmYWxzZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gdG9Ob0FyZ1Zpc2l0KHZpc2l0RnVuY3Rpb246IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcclxuICAgICAgICByZXR1cm4gdmlzaXRGdW5jdGlvbiA/ICgpID0+IHZpc2l0RnVuY3Rpb24oX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSwgX3NjYW5uZXIuZ2V0VG9rZW5MZW5ndGgoKSkgOiAoKSA9PiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdG9PbmVBcmdWaXNpdDxUPih2aXNpdEZ1bmN0aW9uOiAoYXJnOiBULCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHZvaWQpOiAoYXJnOiBUKSA9PiB2b2lkIHtcclxuICAgICAgICByZXR1cm4gdmlzaXRGdW5jdGlvbiA/IChhcmc6IFQpID0+IHZpc2l0RnVuY3Rpb24oYXJnLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpLCBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpKSA6ICgpID0+IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG9uT2JqZWN0QmVnaW4gPSB0b05vQXJnVmlzaXQodmlzaXRvci5vbk9iamVjdEJlZ2luKSxcclxuICAgICAgICBvbk9iamVjdFByb3BlcnR5ID0gdG9PbmVBcmdWaXNpdCh2aXNpdG9yLm9uT2JqZWN0UHJvcGVydHkpLFxyXG4gICAgICAgIG9uT2JqZWN0RW5kID0gdG9Ob0FyZ1Zpc2l0KHZpc2l0b3Iub25PYmplY3RFbmQpLFxyXG4gICAgICAgIG9uQXJyYXlCZWdpbiA9IHRvTm9BcmdWaXNpdCh2aXNpdG9yLm9uQXJyYXlCZWdpbiksXHJcbiAgICAgICAgb25BcnJheUVuZCA9IHRvTm9BcmdWaXNpdCh2aXNpdG9yLm9uQXJyYXlFbmQpLFxyXG4gICAgICAgIG9uTGl0ZXJhbFZhbHVlID0gdG9PbmVBcmdWaXNpdCh2aXNpdG9yLm9uTGl0ZXJhbFZhbHVlKSxcclxuICAgICAgICBvblNlcGFyYXRvciA9IHRvT25lQXJnVmlzaXQodmlzaXRvci5vblNlcGFyYXRvciksXHJcbiAgICAgICAgb25FcnJvciA9IHRvT25lQXJnVmlzaXQodmlzaXRvci5vbkVycm9yKTtcclxuXHJcbiAgICBsZXQgZGlzYWxsb3dDb21tZW50cyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5kaXNhbGxvd0NvbW1lbnRzO1xyXG4gICAgZnVuY3Rpb24gc2Nhbk5leHQoKTogU3ludGF4S2luZCB7XHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgbGV0IHRva2VuID0gX3NjYW5uZXIuc2NhbigpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFN5bnRheEtpbmQuTGluZUNvbW1lbnRUcml2aWE6XHJcbiAgICAgICAgICAgICAgICBjYXNlIFN5bnRheEtpbmQuQmxvY2tDb21tZW50VHJpdmlhOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXNhbGxvd0NvbW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLkludmFsaWRTeW1ib2wpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5Vbmtub3duOlxyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLkludmFsaWRTeW1ib2wpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBTeW50YXhLaW5kLlRyaXZpYTpcclxuICAgICAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5MaW5lQnJlYWtUcml2aWE6XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVFcnJvcihlcnJvcjogUGFyc2VFcnJvckNvZGUsIHNraXBVbnRpbEFmdGVyOiBTeW50YXhLaW5kW10gPSBbXSwgc2tpcFVudGlsOiBTeW50YXhLaW5kW10gPSBbXSk6IHZvaWQge1xyXG4gICAgICAgIG9uRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIGlmIChza2lwVW50aWxBZnRlci5sZW5ndGggKyBza2lwVW50aWwubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgdG9rZW4gPSBfc2Nhbm5lci5nZXRUb2tlbigpO1xyXG4gICAgICAgICAgICB3aGlsZSAodG9rZW4gIT09IFN5bnRheEtpbmQuRU9GKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2tpcFVudGlsQWZ0ZXIuaW5kZXhPZih0b2tlbikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Nhbk5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2tpcFVudGlsLmluZGV4T2YodG9rZW4pICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdG9rZW4gPSBzY2FuTmV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlU3RyaW5nKGlzVmFsdWU6IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gU3ludGF4S2luZC5TdHJpbmdMaXRlcmFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHZhbHVlID0gX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpO1xyXG4gICAgICAgIGlmIChpc1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIG9uTGl0ZXJhbFZhbHVlKHZhbHVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBvbk9iamVjdFByb3BlcnR5KHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2Nhbk5leHQoKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUxpdGVyYWwoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbigpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5OdW1lcmljTGl0ZXJhbDpcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IDA7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gSlNPTi5wYXJzZShfc2Nhbm5lci5nZXRUb2tlblZhbHVlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLkludmFsaWROdW1iZXJGb3JtYXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLkludmFsaWROdW1iZXJGb3JtYXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgb25MaXRlcmFsVmFsdWUodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5OdWxsS2V5d29yZDpcclxuICAgICAgICAgICAgICAgIG9uTGl0ZXJhbFZhbHVlKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5UcnVlS2V5d29yZDpcclxuICAgICAgICAgICAgICAgIG9uTGl0ZXJhbFZhbHVlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgU3ludGF4S2luZC5GYWxzZUtleXdvcmQ6XHJcbiAgICAgICAgICAgICAgICBvbkxpdGVyYWxWYWx1ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2Nhbk5leHQoKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVByb3BlcnR5KCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICghcGFyc2VTdHJpbmcoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLlByb3BlcnR5TmFtZUV4cGVjdGVkLCBbXSwgW1N5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuLCBTeW50YXhLaW5kLkNvbW1hVG9rZW5dKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSA9PT0gU3ludGF4S2luZC5Db2xvblRva2VuKSB7XHJcbiAgICAgICAgICAgIG9uU2VwYXJhdG9yKCc6Jyk7XHJcbiAgICAgICAgICAgIHNjYW5OZXh0KCk7IC8vIGNvbnN1bWUgY29sb25cclxuXHJcbiAgICAgICAgICAgIGlmICghcGFyc2VWYWx1ZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvcihQYXJzZUVycm9yQ29kZS5WYWx1ZUV4cGVjdGVkLCBbXSwgW1N5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuLCBTeW50YXhLaW5kLkNvbW1hVG9rZW5dKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLkNvbG9uRXhwZWN0ZWQsIFtdLCBbU3ludGF4S2luZC5DbG9zZUJyYWNlVG9rZW4sIFN5bnRheEtpbmQuQ29tbWFUb2tlbl0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZU9iamVjdCgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gU3ludGF4S2luZC5PcGVuQnJhY2VUb2tlbikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uT2JqZWN0QmVnaW4oKTtcclxuICAgICAgICBzY2FuTmV4dCgpOyAvLyBjb25zdW1lIG9wZW4gYnJhY2VcclxuXHJcbiAgICAgICAgbGV0IG5lZWRzQ29tbWEgPSBmYWxzZTtcclxuICAgICAgICB3aGlsZSAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gU3ludGF4S2luZC5DbG9zZUJyYWNlVG9rZW4gJiYgX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gU3ludGF4S2luZC5FT0YpIHtcclxuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IFN5bnRheEtpbmQuQ29tbWFUb2tlbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuZWVkc0NvbW1hKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlRXJyb3IoUGFyc2VFcnJvckNvZGUuVmFsdWVFeHBlY3RlZCwgW10sIFtdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG9uU2VwYXJhdG9yKCcsJyk7XHJcbiAgICAgICAgICAgICAgICBzY2FuTmV4dCgpOyAvLyBjb25zdW1lIGNvbW1hXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmVlZHNDb21tYSkge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3IoUGFyc2VFcnJvckNvZGUuQ29tbWFFeHBlY3RlZCwgW10sIFtdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXBhcnNlUHJvcGVydHkoKSkge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlRXJyb3IoUGFyc2VFcnJvckNvZGUuVmFsdWVFeHBlY3RlZCwgW10sIFtTeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbiwgU3ludGF4S2luZC5Db21tYVRva2VuXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmVlZHNDb21tYSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uT2JqZWN0RW5kKCk7XHJcbiAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IFN5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLkNsb3NlQnJhY2VFeHBlY3RlZCwgW1N5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuXSwgW10pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNjYW5OZXh0KCk7IC8vIGNvbnN1bWUgY2xvc2UgYnJhY2VcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VBcnJheSgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gU3ludGF4S2luZC5PcGVuQnJhY2tldFRva2VuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb25BcnJheUJlZ2luKCk7XHJcbiAgICAgICAgc2Nhbk5leHQoKTsgLy8gY29uc3VtZSBvcGVuIGJyYWNrZXRcclxuXHJcbiAgICAgICAgbGV0IG5lZWRzQ29tbWEgPSBmYWxzZTtcclxuICAgICAgICB3aGlsZSAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gU3ludGF4S2luZC5DbG9zZUJyYWNrZXRUb2tlbiAmJiBfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBTeW50YXhLaW5kLkVPRikge1xyXG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSA9PT0gU3ludGF4S2luZC5Db21tYVRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5lZWRzQ29tbWEpIHtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVFcnJvcihQYXJzZUVycm9yQ29kZS5WYWx1ZUV4cGVjdGVkLCBbXSwgW10pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgb25TZXBhcmF0b3IoJywnKTtcclxuICAgICAgICAgICAgICAgIHNjYW5OZXh0KCk7IC8vIGNvbnN1bWUgY29tbWFcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZWVkc0NvbW1hKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvcihQYXJzZUVycm9yQ29kZS5Db21tYUV4cGVjdGVkLCBbXSwgW10pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghcGFyc2VWYWx1ZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVFcnJvcihQYXJzZUVycm9yQ29kZS5WYWx1ZUV4cGVjdGVkLCBbXSwgW1N5bnRheEtpbmQuQ2xvc2VCcmFja2V0VG9rZW4sIFN5bnRheEtpbmQuQ29tbWFUb2tlbl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5lZWRzQ29tbWEgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvbkFycmF5RW5kKCk7XHJcbiAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IFN5bnRheEtpbmQuQ2xvc2VCcmFja2V0VG9rZW4pIHtcclxuICAgICAgICAgICAgaGFuZGxlRXJyb3IoUGFyc2VFcnJvckNvZGUuQ2xvc2VCcmFja2V0RXhwZWN0ZWQsIFtTeW50YXhLaW5kLkNsb3NlQnJhY2tldFRva2VuXSwgW10pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNjYW5OZXh0KCk7IC8vIGNvbnN1bWUgY2xvc2UgYnJhY2tldFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVZhbHVlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBwYXJzZUFycmF5KCkgfHwgcGFyc2VPYmplY3QoKSB8fCBwYXJzZVN0cmluZyh0cnVlKSB8fCBwYXJzZUxpdGVyYWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBzY2FuTmV4dCgpO1xyXG4gICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IFN5bnRheEtpbmQuRU9GKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoIXBhcnNlVmFsdWUoKSkge1xyXG4gICAgICAgIGhhbmRsZUVycm9yKFBhcnNlRXJyb3JDb2RlLlZhbHVlRXhwZWN0ZWQsIFtdLCBbXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IFN5bnRheEtpbmQuRU9GKSB7XHJcbiAgICAgICAgaGFuZGxlRXJyb3IoUGFyc2VFcnJvckNvZGUuRW5kT2ZGaWxlRXhwZWN0ZWQsIFtdLCBbXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBKU09OVmlzaXRvciB7XHJcbiAgICAvKipcclxuICAgICAqIEludm9rZWQgd2hlbiBhbiBvcGVuIGJyYWNlIGlzIGVuY291bnRlcmVkIGFuZCBhbiBvYmplY3QgaXMgc3RhcnRlZC4gVGhlIG9mZnNldCBhbmQgbGVuZ3RoIHJlcHJlc2VudCB0aGUgbG9jYXRpb24gb2YgdGhlIG9wZW4gYnJhY2UuXHJcbiAgICAgKi9cclxuICAgIG9uT2JqZWN0QmVnaW4/OiAob2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSA9PiB2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW52b2tlZCB3aGVuIGEgcHJvcGVydHkgaXMgZW5jb3VudGVyZWQuIFRoZSBvZmZzZXQgYW5kIGxlbmd0aCByZXByZXNlbnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBwcm9wZXJ0eSBuYW1lLlxyXG4gICAgICovXHJcbiAgICBvbk9iamVjdFByb3BlcnR5PzogKHByb3BlcnR5OiBzdHJpbmcsIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4gdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludm9rZWQgd2hlbiBhIGNsb3NpbmcgYnJhY2UgaXMgZW5jb3VudGVyZWQgYW5kIGFuIG9iamVjdCBpcyBjb21wbGV0ZWQuIFRoZSBvZmZzZXQgYW5kIGxlbmd0aCByZXByZXNlbnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBjbG9zaW5nIGJyYWNlLlxyXG4gICAgICovXHJcbiAgICBvbk9iamVjdEVuZD86IChvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnZva2VkIHdoZW4gYW4gb3BlbiBicmFja2V0IGlzIGVuY291bnRlcmVkLiBUaGUgb2Zmc2V0IGFuZCBsZW5ndGggcmVwcmVzZW50IHRoZSBsb2NhdGlvbiBvZiB0aGUgb3BlbiBicmFja2V0LlxyXG4gICAgICovXHJcbiAgICBvbkFycmF5QmVnaW4/OiAob2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSA9PiB2b2lkO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW52b2tlZCB3aGVuIGEgY2xvc2luZyBicmFja2V0IGlzIGVuY291bnRlcmVkLiBUaGUgb2Zmc2V0IGFuZCBsZW5ndGggcmVwcmVzZW50IHRoZSBsb2NhdGlvbiBvZiB0aGUgY2xvc2luZyBicmFja2V0LlxyXG4gICAgICovXHJcbiAgICBvbkFycmF5RW5kPzogKG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4gdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludm9rZWQgd2hlbiBhIGxpdGVyYWwgdmFsdWUgaXMgZW5jb3VudGVyZWQuIFRoZSBvZmZzZXQgYW5kIGxlbmd0aCByZXByZXNlbnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBsaXRlcmFsIHZhbHVlLlxyXG4gICAgICovXHJcbiAgICBvbkxpdGVyYWxWYWx1ZT86ICh2YWx1ZTogYW55LCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnZva2VkIHdoZW4gYSBjb21tYSBvciBjb2xvbiBzZXBhcmF0b3IgaXMgZW5jb3VudGVyZWQuIFRoZSBvZmZzZXQgYW5kIGxlbmd0aCByZXByZXNlbnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBzZXBhcmF0b3IuXHJcbiAgICAgKi9cclxuICAgIG9uU2VwYXJhdG9yPzogKGNoYXJjdGVyOiBzdHJpbmcsIG9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcikgPT4gdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludm9rZWQgb24gYW4gZXJyb3IuXHJcbiAgICAgKi9cclxuICAgIG9uRXJyb3I/OiAoZXJyb3I6IFBhcnNlRXJyb3JDb2RlLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpID0+IHZvaWQ7XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
