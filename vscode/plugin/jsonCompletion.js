'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONCompletion = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _textBuffer = require('text-buffer');

var _textBuffer2 = _interopRequireDefault(_textBuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Range = _textBuffer2.default.Range;

var JSONCompletion = exports.JSONCompletion = function () {
    function JSONCompletion(schemaService) {
        var contributions = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, JSONCompletion);

        this.schemaService = schemaService;
        this.contributions = contributions;
        this.console = console;
    }

    _createClass(JSONCompletion, [{
        key: 'doResolve',
        value: function doResolve(item) {
            for (var i = this.contributions.length - 1; i >= 0; i--) {
                if (this.contributions[i].resolveSuggestion) {
                    var resolver = this.contributions[i].resolveSuggestion(item);
                    if (resolver) {
                        return resolver;
                    }
                }
            }
            return Promise.resolve(item);
        }
    }, {
        key: 'doSuggest',
        value: function doSuggest(document, textDocumentPosition, doc) {
            var _this = this;

            var offset = document.getBuffer().characterIndexForPosition(textDocumentPosition);
            var node = doc.getNodeFromOffsetEndInclusive(offset);
            var currentWord = this.getCurrentWord(document, offset);
            var overwriteRange = null;
            var result = {
                items: [],
                isIncomplete: false
            };
            if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
                overwriteRange = new Range(node.start, node.end);
            } else {
                overwriteRange = new Range(offset - currentWord.length, offset);
            }
            var proposed = {};
            var collector = {
                add: function add(suggestion) {
                    if (!proposed[suggestion.text]) {
                        proposed[suggestion.text] = true;
                        if (overwriteRange) {
                            suggestion.text = TextEdit.replace(overwriteRange, suggestion.text);
                        }
                        result.items.push(suggestion);
                    }
                },
                setAsIncomplete: function setAsIncomplete() {
                    result.isIncomplete = true;
                },
                error: function error(message) {
                    _this.console.error(message);
                },
                log: function log(message) {
                    _this.console.log(message);
                }
            };
            return this.schemaService.getSchemaForResource(document.getURI(), doc).then(function (schema) {
                var collectionPromises = [];
                var addValue = true;
                var currentKey = '';
                var currentProperty = null;
                if (node) {
                    if (node.type === 'string') {
                        var stringNode = node;
                        if (stringNode.isKey) {
                            addValue = !(node.parent && node.parent.value);
                            currentProperty = node.parent ? node.parent : null;
                            currentKey = document.getText().substring(node.start + 1, node.end - 1);
                            if (node.parent) {
                                node = node.parent.parent;
                            }
                        }
                    }
                }
                if (node && node.type === 'object') {
                    var _ret = function () {
                        if (node.start === offset) {
                            return {
                                v: result
                            };
                        }
                        var properties = node.properties;
                        properties.forEach(function (p) {
                            if (!currentProperty || currentProperty !== p) {
                                proposed[p.key.value] = true;
                            }
                        });
                        var isLast = properties.length === 0 || offset >= properties[properties.length - 1].start;
                        if (schema) {
                            _this.getPropertySuggestions(schema, doc, node, addValue, isLast, collector);
                        } else {
                            _this.getSchemaLessPropertySuggestions(doc, node, currentKey, currentWord, isLast, collector);
                        }
                        var location = node.getNodeLocation();
                        _this.contributions.forEach(function (contribution) {
                            var collectPromise = contribution.collectPropertySuggestions(document.getURI(), location, currentWord, addValue, isLast, collector);
                            if (collectPromise) {
                                collectionPromises.push(collectPromise);
                            }
                        });
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                }
                if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
                    node = node.parent;
                }
                if (schema) {
                    _this.getValueSuggestions(schema, doc, node, offset, collector);
                } else {
                    _this.getSchemaLessValueSuggestions(doc, node, offset, document, collector);
                }
                if (!node) {
                    _this.contributions.forEach(function (contribution) {
                        var collectPromise = contribution.collectDefaultSuggestions(document.getURI(), collector);
                        if (collectPromise) {
                            collectionPromises.push(collectPromise);
                        }
                    });
                } else {
                    if (node.type === 'property' && offset > node.colonOffset) {
                        (function () {
                            var parentKey = node.key.value;
                            var valueNode = node.value;
                            if (!valueNode || offset <= valueNode.end) {
                                (function () {
                                    var location = node.parent.getNodeLocation();
                                    _this.contributions.forEach(function (contribution) {
                                        var collectPromise = contribution.collectValueSuggestions(document.getURI(), location, parentKey, collector);
                                        if (collectPromise) {
                                            collectionPromises.push(collectPromise);
                                        }
                                    });
                                })();
                            }
                        })();
                    }
                }
                return Promise.all(collectionPromises).then(function () {
                    return result;
                });
            });
        }
    }, {
        key: 'getPropertySuggestions',
        value: function getPropertySuggestions(schema, doc, node, addValue, isLast, collector) {
            var _this2 = this;

            var matchingSchemas = [];
            doc.validate(schema.schema, matchingSchemas, node.start);
            matchingSchemas.forEach(function (s) {
                if (s.node === node && !s.inverted) {
                    (function () {
                        var schemaProperties = s.schema.properties;
                        if (schemaProperties) {
                            Object.keys(schemaProperties).forEach(function (key) {
                                var propertySchema = schemaProperties[key];
                                collector.add({ type: "property", displayText: key, text: _this2.getTextForProperty(key, propertySchema, addValue, isLast), description: propertySchema.description || '' });
                            });
                        }
                    })();
                }
            });
        }
    }, {
        key: 'getSchemaLessPropertySuggestions',
        value: function getSchemaLessPropertySuggestions(doc, node, currentKey, currentWord, isLast, collector) {
            var _this3 = this;

            var collectSuggestionsForSimilarObject = function collectSuggestionsForSimilarObject(obj) {
                obj.properties.forEach(function (p) {
                    var key = p.key.value;
                    collector.add({ type: "property", displayText: key, text: _this3.getTextForSimilarProperty(key, p.value), description: '' });
                });
            };
            if (node.parent) {
                if (node.parent.type === 'property') {
                    (function () {
                        var parentKey = node.parent.key.value;
                        doc.visit(function (n) {
                            if (n.type === 'property' && n.key.value === parentKey && n.value && n.value.type === 'object') {
                                collectSuggestionsForSimilarObject(n.value);
                            }
                            return true;
                        });
                    })();
                } else if (node.parent.type === 'array') {
                    node.parent.items.forEach(function (n) {
                        if (n.type === 'object' && n !== node) {
                            collectSuggestionsForSimilarObject(n);
                        }
                    });
                }
            }
            if (!currentKey && currentWord.length > 0) {
                collector.add({ type: "property", displayText: this.getLabelForValue(currentWord), text: this.getTextForProperty(currentWord, null, true, isLast), description: '' });
            }
        }
    }, {
        key: 'getSchemaLessValueSuggestions',
        value: function getSchemaLessValueSuggestions(doc, node, offset, document, collector) {
            var _this4 = this;

            var collectSuggestionsForValues = function collectSuggestionsForValues(value) {
                if (!value.contains(offset)) {
                    var content = _this4.getTextForMatchingNode(value, document);
                    collector.add({ type: _this4.getSuggestionKind(value.type), displayText: content, text: content, description: '' });
                }
                if (value.type === 'boolean') {
                    _this4.addBooleanSuggestion(!value.getValue(), collector);
                }
            };
            if (!node) {
                collector.add({ type: this.getSuggestionKind('object'), displayText: 'Empty object', text: '{\n\t{{}}\n}', description: '' });
                collector.add({ type: this.getSuggestionKind('array'), displayText: 'Empty array', text: '[\n\t{{}}\n]', description: '' });
            } else {
                if (node.type === 'property' && offset > node.colonOffset) {
                    var _ret6 = function () {
                        var valueNode = node.value;
                        if (valueNode && offset > valueNode.end) {
                            return {
                                v: void 0
                            };
                        }
                        var parentKey = node.key.value;
                        doc.visit(function (n) {
                            if (n.type === 'property' && n.key.value === parentKey && n.value) {
                                collectSuggestionsForValues(n.value);
                            }
                            return true;
                        });
                    }();

                    if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
                }
                if (node.type === 'array') {
                    if (node.parent && node.parent.type === 'property') {
                        (function () {
                            var parentKey = node.parent.key.value;
                            doc.visit(function (n) {
                                if (n.type === 'property' && n.key.value === parentKey && n.value && n.value.type === 'array') {
                                    n.value.items.forEach(function (n) {
                                        collectSuggestionsForValues(n);
                                    });
                                }
                                return true;
                            });
                        })();
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
        value: function getValueSuggestions(schema, doc, node, offset, collector) {
            var _this5 = this;

            if (!node) {
                this.addDefaultSuggestion(schema.schema, collector);
            } else {
                var _ret8 = function () {
                    var parentKey = null;
                    if (node && node.type === 'property' && offset > node.colonOffset) {
                        var valueNode = node.value;
                        if (valueNode && offset > valueNode.end) {
                            return {
                                v: void 0
                            };
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
                }();

                if ((typeof _ret8 === 'undefined' ? 'undefined' : _typeof(_ret8)) === "object") return _ret8.v;
            }
        }
    }, {
        key: 'addBooleanSuggestion',
        value: function addBooleanSuggestion(value, collector) {
            collector.add({ type: this.getSuggestionKind('boolean'), displayText: value ? 'true' : 'false', text: this.getTextForValue(value), description: '' });
        }
    }, {
        key: 'addNullSuggestion',
        value: function addNullSuggestion(collector) {
            collector.add({ type: this.getSuggestionKind('null'), displayText: 'null', text: 'null', description: '' });
        }
    }, {
        key: 'addEnumSuggestion',
        value: function addEnumSuggestion(schema, collector) {
            var _this6 = this;

            if (Array.isArray(schema.enum)) {
                schema.enum.forEach(function (enm) {
                    return collector.add({ type: _this6.getSuggestionKind(schema.type), displayText: _this6.getLabelForValue(enm), text: _this6.getTextForValue(enm), description: '' });
                });
            } else {
                if (this.isType(schema, 'boolean')) {
                    this.addBooleanSuggestion(true, collector);
                    this.addBooleanSuggestion(false, collector);
                }
                if (this.isType(schema, 'null')) {
                    this.addNullSuggestion(collector);
                }
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
        key: 'isType',
        value: function isType(schema, type) {
            if (Array.isArray(schema.type)) {
                return schema.type.indexOf(type) !== -1;
            }
            return schema.type === type;
        }
    }, {
        key: 'addDefaultSuggestion',
        value: function addDefaultSuggestion(schema, collector) {
            var _this7 = this;

            if (schema.default) {
                collector.add({
                    type: this.getSuggestionKind(schema.type),
                    displayText: this.getLabelForValue(schema.default),
                    text: this.getTextForValue(schema.default),
                    description: 'Default value'
                });
            }
            if (Array.isArray(schema.defaultSnippets)) {
                schema.defaultSnippets.forEach(function (s) {
                    collector.add({
                        type: "snippet",
                        displayText: _this7.getLabelForSnippetValue(s.body),
                        text: _this7.getTextForSnippetValue(s.body)
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
            var snippet = this.getTextForValue(value);
            switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
                case 'object':
                    if (value === null) {
                        return '{{null}}';
                    }
                    return snippet;
                case 'string':
                    return '"{{' + snippet.substr(1, snippet.length - 2) + '}}"';
                case 'number':
                case 'boolean':
                    return '{{' + snippet + '}}';
            }
            return snippet;
        }
    }, {
        key: 'getSuggestionKind',
        value: function getSuggestionKind(type) {
            if (Array.isArray(type)) {
                var array = type;
                type = array.length > 0 ? array[0] : null;
            }
            if (!type) {
                return "value";
            }
            switch (type) {
                case 'string':
                    return "value";
                case 'object':
                    return "module";
                case 'property':
                    return "property";
                default:
                    return "value";
            }
        }
    }, {
        key: 'getTextForMatchingNode',
        value: function getTextForMatchingNode(node, document) {
            switch (node.type) {
                case 'array':
                    return '[]';
                case 'object':
                    return '{}';
                default:
                    var content = document.getText().substr(node.start, node.end - node.start);
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
            if (propertySchema) {
                var defaultVal = propertySchema.default;
                if (typeof defaultVal !== 'undefined') {
                    result = result + this.getTextForEnumValue(defaultVal);
                } else if (propertySchema.enum && propertySchema.enum.length > 0) {
                    result = result + this.getTextForEnumValue(propertySchema.enum[0]);
                } else {
                    var type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
                    switch (type) {
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
                            result += '{{0}}';
                            break;
                        case 'null':
                            result += '{{null}}';
                            break;
                        default:
                            return result;
                    }
                }
            } else {
                result += '{{0}}';
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
    }, {
        key: 'getCurrentWord',
        value: function getCurrentWord(document, offset) {
            var i = offset - 1;
            var text = document.getText();
            while (i >= 0 && ' \t\n\r\v":{[,'.indexOf(text.charAt(i)) === -1) {
                i--;
            }
            return text.substring(i + 1, offset);
        }
    }]);

    return JSONCompletion;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbkNvbXBsZXRpb24udHMiLCJ2c2NvZGUvcGx1Z2luL2pzb25Db21wbGV0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7OztBQ0hBOzs7Ozs7OztBRFdBLElBQU0sUUFBUSxxQkFBVyxLQUF6Qjs7SUFjQSxjLFdBQUEsYztBQU1JLDRCQUFZLGFBQVosRUFBMEc7QUFBQSxZQUE3QyxhQUE2Qyx5REFBRixFQUFFOztBQUFBOztBQUN0RyxhQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFDQSxhQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFDQSxhQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0g7Ozs7a0NBRWdCLEksRUFBZ0I7QUFDN0IsaUJBQUssSUFBSSxJQUFJLEtBQUssYUFBTCxDQUFtQixNQUFuQixHQUE0QixDQUF6QyxFQUE0QyxLQUFLLENBQWpELEVBQW9ELEdBQXBELEVBQXlEO0FBQ3JELG9CQUFJLEtBQUssYUFBTCxDQUFtQixDQUFuQixFQUFzQixpQkFBMUIsRUFBNkM7QUFDekMsd0JBQUksV0FBVyxLQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsaUJBQXRCLENBQXdDLElBQXhDLENBQWY7QUFDQSx3QkFBSSxRQUFKLEVBQWM7QUFDViwrQkFBTyxRQUFQO0FBQ0g7QUFDSjtBQUNKO0FBQ0QsbUJBQU8sUUFBUSxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDSDs7O2tDQUVnQixRLEVBQTJCLG9CLEVBQXdDLEcsRUFBd0I7QUFBQTs7QUFFeEcsZ0JBQUksU0FBUyxTQUFTLFNBQVQsR0FBcUIseUJBQXJCLENBQStDLG9CQUEvQyxDQUFiO0FBQ0EsZ0JBQUksT0FBTyxJQUFJLDZCQUFKLENBQWtDLE1BQWxDLENBQVg7QUFFQSxnQkFBSSxjQUFjLEtBQUssY0FBTCxDQUFvQixRQUFwQixFQUE4QixNQUE5QixDQUFsQjtBQUNBLGdCQUFJLGlCQUFtQyxJQUF2QztBQUNBLGdCQUFJLFNBQXlCO0FBQ3pCLHVC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QkFBUSxJQUFSO0FBQ0ksNkJBQUssU0FBTDtBQUNJLHNDQUFVLFdBQVY7QUFDQTtBQUNKLDZCQUFLLFFBQUw7QUFDSSxzQ0FBVSxRQUFWO0FBQ0E7QUFDSiw2QkFBSyxRQUFMO0FBQ0ksc0NBQVUsY0FBVjtBQUNBO0FBQ0osNkJBQUssT0FBTDtBQUNJLHNDQUFVLGNBQVY7QUFDQTtBQUNKLDZCQUFLLFFBQUw7QUFDSSxzQ0FBVSxPQUFWO0FBQ0E7QUFDSiw2QkFBSyxNQUFMO0FBQ0ksc0NBQVUsVUFBVjtBQUNBO0FBQ0o7QUFDSSxtQ0FBTyxNQUFQO0FBcEJSO0FBc0JIO0FBQ0osYUEvQkQsTUErQk87QUFDSCwwQkFBVSxPQUFWO0FBQ0g7QUFDRCxnQkFBSSxDQUFDLE1BQUwsRUFBYTtBQUNULDBCQUFVLEdBQVY7QUFDSDtBQUNELG1CQUFPLE1BQVA7QUFDSDs7O2tEQUVpQyxHLEVBQWEsYSxFQUE2QjtBQUN4RSxtQkFBTyxLQUFLLGVBQUwsQ0FBcUIsR0FBckIsQ0FBUDtBQUNIOzs7dUNBRXNCLFEsRUFBMkIsTSxFQUFjO0FBQzVELGdCQUFJLElBQUksU0FBUyxDQUFqQjtBQUNBLGdCQUFJLE9BQU8sU0FBUyxPQUFULEVBQVg7QUFDQSxtQkFBTyxLQUFLLENBQUwsSUFBVSxpQkFBaUIsT0FBakIsQ0FBeUIsS0FBSyxNQUFMLENBQVksQ0FBWixDQUF6QixNQUE2QyxDQUFDLENBQS9ELEVBQWtFO0FBQzlEO0FBQ0g7QUFDRCxtQkFBTyxLQUFLLFNBQUwsQ0FBZSxJQUFFLENBQWpCLEVBQW9CLE1BQXBCLENBQVA7QUFDSCIsImZpbGUiOiJ2c2NvZGUvcGx1Z2luL2pzb25Db21wbGV0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcblxyXG5pbXBvcnQgUGFyc2VyIGZyb20gJy4vanNvblBhcnNlcic7XHJcbmltcG9ydCBTY2hlbWFTZXJ2aWNlIGZyb20gJy4vanNvblNjaGVtYVNlcnZpY2UnO1xyXG5pbXBvcnQgSnNvblNjaGVtYSBmcm9tICcuL2pzb25TY2hlbWEnO1xyXG5pbXBvcnQge0lKU09OV29ya2VyQ29udHJpYnV0aW9ufSBmcm9tICcuL2pzb25Db250cmlidXRpb25zJztcclxuaW1wb3J0IFRleHRCdWZmZXIgZnJvbSBcInRleHQtYnVmZmVyXCI7XHJcbmNvbnN0IFJhbmdlID0gVGV4dEJ1ZmZlci5SYW5nZTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVN1Z2dlc3Rpb25zQ29sbGVjdG9yIHtcclxuICAgIGFkZChzdWdnZXN0aW9uOiBTdWdnZXN0aW9uKTogdm9pZDtcclxuICAgIGVycm9yKG1lc3NhZ2U6c3RyaW5nKTogdm9pZDtcclxuICAgIGxvZyhtZXNzYWdlOnN0cmluZyk6IHZvaWQ7XHJcbiAgICBzZXRBc0luY29tcGxldGUoKTogdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb21wbGV0aW9uTGlzdCB7XHJcbiAgICBpdGVtczogU3VnZ2VzdGlvbltdLFxyXG4gICAgaXNJbmNvbXBsZXRlOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSlNPTkNvbXBsZXRpb24ge1xyXG5cclxuICAgIHByaXZhdGUgc2NoZW1hU2VydmljZTogU2NoZW1hU2VydmljZS5JSlNPTlNjaGVtYVNlcnZpY2U7XHJcbiAgICBwcml2YXRlIGNvbnRyaWJ1dGlvbnM6IElKU09OV29ya2VyQ29udHJpYnV0aW9uW107XHJcbiAgICBwcml2YXRlIGNvbnNvbGU6IENvbnNvbGU7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2NoZW1hU2VydmljZTogU2NoZW1hU2VydmljZS5JSlNPTlNjaGVtYVNlcnZpY2UsIGNvbnRyaWJ1dGlvbnM6IElKU09OV29ya2VyQ29udHJpYnV0aW9uW10gPSBbXSkge1xyXG4gICAgICAgIHRoaXMuc2NoZW1hU2VydmljZSA9IHNjaGVtYVNlcnZpY2U7XHJcbiAgICAgICAgdGhpcy5jb250cmlidXRpb25zID0gY29udHJpYnV0aW9ucztcclxuICAgICAgICB0aGlzLmNvbnNvbGUgPSBjb25zb2xlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb1Jlc29sdmUoaXRlbTogU3VnZ2VzdGlvbikgOiBQcm9taXNlPFN1Z2dlc3Rpb24+IHtcclxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jb250cmlidXRpb25zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRyaWJ1dGlvbnNbaV0ucmVzb2x2ZVN1Z2dlc3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGxldCByZXNvbHZlciA9IHRoaXMuY29udHJpYnV0aW9uc1tpXS5yZXNvbHZlU3VnZ2VzdGlvbihpdGVtKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGl0ZW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkb1N1Z2dlc3QoZG9jdW1lbnQ6IEF0b20uVGV4dEVkaXRvciwgdGV4dERvY3VtZW50UG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCk6IFByb21pc2U8Q29tcGxldGlvbkxpc3Q+IHtcclxuXHJcbiAgICAgICAgbGV0IG9mZnNldCA9IGRvY3VtZW50LmdldEJ1ZmZlcigpLmNoYXJhY3RlckluZGV4Rm9yUG9zaXRpb24odGV4dERvY3VtZW50UG9zaXRpb24pO1xyXG4gICAgICAgIGxldCBub2RlID0gZG9jLmdldE5vZGVGcm9tT2Zmc2V0RW5kSW5jbHVzaXZlKG9mZnNldCk7XHJcblxyXG4gICAgICAgIGxldCBjdXJyZW50V29yZCA9IHRoaXMuZ2V0Q3VycmVudFdvcmQoZG9jdW1lbnQsIG9mZnNldCk7XHJcbiAgICAgICAgbGV0IG92ZXJ3cml0ZVJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlID0gbnVsbDtcclxuICAgICAgICBsZXQgcmVzdWx0OiBDb21wbGV0aW9uTGlzdCA9IHtcclxuICAgICAgICAgICAgaXRlbXM6IFtdLFxyXG4gICAgICAgICAgICBpc0luY29tcGxldGU6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgJiYgKG5vZGUudHlwZSA9PT0gJ3N0cmluZycgfHwgbm9kZS50eXBlID09PSAnbnVtYmVyJyB8fCBub2RlLnR5cGUgPT09ICdib29sZWFuJyB8fCBub2RlLnR5cGUgPT09ICdudWxsJykpIHtcclxuICAgICAgICAgICAgb3ZlcndyaXRlUmFuZ2UgPSBuZXcgUmFuZ2Uobm9kZS5zdGFydCwgbm9kZS5lbmQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG92ZXJ3cml0ZVJhbmdlID0gbmV3IFJhbmdlKG9mZnNldCAtIGN1cnJlbnRXb3JkLmxlbmd0aCwgb2Zmc2V0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwcm9wb3NlZDogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0gPSB7fTtcclxuICAgICAgICBsZXQgY29sbGVjdG9yOiBJU3VnZ2VzdGlvbnNDb2xsZWN0b3IgPSB7XHJcbiAgICAgICAgICAgIGFkZDogKHN1Z2dlc3Rpb246IFN1Z2dlc3Rpb24pID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghcHJvcG9zZWRbc3VnZ2VzdGlvbi50ZXh0XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3Bvc2VkW3N1Z2dlc3Rpb24udGV4dF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdmVyd3JpdGVSYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uLnRleHQgPSBUZXh0RWRpdC5yZXBsYWNlKG92ZXJ3cml0ZVJhbmdlLCBzdWdnZXN0aW9uLnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lml0ZW1zLnB1c2goc3VnZ2VzdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldEFzSW5jb21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmlzSW5jb21wbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiAobWVzc2FnZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGxvZzogKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25zb2xlLmxvZyhtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnNjaGVtYVNlcnZpY2UuZ2V0U2NoZW1hRm9yUmVzb3VyY2UoZG9jdW1lbnQuZ2V0VVJJKCksIGRvYykudGhlbigoc2NoZW1hKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBjb2xsZWN0aW9uUHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XHJcblxyXG4gICAgICAgICAgICBsZXQgYWRkVmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudEtleSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRQcm9wZXJ0eTogUGFyc2VyLlByb3BlcnR5QVNUTm9kZSA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmIChub2RlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3RyaW5nTm9kZSA9IDxQYXJzZXIuU3RyaW5nQVNUTm9kZT5ub2RlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJpbmdOb2RlLmlzS2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZFZhbHVlID0gIShub2RlLnBhcmVudCAmJiAoKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm5vZGUucGFyZW50KS52YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UHJvcGVydHkgPSBub2RlLnBhcmVudCA/IDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm5vZGUucGFyZW50IDogbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEtleSA9IGRvY3VtZW50LmdldFRleHQoKS5zdWJzdHJpbmcobm9kZS5zdGFydCArIDEsIG5vZGUuZW5kIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50LnBhcmVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gcHJvcG9zYWxzIGZvciBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIGlmIChub2RlICYmIG5vZGUudHlwZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIGRvbid0IHN1Z2dlc3Qga2V5cyB3aGVuIHRoZSBjdXJzb3IgaXMganVzdCBiZWZvcmUgdGhlIG9wZW5pbmcgY3VybHkgYnJhY2VcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLnN0YXJ0ID09PSBvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gZG9uJ3Qgc3VnZ2VzdCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGFscmVhZHkgcHJlc2VudFxyXG4gICAgICAgICAgICAgICAgbGV0IHByb3BlcnRpZXMgPSAoPFBhcnNlci5PYmplY3RBU1ROb2RlPm5vZGUpLnByb3BlcnRpZXM7XHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50UHJvcGVydHkgfHwgY3VycmVudFByb3BlcnR5ICE9PSBwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2VkW3Aua2V5LnZhbHVlXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGlzTGFzdCA9IHByb3BlcnRpZXMubGVuZ3RoID09PSAwIHx8IG9mZnNldCA+PSBwcm9wZXJ0aWVzW3Byb3BlcnRpZXMubGVuZ3RoIC0gMV0uc3RhcnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJvcGVydHkgcHJvcG9zYWxzIHdpdGggc2NoZW1hXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQcm9wZXJ0eVN1Z2dlc3Rpb25zKHNjaGVtYSwgZG9jLCBub2RlLCBhZGRWYWx1ZSwgaXNMYXN0LCBjb2xsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0eSBwcm9wb3NhbHMgd2l0aG91dCBzY2hlbWFcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFNjaGVtYUxlc3NQcm9wZXJ0eVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgY3VycmVudEtleSwgY3VycmVudFdvcmQsIGlzTGFzdCwgY29sbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbG9jYXRpb24gPSBub2RlLmdldE5vZGVMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25zLmZvckVhY2goKGNvbnRyaWJ1dGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb2xsZWN0UHJvbWlzZSA9IGNvbnRyaWJ1dGlvbi5jb2xsZWN0UHJvcGVydHlTdWdnZXN0aW9ucyhkb2N1bWVudC5nZXRVUkkoKSwgbG9jYXRpb24sIGN1cnJlbnRXb3JkLCBhZGRWYWx1ZSwgaXNMYXN0LCBjb2xsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0UHJvbWlzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uUHJvbWlzZXMucHVzaChjb2xsZWN0UHJvbWlzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBwcm9wb3NhbHMgZm9yIHZhbHVlc1xyXG4gICAgICAgICAgICBpZiAobm9kZSAmJiAobm9kZS50eXBlID09PSAnc3RyaW5nJyB8fCBub2RlLnR5cGUgPT09ICdudW1iZXInIHx8IG5vZGUudHlwZSA9PT0gJ2Jvb2xlYW4nIHx8IG5vZGUudHlwZSA9PT0gJ251bGwnKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2NoZW1hKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB2YWx1ZSBwcm9wb3NhbHMgd2l0aCBzY2hlbWFcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWVTdWdnZXN0aW9ucyhzY2hlbWEsIGRvYywgbm9kZSwgb2Zmc2V0LCBjb2xsZWN0b3IpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gdmFsdWUgcHJvcG9zYWxzIHdpdGhvdXQgc2NoZW1hXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldFNjaGVtYUxlc3NWYWx1ZVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgb2Zmc2V0LCBkb2N1bWVudCwgY29sbGVjdG9yKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvbnMuZm9yRWFjaCgoY29udHJpYnV0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbGxlY3RQcm9taXNlID0gY29udHJpYnV0aW9uLmNvbGxlY3REZWZhdWx0U3VnZ2VzdGlvbnMoZG9jdW1lbnQuZ2V0VVJJKCksIGNvbGxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3RQcm9taXNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25Qcm9taXNlcy5wdXNoKGNvbGxlY3RQcm9taXNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICgobm9kZS50eXBlID09PSAncHJvcGVydHknKSAmJiBvZmZzZXQgPiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+IG5vZGUpLmNvbG9uT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhcmVudEtleSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS5rZXkudmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZU5vZGUgPSAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+IG5vZGUpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWVOb2RlIHx8IG9mZnNldCA8PSB2YWx1ZU5vZGUuZW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IG5vZGUucGFyZW50LmdldE5vZGVMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvbnMuZm9yRWFjaCgoY29udHJpYnV0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29sbGVjdFByb21pc2UgPSBjb250cmlidXRpb24uY29sbGVjdFZhbHVlU3VnZ2VzdGlvbnMoZG9jdW1lbnQuZ2V0VVJJKCksIGxvY2F0aW9uLCBwYXJlbnRLZXksIGNvbGxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGVjdFByb21pc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uUHJvbWlzZXMucHVzaChjb2xsZWN0UHJvbWlzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoY29sbGVjdGlvblByb21pc2VzKS50aGVuKCgpID0+IHJlc3VsdCApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0UHJvcGVydHlTdWdnZXN0aW9ucyhzY2hlbWE6IFNjaGVtYVNlcnZpY2UuUmVzb2x2ZWRTY2hlbWEsIGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCwgbm9kZTogUGFyc2VyLkFTVE5vZGUsIGFkZFZhbHVlOiBib29sZWFuLCBpc0xhc3Q6IGJvb2xlYW4sIGNvbGxlY3RvcjogSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IG1hdGNoaW5nU2NoZW1hczogUGFyc2VyLklBcHBsaWNhYmxlU2NoZW1hW10gPSBbXTtcclxuICAgICAgICBkb2MudmFsaWRhdGUoc2NoZW1hLnNjaGVtYSwgbWF0Y2hpbmdTY2hlbWFzLCBub2RlLnN0YXJ0KTtcclxuXHJcbiAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLmZvckVhY2goKHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKHMubm9kZSA9PT0gbm9kZSAmJiAhcy5pbnZlcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjaGVtYVByb3BlcnRpZXMgPSBzLnNjaGVtYS5wcm9wZXJ0aWVzO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVtYVByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWFQcm9wZXJ0aWVzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHlTY2hlbWEgPSBzY2hlbWFQcm9wZXJ0aWVzW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiBcInByb3BlcnR5XCIsIGRpc3BsYXlUZXh0OiBrZXksIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclByb3BlcnR5KGtleSwgcHJvcGVydHlTY2hlbWEsIGFkZFZhbHVlLCBpc0xhc3QpLCBkZXNjcmlwdGlvbjogcHJvcGVydHlTY2hlbWEuZGVzY3JpcHRpb24gfHwgJycgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFNjaGVtYUxlc3NQcm9wZXJ0eVN1Z2dlc3Rpb25zKGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCwgbm9kZTogUGFyc2VyLkFTVE5vZGUsIGN1cnJlbnRLZXk6IHN0cmluZywgY3VycmVudFdvcmQ6IHN0cmluZywgaXNMYXN0OiBib29sZWFuLCBjb2xsZWN0b3I6IElTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IHZvaWQge1xyXG4gICAgICAgIGxldCBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JTaW1pbGFyT2JqZWN0ID0gKG9iajogUGFyc2VyLk9iamVjdEFTVE5vZGUpID0+IHtcclxuICAgICAgICAgICAgb2JqLnByb3BlcnRpZXMuZm9yRWFjaCgocCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IHAua2V5LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgY29sbGVjdG9yLmFkZCh7IHR5cGU6IFwicHJvcGVydHlcIiwgZGlzcGxheVRleHQ6IGtleSwgdGV4dDogdGhpcy5nZXRUZXh0Rm9yU2ltaWxhclByb3BlcnR5KGtleSwgcC52YWx1ZSksIGRlc2NyaXB0aW9uOiAnJyB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAobm9kZS5wYXJlbnQpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50LnR5cGUgPT09ICdwcm9wZXJ0eScpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBvYmplY3QgaXMgYSBwcm9wZXJ0eSB2YWx1ZSwgY2hlY2sgdGhlIHRyZWUgZm9yIG90aGVyIG9iamVjdHMgdGhhdCBoYW5nIHVuZGVyIGEgcHJvcGVydHkgb2YgdGhlIHNhbWUgbmFtZVxyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudEtleSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlLnBhcmVudCkua2V5LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZG9jLnZpc2l0KChuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG4udHlwZSA9PT0gJ3Byb3BlcnR5JyAmJiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikua2V5LnZhbHVlID09PSBwYXJlbnRLZXkgJiYgKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm4pLnZhbHVlICYmICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZS50eXBlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JTaW1pbGFyT2JqZWN0KDxQYXJzZXIuT2JqZWN0QVNUTm9kZT4oPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5vZGUucGFyZW50LnR5cGUgPT09ICdhcnJheScpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBvYmplY3QgaXMgaW4gYW4gYXJyYXksIHVzZSBhbGwgb3RoZXIgYXJyYXkgZWxlbWVudHMgYXMgc2ltaWxhciBvYmplY3RzXHJcbiAgICAgICAgICAgICAgICAoPFBhcnNlci5BcnJheUFTVE5vZGU+bm9kZS5wYXJlbnQpLml0ZW1zLmZvckVhY2goKG4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobi50eXBlID09PSAnb2JqZWN0JyAmJiBuICE9PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3QoPFBhcnNlci5PYmplY3RBU1ROb2RlPm4pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghY3VycmVudEtleSAmJiBjdXJyZW50V29yZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiBcInByb3BlcnR5XCIsIGRpc3BsYXlUZXh0OiB0aGlzLmdldExhYmVsRm9yVmFsdWUoY3VycmVudFdvcmQpLCB0ZXh0OiB0aGlzLmdldFRleHRGb3JQcm9wZXJ0eShjdXJyZW50V29yZCwgbnVsbCwgdHJ1ZSwgaXNMYXN0KSwgZGVzY3JpcHRpb246ICcnIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFNjaGVtYUxlc3NWYWx1ZVN1Z2dlc3Rpb25zKGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCwgbm9kZTogUGFyc2VyLkFTVE5vZGUsIG9mZnNldDogbnVtYmVyLCBkb2N1bWVudDogQXRvbS5UZXh0RWRpdG9yLCBjb2xsZWN0b3I6IElTdWdnZXN0aW9uc0NvbGxlY3Rvcik6IHZvaWQge1xyXG4gICAgICAgIGxldCBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMgPSAodmFsdWU6IFBhcnNlci5BU1ROb2RlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdmFsdWUuY29udGFpbnMob2Zmc2V0KSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLmdldFRleHRGb3JNYXRjaGluZ05vZGUodmFsdWUsIGRvY3VtZW50KTtcclxuICAgICAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25LaW5kKHZhbHVlLnR5cGUpLCBkaXNwbGF5VGV4dDogY29udGVudCwgdGV4dDogY29udGVudCwgZGVzY3JpcHRpb246ICcnIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS50eXBlID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkQm9vbGVhblN1Z2dlc3Rpb24oIXZhbHVlLmdldFZhbHVlKCksIGNvbGxlY3Rvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvbktpbmQoJ29iamVjdCcpLCBkaXNwbGF5VGV4dDogJ0VtcHR5IG9iamVjdCcsIHRleHQ6ICd7XFxuXFx0e3t9fVxcbn0nLCBkZXNjcmlwdGlvbjogJycgfSk7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25LaW5kKCdhcnJheScpLCBkaXNwbGF5VGV4dDogJ0VtcHR5IGFycmF5JywgdGV4dDogJ1tcXG5cXHR7e319XFxuXScsIGRlc2NyaXB0aW9uOiAnJyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAncHJvcGVydHknICYmIG9mZnNldCA+ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS5jb2xvbk9mZnNldCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlTm9kZSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZU5vZGUgJiYgb2Zmc2V0ID4gdmFsdWVOb2RlLmVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHN1Z2dlc3QgdmFsdWVzIGF0IHRoZSBzYW1lIGtleVxyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudEtleSA9ICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5ub2RlKS5rZXkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBkb2MudmlzaXQoKG4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobi50eXBlID09PSAncHJvcGVydHknICYmICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS5rZXkudmFsdWUgPT09IHBhcmVudEtleSAmJiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdFN1Z2dlc3Rpb25zRm9yVmFsdWVzKCg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ2FycmF5Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50LnR5cGUgPT09ICdwcm9wZXJ0eScpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzdWdnZXN0IGl0ZW1zIG9mIGFuIGFycmF5IGF0IHRoZSBzYW1lIGtleVxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJlbnRLZXkgPSAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bm9kZS5wYXJlbnQpLmtleS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkb2MudmlzaXQoKG4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4udHlwZSA9PT0gJ3Byb3BlcnR5JyAmJiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bikua2V5LnZhbHVlID09PSBwYXJlbnRLZXkgJiYgKDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm4pLnZhbHVlICYmICg8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZS50eXBlID09PSAnYXJyYXknKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKDxQYXJzZXIuQXJyYXlBU1ROb2RlPig8UGFyc2VyLlByb3BlcnR5QVNUTm9kZT5uKS52YWx1ZSkuaXRlbXMpLmZvckVhY2goKG4pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMoPFBhcnNlci5PYmplY3RBU1ROb2RlPm4pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHN1Z2dlc3QgaXRlbXMgaW4gdGhlIHNhbWUgYXJyYXlcclxuICAgICAgICAgICAgICAgICAgICAoPFBhcnNlci5BcnJheUFTVE5vZGU+bm9kZSkuaXRlbXMuZm9yRWFjaCgobikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMoPFBhcnNlci5PYmplY3RBU1ROb2RlPm4pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGdldFZhbHVlU3VnZ2VzdGlvbnMoc2NoZW1hOiBTY2hlbWFTZXJ2aWNlLlJlc29sdmVkU2NoZW1hLCBkb2M6IFBhcnNlci5KU09ORG9jdW1lbnQsIG5vZGU6IFBhcnNlci5BU1ROb2RlLCBvZmZzZXQ6IG51bWJlciwgY29sbGVjdG9yOiBJU3VnZ2VzdGlvbnNDb2xsZWN0b3IpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24oc2NoZW1hLnNjaGVtYSwgY29sbGVjdG9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgcGFyZW50S2V5OiBzdHJpbmcgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAobm9kZSAmJiAobm9kZS50eXBlID09PSAncHJvcGVydHknKSAmJiBvZmZzZXQgPiAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bm9kZSkuY29sb25PZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZU5vZGUgPSAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bm9kZSkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVOb2RlICYmIG9mZnNldCA+IHZhbHVlTm9kZS5lbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47IC8vIHdlIGFyZSBwYXN0IHRoZSB2YWx1ZSBub2RlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRLZXkgPSAoPFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGU+bm9kZSkua2V5LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChub2RlICYmIChwYXJlbnRLZXkgIT09IG51bGwgfHwgbm9kZS50eXBlID09PSAnYXJyYXknKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1hdGNoaW5nU2NoZW1hczogUGFyc2VyLklBcHBsaWNhYmxlU2NoZW1hW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGRvYy52YWxpZGF0ZShzY2hlbWEuc2NoZW1hLCBtYXRjaGluZ1NjaGVtYXMsIG5vZGUuc3RhcnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIG1hdGNoaW5nU2NoZW1hcy5mb3JFYWNoKChzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubm9kZSA9PT0gbm9kZSAmJiAhcy5pbnZlcnRlZCAmJiBzLnNjaGVtYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocy5zY2hlbWEuaXRlbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocy5zY2hlbWEuaXRlbXMsIGNvbGxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHMuc2NoZW1hLml0ZW1zLCBjb2xsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzLnNjaGVtYS5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHlTY2hlbWEgPSBzLnNjaGVtYS5wcm9wZXJ0aWVzW3BhcmVudEtleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlTY2hlbWEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHByb3BlcnR5U2NoZW1hLCBjb2xsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRW51bVN1Z2dlc3Rpb24ocHJvcGVydHlTY2hlbWEsIGNvbGxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGRCb29sZWFuU3VnZ2VzdGlvbih2YWx1ZTogYm9vbGVhbiwgY29sbGVjdG9yOiBJU3VnZ2VzdGlvbnNDb2xsZWN0b3IpOiB2b2lkIHtcclxuICAgICAgICBjb2xsZWN0b3IuYWRkKHsgdHlwZTogdGhpcy5nZXRTdWdnZXN0aW9uS2luZCgnYm9vbGVhbicpLCBkaXNwbGF5VGV4dDogdmFsdWUgPyAndHJ1ZScgOiAnZmFsc2UnLCB0ZXh0OiB0aGlzLmdldFRleHRGb3JWYWx1ZSh2YWx1ZSksIGRlc2NyaXB0aW9uOiAnJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFkZE51bGxTdWdnZXN0aW9uKGNvbGxlY3RvcjogSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKTogdm9pZCB7XHJcbiAgICAgICAgY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvbktpbmQoJ251bGwnKSwgZGlzcGxheVRleHQ6ICdudWxsJywgdGV4dDogJ251bGwnLCBkZXNjcmlwdGlvbjogJycgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGRFbnVtU3VnZ2VzdGlvbihzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIGNvbGxlY3RvcjogSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmVudW0pKSB7XHJcbiAgICAgICAgICAgIHNjaGVtYS5lbnVtLmZvckVhY2goKGVubSkgPT4gY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvbktpbmQoc2NoZW1hLnR5cGUpLCBkaXNwbGF5VGV4dDogdGhpcy5nZXRMYWJlbEZvclZhbHVlKGVubSksIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclZhbHVlKGVubSksIGRlc2NyaXB0aW9uOiAnJyB9KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNUeXBlKHNjaGVtYSwgJ2Jvb2xlYW4nKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbih0cnVlLCBjb2xsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbihmYWxzZSwgY29sbGVjdG9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1R5cGUoc2NoZW1hLCAnbnVsbCcpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE51bGxTdWdnZXN0aW9uKGNvbGxlY3Rvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkge1xyXG4gICAgICAgICAgICBzY2hlbWEuYWxsT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFueU9mKSkge1xyXG4gICAgICAgICAgICBzY2hlbWEuYW55T2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLm9uZU9mKSkge1xyXG4gICAgICAgICAgICBzY2hlbWEub25lT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGRFbnVtU3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpc1R5cGUoc2NoZW1hOiBKc29uU2NoZW1hLklKU09OU2NoZW1hLCB0eXBlOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEudHlwZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYS50eXBlLmluZGV4T2YodHlwZSkgIT09IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2NoZW1hLnR5cGUgPT09IHR5cGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGREZWZhdWx0U3VnZ2VzdGlvbihzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIGNvbGxlY3RvcjogSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHNjaGVtYS5kZWZhdWx0KSB7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogdGhpcy5nZXRTdWdnZXN0aW9uS2luZChzY2hlbWEudHlwZSksXHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5VGV4dDogdGhpcy5nZXRMYWJlbEZvclZhbHVlKHNjaGVtYS5kZWZhdWx0KSxcclxuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclZhbHVlKHNjaGVtYS5kZWZhdWx0KSxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVmYXVsdCB2YWx1ZScsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZGVmYXVsdFNuaXBwZXRzKSkge1xyXG4gICAgICAgICAgICBzY2hlbWEuZGVmYXVsdFNuaXBwZXRzLmZvckVhY2gocyA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0b3IuYWRkKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInNuaXBwZXRcIixcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5VGV4dDogdGhpcy5nZXRMYWJlbEZvclNuaXBwZXRWYWx1ZShzLmJvZHkpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclNuaXBwZXRWYWx1ZShzLmJvZHkpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XHJcbiAgICAgICAgICAgIHNjaGVtYS5hbGxPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XHJcbiAgICAgICAgICAgIHNjaGVtYS5hbnlPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpKSB7XHJcbiAgICAgICAgICAgIHNjaGVtYS5vbmVPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldExhYmVsRm9yVmFsdWUodmFsdWU6IGFueSk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGxhYmVsID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xyXG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggPiA1Nykge1xyXG4gICAgICAgICAgICByZXR1cm4gbGFiZWwuc3Vic3RyKDAsIDU3KS50cmltKCkgKyAnLi4uJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxhYmVsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0TGFiZWxGb3JTbmlwcGV0VmFsdWUodmFsdWU6IGFueSk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGxhYmVsID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xyXG4gICAgICAgIGxhYmVsID0gbGFiZWwucmVwbGFjZSgvXFx7XFx7fFxcfVxcfS9nLCAnJyk7XHJcbiAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCA+IDU3KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsYWJlbC5zdWJzdHIoMCwgNTcpLnRyaW0oKSArICcuLi4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGFiZWw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRUZXh0Rm9yVmFsdWUodmFsdWU6IGFueSk6IHN0cmluZyB7XHJcbiAgICAgICAgdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgJ1xcdCcpO1xyXG4gICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1tcXFxcXFx7XFx9XS9nLCAnXFxcXCQmJyk7XHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRUZXh0Rm9yU25pcHBldFZhbHVlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgJ1xcdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0VGV4dEZvckVudW1WYWx1ZSh2YWx1ZTogYW55KTogc3RyaW5nIHtcclxuICAgICAgICBsZXQgc25pcHBldCA9IHRoaXMuZ2V0VGV4dEZvclZhbHVlKHZhbHVlKTtcclxuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xyXG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOlxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd7e251bGx9fSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc25pcHBldDtcclxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAnXCJ7eycgKyBzbmlwcGV0LnN1YnN0cigxLCBzbmlwcGV0Lmxlbmd0aCAtIDIpICsgJ319XCInO1xyXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAne3snICsgc25pcHBldCArICd9fSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzbmlwcGV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0U3VnZ2VzdGlvbktpbmQodHlwZTogYW55KTogc3RyaW5nIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSkge1xyXG4gICAgICAgICAgICBsZXQgYXJyYXkgPSA8YW55W10+dHlwZTtcclxuICAgICAgICAgICAgdHlwZSA9IGFycmF5Lmxlbmd0aCA+IDAgPyBhcnJheVswXSA6IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ2YWx1ZVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzogcmV0dXJuIFwidmFsdWVcIjtcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzogcmV0dXJuIFwibW9kdWxlXCI7XHJcbiAgICAgICAgICAgIGNhc2UgJ3Byb3BlcnR5JzogcmV0dXJuIFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIFwidmFsdWVcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgZ2V0VGV4dEZvck1hdGNoaW5nTm9kZShub2RlOiBQYXJzZXIuQVNUTm9kZSwgZG9jdW1lbnQ6IEF0b20uVGV4dEVkaXRvcik6IHN0cmluZyB7XHJcbiAgICAgICAgc3dpdGNoIChub2RlLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnYXJyYXknOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICdbXSc7XHJcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3t9JztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGxldCBjb250ZW50ID0gZG9jdW1lbnQuZ2V0VGV4dCgpLnN1YnN0cihub2RlLnN0YXJ0LCBub2RlLmVuZCAtIG5vZGUuc3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0VGV4dEZvclByb3BlcnR5KGtleTogc3RyaW5nLCBwcm9wZXJ0eVNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgYWRkVmFsdWU6IGJvb2xlYW4sIGlzTGFzdDogYm9vbGVhbik6IHN0cmluZyB7XHJcblxyXG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLmdldFRleHRGb3JWYWx1ZShrZXkpO1xyXG4gICAgICAgIGlmICghYWRkVmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzdWx0ICs9ICc6ICc7XHJcblxyXG4gICAgICAgIGlmIChwcm9wZXJ0eVNjaGVtYSkge1xyXG4gICAgICAgICAgICBsZXQgZGVmYXVsdFZhbCA9IHByb3BlcnR5U2NoZW1hLmRlZmF1bHQ7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdFZhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArIHRoaXMuZ2V0VGV4dEZvckVudW1WYWx1ZShkZWZhdWx0VmFsKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVNjaGVtYS5lbnVtICYmIHByb3BlcnR5U2NoZW1hLmVudW0ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgdGhpcy5nZXRUZXh0Rm9yRW51bVZhbHVlKHByb3BlcnR5U2NoZW1hLmVudW1bMF0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBBcnJheS5pc0FycmF5KHByb3BlcnR5U2NoZW1hLnR5cGUpID8gcHJvcGVydHlTY2hlbWEudHlwZVswXSA6IHByb3BlcnR5U2NoZW1hLnR5cGU7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd7e2ZhbHNlfX0nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ1wie3t9fVwiJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd7XFxuXFx0e3t9fVxcbn0nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdhcnJheSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnW1xcblxcdHt7fX1cXG5dJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICd7ezB9fSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bGwnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3t7bnVsbH19JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSAne3swfX0nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWlzTGFzdCkge1xyXG4gICAgICAgICAgICByZXN1bHQgKz0gJywnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0VGV4dEZvclNpbWlsYXJQcm9wZXJ0eShrZXk6IHN0cmluZywgdGVtcGxhdGVWYWx1ZTogUGFyc2VyLkFTVE5vZGUpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFRleHRGb3JWYWx1ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0Q3VycmVudFdvcmQoZG9jdW1lbnQ6IEF0b20uVGV4dEVkaXRvciwgb2Zmc2V0OiBudW1iZXIpIHtcclxuICAgICAgICB2YXIgaSA9IG9mZnNldCAtIDE7XHJcbiAgICAgICAgdmFyIHRleHQgPSBkb2N1bWVudC5nZXRUZXh0KCk7XHJcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiAnIFxcdFxcblxcclxcdlwiOntbLCcuaW5kZXhPZih0ZXh0LmNoYXJBdChpKSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIGktLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKGkrMSwgb2Zmc2V0KTtcclxuICAgIH1cclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgVGV4dEJ1ZmZlciBmcm9tIFwidGV4dC1idWZmZXJcIjtcbmNvbnN0IFJhbmdlID0gVGV4dEJ1ZmZlci5SYW5nZTtcbmV4cG9ydCBjbGFzcyBKU09OQ29tcGxldGlvbiB7XG4gICAgY29uc3RydWN0b3Ioc2NoZW1hU2VydmljZSwgY29udHJpYnV0aW9ucyA9IFtdKSB7XG4gICAgICAgIHRoaXMuc2NoZW1hU2VydmljZSA9IHNjaGVtYVNlcnZpY2U7XG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9ucyA9IGNvbnRyaWJ1dGlvbnM7XG4gICAgICAgIHRoaXMuY29uc29sZSA9IGNvbnNvbGU7XG4gICAgfVxuICAgIGRvUmVzb2x2ZShpdGVtKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmNvbnRyaWJ1dGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRyaWJ1dGlvbnNbaV0ucmVzb2x2ZVN1Z2dlc3Rpb24pIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzb2x2ZXIgPSB0aGlzLmNvbnRyaWJ1dGlvbnNbaV0ucmVzb2x2ZVN1Z2dlc3Rpb24oaXRlbSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc29sdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpdGVtKTtcbiAgICB9XG4gICAgZG9TdWdnZXN0KGRvY3VtZW50LCB0ZXh0RG9jdW1lbnRQb3NpdGlvbiwgZG9jKSB7XG4gICAgICAgIGxldCBvZmZzZXQgPSBkb2N1bWVudC5nZXRCdWZmZXIoKS5jaGFyYWN0ZXJJbmRleEZvclBvc2l0aW9uKHRleHREb2N1bWVudFBvc2l0aW9uKTtcbiAgICAgICAgbGV0IG5vZGUgPSBkb2MuZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0KTtcbiAgICAgICAgbGV0IGN1cnJlbnRXb3JkID0gdGhpcy5nZXRDdXJyZW50V29yZChkb2N1bWVudCwgb2Zmc2V0KTtcbiAgICAgICAgbGV0IG92ZXJ3cml0ZVJhbmdlID0gbnVsbDtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHtcbiAgICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgICAgIGlzSW5jb21wbGV0ZTogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG5vZGUgJiYgKG5vZGUudHlwZSA9PT0gJ3N0cmluZycgfHwgbm9kZS50eXBlID09PSAnbnVtYmVyJyB8fCBub2RlLnR5cGUgPT09ICdib29sZWFuJyB8fCBub2RlLnR5cGUgPT09ICdudWxsJykpIHtcbiAgICAgICAgICAgIG92ZXJ3cml0ZVJhbmdlID0gbmV3IFJhbmdlKG5vZGUuc3RhcnQsIG5vZGUuZW5kKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG92ZXJ3cml0ZVJhbmdlID0gbmV3IFJhbmdlKG9mZnNldCAtIGN1cnJlbnRXb3JkLmxlbmd0aCwgb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcHJvcG9zZWQgPSB7fTtcbiAgICAgICAgbGV0IGNvbGxlY3RvciA9IHtcbiAgICAgICAgICAgIGFkZDogKHN1Z2dlc3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXByb3Bvc2VkW3N1Z2dlc3Rpb24udGV4dF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcG9zZWRbc3VnZ2VzdGlvbi50ZXh0XSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvdmVyd3JpdGVSYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VnZ2VzdGlvbi50ZXh0ID0gVGV4dEVkaXQucmVwbGFjZShvdmVyd3JpdGVSYW5nZSwgc3VnZ2VzdGlvbi50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuaXRlbXMucHVzaChzdWdnZXN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0QXNJbmNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmlzSW5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvZzogKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcy5zY2hlbWFTZXJ2aWNlLmdldFNjaGVtYUZvclJlc291cmNlKGRvY3VtZW50LmdldFVSSSgpLCBkb2MpLnRoZW4oKHNjaGVtYSkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbGxlY3Rpb25Qcm9taXNlcyA9IFtdO1xuICAgICAgICAgICAgbGV0IGFkZFZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50S2V5ID0gJyc7XG4gICAgICAgICAgICBsZXQgY3VycmVudFByb3BlcnR5ID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0cmluZ05vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaW5nTm9kZS5pc0tleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkVmFsdWUgPSAhKG5vZGUucGFyZW50ICYmIChub2RlLnBhcmVudC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFByb3BlcnR5ID0gbm9kZS5wYXJlbnQgPyBub2RlLnBhcmVudCA6IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50S2V5ID0gZG9jdW1lbnQuZ2V0VGV4dCgpLnN1YnN0cmluZyhub2RlLnN0YXJ0ICsgMSwgbm9kZS5lbmQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudC5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSAmJiBub2RlLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuc3RhcnQgPT09IG9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgcHJvcGVydGllcyA9IG5vZGUucHJvcGVydGllcztcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudFByb3BlcnR5IHx8IGN1cnJlbnRQcm9wZXJ0eSAhPT0gcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcG9zZWRbcC5rZXkudmFsdWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxldCBpc0xhc3QgPSBwcm9wZXJ0aWVzLmxlbmd0aCA9PT0gMCB8fCBvZmZzZXQgPj0gcHJvcGVydGllc1twcm9wZXJ0aWVzLmxlbmd0aCAtIDFdLnN0YXJ0O1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQcm9wZXJ0eVN1Z2dlc3Rpb25zKHNjaGVtYSwgZG9jLCBub2RlLCBhZGRWYWx1ZSwgaXNMYXN0LCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRTY2hlbWFMZXNzUHJvcGVydHlTdWdnZXN0aW9ucyhkb2MsIG5vZGUsIGN1cnJlbnRLZXksIGN1cnJlbnRXb3JkLCBpc0xhc3QsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IG5vZGUuZ2V0Tm9kZUxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25zLmZvckVhY2goKGNvbnRyaWJ1dGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgY29sbGVjdFByb21pc2UgPSBjb250cmlidXRpb24uY29sbGVjdFByb3BlcnR5U3VnZ2VzdGlvbnMoZG9jdW1lbnQuZ2V0VVJJKCksIGxvY2F0aW9uLCBjdXJyZW50V29yZCwgYWRkVmFsdWUsIGlzTGFzdCwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbGxlY3RQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uUHJvbWlzZXMucHVzaChjb2xsZWN0UHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlICYmIChub2RlLnR5cGUgPT09ICdzdHJpbmcnIHx8IG5vZGUudHlwZSA9PT0gJ251bWJlcicgfHwgbm9kZS50eXBlID09PSAnYm9vbGVhbicgfHwgbm9kZS50eXBlID09PSAnbnVsbCcpKSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNjaGVtYSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0VmFsdWVTdWdnZXN0aW9ucyhzY2hlbWEsIGRvYywgbm9kZSwgb2Zmc2V0LCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRTY2hlbWFMZXNzVmFsdWVTdWdnZXN0aW9ucyhkb2MsIG5vZGUsIG9mZnNldCwgZG9jdW1lbnQsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvbnMuZm9yRWFjaCgoY29udHJpYnV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjb2xsZWN0UHJvbWlzZSA9IGNvbnRyaWJ1dGlvbi5jb2xsZWN0RGVmYXVsdFN1Z2dlc3Rpb25zKGRvY3VtZW50LmdldFVSSSgpLCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGVjdFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25Qcm9taXNlcy5wdXNoKGNvbGxlY3RQcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKChub2RlLnR5cGUgPT09ICdwcm9wZXJ0eScpICYmIG9mZnNldCA+IG5vZGUuY29sb25PZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhcmVudEtleSA9IG5vZGUua2V5LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVOb2RlID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZU5vZGUgfHwgb2Zmc2V0IDw9IHZhbHVlTm9kZS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IG5vZGUucGFyZW50LmdldE5vZGVMb2NhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25zLmZvckVhY2goKGNvbnRyaWJ1dGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb2xsZWN0UHJvbWlzZSA9IGNvbnRyaWJ1dGlvbi5jb2xsZWN0VmFsdWVTdWdnZXN0aW9ucyhkb2N1bWVudC5nZXRVUkkoKSwgbG9jYXRpb24sIHBhcmVudEtleSwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sbGVjdFByb21pc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvblByb21pc2VzLnB1c2goY29sbGVjdFByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGNvbGxlY3Rpb25Qcm9taXNlcykudGhlbigoKSA9PiByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0UHJvcGVydHlTdWdnZXN0aW9ucyhzY2hlbWEsIGRvYywgbm9kZSwgYWRkVmFsdWUsIGlzTGFzdCwgY29sbGVjdG9yKSB7XG4gICAgICAgIGxldCBtYXRjaGluZ1NjaGVtYXMgPSBbXTtcbiAgICAgICAgZG9jLnZhbGlkYXRlKHNjaGVtYS5zY2hlbWEsIG1hdGNoaW5nU2NoZW1hcywgbm9kZS5zdGFydCk7XG4gICAgICAgIG1hdGNoaW5nU2NoZW1hcy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgICAgICBpZiAocy5ub2RlID09PSBub2RlICYmICFzLmludmVydGVkKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjaGVtYVByb3BlcnRpZXMgPSBzLnNjaGVtYS5wcm9wZXJ0aWVzO1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWFQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYVByb3BlcnRpZXMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5U2NoZW1hID0gc2NoZW1hUHJvcGVydGllc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdG9yLmFkZCh7IHR5cGU6IFwicHJvcGVydHlcIiwgZGlzcGxheVRleHQ6IGtleSwgdGV4dDogdGhpcy5nZXRUZXh0Rm9yUHJvcGVydHkoa2V5LCBwcm9wZXJ0eVNjaGVtYSwgYWRkVmFsdWUsIGlzTGFzdCksIGRlc2NyaXB0aW9uOiBwcm9wZXJ0eVNjaGVtYS5kZXNjcmlwdGlvbiB8fCAnJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0U2NoZW1hTGVzc1Byb3BlcnR5U3VnZ2VzdGlvbnMoZG9jLCBub2RlLCBjdXJyZW50S2V5LCBjdXJyZW50V29yZCwgaXNMYXN0LCBjb2xsZWN0b3IpIHtcbiAgICAgICAgbGV0IGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3QgPSAob2JqKSA9PiB7XG4gICAgICAgICAgICBvYmoucHJvcGVydGllcy5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGtleSA9IHAua2V5LnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiBcInByb3BlcnR5XCIsIGRpc3BsYXlUZXh0OiBrZXksIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclNpbWlsYXJQcm9wZXJ0eShrZXksIHAudmFsdWUpLCBkZXNjcmlwdGlvbjogJycgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICBpZiAobm9kZS5wYXJlbnQudHlwZSA9PT0gJ3Byb3BlcnR5Jykge1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRLZXkgPSBub2RlLnBhcmVudC5rZXkudmFsdWU7XG4gICAgICAgICAgICAgICAgZG9jLnZpc2l0KChuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuLnR5cGUgPT09ICdwcm9wZXJ0eScgJiYgbi5rZXkudmFsdWUgPT09IHBhcmVudEtleSAmJiBuLnZhbHVlICYmIG4udmFsdWUudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclNpbWlsYXJPYmplY3Qobi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLnBhcmVudC50eXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5wYXJlbnQuaXRlbXMuZm9yRWFjaCgobikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobi50eXBlID09PSAnb2JqZWN0JyAmJiBuICE9PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JTaW1pbGFyT2JqZWN0KG4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjdXJyZW50S2V5ICYmIGN1cnJlbnRXb3JkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiBcInByb3BlcnR5XCIsIGRpc3BsYXlUZXh0OiB0aGlzLmdldExhYmVsRm9yVmFsdWUoY3VycmVudFdvcmQpLCB0ZXh0OiB0aGlzLmdldFRleHRGb3JQcm9wZXJ0eShjdXJyZW50V29yZCwgbnVsbCwgdHJ1ZSwgaXNMYXN0KSwgZGVzY3JpcHRpb246ICcnIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFNjaGVtYUxlc3NWYWx1ZVN1Z2dlc3Rpb25zKGRvYywgbm9kZSwgb2Zmc2V0LCBkb2N1bWVudCwgY29sbGVjdG9yKSB7XG4gICAgICAgIGxldCBjb2xsZWN0U3VnZ2VzdGlvbnNGb3JWYWx1ZXMgPSAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUuY29udGFpbnMob2Zmc2V0KSkge1xuICAgICAgICAgICAgICAgIGxldCBjb250ZW50ID0gdGhpcy5nZXRUZXh0Rm9yTWF0Y2hpbmdOb2RlKHZhbHVlLCBkb2N1bWVudCk7XG4gICAgICAgICAgICAgICAgY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvbktpbmQodmFsdWUudHlwZSksIGRpc3BsYXlUZXh0OiBjb250ZW50LCB0ZXh0OiBjb250ZW50LCBkZXNjcmlwdGlvbjogJycgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUudHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbighdmFsdWUuZ2V0VmFsdWUoKSwgY29sbGVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBjb2xsZWN0b3IuYWRkKHsgdHlwZTogdGhpcy5nZXRTdWdnZXN0aW9uS2luZCgnb2JqZWN0JyksIGRpc3BsYXlUZXh0OiAnRW1wdHkgb2JqZWN0JywgdGV4dDogJ3tcXG5cXHR7e319XFxufScsIGRlc2NyaXB0aW9uOiAnJyB9KTtcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25LaW5kKCdhcnJheScpLCBkaXNwbGF5VGV4dDogJ0VtcHR5IGFycmF5JywgdGV4dDogJ1tcXG5cXHR7e319XFxuXScsIGRlc2NyaXB0aW9uOiAnJyB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09ICdwcm9wZXJ0eScgJiYgb2Zmc2V0ID4gbm9kZS5jb2xvbk9mZnNldCkge1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZU5vZGUgPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZU5vZGUgJiYgb2Zmc2V0ID4gdmFsdWVOb2RlLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRLZXkgPSBub2RlLmtleS52YWx1ZTtcbiAgICAgICAgICAgICAgICBkb2MudmlzaXQoKG4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG4udHlwZSA9PT0gJ3Byb3BlcnR5JyAmJiBuLmtleS52YWx1ZSA9PT0gcGFyZW50S2V5ICYmIG4udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclZhbHVlcyhuLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQudHlwZSA9PT0gJ3Byb3BlcnR5Jykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyZW50S2V5ID0gbm9kZS5wYXJlbnQua2V5LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBkb2MudmlzaXQoKG4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuLnR5cGUgPT09ICdwcm9wZXJ0eScgJiYgbi5rZXkudmFsdWUgPT09IHBhcmVudEtleSAmJiBuLnZhbHVlICYmIG4udmFsdWUudHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuLnZhbHVlLml0ZW1zKS5mb3JFYWNoKChuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RTdWdnZXN0aW9uc0ZvclZhbHVlcyhuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuaXRlbXMuZm9yRWFjaCgobikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdFN1Z2dlc3Rpb25zRm9yVmFsdWVzKG4pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0VmFsdWVTdWdnZXN0aW9ucyhzY2hlbWEsIGRvYywgbm9kZSwgb2Zmc2V0LCBjb2xsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICB0aGlzLmFkZERlZmF1bHRTdWdnZXN0aW9uKHNjaGVtYS5zY2hlbWEsIGNvbGxlY3Rvcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgcGFyZW50S2V5ID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChub2RlICYmIChub2RlLnR5cGUgPT09ICdwcm9wZXJ0eScpICYmIG9mZnNldCA+IG5vZGUuY29sb25PZmZzZXQpIHtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWVOb2RlID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVOb2RlICYmIG9mZnNldCA+IHZhbHVlTm9kZS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnRLZXkgPSBub2RlLmtleS52YWx1ZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZSAmJiAocGFyZW50S2V5ICE9PSBudWxsIHx8IG5vZGUudHlwZSA9PT0gJ2FycmF5JykpIHtcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2hpbmdTY2hlbWFzID0gW107XG4gICAgICAgICAgICAgICAgZG9jLnZhbGlkYXRlKHNjaGVtYS5zY2hlbWEsIG1hdGNoaW5nU2NoZW1hcywgbm9kZS5zdGFydCk7XG4gICAgICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubm9kZSA9PT0gbm9kZSAmJiAhcy5pbnZlcnRlZCAmJiBzLnNjaGVtYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMuc2NoZW1hLml0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGREZWZhdWx0U3VnZ2VzdGlvbihzLnNjaGVtYS5pdGVtcywgY29sbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHMuc2NoZW1hLml0ZW1zLCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMuc2NoZW1hLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHlTY2hlbWEgPSBzLnNjaGVtYS5wcm9wZXJ0aWVzW3BhcmVudEtleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5U2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRGVmYXVsdFN1Z2dlc3Rpb24ocHJvcGVydHlTY2hlbWEsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRW51bVN1Z2dlc3Rpb24ocHJvcGVydHlTY2hlbWEsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYWRkQm9vbGVhblN1Z2dlc3Rpb24odmFsdWUsIGNvbGxlY3Rvcikge1xuICAgICAgICBjb2xsZWN0b3IuYWRkKHsgdHlwZTogdGhpcy5nZXRTdWdnZXN0aW9uS2luZCgnYm9vbGVhbicpLCBkaXNwbGF5VGV4dDogdmFsdWUgPyAndHJ1ZScgOiAnZmFsc2UnLCB0ZXh0OiB0aGlzLmdldFRleHRGb3JWYWx1ZSh2YWx1ZSksIGRlc2NyaXB0aW9uOiAnJyB9KTtcbiAgICB9XG4gICAgYWRkTnVsbFN1Z2dlc3Rpb24oY29sbGVjdG9yKSB7XG4gICAgICAgIGNvbGxlY3Rvci5hZGQoeyB0eXBlOiB0aGlzLmdldFN1Z2dlc3Rpb25LaW5kKCdudWxsJyksIGRpc3BsYXlUZXh0OiAnbnVsbCcsIHRleHQ6ICdudWxsJywgZGVzY3JpcHRpb246ICcnIH0pO1xuICAgIH1cbiAgICBhZGRFbnVtU3VnZ2VzdGlvbihzY2hlbWEsIGNvbGxlY3Rvcikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZW51bSkpIHtcbiAgICAgICAgICAgIHNjaGVtYS5lbnVtLmZvckVhY2goKGVubSkgPT4gY29sbGVjdG9yLmFkZCh7IHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvbktpbmQoc2NoZW1hLnR5cGUpLCBkaXNwbGF5VGV4dDogdGhpcy5nZXRMYWJlbEZvclZhbHVlKGVubSksIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclZhbHVlKGVubSksIGRlc2NyaXB0aW9uOiAnJyB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1R5cGUoc2NoZW1hLCAnYm9vbGVhbicpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRCb29sZWFuU3VnZ2VzdGlvbih0cnVlLCBjb2xsZWN0b3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkQm9vbGVhblN1Z2dlc3Rpb24oZmFsc2UsIGNvbGxlY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc1R5cGUoc2NoZW1hLCAnbnVsbCcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGROdWxsU3VnZ2VzdGlvbihjb2xsZWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikpIHtcbiAgICAgICAgICAgIHNjaGVtYS5hbGxPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcbiAgICAgICAgICAgIHNjaGVtYS5hbnlPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5vbmVPZikpIHtcbiAgICAgICAgICAgIHNjaGVtYS5vbmVPZi5mb3JFYWNoKChzKSA9PiB0aGlzLmFkZEVudW1TdWdnZXN0aW9uKHMsIGNvbGxlY3RvcikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzVHlwZShzY2hlbWEsIHR5cGUpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLnR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hLnR5cGUuaW5kZXhPZih0eXBlKSAhPT0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjaGVtYS50eXBlID09PSB0eXBlO1xuICAgIH1cbiAgICBhZGREZWZhdWx0U3VnZ2VzdGlvbihzY2hlbWEsIGNvbGxlY3Rvcikge1xuICAgICAgICBpZiAoc2NoZW1hLmRlZmF1bHQpIHtcbiAgICAgICAgICAgIGNvbGxlY3Rvci5hZGQoe1xuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMuZ2V0U3VnZ2VzdGlvbktpbmQoc2NoZW1hLnR5cGUpLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlUZXh0OiB0aGlzLmdldExhYmVsRm9yVmFsdWUoc2NoZW1hLmRlZmF1bHQpLFxuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclZhbHVlKHNjaGVtYS5kZWZhdWx0KSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZmF1bHQgdmFsdWUnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmRlZmF1bHRTbmlwcGV0cykpIHtcbiAgICAgICAgICAgIHNjaGVtYS5kZWZhdWx0U25pcHBldHMuZm9yRWFjaChzID0+IHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0b3IuYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJzbmlwcGV0XCIsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlUZXh0OiB0aGlzLmdldExhYmVsRm9yU25pcHBldFZhbHVlKHMuYm9keSksXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuZ2V0VGV4dEZvclNuaXBwZXRWYWx1ZShzLmJvZHkpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEuYWxsT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGREZWZhdWx0U3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEuYW55T2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGREZWZhdWx0U3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEub25lT2YuZm9yRWFjaCgocykgPT4gdGhpcy5hZGREZWZhdWx0U3VnZ2VzdGlvbihzLCBjb2xsZWN0b3IpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRMYWJlbEZvclZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGxldCBsYWJlbCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCA+IDU3KSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWwuc3Vic3RyKDAsIDU3KS50cmltKCkgKyAnLi4uJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgfVxuICAgIGdldExhYmVsRm9yU25pcHBldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGxldCBsYWJlbCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgICAgbGFiZWwgPSBsYWJlbC5yZXBsYWNlKC9cXHtcXHt8XFx9XFx9L2csICcnKTtcbiAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCA+IDU3KSB7XG4gICAgICAgICAgICByZXR1cm4gbGFiZWwuc3Vic3RyKDAsIDU3KS50cmltKCkgKyAnLi4uJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgfVxuICAgIGdldFRleHRGb3JWYWx1ZSh2YWx1ZSkge1xuICAgICAgICB2YXIgdGV4dCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlLCBudWxsLCAnXFx0Jyk7XG4gICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1tcXFxcXFx7XFx9XS9nLCAnXFxcXCQmJyk7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cbiAgICBnZXRUZXh0Rm9yU25pcHBldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgJ1xcdCcpO1xuICAgIH1cbiAgICBnZXRUZXh0Rm9yRW51bVZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGxldCBzbmlwcGV0ID0gdGhpcy5nZXRUZXh0Rm9yVmFsdWUodmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd7e251bGx9fSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzbmlwcGV0O1xuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1wie3snICsgc25pcHBldC5zdWJzdHIoMSwgc25pcHBldC5sZW5ndGggLSAyKSArICd9fVwiJztcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3t7JyArIHNuaXBwZXQgKyAnfX0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzbmlwcGV0O1xuICAgIH1cbiAgICBnZXRTdWdnZXN0aW9uS2luZCh0eXBlKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHR5cGUpKSB7XG4gICAgICAgICAgICBsZXQgYXJyYXkgPSB0eXBlO1xuICAgICAgICAgICAgdHlwZSA9IGFycmF5Lmxlbmd0aCA+IDAgPyBhcnJheVswXSA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ2YWx1ZVwiO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzogcmV0dXJuIFwidmFsdWVcIjtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6IHJldHVybiBcIm1vZHVsZVwiO1xuICAgICAgICAgICAgY2FzZSAncHJvcGVydHknOiByZXR1cm4gXCJwcm9wZXJ0eVwiO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIFwidmFsdWVcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRUZXh0Rm9yTWF0Y2hpbmdOb2RlKG5vZGUsIGRvY3VtZW50KSB7XG4gICAgICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdhcnJheSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdbXSc7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiAne30nO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBsZXQgY29udGVudCA9IGRvY3VtZW50LmdldFRleHQoKS5zdWJzdHIobm9kZS5zdGFydCwgbm9kZS5lbmQgLSBub2RlLnN0YXJ0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRUZXh0Rm9yUHJvcGVydHkoa2V5LCBwcm9wZXJ0eVNjaGVtYSwgYWRkVmFsdWUsIGlzTGFzdCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5nZXRUZXh0Rm9yVmFsdWUoa2V5KTtcbiAgICAgICAgaWYgKCFhZGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgKz0gJzogJztcbiAgICAgICAgaWYgKHByb3BlcnR5U2NoZW1hKSB7XG4gICAgICAgICAgICBsZXQgZGVmYXVsdFZhbCA9IHByb3BlcnR5U2NoZW1hLmRlZmF1bHQ7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRWYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgdGhpcy5nZXRUZXh0Rm9yRW51bVZhbHVlKGRlZmF1bHRWYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocHJvcGVydHlTY2hlbWEuZW51bSAmJiBwcm9wZXJ0eVNjaGVtYS5lbnVtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgKyB0aGlzLmdldFRleHRGb3JFbnVtVmFsdWUocHJvcGVydHlTY2hlbWEuZW51bVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IEFycmF5LmlzQXJyYXkocHJvcGVydHlTY2hlbWEudHlwZSkgPyBwcm9wZXJ0eVNjaGVtYS50eXBlWzBdIDogcHJvcGVydHlTY2hlbWEudHlwZTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3t7ZmFsc2V9fSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnXCJ7e319XCInO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3tcXG5cXHR7e319XFxufSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYXJyYXknOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9ICdbXFxuXFx0e3t9fVxcbl0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gJ3t7MH19JztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdudWxsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAne3tudWxsfX0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAne3swfX0nO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJywnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGdldFRleHRGb3JTaW1pbGFyUHJvcGVydHkoa2V5LCB0ZW1wbGF0ZVZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFRleHRGb3JWYWx1ZShrZXkpO1xuICAgIH1cbiAgICBnZXRDdXJyZW50V29yZChkb2N1bWVudCwgb2Zmc2V0KSB7XG4gICAgICAgIHZhciBpID0gb2Zmc2V0IC0gMTtcbiAgICAgICAgdmFyIHRleHQgPSBkb2N1bWVudC5nZXRUZXh0KCk7XG4gICAgICAgIHdoaWxlIChpID49IDAgJiYgJyBcXHRcXG5cXHJcXHZcIjp7WywnLmluZGV4T2YodGV4dC5jaGFyQXQoaSkpID09PSAtMSkge1xuICAgICAgICAgICAgaS0tO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0LnN1YnN0cmluZyhpICsgMSwgb2Zmc2V0KTtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
