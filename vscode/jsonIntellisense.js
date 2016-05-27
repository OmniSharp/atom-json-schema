'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONIntellisense = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsonParser = require('./parser/jsonParser');

var _jsonParser2 = _interopRequireDefault(_jsonParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSONIntellisense = exports.JSONIntellisense = function () {
    function JSONIntellisense(schemaService, contributions) {
        _classCallCheck(this, JSONIntellisense);

        this.schemaService = schemaService;
        this.contributions = contributions;
    }

    _createClass(JSONIntellisense, [{
        key: 'doSuggest',
        value: function doSuggest(resource, modelMirror, position) {
            var _this = this;

            var currentWord = modelMirror.getWordUntilPosition(position).word;
            var parser = new _jsonParser2.default.JSONParser();
            var config = new _jsonParser2.default.JSONDocumentConfig();
            config.ignoreDanglingComma = true;
            var doc = parser.parse(modelMirror.getValue(), config);
            var result = {
                currentWord: currentWord,
                incomplete: false,
                suggestions: []
            };
            var overwriteBefore = void 0;
            var overwriteAfter = void 0;
            var proposed = {};
            var collector = {
                add: function add(suggestion) {
                    if (!proposed[suggestion.label]) {
                        proposed[suggestion.label] = true;
                        suggestion.overwriteBefore = overwriteBefore;
                        suggestion.overwriteAfter = overwriteAfter;
                        result.suggestions.push(suggestion);
                    }
                },
                setAsIncomplete: function setAsIncomplete() {
                    result.incomplete = true;
                },
                error: function error(message) {
                    throw new Error(message);
                }
            };
            return this.schemaService.getSchemaForResource(resource.toString(), doc).then(function (schema) {
                var collectionPromises = [];
                var offset = modelMirror.getOffsetFromPosition(position);
                var node = doc.getNodeFromOffsetEndInclusive(offset);
                var addValue = true;
                var currentKey = currentWord;
                var currentProperty = null;
                if (node) {
                    if (node.type === 'string') {
                        var stringNode = node;
                        if (stringNode.isKey) {
                            var nodeRange = modelMirror.getRangeFromOffsetAndLength(node.start, node.end - node.start);
                            overwriteBefore = position.column - nodeRange.startColumn;
                            overwriteAfter = nodeRange.endColumn - position.column;
                            addValue = !(node.parent && node.parent.value);
                            currentProperty = node.parent ? node.parent : null;
                            currentKey = modelMirror.getValueInRange({ startColumn: nodeRange.startColumn + 1, startLineNumber: nodeRange.startLineNumber, endColumn: position.column, endLineNumber: position.lineNumber });
                            if (node.parent) {
                                node = node.parent.parent;
                            }
                        }
                    }
                }
                if (node && node.type === 'object') {
                    if (node.start === offset) {
                        return result;
                    }
                    var properties = node.properties;
                    properties.forEach(function (p) {
                        if (!currentProperty || currentProperty !== p) {
                            proposed[p.key.value] = true;
                        }
                    });
                    if (schema) {
                        var isLast = properties.length === 0 || offset >= properties[properties.length - 1].start;
                        _this.getPropertySuggestions(resource, schema, doc, node, currentKey, addValue, isLast, collector);
                    } else if (node.parent) {
                        _this.getSchemaLessPropertySuggestions(doc, node, collector);
                    }
                    var location = node.getNodeLocation();
                    _this.contributions.forEach(function (contribution) {
                        var collectPromise = contribution.collectPropertySuggestions(resource, location, currentWord, addValue, isLast, collector);
                        if (collectPromise) {
                            collectionPromises.push(collectPromise);
                        }
                    });
                }
                if (node && (node.type === 'string' || node.type === 'number' || node.type === 'integer' || node.type === 'boolean' || node.type === 'null')) {
                    var nodeRange = modelMirror.getRangeFromOffsetAndLength(node.start, node.end - node.start);
                    overwriteBefore = position.column - nodeRange.startColumn;
                    overwriteAfter = nodeRange.endColumn - position.column;
                    node = node.parent;
                }
                if (schema) {
                    _this.getValueSuggestions(resource, schema, doc, node, offset, collector);
                } else {
                    _this.getSchemaLessValueSuggestions(doc, node, offset, modelMirror, collector);
                }
                if (!node) {
                    _this.contributions.forEach(function (contribution) {
                        var collectPromise = contribution.collectDefaultSuggestions(resource, collector);
                        if (collectPromise) {
                            collectionPromises.push(collectPromise);
                        }
                    });
                } else {
                    if (node.type === 'property' && offset > node.colonOffset) {
                        var parentKey = node.key.value;
                        var valueNode = node.value;
                        if (!valueNode || offset <= valueNode.end) {
                            var location = node.parent.getNodeLocation();
                            _this.contributions.forEach(function (contribution) {
                                var collectPromise = contribution.collectValueSuggestions(resource, location, parentKey, collector);
                                if (collectPromise) {
                                    collectionPromises.push(collectPromise);
                                }
                            });
                        }
                    }
                }
                return Promise.all(collectionPromises).then(function () {
                    return result;
                });
            });
        }
    }, {
        key: 'getPropertySuggestions',
        value: function getPropertySuggestions(resource, schema, doc, node, currentWord, addValue, isLast, collector) {
            var _this2 = this;

            var matchingSchemas = [];
            doc.validate(schema.schema, matchingSchemas, node.start);
            matchingSchemas.forEach(function (s) {
                if (s.node === node && !s.inverted) {
                    var schemaProperties = s.schema.properties;
                    if (schemaProperties) {
                        Object.keys(schemaProperties).forEach(function (key) {
                            var propertySchema = schemaProperties[key];
                            collector.add({ type: 'property', label: key, codeSnippet: _this2.getTextForProperty(key, propertySchema, addValue, isLast), documentationLabel: propertySchema.description || '' });
                        });
                    }
                }
            });
        }
    }, {
        key: 'getSchemaLessPropertySuggestions',
        value: function getSchemaLessPropertySuggestions(doc, node, collector) {
            var _this3 = this;

            var collectSuggestionsForSimilarObject = function collectSuggestionsForSimilarObject(obj) {
                obj.properties.forEach(function (p) {
                    var key = p.key.value;
                    collector.add({ type: 'property', label: key, codeSnippet: _this3.getTextForSimilarProperty(key, p.value), documentationLabel: '' });
                });
            };
            if (node.parent.type === 'property') {
                var parentKey = node.parent.key.value;
                doc.visit(function (n) {
                    if (n.type === 'property' && n.key.value === parentKey && n.value && n.value.type === 'object') {
                        collectSuggestionsForSimilarObject(n.value);
                    }
                    return true;
                });
            } else if (node.parent.type === 'array') {
                node.parent.items.forEach(function (n) {
                    if (n.type === 'object' && n !== node) {
                        collectSuggestionsForSimilarObject(n);
                    }
                });
            }
        }
    }, {
        key: 'getSchemaLessValueSuggestions',
        value: function getSchemaLessValueSuggestions(doc, node, offset, modelMirror, collector) {
            var _this4 = this;

            var collectSuggestionsForValues = function collectSuggestionsForValues(value) {
                var content = _this4.getTextForMatchingNode(value, modelMirror);
                collector.add({ type: _this4.getSuggestionType(value.type), label: content, codeSnippet: content, documentationLabel: '' });
                if (value.type === 'boolean') {
                    _this4.addBooleanSuggestion(!value.getValue(), collector);
                }
            };
            if (!node) {
                collector.add({ type: this.getSuggestionType('object'), label: 'Empty object', codeSnippet: '{\n\t{{}}\n}', documentationLabel: '' });
                collector.add({ type: this.getSuggestionType('array'), label: 'Empty array', codeSnippet: '[\n\t{{}}\n]', documentationLabel: '' });
            } else {
                if (node.type === 'property' && offset > node.colonOffset) {
                    var valueNode = node.value;
                    if (valueNode && offset > valueNode.end) {
                        return;
                    }
                    var parentKey = node.key.value;
                    doc.visit(function (n) {
                        if (n.type === 'property' && n.key.value === parentKey && n.value) {
                            collectSuggestionsForValues(n.value);
                        }
                        return true;
                    });
                }
                if (node.type === 'array') {
                    if (node.parent && node.parent.type === 'property') {
                        var parentKey = node.parent.key.value;
                        doc.visit(function (n) {
                            if (n.type === 'property' && n.key.value === parentKey && n.value && n.value.type === 'array') {
                                n.value.items.forEach(function (n) {
                                    collectSuggestionsForValues(n);
                                });
                            }
                            return true;
                        });
                    } else {
                        node.items.forEach(function (n) {
                            collectSuggestionsForValues(n);
                        });
                    }
                }
            }
        }
    }, {
        key: 'getValueSuggestions',
        value: function getValueSuggestions(resource, schema, doc, node, offset, collector) {
            var _this5 = this;

            if (!node) {
                this.addDefaultSuggestion(schema.schema, collector);
            } else {
                var parentKey = null;
                if (node && node.type === 'property' && offset > node.colonOffset) {
                    var valueNode = node.value;
                    if (valueNode && offset > valueNode.end) {
                        return;
                    }
                    parentKey = node.key.value;
                    node = node.parent;
                }
                if (node && (parentKey !== null || node.type === 'array')) {
                    var matchingSchemas = [];
                    doc.validate(schema.schema, matchingSchemas, node.start);
                    matchingSchemas.forEach(function (s) {
                        if (s.node === node && !s.inverted && s.schema) {
                            if (s.schema.items) {
                                _this5.addDefaultSuggestion(s.schema.items, collector);
                                _this5.addEnumSuggestion(s.schema.items, collector);
                            }
                            if (s.schema.properties) {
                                var propertySchema = s.schema.properties[parentKey];
                                if (propertySchema) {
                                    _this5.addDefaultSuggestion(propertySchema, collector);
                                    _this5.addEnumSuggestion(propertySchema, collector);
                                }
                            }
                        }
                    });
                }
            }
        }
    }, {
        key: 'addBooleanSuggestion',
        value: function addBooleanSuggestion(value, collector) {
            collector.add({ type: this.getSuggestionType('boolean'), label: value ? 'true' : 'false', codeSnippet: this.getTextForEnumValue(value), documentationLabel: '' });
        }
    }, {
        key: 'addEnumSuggestion',
        value: function addEnumSuggestion(schema, collector) {
            var _this6 = this;

            if (Array.isArray(schema.enum)) {
                schema.enum.forEach(function (enm) {
                    return collector.add({ type: _this6.getSuggestionType(schema.type), label: _this6.getLabelForValue(enm), codeSnippet: _this6.getTextForEnumValue(enm), documentationLabel: '' });
                });
            } else if (schema.type === 'boolean') {
                this.addBooleanSuggestion(true, collector);
                this.addBooleanSuggestion(false, collector);
            }
            if (Array.isArray(schema.allOf)) {
                schema.allOf.forEach(function (s) {
                    return _this6.addEnumSuggestion(s, collector);
                });
            }
            if (Array.isArray(schema.anyOf)) {
                schema.anyOf.forEach(function (s) {
                    return _this6.addEnumSuggestion(s, collector);
                });
            }
            if (Array.isArray(schema.oneOf)) {
                schema.oneOf.forEach(function (s) {
                    return _this6.addEnumSuggestion(s, collector);
                });
            }
        }
    }, {
        key: 'addDefaultSuggestion',
        value: function addDefaultSuggestion(schema, collector) {
            var _this7 = this;

            if (schema.default) {
                collector.add({
                    type: this.getSuggestionType(schema.type),
                    label: this.getLabelForValue(schema.default),
                    codeSnippet: this.getTextForValue(schema.default),
                    typeLabel: 'Default value'
                });
            }
            if (Array.isArray(schema.defaultSnippets)) {
                schema.defaultSnippets.forEach(function (s) {
                    collector.add({
                        type: 'snippet',
                        label: _this7.getLabelForSnippetValue(s.body),
                        codeSnippet: _this7.getTextForSnippetValue(s.body)
                    });
                });
            }
            if (Array.isArray(schema.allOf)) {
                schema.allOf.forEach(function (s) {
                    return _this7.addDefaultSuggestion(s, collector);
                });
            }
            if (Array.isArray(schema.anyOf)) {
                schema.anyOf.forEach(function (s) {
                    return _this7.addDefaultSuggestion(s, collector);
                });
            }
            if (Array.isArray(schema.oneOf)) {
                schema.oneOf.forEach(function (s) {
                    return _this7.addDefaultSuggestion(s, collector);
                });
            }
        }
    }, {
        key: 'getLabelForValue',
        value: function getLabelForValue(value) {
            var label = JSON.stringify(value);
            label = label.replace('{{', '').replace('}}', '');
            if (label.length > 57) {
                return label.substr(0, 57).trim() + '...';
            }
            return label;
        }
    }, {
        key: 'getLabelForSnippetValue',
        value: function getLabelForSnippetValue(value) {
            var label = JSON.stringify(value);
            label = label.replace(/\{\{|\}\}/g, '');
            if (label.length > 57) {
                return label.substr(0, 57).trim() + '...';
            }
            return label;
        }
    }, {
        key: 'getTextForValue',
        value: function getTextForValue(value) {
            var text = JSON.stringify(value, null, '\t');
            text = text.replace(/[\\\{\}]/g, '\\$&');
            return text;
        }
    }, {
        key: 'getTextForSnippetValue',
        value: function getTextForSnippetValue(value) {
            return JSON.stringify(value, null, '\t');
        }
    }, {
        key: 'getTextForEnumValue',
        value: function getTextForEnumValue(value) {
            var snippet = JSON.stringify(value, null, '\t');
            switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
                case 'object':
                    if (value === null) {
                        return '{{null}}';
                    }
                    return snippet;
                case 'string':
                    return '"{{' + snippet.substr(1, snippet.length - 2) + '}}"';
                case 'number':
                case 'integer':
                case 'boolean':
                    return '{{' + snippet + '}}';
            }
            return snippet;
        }
    }, {
        key: 'getSuggestionType',
        value: function getSuggestionType(type) {
            if (Array.isArray(type)) {
                var array = type;
                type = array.length > 0 ? array[0] : null;
            }
            if (!type) {
                return 'text';
            }
            switch (type) {
                case 'string':
                    return 'text';
                case 'object':
                    return 'module';
                case 'property':
                    return 'property';
                default:
                    return 'value';
            }
        }
    }, {
        key: 'getTextForMatchingNode',
        value: function getTextForMatchingNode(node, modelMirror) {
            switch (node.type) {
                case 'array':
                    return '[]';
                case 'object':
                    return '{}';
                default:
                    var content = modelMirror.getValueInRange(modelMirror.getRangeFromOffsetAndLength(node.start, node.end - node.start));
                    return content;
            }
        }
    }, {
        key: 'getTextForProperty',
        value: function getTextForProperty(key, propertySchema, addValue, isLast) {
            var result = this.getTextForValue(key);
            if (!addValue) {
                return result;
            }
            result += ': ';
            var defaultVal = propertySchema.default;
            if (!_lodash2.default.isUndefined(defaultVal)) {
                result = result + this.getTextForEnumValue(defaultVal);
            } else if (propertySchema.enum && propertySchema.enum.length > 0) {
                result = result + this.getTextForEnumValue(propertySchema.enum[0]);
            } else {
                switch (propertySchema.type) {
                    case 'boolean':
                        result += '{{false}}';
                        break;
                    case 'string':
                        result += '"{{}}"';
                        break;
                    case 'object':
                        result += '{\n\t{{}}\n}';
                        break;
                    case 'array':
                        result += '[\n\t{{}}\n]';
                        break;
                    case 'number':
                    case 'integer':
                        result += '{{0}}';
                        break;
                    case 'null':
                        result += '{{null}}';
                        break;
                    default:
                        return result;
                }
            }
            if (!isLast) {
                result += ',';
            }
            return result;
        }
    }, {
        key: 'getTextForSimilarProperty',
        value: function getTextForSimilarProperty(key, templateValue) {
            return this.getTextForValue(key);
        }
    }]);

    return JSONIntellisense;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9qc29uSW50ZWxsaXNlbnNlLnRzIiwidnNjb2RlL2pzb25JbnRlbGxpc2Vuc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUE7Ozs7Ozs7Ozs7O0FDSEE7Ozs7QUFDQTs7Ozs7Ozs7SURXQSxnQixXQUFBLGdCO0FBS0MsOEJBQVksYUFBWixFQUE2RCxhQUE3RCxFQUFnSDtBQUFBOztBQUMvRyxhQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFDQSxhQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFDQTs7OztrQ0FFZ0IsUSxFQUFlLFcsRUFBd0MsUSxFQUFnQztBQUFBOztBQUN2RyxnQkFBSSxjQUFjLFlBQVksb0JBQVosQ0FBaUMsUUFBakMsRUFBMkMsSUFBN0Q7QUFFQSxnQkFBSSxTQUFTLElBQUkscUJBQU8sVUFBWCxFQUFiO0FBQ0EsZ0JBQUksU0FBUyxJQUFJLHFCQUFPLGtCQUFYLEVBQWI7QUFFQSxtQkFBTyxtQkFBUCxHQUE2QixJQUE3QjtBQUVBLGdCQUFJLE1BQU0sT0FBTyxLQUFQLENBQWEsWUFBWSxRQUFaLEVBQWIsRUFBcUMsTUFBckMsQ0FBVjtBQUVBLGdCQUFJLFNBQXFCO0FBQ3hCLDZCQUFhLFdBRFc7QUFFeEIsNEJBQVksS0FGWTtBQUd4Qiw2QkFBYTtBQUhXLGFBQXpCO0FBS0EsZ0JBQUksa0JBQWtCLEtBQUssQ0FBM0I7QUFDQSxnQkFBSSxpQkFBaUIsS0FBSyxDQUExQjtBQUVBLGdCQUFJLFdBQXVDLEVBQTNDO0FBQ0EsZ0JBQUksWUFBK0M7QUFDbEQscUJBQUssYUFBQyxVQUFELEVBQThCO0FBQ2xDLHdCQUFJLENBQUMsU0FBUyxXQUFXLEtBQXBCLENBQUwsRUFBaUM7QUFDaEMsaUNBQVMsV0FBVyxLQUFwQixJQUE2QixJQUE3QjtBQUVBLG1DQUFXLGVBQVgsR0FBNkIsZUFBN0I7QUFDQSxtQ0FBVyxjQUFYLEdBQTRCLGNBQTVCO0FBQ0EsK0JBQU8sV0FBUCxDQUFtQixJQUFuQixDQUF3QixVQUF4QjtBQUNBO0FBQ0Qs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QyxrQ0FBVSxjQUFWO0FBQ0E7QUFDRCx5QkFBSyxRQUFMO0FBQ0EseUJBQUssU0FBTDtBQUNDLGtDQUFVLE9BQVY7QUFDQTtBQUNELHlCQUFLLE1BQUw7QUFDQyxrQ0FBVSxVQUFWO0FBQ0E7QUFDRDtBQUNDLCtCQUFPLE1BQVA7QUFyQkY7QUF1QkE7QUFDRCxnQkFBSSxDQUFDLE1BQUwsRUFBYTtBQUNaLDBCQUFVLEdBQVY7QUFDQTtBQUNELG1CQUFPLE1BQVA7QUFDQTs7O2tEQUVpQyxHLEVBQWEsYSxFQUE2QjtBQUMzRSxtQkFBTyxLQUFLLGVBQUwsQ0FBcUIsR0FBckIsQ0FBUDtBQUNBIiwiZmlsZSI6InZzY29kZS9qc29uSW50ZWxsaXNlbnNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBVUkkgZnJvbSAnLi9jb21tb24vdXJpJztcclxuaW1wb3J0IFBhcnNlciBmcm9tICcuL3BhcnNlci9qc29uUGFyc2VyJztcclxuaW1wb3J0IFNjaGVtYVNlcnZpY2UgZnJvbSAnLi9qc29uU2NoZW1hU2VydmljZSc7XHJcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCBKc29uV29ya2VyIGZyb20gJy4vanNvbldvcmtlcic7XHJcbmltcG9ydCBKc29uU2NoZW1hIGZyb20gJy4vY29tbW9uL2pzb25TY2hlbWEnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEpTT05JbnRlbGxpc2Vuc2Uge1xyXG5cclxuXHRwcml2YXRlIHNjaGVtYVNlcnZpY2U6IFNjaGVtYVNlcnZpY2UuSUpTT05TY2hlbWFTZXJ2aWNlO1xyXG5cdHByaXZhdGUgY29udHJpYnV0aW9uczogSnNvbldvcmtlci5JSlNPTldvcmtlckNvbnRyaWJ1dGlvbltdO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihzY2hlbWFTZXJ2aWNlOiBTY2hlbWFTZXJ2aWNlLklKU09OU2NoZW1hU2VydmljZSwgY29udHJpYnV0aW9uczogSnNvbldvcmtlci5JSlNPTldvcmtlckNvbnRyaWJ1dGlvbltdKSB7XHJcblx0XHR0aGlzLnNjaGVtYVNlcnZpY2UgPSBzY2hlbWFTZXJ2aWNlO1xyXG5cdFx0dGhpcy5jb250cmlidXRpb25zID0gY29udHJpYnV0aW9ucztcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBkb1N1Z2dlc3QocmVzb3VyY2U6IFVSSSwgbW9kZWxNaXJyb3I6IEVkaXRvckNvbW1vbi5JTWlycm9yTW9kZWwsIHBvc2l0aW9uOiBFZGl0b3JDb21tb24uSVBvc2l0aW9uKTogUHJvbWlzZTxTdWdnZXN0aW9uPiB7XHJcblx0XHR2YXIgY3VycmVudFdvcmQgPSBtb2RlbE1pcnJvci5nZXRXb3JkVW50aWxQb3NpdGlvbihwb3NpdGlvbikud29yZDtcclxuXHJcblx0XHR2YXIgcGFyc2VyID0gbmV3IFBhcnNlci5KU09OUGFyc2VyKCk7XHJcblx0XHR2YXIgY29uZmlnID0gbmV3IFBhcnNlci5KU09ORG9jdW1lbnRDb25maWcoKTtcclxuXHRcdC8vIHNvIHlvdSBjYW4gaW52b2tlIHN1Z2dlc3QgYWZ0ZXIgdGhlIGNvbW1hIGluIGFuIG9iamVjdCBsaXRlcmFsXHJcblx0XHRjb25maWcuaWdub3JlRGFuZ2xpbmdDb21tYSA9IHRydWU7XHJcblxyXG5cdFx0dmFyIGRvYyA9IHBhcnNlci5wYXJzZShtb2RlbE1pcnJvci5nZXRWYWx1ZSgpLCBjb25maWcpO1xyXG5cclxuXHRcdHZhciByZXN1bHQ6IFN1Z2dlc3Rpb24gPSB7XHJcblx0XHRcdGN1cnJlbnRXb3JkOiBjdXJyZW50V29yZCxcclxuXHRcdFx0aW5jb21wbGV0ZTogZmFsc2UsXHJcblx0XHRcdHN1Z2dlc3Rpb25zOiBbXVxyXG5cdFx0fTtcclxuXHRcdHZhciBvdmVyd3JpdGVCZWZvcmUgPSB2b2lkIDA7XHJcblx0XHR2YXIgb3ZlcndyaXRlQWZ0ZXIgPSB2b2lkIDA7XHJcblxyXG5cdFx0dmFyIHByb3Bvc2VkOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9O1xyXG5cdFx0dmFyIGNvbGxlY3RvciA6IEpzb25Xb3JrZXIuSVN1Z2dlc3Rpb25zQ29sbGVjdG9yID0ge1xyXG5cdFx0XHRhZGQ6IChzdWdnZXN0aW9uOiBNb2Rlcy5JU3VnZ2VzdGlvbikgPT4ge1xyXG5cdFx0XHRcdGlmICghcHJvcG9zZWRbc3VnZ2VzdGlvbi5sYWJlbF0pIHtcclxuXHRcdFx0XHRcdHByb3Bvc2VkW3N1Z2dlc3Rpb24ubGFiZWxdID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHRzdWdnZXN0aW9uLm92ZXJ3cml0ZUJlZm9yZSA9IG92ZXJ3cml0ZUJlZm9yZTtcclxuXHRcdFx0XHRcdHN1Z2dlc3Rpb24ub3ZlcndyaXRlQWZ0ZXIgPSBvdmVyd3JpdGVBZnRlcjtcclxuXHRcdFx0XHRcdHJlc3VsdC5zdWdnZXN0aW9ucy5wdXNoKHN1Z2dlc3Rpb24pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0c2V0QXNJbmNvbXBsZXRlOiAoKSA9PiB7XHJcblx0XHRcdFx0cmVzdWx0LmluY29tcGxldGUgPSB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRlcnJvcjogKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcy5zY2hlbWFTZXJ2aWNlLmdldFNjaGVtYUZvclJlc291cmNlKHJlc291cmNlLnRvU3RyaW5nKCksIGRvYykudGhlbigoc2NoZW1hKSA9PiB7XHJcblx0XHRcdHZhciBjb2xsZWN0aW9uUHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XHJcblxyXG5cdFx0XHR2YXIgb2Zmc2V0ID0gbW9kZWxNaXJyb3IuZ2V0T2Zmc2V0RnJvbVBvc2l0aW9uKHBvc2l0aW9uKTtcclxuXHRcdFx0dmFyIG5vZGUgPSBkb2MuZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0KTtcclxuXHRcdFx0dmFyIGFkZFZhbHVlID0gdHJ1ZTtcclxuXHRcdFx0dmFyIGN1cnJlbnRLZXkgPSBjdXJyZW50V29yZDtcclxuXHRcdFx0dmFyIGN1cnJlbnRQcm9wZXJ0eSA6IFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGUgPSBudWxsO1xyXG5cdFx0XHRpZiAobm9kZSkge1xyXG5cclxuXHRcdFx0XHRpZiAobm9kZS50eXBlID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdFx0dmFyIHN0cmluZ05vZGUgPSA8UGFyc2VyLlN0cmluZ0FTVE5vZGU+IG5vZGU7XHJcblx0XHRcdFx0XHRpZiAoc3RyaW5nTm9kZS5pc0tleSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgbm9kZVJhbmdlID0gbW9kZWxNaXJyb3IuZ2V0UmFuZ2VGcm9tT2Zmc2V0QW5kTGVuZ3RoKG5vZGUuc3RhcnQsIG5vZGUuZW5kIC0gbm9kZS5zdGFydCk7XHJcblx0XHRcdFx0XHRcdG92ZXJ3cml0ZUJlZm9yZSA9IHBvc2l0aW9uLmNvbHVtbiAtIG5vZGVSYW5nZS5zdGFydENvbHVtbjtcclxuXHRcdFx0XHRcdFx0b3ZlcndyaXRlQWZ0ZXIgPSBub2RlUmFuZ2UuZW5kQ29sdW1uIC0gcG9zaXRpb24uY29sdW1uO1xyXG5cdFx0XHRcdFx0XHRhZGRWYWx1ZSA9ICEobm9kZS5wYXJlbnQgJiYgKCg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT4gbm9kZS5wYXJlbnQpLnZhbHVlKSk7XHJcblx0XHRcdFx0XHRcdGN1cnJlbnRQcm9wZXJ0eSA9IG5vZGUucGFyZW50ID8gPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+IG5vZGUucGFyZW50IDogbnVsbDtcclxuXHRcdFx0XHRcdFx0Y3VycmVudEtleSA9IG1vZGVsTWlycm9yLmdldFZhbHVlSW5SYW5nZSh7IHN0YXJ0Q29sdW1uOiBub2RlUmFuZ2Uuc3RhcnRDb2x1bW4gKyAxLCBzdGFydExpbmVOdW1iZXI6IG5vZGVSYW5nZS5zdGFydExpbmVOdW1iZXIsIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyIH0pO1xyXG5cdFx0XHRcdFx0XHRpZiAobm9kZS5wYXJlbnQpIHtcclxuXHRcdFx0XHRcdFx0XHRub2RlID0gbm9kZS5wYXJlbnQucGFyZW50O1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gcHJvcG9zYWxzIGZvciBwcm9wZXJ0aWVzXHJcblx0XHRcdGlmIChub2RlICYmIG5vZGUudHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHQvLyBkb24ndCBzdWdnZXN0IGtleXMgd2hlbiB0aGUgY3Vyc29yIGlzIGp1c3QgYmVmb3JlIHRoZSBvcGVuaW5nIGN1cmx5IGJyYWNlXHJcblx0XHRcdFx0aWYgKG5vZGUuc3RhcnQgPT09IG9mZnNldCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gZG9uJ3Qgc3VnZ2VzdCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFscmVhZHkgcHJlc2VudFxyXG5cdFx0XHRcdHZhciBwcm9wZXJ0aWVzID0gKDxQYXJzZXIuT2JqZWN0QVNUTm9kZT4gbm9kZSkucHJvcGVydGllcztcclxuXHRcdFx0XHRwcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoIWN1cnJlbnRQcm9wZXJ0eSB8fCBjdXJyZW50UHJvcGVydHkgIT09IHApIHtcclxuXHRcdFx0XHRcdFx0cHJvcG9zZWRbcC5rZXkudmFsdWVdID0gdHJ1ZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0aWYgKHNjaGVtYSkge1xyXG5cdFx0XHRcdFx0Ly8gcHJvcGVydHkgcHJvcG9zYWxzIHdpdGggc2NoZW1hXHJcblx0XHRcdFx0XHR2YXIgaXNMYXN0ID0gcHJvcGVydGllcy5sZW5ndGggPT09IDAgfHwgb2Zmc2V0ID49IHByb3BlcnRpZXNbcHJvcGVydGllcy5sZW5ndGggLSAxXS5zdGFydDtcclxuXHRcdFx0XHRcdHRoaXMuZ2V0UHJvcGVydHlTdWdnZXN0aW9ucyhyZXNvdXJjZSwgc2NoZW1hLCBkb2MsIG5vZGUsIGN1cnJlbnRLZXksIGFkZFZhbHVlLCBpc0xhc3QsIGNvbGxlY3Rvcik7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChub2RlLnBhcmVudCkge1xyXG5cdFx0XHRcdFx0Ly8gcHJvcGVydHkgcHJvcG9zYWxzIHdpdGhvdXQgc2NoZW1hXHJcblx0XHRcdFx0XHR0aGlzLmdldFNjaGVtYUxlc3NQcm9wZXJ0eVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgY29sbGVjdG9yKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHZhciBsb2NhdGlvbiA9IG5vZGUuZ2V0Tm9kZUxvY2F0aW9uKCk7XHJcblx0XHRcdFx0dGhpcy5jb250cmlidXRpb25zLmZvckVhY2goKGNvbnRyaWJ1dGlvbikgPT4ge1xyXG5cdFx0XHRcdFx0dmFyIGNvbGxlY3RQcm9taXNlID0gY29udHJpYnV0aW9uLmNvbGxlY3RQcm9wZXJ0eVN1Z2dlc3Rpb25zKHJlc291cmNlLCBsb2NhdGlvbiwgY3VycmVudFdvcmQsIGFkZFZhbHVlLCBpc0xhc3QsIGNvbGxlY3Rvcik7XHJcblx0XHRcdFx0XHRpZiAoY29sbGVjdFByb21pc2UpIHtcclxuXHRcdFx0XHRcdFx0Y29sbGVjdGlvblByb21pc2VzLnB1c2goY29sbGVjdFByb21pc2UpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBwcm9wb3NhbHMgZm9yIHZhbHVlc1xyXG5cdFx0XHRpZiAobm9kZSAmJiAobm9kZS50eXBlID09PSAnc3RyaW5nJyB8fCBub2RlLnR5cGUgPT09ICdudW1iZXInIHx8IG5vZGUudHlwZSA9PT0gJ2ludGVnZXInIHx8IG5vZGUudHlwZSA9PT0gJ2Jvb2xlYW4nIHx8IG5vZGUudHlwZSA9PT0gJ251bGwnKSkge1xyXG5cdFx0XHRcdHZhciBub2RlUmFuZ2UgPSBtb2RlbE1pcnJvci5nZXRSYW5nZUZyb21PZmZzZXRBbmRMZW5ndGgobm9kZS5zdGFydCwgbm9kZS5lbmQgLSBub2RlLnN0YXJ0KTtcclxuXHRcdFx0XHRvdmVyd3JpdGVCZWZvcmUgPSBwb3NpdGlvbi5jb2x1bW4gLSBub2RlUmFuZ2Uuc3RhcnRDb2x1bW47XHJcblx0XHRcdFx0b3ZlcndyaXRlQWZ0ZXIgPSBub2RlUmFuZ2UuZW5kQ29sdW1uIC0gcG9zaXRpb24uY29sdW1uO1xyXG5cdFx0XHRcdG5vZGUgPSBub2RlLnBhcmVudDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHNjaGVtYSkge1xyXG5cdFx0XHRcdC8vIHZhbHVlIHByb3Bvc2FscyB3aXRoIHNjaGVtYVxyXG5cdFx0XHRcdHRoaXMuZ2V0VmFsdWVTdWdnZXN0aW9ucyhyZXNvdXJjZSwgc2NoZW1hLCBkb2MsIG5vZGUsIG9mZnNldCwgY29sbGVjdG9yKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQvLyB2YWx1ZSBwcm9wb3NhbHMgd2l0aG91dCBzY2hlbWFcclxuXHRcdFx0XHR0aGlzLmdldFNjaGVtYUxlc3NWYWx1ZVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgb2Zmc2V0LCBtb2RlbE1pcnJvciwgY29sbGVjdG9yKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIW5vZGUpIHtcclxuXHRcdFx0XHR0aGlzLmNvbnRyaWJ1dGlvbnMuZm9yRWFjaCgoY29udHJpYnV0aW9uKSA9PiB7XHJcblx0XHRcdFx0XHR2YXIgY29sbGVjdFByb21pc2UgPSBjb250cmlidXRpb24uY29sbGVjdERlZmF1bHRTdWdnZXN0aW9ucyhyZXNvdXJjZSwgY29sbGVjdG9yKTtcclxuXHRcdFx0XHRcdGlmIChjb2xsZWN0UHJvbWlzZSkge1xyXG5cdFx0XHRcdFx0XHRjb2xsZWN0aW9uUHJvbWlzZXMucHVzaChjb2xsZWN0UHJvbWlzZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0aWYgKChub2RlLnR5cGUgPT09ICdwcm9wZXJ0eScpICYmIG9mZnNldCA+ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT4gbm9kZSkuY29sb25PZmZzZXQpIHtcclxuXHRcdFx0XHRcdHZhciBwYXJlbnRLZXkgPSAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bm9kZSkua2V5LnZhbHVlO1xyXG5cclxuXHRcdFx0XHRcdHZhciB2YWx1ZU5vZGUgPSAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+IG5vZGUpLnZhbHVlO1xyXG5cdFx0XHRcdFx0aWYgKCF2YWx1ZU5vZGUgfHwgb2Zmc2V0IDw9IHZhbHVlTm9kZS5lbmQpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGxvY2F0aW9uID0gbm9kZS5wYXJlbnQuZ2V0Tm9kZUxvY2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdHRoaXMuY29udHJpYnV0aW9ucy5mb3JFYWNoKChjb250cmlidXRpb24pID0+IHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgY29sbGVjdFByb21pc2UgPSBjb250cmlidXRpb24uY29sbGVjdFZhbHVlU3VnZ2VzdGlvbnMocmVzb3VyY2UsIGxvY2F0aW9uLCBwYXJlbnRLZXksIGNvbGxlY3Rvcik7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNvbGxlY3RQcm9taXNlKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRjb2xsZWN0aW9uUHJvbWlzZXMucHVzaChjb2xsZWN0UHJvbWlzZSk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoY29sbGVjdGlvblByb21pc2VzKS50aGVuKCgpID0+IHsgcmV0dXJuIHJlc3VsdDsgfSApO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGdldFByb3BlcnR5U3VnZ2VzdGlvbnMocmVzb3VyY2U6IFVSSSwgc2NoZW1hOiBTY2hlbWFTZXJ2aWNlLlJlc29sdmVkU2NoZW1hLCBkb2M6IFBhcnNlci5KU09ORG9jdW1lbnQsIG5vZGU6IFBhcnNlci5BU1ROb2RlLCBjdXJyZW50V29yZDogc3RyaW5nLCBhZGRWYWx1ZTogYm9vbGVhbiwgaXNMYXN0OiBib29sZWFuLCBjb2xsZWN0b3I6IEpzb25Xb3JrZXIuSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKTogdm9pZCB7XHJcblx0XHR2YXIgbWF0Y2hpbmdTY2hlbWFzOiBQYXJzZXIuSUFwcGxpY2FibGVTY2hlbWFbXSA9IFtdO1xyXG5cdFx0ZG9jLnZhbGlkYXRlKHNjaGVtYS5zY2hlbWEsIG1hdGNoaW5nU2NoZW1hcywgbm9kZS5zdGFydCk7XHJcblxyXG5cdFx0bWF0Y2hpbmdTY2hlbWFzLmZvckVhY2goKHMpID0+IHtcclxuXHRcdFx0aWYgKHMubm9kZSA9PT0gbm9kZSAmJiAhcy5pbnZlcnRlZCkge1xyXG5cdFx0XHRcdHZhciBzY2hlbWFQcm9wZXJ0aWVzID0gcy5zY2hlbWEucHJvcGVydGllcztcclxuXHRcdFx0XHRpZiAoc2NoZW1hUHJvcGVydGllcykge1xyXG5cdFx0XHRcdFx0T2JqZWN0LmtleXMoc2NoZW1hUHJvcGVydGllcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRcdFx0dmFyIHByb3BlcnR5U2NoZW1hID0gc2NoZW1hUHJvcGVydGllc1trZXldO1xyXG5cdFx0XHRcdFx0XHRjb2xsZWN0b3IuYWRkKHsgdHlwZTogJ3Byb3BlcnR5JywgbGFiZWw6IGtleSwgY29kZVNuaXBwZXQ6IHRoaXMuZ2V0VGV4dEZvclByb3BlcnR5KGtleSwgcHJvcGVydHlTY2hlbWEsIGFkZFZhbHVlLCBpc0xhc3QpLCBkb2N1bWVudGF0aW9uTGFiZWw6IHByb3BlcnR5U2NoZW1hLmRlc2NyaXB0aW9uIHx8ICcnIH0pO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgZ2V0U2NoZW1hTGVzc1Byb3BlcnR5U3VnZ2VzdGlvbnMoZG9jOiBQYXJzZXIuSlNPTkRvY3VtZW50LCBub2RlOiBQYXJzZXIuQVNUTm9kZSwgY29sbGVjdG9yOiBKc29uV29ya2VyLklTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IHZvaWQge1xyXG5cdFx0dmFyIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3QgPSAob2JqOiBQYXJzZXIuT2JqZWN0QVNUTm9kZSkgPT4ge1xyXG5cdFx0XHRvYmoucHJvcGVydGllcy5mb3JFYWNoKChwKSA9PiB7XHJcblx0XHRcdFx0dmFyIGtleSA9IHAua2V5LnZhbHVlO1xyXG5cdFx0XHRcdGNvbGxlY3Rvci5hZGQoeyB0eXBlOiAncHJvcGVydHknLCBsYWJlbDoga2V5LCBjb2RlU25pcHBldDogdGhpcy5nZXRUZXh0Rm9yU2ltaWxhclByb3BlcnR5KGtleSwgcC52YWx1ZSksIGRvY3VtZW50YXRpb25MYWJlbDogJycgfSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fTtcclxuXHRcdGlmIChub2RlLnBhcmVudC50eXBlID09PSAncHJvcGVydHknKSB7XHJcblx0XHRcdC8vIGlmIHRoZSBvYmplY3QgaXMgYSBwcm9wZXJ0eSB2YWx1ZSwgY2hlY2sgdGhlIHRyZWUgZm9yIG90aGVyIG9iamVjdHMgdGhhdCBoYW5nIHVuZGVyIGEgcHJvcGVydHkgb2YgdGhlIHNhbWUgbmFtZVxyXG5cdFx0XHR2YXIgcGFyZW50S2V5ID0gKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm5vZGUucGFyZW50KS5rZXkudmFsdWU7XHJcblx0XHRcdGRvYy52aXNpdCgobikgPT4ge1xyXG5cdFx0XHRcdGlmIChuLnR5cGUgPT09ICdwcm9wZXJ0eScgJiYgKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm4pLmtleS52YWx1ZSA9PT0gcGFyZW50S2V5ICYmICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZSAmJiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikudmFsdWUudHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHRcdGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3QoPFBhcnNlci5PYmplY3RBU1ROb2RlPiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikudmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IGVsc2UgaWYgKG5vZGUucGFyZW50LnR5cGUgPT09ICdhcnJheScpIHtcclxuXHRcdFx0Ly8gaWYgdGhlIG9iamVjdCBpcyBpbiBhbiBhcnJheSwgdXNlIGFsbCBvdGhlciBhcnJheSBlbGVtZW50cyBhcyBzaW1pbGFyIG9iamVjdHNcclxuXHRcdFx0KDxQYXJzZXIuQXJyYXlBU1ROb2RlPiBub2RlLnBhcmVudCkuaXRlbXMuZm9yRWFjaCgobikgPT4ge1xyXG5cdFx0XHRcdGlmIChuLnR5cGUgPT09ICdvYmplY3QnICYmIG4gIT09IG5vZGUpIHtcclxuXHRcdFx0XHRcdGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3QoPFBhcnNlci5PYmplY3RBU1ROb2RlPiBuKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cHVibGljIGdldFNjaGVtYUxlc3NWYWx1ZVN1Z2dlc3Rpb25zKGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCwgbm9kZTogUGFyc2VyLkFTVE5vZGUsIG9mZnNldDogbnVtYmVyLCBtb2RlbE1pcnJvcjogRWRpdG9yQ29tbW9uLklNaXJyb3JNb2RlbCwgY29sbGVjdG9yOiBKc29uV29ya2VyLklTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IHZvaWQge1xyXG5cdFx0dmFyIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclZhbHVlcyA9ICh2YWx1ZTogUGFyc2VyLkFTVE5vZGUpID0+IHtcclxuXHRcdFx0dmFyIGNvbnRlbnQgPSB0aGlzLmdldFRleHRGb3JNYXRjaGluZ05vZGUodmFsdWUsIG1vZGVsTWlycm9yKTtcclxuXHRcdFx0Y29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvblR5cGUodmFsdWUudHlwZSksIGxhYmVsOiBjb250ZW50LCBjb2RlU25pcHBldDogY29udGVudCwgZG9jdW1lbnRhdGlvbkxhYmVsOiAnJyB9KTtcclxuXHRcdFx0aWYgKHZhbHVlLnR5cGUgPT09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdHRoaXMuYWRkQm9vbGVhblN1Z2dlc3Rpb24oIXZhbHVlLmdldFZhbHVlKCksIGNvbGxlY3Rvcik7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0aWYgKCFub2RlKSB7XHJcblx0XHRcdGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25UeXBlKCdvYmplY3QnKSwgbGFiZWw6ICdFbXB0eSBvYmplY3QnLCBjb2RlU25pcHBldDogJ3tcXG5cXHR7e319XFxufScsIGRvY3VtZW50YXRpb25MYWJlbDogJycgfSk7XHJcblx0XHRcdGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25UeXBlKCdhcnJheScpLCBsYWJlbDogJ0VtcHR5IGFycmF5JywgY29kZVNuaXBwZXQ6ICdbXFxuXFx0e3t9fVxcbl0nLCBkb2N1bWVudGF0aW9uTGFiZWw6ICcnIH0pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKG5vZGUudHlwZSA9PT0gJ3Byb3BlcnR5JyAmJiBvZmZzZXQgPiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+IG5vZGUpLmNvbG9uT2Zmc2V0KSB7XHJcblx0XHRcdFx0dmFyIHZhbHVlTm9kZSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS52YWx1ZTtcclxuXHRcdFx0XHRpZiAodmFsdWVOb2RlICYmIG9mZnNldCA+IHZhbHVlTm9kZS5lbmQpIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gc3VnZ2VzdCB2YWx1ZXMgYXQgdGhlIHNhbWUga2V5XHJcblx0XHRcdFx0dmFyIHBhcmVudEtleSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS5rZXkudmFsdWU7XHJcblx0XHRcdFx0ZG9jLnZpc2l0KChuKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAobi50eXBlID09PSAncHJvcGVydHknICYmICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS5rZXkudmFsdWUgPT09IHBhcmVudEtleSAmJiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikudmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0Y29sbGVjdFN1Z2dlc3Rpb25zRm9yVmFsdWVzKCg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAobm9kZS50eXBlID09PSAnYXJyYXknKSB7XHJcblx0XHRcdFx0aWYgKG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50LnR5cGUgPT09ICdwcm9wZXJ0eScpIHtcclxuXHRcdFx0XHRcdC8vIHN1Z2dlc3QgaXRlbXMgb2YgYW4gYXJyYXkgYXQgdGhlIHNhbWUga2V5XHJcblx0XHRcdFx0XHR2YXIgcGFyZW50S2V5ID0gKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm5vZGUucGFyZW50KS5rZXkudmFsdWU7XHJcblx0XHRcdFx0XHRkb2MudmlzaXQoKG4pID0+IHtcclxuXHRcdFx0XHRcdFx0aWYgKG4udHlwZSA9PT0gJ3Byb3BlcnR5JyAmJiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikua2V5LnZhbHVlID09PSBwYXJlbnRLZXkgJiYgKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm4pLnZhbHVlICYmICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZS50eXBlID09PSAnYXJyYXknKSB7XHJcblx0XHRcdFx0XHRcdFx0KCg8UGFyc2VyLkFycmF5QVNUTm9kZT4oPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikudmFsdWUpLml0ZW1zKS5mb3JFYWNoKChuKSA9PiB7XHJcblx0XHRcdFx0XHRcdFx0XHRjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMoPFBhcnNlci5PYmplY3RBU1ROb2RlPiBuKTtcclxuXHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvLyBzdWdnZXN0IGl0ZW1zIGluIHRoZSBzYW1lIGFycmF5XHJcblx0XHRcdFx0XHQoPFBhcnNlci5BcnJheUFTVE5vZGU+IG5vZGUpLml0ZW1zLmZvckVhY2goKG4pID0+IHtcclxuXHRcdFx0XHRcdFx0Y29sbGVjdFN1Z2dlc3Rpb25zRm9yVmFsdWVzKDxQYXJzZXIuT2JqZWN0QVNUTm9kZT4gbik7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cclxuXHRwdWJsaWMgZ2V0VmFsdWVTdWdnZXN0aW9ucyhyZXNvdXJjZTogVVJJLCBzY2hlbWE6IFNjaGVtYVNlcnZpY2UuUmVzb2x2ZWRTY2hlbWEsIGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCwgbm9kZTogUGFyc2VyLkFTVE5vZGUsIG9mZnNldDogbnVtYmVyLCBjb2xsZWN0b3I6IEpzb25Xb3JrZXIuSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKSA6IHZvaWQge1xyXG5cclxuXHRcdGlmICghbm9kZSkge1xyXG5cdFx0XHR0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHNjaGVtYS5zY2hlbWEsIGNvbGxlY3Rvcik7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR2YXIgcGFyZW50S2V5OiBzdHJpbmcgPSBudWxsO1xyXG5cdFx0XHRpZiAobm9kZSAmJiAobm9kZS50eXBlID09PSAncHJvcGVydHknKSAmJiBvZmZzZXQgPiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+IG5vZGUpLmNvbG9uT2Zmc2V0KSB7XHJcblx0XHRcdFx0dmFyIHZhbHVlTm9kZSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT4gbm9kZSkudmFsdWU7XHJcblx0XHRcdFx0aWYgKHZhbHVlTm9kZSAmJiBvZmZzZXQgPiB2YWx1ZU5vZGUuZW5kKSB7XHJcblx0XHRcdFx0XHRyZXR1cm47IC8vIHdlIGFyZSBwYXN0IHRoZSB2YWx1ZSBub2RlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHBhcmVudEtleSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS5rZXkudmFsdWU7XHJcblx0XHRcdFx0bm9kZSA9IG5vZGUucGFyZW50O1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChub2RlICYmIChwYXJlbnRLZXkgIT09IG51bGwgfHwgbm9kZS50eXBlID09PSAnYXJyYXknKSkge1xyXG5cdFx0XHRcdHZhciBtYXRjaGluZ1NjaGVtYXM6IFBhcnNlci5JQXBwbGljYWJsZVNjaGVtYVtdID0gW107XHJcblx0XHRcdFx0ZG9jLnZhbGlkYXRlKHNjaGVtYS5zY2hlbWEsIG1hdGNoaW5nU2NoZW1hcywgbm9kZS5zdGFydCk7XHJcblxyXG5cdFx0XHRcdG1hdGNoaW5nU2NoZW1hcy5mb3JFYWNoKChzKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAocy5ub2RlID09PSBub2RlICYmICFzLmludmVydGVkICYmIHMuc2NoZW1hKSB7XHJcblx0XHRcdFx0XHRcdGlmIChzLnNjaGVtYS5pdGVtcykge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocy5zY2hlbWEuaXRlbXMsIGNvbGxlY3Rvcik7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLnNjaGVtYS5pdGVtcywgY29sbGVjdG9yKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAocy5zY2hlbWEucHJvcGVydGllcykge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBwcm9wZXJ0eVNjaGVtYSA9IHMuc2NoZW1hLnByb3BlcnRpZXNbcGFyZW50S2V5XTtcclxuXHRcdFx0XHRcdFx0XHRpZiAocHJvcGVydHlTY2hlbWEpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocHJvcGVydHlTY2hlbWEsIGNvbGxlY3Rvcik7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHByb3BlcnR5U2NoZW1hLCBjb2xsZWN0b3IpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhZGRCb29sZWFuU3VnZ2VzdGlvbih2YWx1ZTogYm9vbGVhbiwgY29sbGVjdG9yOiBKc29uV29ya2VyLklTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IHZvaWQge1xyXG5cdFx0Y29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvblR5cGUoJ2Jvb2xlYW4nKSwgbGFiZWw6IHZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJywgY29kZVNuaXBwZXQ6IHRoaXMuZ2V0VGV4dEZvckVudW1WYWx1ZSh2YWx1ZSksIGRvY3VtZW50YXRpb25MYWJlbDogJycgfSk7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGFkZEVudW1TdWdnZXN0aW9uKHNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgY29sbGVjdG9yOiBKc29uV29ya2VyLklTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IHZvaWQge1xyXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmVudW0pKSB7XHJcblx0XHRcdHNjaGVtYS5lbnVtLmZvckVhY2goKGVubSkgPT4gY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvblR5cGUoc2NoZW1hLnR5cGUpLCBsYWJlbDogdGhpcy5nZXRMYWJlbEZvclZhbHVlKGVubSksIGNvZGVTbmlwcGV0OiB0aGlzLmdldFRleHRGb3JFbnVtVmFsdWUoZW5tKSwgZG9jdW1lbnRhdGlvbkxhYmVsOiAnJyB9KSk7XHJcblx0XHR9IGVsc2UgaWYgKHNjaGVtYS50eXBlID09PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0dGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbih0cnVlLCBjb2xsZWN0b3IpO1xyXG5cdFx0XHR0aGlzLmFkZEJvb2xlYW5TdWdnZXN0aW9uKGZhbHNlLCBjb2xsZWN0b3IpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkge1xyXG5cdFx0XHRzY2hlbWEuYWxsT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcclxuXHRcdH1cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcclxuXHRcdFx0c2NoZW1hLmFueU9mLmZvckVhY2goKHMpID0+IHRoaXMuYWRkRW51bVN1Z2dlc3Rpb24ocywgY29sbGVjdG9yKSk7XHJcblx0XHR9XHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpKSB7XHJcblx0XHRcdHNjaGVtYS5vbmVPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhZGREZWZhdWx0U3VnZ2VzdGlvbihzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIGNvbGxlY3RvcjogSnNvbldvcmtlci5JU3VnZ2VzdGlvbnNDb2xsZWN0b3IpOiB2b2lkIHtcclxuXHRcdGlmIChzY2hlbWEuZGVmYXVsdCkge1xyXG5cdFx0XHRjb2xsZWN0b3IuYWRkKHtcclxuXHRcdFx0XHR0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25UeXBlKHNjaGVtYS50eXBlKSxcclxuXHRcdFx0XHRsYWJlbDogdGhpcy5nZXRMYWJlbEZvclZhbHVlKHNjaGVtYS5kZWZhdWx0KSxcclxuXHRcdFx0XHRjb2RlU25pcHBldDogdGhpcy5nZXRUZXh0Rm9yVmFsdWUoc2NoZW1hLmRlZmF1bHQpLFxyXG5cdFx0XHRcdHR5cGVMYWJlbDogICdEZWZhdWx0IHZhbHVlJyxcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZGVmYXVsdFNuaXBwZXRzKSkge1xyXG5cdFx0XHRzY2hlbWEuZGVmYXVsdFNuaXBwZXRzLmZvckVhY2gocyA9PiB7XHJcblx0XHRcdFx0Y29sbGVjdG9yLmFkZCh7XHJcblx0XHRcdFx0XHR0eXBlOiAnc25pcHBldCcsXHJcblx0XHRcdFx0XHRsYWJlbDogdGhpcy5nZXRMYWJlbEZvclNuaXBwZXRWYWx1ZShzLmJvZHkpLFxyXG5cdFx0XHRcdFx0Y29kZVNuaXBwZXQ6IHRoaXMuZ2V0VGV4dEZvclNuaXBwZXRWYWx1ZShzLmJvZHkpXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkge1xyXG5cdFx0XHRzY2hlbWEuYWxsT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGREZWZhdWx0U3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcclxuXHRcdH1cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcclxuXHRcdFx0c2NoZW1hLmFueU9mLmZvckVhY2goKHMpID0+IHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocywgY29sbGVjdG9yKSk7XHJcblx0XHR9XHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpKSB7XHJcblx0XHRcdHNjaGVtYS5vbmVPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBnZXRMYWJlbEZvclZhbHVlKHZhbHVlOiBhbnkpIDogc3RyaW5nIHtcclxuXHRcdHZhciBsYWJlbCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcclxuXHRcdGxhYmVsID0gbGFiZWwucmVwbGFjZSgne3snLCAnJykucmVwbGFjZSgnfX0nLCAnJyk7XHJcblx0XHRpZiAobGFiZWwubGVuZ3RoID4gNTcpIHtcclxuXHRcdFx0cmV0dXJuIGxhYmVsLnN1YnN0cigwLCA1NykudHJpbSgpICsgJy4uLic7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbGFiZWw7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGdldExhYmVsRm9yU25pcHBldFZhbHVlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xyXG5cdFx0bGV0IGxhYmVsID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xyXG5cdFx0bGFiZWwgPSBsYWJlbC5yZXBsYWNlKC9cXHtcXHt8XFx9XFx9L2csICcnKTtcclxuXHRcdGlmIChsYWJlbC5sZW5ndGggPiA1Nykge1xyXG5cdFx0XHRyZXR1cm4gbGFiZWwuc3Vic3RyKDAsIDU3KS50cmltKCkgKyAnLi4uJztcclxuXHRcdH1cclxuXHRcdHJldHVybiBsYWJlbDtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgZ2V0VGV4dEZvclZhbHVlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xyXG5cdFx0dmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgJ1xcdCcpO1xyXG5cdFx0dGV4dCA9IHRleHQucmVwbGFjZSgvW1xcXFxcXHtcXH1dL2csICdcXFxcJCYnKTtcclxuXHRcdHJldHVybiB0ZXh0O1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBnZXRUZXh0Rm9yU25pcHBldFZhbHVlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xyXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlLCBudWxsLCAnXFx0Jyk7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGdldFRleHRGb3JFbnVtVmFsdWUodmFsdWU6IGFueSkgOiBzdHJpbmcge1xyXG5cdFx0dmFyIHNuaXBwZXQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgJ1xcdCcpO1xyXG5cdFx0c3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcclxuXHRcdFx0Y2FzZSAnb2JqZWN0JzpcclxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcclxuXHRcdFx0XHRcdHJldHVybiAne3tudWxsfX0nO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gc25pcHBldDtcclxuXHRcdFx0Y2FzZSAnc3RyaW5nJzpcclxuXHRcdFx0XHRyZXR1cm4gJ1wie3snICsgc25pcHBldC5zdWJzdHIoMSwgc25pcHBldC5sZW5ndGggLSAyKSArICd9fVwiJztcclxuXHRcdFx0Y2FzZSAnbnVtYmVyJzpcclxuXHRcdFx0Y2FzZSAnaW50ZWdlcic6XHJcblx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxyXG5cdFx0XHRcdHJldHVybiAne3snICsgc25pcHBldCArICd9fSc7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc25pcHBldDtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgZ2V0U3VnZ2VzdGlvblR5cGUodHlwZTogYW55KTogc3RyaW5nIHtcclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHR5cGUpKSB7XHJcblx0XHRcdHZhciBhcnJheSA9IDxhbnlbXT4gdHlwZTtcclxuXHRcdFx0dHlwZSA9IGFycmF5Lmxlbmd0aCA+IDAgPyBhcnJheVswXSA6IG51bGw7XHJcblx0XHR9XHJcblx0XHRpZiAoIXR5cGUpIHtcclxuXHRcdFx0cmV0dXJuICd0ZXh0JztcclxuXHRcdH1cclxuXHRcdHN3aXRjaCAodHlwZSkge1xyXG5cdFx0XHRjYXNlICdzdHJpbmcnOiByZXR1cm4gJ3RleHQnO1xyXG5cdFx0XHRjYXNlICdvYmplY3QnOiByZXR1cm4gJ21vZHVsZSc7XHJcblx0XHRcdGNhc2UgJ3Byb3BlcnR5JzogcmV0dXJuICdwcm9wZXJ0eSc7XHJcblx0XHRcdGRlZmF1bHQ6IHJldHVybiAndmFsdWUnO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdHByaXZhdGUgZ2V0VGV4dEZvck1hdGNoaW5nTm9kZShub2RlOiBQYXJzZXIuQVNUTm9kZSwgbW9kZWxNaXJyb3I6IEVkaXRvckNvbW1vbi5JTWlycm9yTW9kZWwpOiBzdHJpbmcge1xyXG5cdFx0c3dpdGNoIChub2RlLnR5cGUpIHtcclxuXHRcdFx0Y2FzZSAnYXJyYXknOlxyXG5cdFx0XHRcdHJldHVybiAnW10nO1xyXG5cdFx0XHRjYXNlICdvYmplY3QnOlxyXG5cdFx0XHRcdHJldHVybiAne30nO1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHZhciBjb250ZW50ID0gbW9kZWxNaXJyb3IuZ2V0VmFsdWVJblJhbmdlKG1vZGVsTWlycm9yLmdldFJhbmdlRnJvbU9mZnNldEFuZExlbmd0aChub2RlLnN0YXJ0LCBub2RlLmVuZCAtIG5vZGUuc3RhcnQpKTtcclxuXHRcdFx0XHRyZXR1cm4gY29udGVudDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHByaXZhdGUgZ2V0VGV4dEZvclByb3BlcnR5KGtleTogc3RyaW5nLCBwcm9wZXJ0eVNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgYWRkVmFsdWU6Ym9vbGVhbiwgaXNMYXN0OiBib29sZWFuKTogc3RyaW5nIHtcclxuXHJcblx0XHRsZXQgcmVzdWx0ID0gdGhpcy5nZXRUZXh0Rm9yVmFsdWUoa2V5KTtcclxuXHRcdGlmICghYWRkVmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH1cclxuXHRcdHJlc3VsdCArPSAnOiAnO1xyXG5cclxuXHRcdHZhciBkZWZhdWx0VmFsID0gcHJvcGVydHlTY2hlbWEuZGVmYXVsdDtcclxuXHRcdGlmICghXy5pc1VuZGVmaW5lZChkZWZhdWx0VmFsKSkge1xyXG5cdFx0XHRyZXN1bHQgPSByZXN1bHQgKyB0aGlzLmdldFRleHRGb3JFbnVtVmFsdWUoZGVmYXVsdFZhbCk7XHJcblx0XHR9IGVsc2UgaWYgKHByb3BlcnR5U2NoZW1hLmVudW0gJiYgcHJvcGVydHlTY2hlbWEuZW51bS5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHJlc3VsdCA9IHJlc3VsdCArIHRoaXMuZ2V0VGV4dEZvckVudW1WYWx1ZShwcm9wZXJ0eVNjaGVtYS5lbnVtWzBdKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHN3aXRjaCAocHJvcGVydHlTY2hlbWEudHlwZSkge1xyXG5cdFx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxyXG5cdFx0XHRcdFx0cmVzdWx0ICs9ICd7e2ZhbHNlfX0nO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnc3RyaW5nJzpcclxuXHRcdFx0XHRcdHJlc3VsdCArPSAnXCJ7e319XCInO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnb2JqZWN0JzpcclxuXHRcdFx0XHRcdHJlc3VsdCArPSAne1xcblxcdHt7fX1cXG59JztcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgJ2FycmF5JzpcclxuXHRcdFx0XHRcdHJlc3VsdCArPSAnW1xcblxcdHt7fX1cXG5dJztcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgJ251bWJlcic6XHJcblx0XHRcdFx0Y2FzZSAnaW50ZWdlcic6XHJcblx0XHRcdFx0XHRyZXN1bHQgKz0gJ3t7MH19JztcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgJ251bGwnOlxyXG5cdFx0XHRcdFx0cmVzdWx0ICs9ICd7e251bGx9fSc7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKCFpc0xhc3QpIHtcclxuXHRcdFx0cmVzdWx0ICs9ICcsJztcclxuXHRcdH1cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGdldFRleHRGb3JTaW1pbGFyUHJvcGVydHkoa2V5OiBzdHJpbmcsIHRlbXBsYXRlVmFsdWU6IFBhcnNlci5BU1ROb2RlKTogc3RyaW5nIHtcclxuXHRcdHJldHVybiB0aGlzLmdldFRleHRGb3JWYWx1ZShrZXkpO1xyXG5cdH1cclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgUGFyc2VyIGZyb20gJy4vcGFyc2VyL2pzb25QYXJzZXInO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmV4cG9ydCBjbGFzcyBKU09OSW50ZWxsaXNlbnNlIHtcbiAgICBjb25zdHJ1Y3RvcihzY2hlbWFTZXJ2aWNlLCBjb250cmlidXRpb25zKSB7XG4gICAgICAgIHRoaXMuc2NoZW1hU2VydmljZSA9IHNjaGVtYVNlcnZpY2U7XG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9ucyA9IGNvbnRyaWJ1dGlvbnM7XG4gICAgfVxuICAgIGRvU3VnZ2VzdChyZXNvdXJjZSwgbW9kZWxNaXJyb3IsIHBvc2l0aW9uKSB7XG4gICAgICAgIHZhciBjdXJyZW50V29yZCA9IG1vZGVsTWlycm9yLmdldFdvcmRVbnRpbFBvc2l0aW9uKHBvc2l0aW9uKS53b3JkO1xuICAgICAgICB2YXIgcGFyc2VyID0gbmV3IFBhcnNlci5KU09OUGFyc2VyKCk7XG4gICAgICAgIHZhciBjb25maWcgPSBuZXcgUGFyc2VyLkpTT05Eb2N1bWVudENvbmZpZygpO1xuICAgICAgICBjb25maWcuaWdub3JlRGFuZ2xpbmdDb21tYSA9IHRydWU7XG4gICAgICAgIHZhciBkb2MgPSBwYXJzZXIucGFyc2UobW9kZWxNaXJyb3IuZ2V0VmFsdWUoKSwgY29uZmlnKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIGN1cnJlbnRXb3JkOiBjdXJyZW50V29yZCxcbiAgICAgICAgICAgIGluY29tcGxldGU6IGZhbHNlLFxuICAgICAgICAgICAgc3VnZ2VzdGlvbnM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHZhciBvdmVyd3JpdGVCZWZvcmUgPSB2b2lkIDA7XG4gICAgICAgIHZhciBvdmVyd3JpdGVBZnRlciA9IHZvaWQgMDtcbiAgICAgICAgdmFyIHByb3Bvc2VkID0ge307XG4gICAgICAgIHZhciBjb2xsZWN0b3IgPSB7XG4gICAgICAgICAgICBhZGQ6IChzdWdnZXN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFwcm9wb3NlZFtzdWdnZXN0aW9uLmxhYmVsXSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wb3NlZFtzdWdnZXN0aW9uLmxhYmVsXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb24ub3ZlcndyaXRlQmVmb3JlID0gb3ZlcndyaXRlQmVmb3JlO1xuICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uLm92ZXJ3cml0ZUFmdGVyID0gb3ZlcndyaXRlQWZ0ZXI7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zdWdnZXN0aW9ucy5wdXNoKHN1Z2dlc3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRBc0luY29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHQuaW5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcy5zY2hlbWFTZXJ2aWNlLmdldFNjaGVtYUZvclJlc291cmNlKHJlc291cmNlLnRvU3RyaW5nKCksIGRvYykudGhlbigoc2NoZW1hKSA9PiB7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvblByb21pc2VzID0gW107XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gbW9kZWxNaXJyb3IuZ2V0T2Zmc2V0RnJvbVBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICAgICAgICAgIHZhciBub2RlID0gZG9jLmdldE5vZGVGcm9tT2Zmc2V0RW5kSW5jbHVzaXZlKG9mZnNldCk7XG4gICAgICAgICAgICB2YXIgYWRkVmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRLZXkgPSBjdXJyZW50V29yZDtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UHJvcGVydHkgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RyaW5nTm9kZSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJpbmdOb2RlLmlzS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZVJhbmdlID0gbW9kZWxNaXJyb3IuZ2V0UmFuZ2VGcm9tT2Zmc2V0QW5kTGVuZ3RoKG5vZGUuc3RhcnQsIG5vZGUuZW5kIC0gbm9kZS5zdGFydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGVCZWZvcmUgPSBwb3NpdGlvbi5jb2x1bW4gLSBub2RlUmFuZ2Uuc3RhcnRDb2x1bW47XG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGVBZnRlciA9IG5vZGVSYW5nZS5lbmRDb2x1bW4gLSBwb3NpdGlvbi5jb2x1bW47XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRWYWx1ZSA9ICEobm9kZS5wYXJlbnQgJiYgKG5vZGUucGFyZW50LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UHJvcGVydHkgPSBub2RlLnBhcmVudCA/IG5vZGUucGFyZW50IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRLZXkgPSBtb2RlbE1pcnJvci5nZXRWYWx1ZUluUmFuZ2UoeyBzdGFydENvbHVtbjogbm9kZVJhbmdlLnN0YXJ0Q29sdW1uICsgMSwgc3RhcnRMaW5lTnVtYmVyOiBub2RlUmFuZ2Uuc3RhcnRMaW5lTnVtYmVyLCBlbmRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbiwgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlciB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudC5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSAmJiBub2RlLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuc3RhcnQgPT09IG9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IG5vZGUucHJvcGVydGllcztcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudFByb3BlcnR5IHx8IGN1cnJlbnRQcm9wZXJ0eSAhPT0gcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcG9zZWRbcC5rZXkudmFsdWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzTGFzdCA9IHByb3BlcnRpZXMubGVuZ3RoID09PSAwIHx8IG9mZnNldCA+PSBwcm9wZXJ0aWVzW3Byb3BlcnRpZXMubGVuZ3RoIC0gMV0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0UHJvcGVydHlTdWdnZXN0aW9ucyhyZXNvdXJjZSwgc2NoZW1hLCBkb2MsIG5vZGUsIGN1cnJlbnRLZXksIGFkZFZhbHVlLCBpc0xhc3QsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0U2NoZW1hTGVzc1Byb3BlcnR5U3VnZ2VzdGlvbnMoZG9jLCBub2RlLCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBub2RlLmdldE5vZGVMb2NhdGlvbigpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJpYnV0aW9ucy5mb3JFYWNoKChjb250cmlidXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3RQcm9taXNlID0gY29udHJpYnV0aW9uLmNvbGxlY3RQcm9wZXJ0eVN1Z2dlc3Rpb25zKHJlc291cmNlLCBsb2NhdGlvbiwgY3VycmVudFdvcmQsIGFkZFZhbHVlLCBpc0xhc3QsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0UHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvblByb21pc2VzLnB1c2goY29sbGVjdFByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSAmJiAobm9kZS50eXBlID09PSAnc3RyaW5nJyB8fCBub2RlLnR5cGUgPT09ICdudW1iZXInIHx8IG5vZGUudHlwZSA9PT0gJ2ludGVnZXInIHx8IG5vZGUudHlwZSA9PT0gJ2Jvb2xlYW4nIHx8IG5vZGUudHlwZSA9PT0gJ251bGwnKSkge1xuICAgICAgICAgICAgICAgIHZhciBub2RlUmFuZ2UgPSBtb2RlbE1pcnJvci5nZXRSYW5nZUZyb21PZmZzZXRBbmRMZW5ndGgobm9kZS5zdGFydCwgbm9kZS5lbmQgLSBub2RlLnN0YXJ0KTtcbiAgICAgICAgICAgICAgICBvdmVyd3JpdGVCZWZvcmUgPSBwb3NpdGlvbi5jb2x1bW4gLSBub2RlUmFuZ2Uuc3RhcnRDb2x1bW47XG4gICAgICAgICAgICAgICAgb3ZlcndyaXRlQWZ0ZXIgPSBub2RlUmFuZ2UuZW5kQ29sdW1uIC0gcG9zaXRpb24uY29sdW1uO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFZhbHVlU3VnZ2VzdGlvbnMocmVzb3VyY2UsIHNjaGVtYSwgZG9jLCBub2RlLCBvZmZzZXQsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldFNjaGVtYUxlc3NWYWx1ZVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgb2Zmc2V0LCBtb2RlbE1pcnJvciwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJpYnV0aW9ucy5mb3JFYWNoKChjb250cmlidXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3RQcm9taXNlID0gY29udHJpYnV0aW9uLmNvbGxlY3REZWZhdWx0U3VnZ2VzdGlvbnMocmVzb3VyY2UsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0UHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvblByb21pc2VzLnB1c2goY29sbGVjdFByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoKG5vZGUudHlwZSA9PT0gJ3Byb3BlcnR5JykgJiYgb2Zmc2V0ID4gbm9kZS5jb2xvbk9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50S2V5ID0gbm9kZS5rZXkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZU5vZGUgPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlTm9kZSB8fCBvZmZzZXQgPD0gdmFsdWVOb2RlLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbm9kZS5wYXJlbnQuZ2V0Tm9kZUxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvbnMuZm9yRWFjaCgoY29udHJpYnV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbGxlY3RQcm9taXNlID0gY29udHJpYnV0aW9uLmNvbGxlY3RWYWx1ZVN1Z2dlc3Rpb25zKHJlc291cmNlLCBsb2NhdGlvbiwgcGFyZW50S2V5LCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0UHJvbWlzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uUHJvbWlzZXMucHVzaChjb2xsZWN0UHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoY29sbGVjdGlvblByb21pc2VzKS50aGVuKCgpID0+IHsgcmV0dXJuIHJlc3VsdDsgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRQcm9wZXJ0eVN1Z2dlc3Rpb25zKHJlc291cmNlLCBzY2hlbWEsIGRvYywgbm9kZSwgY3VycmVudFdvcmQsIGFkZFZhbHVlLCBpc0xhc3QsIGNvbGxlY3Rvcikge1xuICAgICAgICB2YXIgbWF0Y2hpbmdTY2hlbWFzID0gW107XG4gICAgICAgIGRvYy52YWxpZGF0ZShzY2hlbWEuc2NoZW1hLCBtYXRjaGluZ1NjaGVtYXMsIG5vZGUuc3RhcnQpO1xuICAgICAgICBtYXRjaGluZ1NjaGVtYXMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICAgICAgaWYgKHMubm9kZSA9PT0gbm9kZSAmJiAhcy5pbnZlcnRlZCkge1xuICAgICAgICAgICAgICAgIHZhciBzY2hlbWFQcm9wZXJ0aWVzID0gcy5zY2hlbWEucHJvcGVydGllcztcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWFQcm9wZXJ0aWVzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVNjaGVtYSA9IHNjaGVtYVByb3BlcnRpZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiAncHJvcGVydHknLCBsYWJlbDoga2V5LCBjb2RlU25pcHBldDogdGhpcy5nZXRUZXh0Rm9yUHJvcGVydHkoa2V5LCBwcm9wZXJ0eVNjaGVtYSwgYWRkVmFsdWUsIGlzTGFzdCksIGRvY3VtZW50YXRpb25MYWJlbDogcHJvcGVydHlTY2hlbWEuZGVzY3JpcHRpb24gfHwgJycgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFNjaGVtYUxlc3NQcm9wZXJ0eVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgY29sbGVjdG9yKSB7XG4gICAgICAgIHZhciBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JTaW1pbGFyT2JqZWN0ID0gKG9iaikgPT4ge1xuICAgICAgICAgICAgb2JqLnByb3BlcnRpZXMuZm9yRWFjaCgocCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBwLmtleS52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0b3IuYWRkKHsgdHlwZTogJ3Byb3BlcnR5JywgbGFiZWw6IGtleSwgY29kZVNuaXBwZXQ6IHRoaXMuZ2V0VGV4dEZvclNpbWlsYXJQcm9wZXJ0eShrZXksIHAudmFsdWUpLCBkb2N1bWVudGF0aW9uTGFiZWw6ICcnIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChub2RlLnBhcmVudC50eXBlID09PSAncHJvcGVydHknKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50S2V5ID0gbm9kZS5wYXJlbnQua2V5LnZhbHVlO1xuICAgICAgICAgICAgZG9jLnZpc2l0KChuKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG4udHlwZSA9PT0gJ3Byb3BlcnR5JyAmJiBuLmtleS52YWx1ZSA9PT0gcGFyZW50S2V5ICYmIG4udmFsdWUgJiYgbi52YWx1ZS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JTaW1pbGFyT2JqZWN0KG4udmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5vZGUucGFyZW50LnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgICAgICAgIG5vZGUucGFyZW50Lml0ZW1zLmZvckVhY2goKG4pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobi50eXBlID09PSAnb2JqZWN0JyAmJiBuICE9PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3Qobik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0U2NoZW1hTGVzc1ZhbHVlU3VnZ2VzdGlvbnMoZG9jLCBub2RlLCBvZmZzZXQsIG1vZGVsTWlycm9yLCBjb2xsZWN0b3IpIHtcbiAgICAgICAgdmFyIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclZhbHVlcyA9ICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSB0aGlzLmdldFRleHRGb3JNYXRjaGluZ05vZGUodmFsdWUsIG1vZGVsTWlycm9yKTtcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25UeXBlKHZhbHVlLnR5cGUpLCBsYWJlbDogY29udGVudCwgY29kZVNuaXBwZXQ6IGNvbnRlbnQsIGRvY3VtZW50YXRpb25MYWJlbDogJycgfSk7XG4gICAgICAgICAgICBpZiAodmFsdWUudHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbighdmFsdWUuZ2V0VmFsdWUoKSwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBjb2xsZWN0b3IuYWRkKHsgdHlwZTogdGhpcy5nZXRTdWdnZXN0aW9uVHlwZSgnb2JqZWN0JyksIGxhYmVsOiAnRW1wdHkgb2JqZWN0JywgY29kZVNuaXBwZXQ6ICd7XFxuXFx0e3t9fVxcbn0nLCBkb2N1bWVudGF0aW9uTGFiZWw6ICcnIH0pO1xuICAgICAgICAgICAgY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvblR5cGUoJ2FycmF5JyksIGxhYmVsOiAnRW1wdHkgYXJyYXknLCBjb2RlU25pcHBldDogJ1tcXG5cXHR7e319XFxuXScsIGRvY3VtZW50YXRpb25MYWJlbDogJycgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAncHJvcGVydHknICYmIG9mZnNldCA+IG5vZGUuY29sb25PZmZzZXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVOb2RlID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVOb2RlICYmIG9mZnNldCA+IHZhbHVlTm9kZS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50S2V5ID0gbm9kZS5rZXkudmFsdWU7XG4gICAgICAgICAgICAgICAgZG9jLnZpc2l0KChuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuLnR5cGUgPT09ICdwcm9wZXJ0eScgJiYgbi5rZXkudmFsdWUgPT09IHBhcmVudEtleSAmJiBuLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMobi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50LnR5cGUgPT09ICdwcm9wZXJ0eScpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudEtleSA9IG5vZGUucGFyZW50LmtleS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgZG9jLnZpc2l0KChuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobi50eXBlID09PSAncHJvcGVydHknICYmIG4ua2V5LnZhbHVlID09PSBwYXJlbnRLZXkgJiYgbi52YWx1ZSAmJiBuLnZhbHVlLnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAobi52YWx1ZS5pdGVtcykuZm9yRWFjaCgobikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMobik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2RlLml0ZW1zLmZvckVhY2goKG4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclZhbHVlcyhuKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGdldFZhbHVlU3VnZ2VzdGlvbnMocmVzb3VyY2UsIHNjaGVtYSwgZG9jLCBub2RlLCBvZmZzZXQsIGNvbGxlY3Rvcikge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24oc2NoZW1hLnNjaGVtYSwgY29sbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRLZXkgPSBudWxsO1xuICAgICAgICAgICAgaWYgKG5vZGUgJiYgKG5vZGUudHlwZSA9PT0gJ3Byb3BlcnR5JykgJiYgb2Zmc2V0ID4gbm9kZS5jb2xvbk9mZnNldCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZU5vZGUgPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZU5vZGUgJiYgb2Zmc2V0ID4gdmFsdWVOb2RlLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudEtleSA9IG5vZGUua2V5LnZhbHVlO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlICYmIChwYXJlbnRLZXkgIT09IG51bGwgfHwgbm9kZS50eXBlID09PSAnYXJyYXknKSkge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaGluZ1NjaGVtYXMgPSBbXTtcbiAgICAgICAgICAgICAgICBkb2MudmFsaWRhdGUoc2NoZW1hLnNjaGVtYSwgbWF0Y2hpbmdTY2hlbWFzLCBub2RlLnN0YXJ0KTtcbiAgICAgICAgICAgICAgICBtYXRjaGluZ1NjaGVtYXMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocy5ub2RlID09PSBub2RlICYmICFzLmludmVydGVkICYmIHMuc2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocy5zY2hlbWEuaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHMuc2NoZW1hLml0ZW1zLCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRW51bVN1Z2dlc3Rpb24ocy5zY2hlbWEuaXRlbXMsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocy5zY2hlbWEucHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVNjaGVtYSA9IHMuc2NoZW1hLnByb3BlcnRpZXNbcGFyZW50S2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlTY2hlbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREZWZhdWx0U3VnZ2VzdGlvbihwcm9wZXJ0eVNjaGVtYSwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihwcm9wZXJ0eVNjaGVtYSwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGRCb29sZWFuU3VnZ2VzdGlvbih2YWx1ZSwgY29sbGVjdG9yKSB7XG4gICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25UeXBlKCdib29sZWFuJyksIGxhYmVsOiB2YWx1ZSA/ICd0cnVlJyA6ICdmYWxzZScsIGNvZGVTbmlwcGV0OiB0aGlzLmdldFRleHRGb3JFbnVtVmFsdWUodmFsdWUpLCBkb2N1bWVudGF0aW9uTGFiZWw6ICcnIH0pO1xuICAgIH1cbiAgICBhZGRFbnVtU3VnZ2VzdGlvbihzY2hlbWEsIGNvbGxlY3Rvcikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZW51bSkpIHtcbiAgICAgICAgICAgIHNjaGVtYS5lbnVtLmZvckVhY2goKGVubSkgPT4gY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvblR5cGUoc2NoZW1hLnR5cGUpLCBsYWJlbDogdGhpcy5nZXRMYWJlbEZvclZhbHVlKGVubSksIGNvZGVTbmlwcGV0OiB0aGlzLmdldFRleHRGb3JFbnVtVmFsdWUoZW5tKSwgZG9jdW1lbnRhdGlvbkxhYmVsOiAnJyB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NoZW1hLnR5cGUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbih0cnVlLCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbihmYWxzZSwgY29sbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEuYWxsT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEuYW55T2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEub25lT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGREZWZhdWx0U3VnZ2VzdGlvbihzY2hlbWEsIGNvbGxlY3Rvcikge1xuICAgICAgICBpZiAoc2NoZW1hLmRlZmF1bHQpIHtcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoe1xuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvblR5cGUoc2NoZW1hLnR5cGUpLFxuICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLmdldExhYmVsRm9yVmFsdWUoc2NoZW1hLmRlZmF1bHQpLFxuICAgICAgICAgICAgICAgIGNvZGVTbmlwcGV0OiB0aGlzLmdldFRleHRGb3JWYWx1ZShzY2hlbWEuZGVmYXVsdCksXG4gICAgICAgICAgICAgICAgdHlwZUxhYmVsOiAnRGVmYXVsdCB2YWx1ZScsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZGVmYXVsdFNuaXBwZXRzKSkge1xuICAgICAgICAgICAgc2NoZW1hLmRlZmF1bHRTbmlwcGV0cy5mb3JFYWNoKHMgPT4ge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc25pcHBldCcsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0aGlzLmdldExhYmVsRm9yU25pcHBldFZhbHVlKHMuYm9keSksXG4gICAgICAgICAgICAgICAgICAgIGNvZGVTbmlwcGV0OiB0aGlzLmdldFRleHRGb3JTbmlwcGV0VmFsdWUocy5ib2R5KVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkge1xuICAgICAgICAgICAgc2NoZW1hLmFsbE9mLmZvckVhY2goKHMpID0+IHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocywgY29sbGVjdG9yKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFueU9mKSkge1xuICAgICAgICAgICAgc2NoZW1hLmFueU9mLmZvckVhY2goKHMpID0+IHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocywgY29sbGVjdG9yKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLm9uZU9mKSkge1xuICAgICAgICAgICAgc2NoZW1hLm9uZU9mLmZvckVhY2goKHMpID0+IHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocywgY29sbGVjdG9yKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0TGFiZWxGb3JWYWx1ZSh2YWx1ZSkge1xuICAgICAgICB2YXIgbGFiZWwgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgIGxhYmVsID0gbGFiZWwucmVwbGFjZSgne3snLCAnJykucmVwbGFjZSgnfX0nLCAnJyk7XG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggPiA1Nykge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVsLnN1YnN0cigwLCA1NykudHJpbSgpICsgJy4uLic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgIH1cbiAgICBnZXRMYWJlbEZvclNuaXBwZXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICBsZXQgbGFiZWwgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgIGxhYmVsID0gbGFiZWwucmVwbGFjZSgvXFx7XFx7fFxcfVxcfS9nLCAnJyk7XG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggPiA1Nykge1xuICAgICAgICAgICAgcmV0dXJuIGxhYmVsLnN1YnN0cigwLCA1NykudHJpbSgpICsgJy4uLic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgIH1cbiAgICBnZXRUZXh0Rm9yVmFsdWUodmFsdWUpIHtcbiAgICAgICAgdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgJ1xcdCcpO1xuICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9bXFxcXFxce1xcfV0vZywgJ1xcXFwkJicpO1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG4gICAgZ2V0VGV4dEZvclNuaXBwZXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUsIG51bGwsICdcXHQnKTtcbiAgICB9XG4gICAgZ2V0VGV4dEZvckVudW1WYWx1ZSh2YWx1ZSkge1xuICAgICAgICB2YXIgc25pcHBldCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlLCBudWxsLCAnXFx0Jyk7XG4gICAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3t7bnVsbH19JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNuaXBwZXQ7XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgIHJldHVybiAnXCJ7eycgKyBzbmlwcGV0LnN1YnN0cigxLCBzbmlwcGV0Lmxlbmd0aCAtIDIpICsgJ319XCInO1xuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGNhc2UgJ2ludGVnZXInOlxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuICd7eycgKyBzbmlwcGV0ICsgJ319JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc25pcHBldDtcbiAgICB9XG4gICAgZ2V0U3VnZ2VzdGlvblR5cGUodHlwZSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSkge1xuICAgICAgICAgICAgdmFyIGFycmF5ID0gdHlwZTtcbiAgICAgICAgICAgIHR5cGUgPSBhcnJheS5sZW5ndGggPiAwID8gYXJyYXlbMF0gOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuICd0ZXh0JztcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6IHJldHVybiAndGV4dCc7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiByZXR1cm4gJ21vZHVsZSc7XG4gICAgICAgICAgICBjYXNlICdwcm9wZXJ0eSc6IHJldHVybiAncHJvcGVydHknO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuICd2YWx1ZSc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0VGV4dEZvck1hdGNoaW5nTm9kZShub2RlLCBtb2RlbE1pcnJvcikge1xuICAgICAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnYXJyYXknOlxuICAgICAgICAgICAgICAgIHJldHVybiAnW10nO1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3t9JztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBtb2RlbE1pcnJvci5nZXRWYWx1ZUluUmFuZ2UobW9kZWxNaXJyb3IuZ2V0UmFuZ2VGcm9tT2Zmc2V0QW5kTGVuZ3RoKG5vZGUuc3RhcnQsIG5vZGUuZW5kIC0gbm9kZS5zdGFydCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFRleHRGb3JQcm9wZXJ0eShrZXksIHByb3BlcnR5U2NoZW1hLCBhZGRWYWx1ZSwgaXNMYXN0KSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLmdldFRleHRGb3JWYWx1ZShrZXkpO1xuICAgICAgICBpZiAoIWFkZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSAnOiAnO1xuICAgICAgICB2YXIgZGVmYXVsdFZhbCA9IHByb3BlcnR5U2NoZW1hLmRlZmF1bHQ7XG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChkZWZhdWx0VmFsKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgdGhpcy5nZXRUZXh0Rm9yRW51bVZhbHVlKGRlZmF1bHRWYWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByb3BlcnR5U2NoZW1hLmVudW0gJiYgcHJvcGVydHlTY2hlbWEuZW51bS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyB0aGlzLmdldFRleHRGb3JFbnVtVmFsdWUocHJvcGVydHlTY2hlbWEuZW51bVswXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5U2NoZW1hLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd7e2ZhbHNlfX0nO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1wie3t9fVwiJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd7XFxuXFx0e3t9fVxcbn0nO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhcnJheSc6XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnW1xcblxcdHt7fX1cXG5dJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpbnRlZ2VyJzpcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd7ezB9fSc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3t7bnVsbH19JztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzTGFzdCkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICcsJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBnZXRUZXh0Rm9yU2ltaWxhclByb3BlcnR5KGtleSwgdGVtcGxhdGVWYWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZXh0Rm9yVmFsdWUoa2V5KTtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
