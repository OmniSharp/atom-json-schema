'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONDocument = exports.ValidationResult = exports.JSONDocumentConfig = exports.ObjectASTNode = exports.PropertyASTNode = exports.StringASTNode = exports.NumberASTNode = exports.ArrayASTNode = exports.BooleanASTNode = exports.NullASTNode = exports.ASTNode = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.parse = parse;

var _jsoncParser = require('jsonc-parser');

var _jsoncParser2 = _interopRequireDefault(_jsoncParser);

var _jsonLocation = require('./jsonLocation');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ASTNode = exports.ASTNode = function () {
    function ASTNode(parent, type, name, start, end) {
        _classCallCheck(this, ASTNode);

        this.type = type;
        this.name = name;
        this.start = start;
        this.end = end;
        this.parent = parent;
    }

    _createClass(ASTNode, [{
        key: 'getNodeLocation',
        value: function getNodeLocation() {
            var path = this.parent ? this.parent.getNodeLocation() : new _jsonLocation.JSONLocation([]);
            if (this.name) {
                path = path.append(this.name);
            }
            return path;
        }
    }, {
        key: 'getChildNodes',
        value: function getChildNodes() {
            return [];
        }
    }, {
        key: 'getValue',
        value: function getValue() {
            return;
        }
    }, {
        key: 'contains',
        value: function contains(offset) {
            var includeRightBound = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            return offset >= this.start && offset < this.end || includeRightBound && offset === this.end;
        }
    }, {
        key: 'visit',
        value: function visit(visitor) {
            return visitor(this);
        }
    }, {
        key: 'getNodeFromOffset',
        value: function getNodeFromOffset(offset) {
            var findNode = function findNode(node) {
                if (offset >= node.start && offset < node.end) {
                    var children = node.getChildNodes();
                    for (var i = 0; i < children.length && children[i].start <= offset; i++) {
                        var item = findNode(children[i]);
                        if (item) {
                            return item;
                        }
                    }
                    return node;
                }
                return null;
            };
            return findNode(this);
        }
    }, {
        key: 'getNodeFromOffsetEndInclusive',
        value: function getNodeFromOffsetEndInclusive(offset) {
            var findNode = function findNode(node) {
                if (offset >= node.start && offset <= node.end) {
                    var children = node.getChildNodes();
                    for (var i = 0; i < children.length && children[i].start <= offset; i++) {
                        var item = findNode(children[i]);
                        if (item) {
                            return item;
                        }
                    }
                    return node;
                }
                return null;
            };
            return findNode(this);
        }
    }, {
        key: 'validate',
        value: function validate(schema, validationResult, matchingSchemas) {
            var _this = this;

            var offset = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

            if (offset !== -1 && !this.contains(offset)) {
                return;
            }
            if (Array.isArray(schema.type)) {
                if (schema.type.indexOf(this.type) === -1) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: schema.errorMessage || 'Incorrect type. Expected one of ' + schema.type.join(', ')
                    });
                }
            } else if (schema.type) {
                if (this.type !== schema.type) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: schema.errorMessage || 'Incorrect type. Expected "' + schema.type + '"'
                    });
                }
            }
            if (Array.isArray(schema.allOf)) {
                schema.allOf.forEach(function (subSchema) {
                    _this.validate(subSchema, validationResult, matchingSchemas, offset);
                });
            }
            if (schema.not) {
                var subValidationResult = new ValidationResult();
                var subMatchingSchemas = [];
                this.validate(schema.not, subValidationResult, subMatchingSchemas, offset);
                if (!subValidationResult.hasErrors()) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Matches a schema that is not allowed.'
                    });
                }
                if (matchingSchemas) {
                    subMatchingSchemas.forEach(function (ms) {
                        ms.inverted = !ms.inverted;
                        matchingSchemas.push(ms);
                    });
                }
            }
            var testAlternatives = function testAlternatives(alternatives, maxOneMatch) {
                var matches = [];
                var bestMatch = null;
                alternatives.forEach(function (subSchema) {
                    var subValidationResult = new ValidationResult();
                    var subMatchingSchemas = [];
                    _this.validate(subSchema, subValidationResult, subMatchingSchemas);
                    if (!subValidationResult.hasErrors()) {
                        matches.push(subSchema);
                    }
                    if (!bestMatch) {
                        bestMatch = { schema: subSchema, validationResult: subValidationResult, matchingSchemas: subMatchingSchemas };
                    } else {
                        if (!maxOneMatch && !subValidationResult.hasErrors() && !bestMatch.validationResult.hasErrors()) {
                            bestMatch.matchingSchemas.push.apply(bestMatch.matchingSchemas, subMatchingSchemas);
                            bestMatch.validationResult.propertiesMatches += subValidationResult.propertiesMatches;
                            bestMatch.validationResult.propertiesValueMatches += subValidationResult.propertiesValueMatches;
                        } else {
                            var compareResult = subValidationResult.compare(bestMatch.validationResult);
                            if (compareResult > 0) {
                                bestMatch = { schema: subSchema, validationResult: subValidationResult, matchingSchemas: subMatchingSchemas };
                            } else if (compareResult === 0) {
                                bestMatch.matchingSchemas.push.apply(bestMatch.matchingSchemas, subMatchingSchemas);
                            }
                        }
                    }
                });
                if (matches.length > 1 && maxOneMatch) {
                    validationResult.warnings.push({
                        location: { start: _this.start, end: _this.start + 1 },
                        message: 'Matches multiple schemas when only one must validate.'
                    });
                }
                if (bestMatch !== null) {
                    validationResult.merge(bestMatch.validationResult);
                    validationResult.propertiesMatches += bestMatch.validationResult.propertiesMatches;
                    validationResult.propertiesValueMatches += bestMatch.validationResult.propertiesValueMatches;
                    if (matchingSchemas) {
                        matchingSchemas.push.apply(matchingSchemas, bestMatch.matchingSchemas);
                    }
                }
                return matches.length;
            };
            if (Array.isArray(schema.anyOf)) {
                testAlternatives(schema.anyOf, false);
            }
            if (Array.isArray(schema.oneOf)) {
                testAlternatives(schema.oneOf, true);
            }
            if (Array.isArray(schema.enum)) {
                if (schema.enum.indexOf(this.getValue()) === -1) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is not an accepted value. Valid values: ' + JSON.stringify(schema.enum)
                    });
                } else {
                    validationResult.enumValueMatch = true;
                }
            }
            if (matchingSchemas !== null) {
                matchingSchemas.push({ node: this, schema: schema });
            }
        }
    }]);

    return ASTNode;
}();

var NullASTNode = exports.NullASTNode = function (_ASTNode) {
    _inherits(NullASTNode, _ASTNode);

    function NullASTNode(parent, name, start, end) {
        _classCallCheck(this, NullASTNode);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(NullASTNode).call(this, parent, 'null', name, start, end));
    }

    _createClass(NullASTNode, [{
        key: 'getValue',
        value: function getValue() {
            return null;
        }
    }]);

    return NullASTNode;
}(ASTNode);

var BooleanASTNode = exports.BooleanASTNode = function (_ASTNode2) {
    _inherits(BooleanASTNode, _ASTNode2);

    function BooleanASTNode(parent, name, value, start, end) {
        _classCallCheck(this, BooleanASTNode);

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(BooleanASTNode).call(this, parent, 'boolean', name, start, end));

        _this3.value = value;
        return _this3;
    }

    _createClass(BooleanASTNode, [{
        key: 'getValue',
        value: function getValue() {
            return this.value;
        }
    }]);

    return BooleanASTNode;
}(ASTNode);

var ArrayASTNode = exports.ArrayASTNode = function (_ASTNode3) {
    _inherits(ArrayASTNode, _ASTNode3);

    function ArrayASTNode(parent, name, start, end) {
        _classCallCheck(this, ArrayASTNode);

        var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayASTNode).call(this, parent, 'array', name, start, end));

        _this4.items = [];
        return _this4;
    }

    _createClass(ArrayASTNode, [{
        key: 'getChildNodes',
        value: function getChildNodes() {
            return this.items;
        }
    }, {
        key: 'getValue',
        value: function getValue() {
            return this.items.map(function (v) {
                return v.getValue();
            });
        }
    }, {
        key: 'addItem',
        value: function addItem(item) {
            if (item) {
                this.items.push(item);
                return true;
            }
            return false;
        }
    }, {
        key: 'visit',
        value: function visit(visitor) {
            var ctn = visitor(this);
            for (var i = 0; i < this.items.length && ctn; i++) {
                ctn = this.items[i].visit(visitor);
            }
            return ctn;
        }
    }, {
        key: 'validate',
        value: function validate(schema, validationResult, matchingSchemas) {
            var _this5 = this;

            var offset = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

            if (offset !== -1 && !this.contains(offset)) {
                return;
            }
            _get(Object.getPrototypeOf(ArrayASTNode.prototype), 'validate', this).call(this, schema, validationResult, matchingSchemas, offset);
            if (Array.isArray(schema.items)) {
                (function () {
                    var subSchemas = schema.items;
                    subSchemas.forEach(function (subSchema, index) {
                        var itemValidationResult = new ValidationResult();
                        var item = _this5.items[index];
                        if (item) {
                            item.validate(subSchema, itemValidationResult, matchingSchemas, offset);
                            validationResult.mergePropertyMatch(itemValidationResult);
                        } else if (_this5.items.length >= subSchemas.length) {
                            validationResult.propertiesValueMatches++;
                        }
                    });
                    if (schema.additionalItems === false && _this5.items.length > subSchemas.length) {
                        validationResult.warnings.push({
                            location: { start: _this5.start, end: _this5.end },
                            message: 'Array has too many items according to schema. Expected ' + subSchemas.length + ' or fewer'
                        });
                    } else if (_this5.items.length >= subSchemas.length) {
                        validationResult.propertiesValueMatches += _this5.items.length - subSchemas.length;
                    }
                })();
            } else if (schema.items) {
                this.items.forEach(function (item) {
                    var itemValidationResult = new ValidationResult();
                    item.validate(schema.items, itemValidationResult, matchingSchemas, offset);
                    validationResult.mergePropertyMatch(itemValidationResult);
                });
            }
            if (schema.minItems && this.items.length < schema.minItems) {
                validationResult.warnings.push({
                    location: { start: this.start, end: this.end },
                    message: 'Array has too few items. Expected ' + schema.minItems + ' or more'
                });
            }
            if (schema.maxItems && this.items.length > schema.maxItems) {
                validationResult.warnings.push({
                    location: { start: this.start, end: this.end },
                    message: 'Array has too many items. Expected ' + schema.minItems + ' or fewer'
                });
            }
            if (schema.uniqueItems === true) {
                (function () {
                    var values = _this5.items.map(function (node) {
                        return node.getValue();
                    });
                    var duplicates = values.some(function (value, index) {
                        return index !== values.lastIndexOf(value);
                    });
                    if (duplicates) {
                        validationResult.warnings.push({
                            location: { start: _this5.start, end: _this5.end },
                            message: 'Array has duplicate items'
                        });
                    }
                })();
            }
        }
    }]);

    return ArrayASTNode;
}(ASTNode);

var NumberASTNode = exports.NumberASTNode = function (_ASTNode4) {
    _inherits(NumberASTNode, _ASTNode4);

    function NumberASTNode(parent, name, start, end) {
        _classCallCheck(this, NumberASTNode);

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(NumberASTNode).call(this, parent, 'number', name, start, end));

        _this6.isInteger = true;
        _this6.value = Number.NaN;
        return _this6;
    }

    _createClass(NumberASTNode, [{
        key: 'getValue',
        value: function getValue() {
            return this.value;
        }
    }, {
        key: 'validate',
        value: function validate(schema, validationResult, matchingSchemas) {
            var offset = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

            if (offset !== -1 && !this.contains(offset)) {
                return;
            }
            var typeIsInteger = false;
            if (schema.type === 'integer' || Array.isArray(schema.type) && schema.type.indexOf('integer') !== -1) {
                typeIsInteger = true;
            }
            if (typeIsInteger && this.isInteger === true) {
                this.type = 'integer';
            }
            _get(Object.getPrototypeOf(NumberASTNode.prototype), 'validate', this).call(this, schema, validationResult, matchingSchemas, offset);
            this.type = 'number';
            var val = this.getValue();
            if (typeof schema.multipleOf === 'number') {
                if (val % schema.multipleOf !== 0) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is not divisible by ' + schema.multipleOf
                    });
                }
            }
            if (typeof schema.minimum === 'number') {
                if (schema.exclusiveMinimum && val <= schema.minimum) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is below the exclusive minimum of ' + schema.minimum
                    });
                }
                if (!schema.exclusiveMinimum && val < schema.minimum) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is below the minimum of ' + schema.minimum
                    });
                }
            }
            if (typeof schema.maximum === 'number') {
                if (schema.exclusiveMaximum && val >= schema.maximum) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is above the exclusive maximum of ' + schema.maximum
                    });
                }
                if (!schema.exclusiveMaximum && val > schema.maximum) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is above the maximum of ' + schema.maximum
                    });
                }
            }
        }
    }]);

    return NumberASTNode;
}(ASTNode);

var StringASTNode = exports.StringASTNode = function (_ASTNode5) {
    _inherits(StringASTNode, _ASTNode5);

    function StringASTNode(parent, name, isKey, start, end) {
        _classCallCheck(this, StringASTNode);

        var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(StringASTNode).call(this, parent, 'string', name, start, end));

        _this7.isKey = isKey;
        _this7.value = '';
        return _this7;
    }

    _createClass(StringASTNode, [{
        key: 'getValue',
        value: function getValue() {
            return this.value;
        }
    }, {
        key: 'validate',
        value: function validate(schema, validationResult, matchingSchemas) {
            var offset = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

            if (offset !== -1 && !this.contains(offset)) {
                return;
            }
            _get(Object.getPrototypeOf(StringASTNode.prototype), 'validate', this).call(this, schema, validationResult, matchingSchemas, offset);
            if (schema.minLength && this.value.length < schema.minLength) {
                validationResult.warnings.push({
                    location: { start: this.start, end: this.end },
                    message: 'String is shorter than the minimum length of ' + schema.minLength
                });
            }
            if (schema.maxLength && this.value.length > schema.maxLength) {
                validationResult.warnings.push({
                    location: { start: this.start, end: this.end },
                    message: 'String is shorter than the maximum length of ' + schema.maxLength
                });
            }
            if (schema.pattern) {
                var regex = new RegExp(schema.pattern);
                if (!regex.test(this.value)) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: schema.errorMessage || 'String does not match the pattern of "' + schema.pattern + '"'
                    });
                }
            }
        }
    }]);

    return StringASTNode;
}(ASTNode);

var PropertyASTNode = exports.PropertyASTNode = function (_ASTNode6) {
    _inherits(PropertyASTNode, _ASTNode6);

    function PropertyASTNode(parent, key) {
        _classCallCheck(this, PropertyASTNode);

        var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(PropertyASTNode).call(this, parent, 'property', null, key.start));

        _this8.key = key;
        key.parent = _this8;
        key.name = key.value;
        _this8.colonOffset = -1;
        return _this8;
    }

    _createClass(PropertyASTNode, [{
        key: 'getChildNodes',
        value: function getChildNodes() {
            return this.value ? [this.key, this.value] : [this.key];
        }
    }, {
        key: 'setValue',
        value: function setValue(value) {
            this.value = value;
            return value !== null;
        }
    }, {
        key: 'visit',
        value: function visit(visitor) {
            return visitor(this) && this.key.visit(visitor) && this.value && this.value.visit(visitor);
        }
    }, {
        key: 'validate',
        value: function validate(schema, validationResult, matchingSchemas) {
            var offset = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

            if (offset !== -1 && !this.contains(offset)) {
                return;
            }
            if (this.value) {
                this.value.validate(schema, validationResult, matchingSchemas, offset);
            }
        }
    }]);

    return PropertyASTNode;
}(ASTNode);

var ObjectASTNode = exports.ObjectASTNode = function (_ASTNode7) {
    _inherits(ObjectASTNode, _ASTNode7);

    function ObjectASTNode(parent, name, start, end) {
        _classCallCheck(this, ObjectASTNode);

        var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(ObjectASTNode).call(this, parent, 'object', name, start, end));

        _this9.properties = [];
        return _this9;
    }

    _createClass(ObjectASTNode, [{
        key: 'getChildNodes',
        value: function getChildNodes() {
            return this.properties;
        }
    }, {
        key: 'addProperty',
        value: function addProperty(node) {
            if (!node) {
                return false;
            }
            this.properties.push(node);
            return true;
        }
    }, {
        key: 'getFirstProperty',
        value: function getFirstProperty(key) {
            for (var i = 0; i < this.properties.length; i++) {
                if (this.properties[i].key.value === key) {
                    return this.properties[i];
                }
            }
            return null;
        }
    }, {
        key: 'getKeyList',
        value: function getKeyList() {
            return this.properties.map(function (p) {
                return p.key.getValue();
            });
        }
    }, {
        key: 'getValue',
        value: function getValue() {
            var value = {};
            this.properties.forEach(function (p) {
                var v = p.value && p.value.getValue();
                if (v) {
                    value[p.key.getValue()] = v;
                }
            });
            return value;
        }
    }, {
        key: 'visit',
        value: function visit(visitor) {
            var ctn = visitor(this);
            for (var i = 0; i < this.properties.length && ctn; i++) {
                ctn = this.properties[i].visit(visitor);
            }
            return ctn;
        }
    }, {
        key: 'validate',
        value: function validate(schema, validationResult, matchingSchemas) {
            var _this10 = this;

            var offset = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];

            if (offset !== -1 && !this.contains(offset)) {
                return;
            }
            _get(Object.getPrototypeOf(ObjectASTNode.prototype), 'validate', this).call(this, schema, validationResult, matchingSchemas, offset);
            var seenKeys = {};
            var unprocessedProperties = [];
            this.properties.forEach(function (node) {
                var key = node.key.value;
                seenKeys[key] = node.value;
                unprocessedProperties.push(key);
            });
            if (Array.isArray(schema.required)) {
                schema.required.forEach(function (propertyName) {
                    if (!seenKeys[propertyName]) {
                        var key = _this10.parent && _this10.parent && _this10.parent.key;
                        var location = key ? { start: key.start, end: key.end } : { start: _this10.start, end: _this10.start + 1 };
                        validationResult.warnings.push({
                            location: location,
                            message: 'Missing property "' + propertyName + '"'
                        });
                    }
                });
            }
            var propertyProcessed = function propertyProcessed(prop) {
                var index = unprocessedProperties.indexOf(prop);
                while (index >= 0) {
                    unprocessedProperties.splice(index, 1);
                    index = unprocessedProperties.indexOf(prop);
                }
            };
            if (schema.properties) {
                Object.keys(schema.properties).forEach(function (propertyName) {
                    propertyProcessed(propertyName);
                    var prop = schema.properties[propertyName];
                    var child = seenKeys[propertyName];
                    if (child) {
                        var propertyvalidationResult = new ValidationResult();
                        child.validate(prop, propertyvalidationResult, matchingSchemas, offset);
                        validationResult.mergePropertyMatch(propertyvalidationResult);
                    }
                });
            }
            if (schema.patternProperties) {
                Object.keys(schema.patternProperties).forEach(function (propertyPattern) {
                    var regex = new RegExp(propertyPattern);
                    unprocessedProperties.slice(0).forEach(function (propertyName) {
                        if (regex.test(propertyName)) {
                            propertyProcessed(propertyName);
                            var child = seenKeys[propertyName];
                            if (child) {
                                var propertyvalidationResult = new ValidationResult();
                                child.validate(schema.patternProperties[propertyPattern], propertyvalidationResult, matchingSchemas, offset);
                                validationResult.mergePropertyMatch(propertyvalidationResult);
                            }
                        }
                    });
                });
            }
            if (schema.additionalProperties) {
                unprocessedProperties.forEach(function (propertyName) {
                    var child = seenKeys[propertyName];
                    if (child) {
                        var propertyvalidationResult = new ValidationResult();
                        child.validate(schema.additionalProperties, propertyvalidationResult, matchingSchemas, offset);
                        validationResult.mergePropertyMatch(propertyvalidationResult);
                    }
                });
            } else if (schema.additionalProperties === false) {
                if (unprocessedProperties.length > 0) {
                    unprocessedProperties.forEach(function (propertyName) {
                        var child = seenKeys[propertyName];
                        if (child) {
                            var propertyNode = child.parent;
                            validationResult.warnings.push({
                                location: { start: propertyNode.key.start, end: propertyNode.key.end },
                                message: 'Property ' + propertyName + ' is not allowed'
                            });
                        }
                    });
                }
            }
            if (schema.maxProperties) {
                if (this.properties.length > schema.maxProperties) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Object has more properties than limit of ' + schema.maxProperties
                    });
                }
            }
            if (schema.minProperties) {
                if (this.properties.length < schema.minProperties) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Object has fewer properties than the required number of ' + schema.minProperties
                    });
                }
            }
            if (schema.dependencies) {
                Object.keys(schema.dependencies).forEach(function (key) {
                    var prop = seenKeys[key];
                    if (prop) {
                        if (Array.isArray(schema.dependencies[key])) {
                            var valueAsArray = schema.dependencies[key];
                            valueAsArray.forEach(function (requiredProp) {
                                if (!seenKeys[requiredProp]) {
                                    validationResult.warnings.push({
                                        location: { start: _this10.start, end: _this10.end },
                                        message: 'Object is missing property ' + (requiredProp, key) + ' required by property {1}'
                                    });
                                } else {
                                    validationResult.propertiesValueMatches++;
                                }
                            });
                        } else if (schema.dependencies[key]) {
                            var valueAsSchema = schema.dependencies[key];
                            var propertyvalidationResult = new ValidationResult();
                            _this10.validate(valueAsSchema, propertyvalidationResult, matchingSchemas, offset);
                            validationResult.mergePropertyMatch(propertyvalidationResult);
                        }
                    }
                });
            }
        }
    }]);

    return ObjectASTNode;
}(ASTNode);

var JSONDocumentConfig = exports.JSONDocumentConfig = function JSONDocumentConfig() {
    _classCallCheck(this, JSONDocumentConfig);

    this.ignoreDanglingComma = false;
};

var ValidationResult = exports.ValidationResult = function () {
    function ValidationResult() {
        _classCallCheck(this, ValidationResult);

        this.errors = [];
        this.warnings = [];
        this.propertiesMatches = 0;
        this.propertiesValueMatches = 0;
        this.enumValueMatch = false;
    }

    _createClass(ValidationResult, [{
        key: 'hasErrors',
        value: function hasErrors() {
            return !!this.errors.length || !!this.warnings.length;
        }
    }, {
        key: 'mergeAll',
        value: function mergeAll(validationResults) {
            var _this11 = this;

            validationResults.forEach(function (validationResult) {
                _this11.merge(validationResult);
            });
        }
    }, {
        key: 'merge',
        value: function merge(validationResult) {
            this.errors = this.errors.concat(validationResult.errors);
            this.warnings = this.warnings.concat(validationResult.warnings);
        }
    }, {
        key: 'mergePropertyMatch',
        value: function mergePropertyMatch(propertyValidationResult) {
            this.merge(propertyValidationResult);
            this.propertiesMatches++;
            if (propertyValidationResult.enumValueMatch || !propertyValidationResult.hasErrors() && propertyValidationResult.propertiesMatches) {
                this.propertiesValueMatches++;
            }
        }
    }, {
        key: 'compare',
        value: function compare(other) {
            var hasErrors = this.hasErrors();
            if (hasErrors !== other.hasErrors()) {
                return hasErrors ? -1 : 1;
            }
            if (this.enumValueMatch !== other.enumValueMatch) {
                return other.enumValueMatch ? -1 : 1;
            }
            if (this.propertiesValueMatches !== other.propertiesValueMatches) {
                return this.propertiesValueMatches - other.propertiesValueMatches;
            }
            return this.propertiesMatches - other.propertiesMatches;
        }
    }]);

    return ValidationResult;
}();

var JSONDocument = exports.JSONDocument = function () {
    function JSONDocument(config) {
        _classCallCheck(this, JSONDocument);

        this.config = config;
        this.validationResult = new ValidationResult();
    }

    _createClass(JSONDocument, [{
        key: 'getNodeFromOffset',
        value: function getNodeFromOffset(offset) {
            return this.root && this.root.getNodeFromOffset(offset);
        }
    }, {
        key: 'getNodeFromOffsetEndInclusive',
        value: function getNodeFromOffsetEndInclusive(offset) {
            return this.root && this.root.getNodeFromOffsetEndInclusive(offset);
        }
    }, {
        key: 'visit',
        value: function visit(visitor) {
            if (this.root) {
                this.root.visit(visitor);
            }
        }
    }, {
        key: 'validate',
        value: function validate(schema) {
            var matchingSchemas = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            var offset = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

            if (this.root) {
                this.root.validate(schema, this.validationResult, matchingSchemas, offset);
            }
        }
    }, {
        key: 'errors',
        get: function get() {
            return this.validationResult.errors;
        }
    }, {
        key: 'warnings',
        get: function get() {
            return this.validationResult.warnings;
        }
    }]);

    return JSONDocument;
}();

function parse(text) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? new JSONDocumentConfig() : arguments[1];

    var _doc = new JSONDocument(config);
    var _scanner = _jsoncParser2.default.createScanner(text, true);
    function _accept(token) {
        if (_scanner.getToken() === token) {
            _scanner.scan();
            return true;
        }
        return false;
    }
    function _error(message) {
        var node = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var skipUntilAfter = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
        var skipUntil = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

        if (_doc.errors.length === 0 || _doc.errors[0].location.start !== _scanner.getTokenOffset()) {
            var error = { message: message, location: { start: _scanner.getTokenOffset(), end: _scanner.getTokenOffset() + _scanner.getTokenLength() } };
            _doc.errors.push(error);
        }
        if (node) {
            _finalize(node, false);
        }
        if (skipUntilAfter.length + skipUntil.length > 0) {
            var token = _scanner.getToken();
            while (token !== _jsoncParser2.default.SyntaxKind.EOF) {
                if (skipUntilAfter.indexOf(token) !== -1) {
                    _scanner.scan();
                    break;
                } else if (skipUntil.indexOf(token) !== -1) {
                    break;
                }
                token = _scanner.scan();
            }
        }
        return node;
    }
    function _checkScanError() {
        switch (_scanner.getTokenError()) {
            case _jsoncParser2.default.ScanError.InvalidUnicode:
                _error('Invalid unicode sequence in string');
                return true;
            case _jsoncParser2.default.ScanError.InvalidEscapeCharacter:
                _error('Invalid escape character in string');
                return true;
            case _jsoncParser2.default.ScanError.UnexpectedEndOfNumber:
                _error('Unexpected end of number');
                return true;
            case _jsoncParser2.default.ScanError.UnexpectedEndOfComment:
                _error('Unexpected end of comment');
                return true;
            case _jsoncParser2.default.ScanError.UnexpectedEndOfString:
                _error('Unexpected end of string');
                return true;
        }
        return false;
    }
    function _finalize(node, scanNext) {
        node.end = _scanner.getTokenOffset() + _scanner.getTokenLength();
        if (scanNext) {
            _scanner.scan();
        }
        return node;
    }
    function _parseArray(parent, name) {
        if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.OpenBracketToken) {
            return null;
        }
        var node = new ArrayASTNode(parent, name, _scanner.getTokenOffset());
        _scanner.scan();
        var count = 0;
        if (node.addItem(_parseValue(node, '' + count++))) {
            while (_accept(_jsoncParser2.default.SyntaxKind.CommaToken)) {
                if (!node.addItem(_parseValue(node, '' + count++)) && !_doc.config.ignoreDanglingComma) {
                    _error('Value expected');
                }
            }
        }
        if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.CloseBracketToken) {
            return _error('Expected comma or closing bracket', node);
        }
        return _finalize(node, true);
    }
    function _parseProperty(parent, keysSeen) {
        var key = _parseString(null, null, true);
        if (!key) {
            if (_scanner.getToken() === _jsoncParser2.default.SyntaxKind.Unknown) {
                var value = _scanner.getTokenValue();
                if (value.match(/^['\w]/)) {
                    _error('Property keys must be doublequoted');
                }
            }
            return null;
        }
        var node = new PropertyASTNode(parent, key);
        if (keysSeen[key.value]) {
            _doc.warnings.push({ location: { start: node.key.start, end: node.key.end }, message: 'Duplicate object key' });
        }
        keysSeen[key.value] = true;
        if (_scanner.getToken() === _jsoncParser2.default.SyntaxKind.ColonToken) {
            node.colonOffset = _scanner.getTokenOffset();
        } else {
            return _error('Colon expected', node, [], [_jsoncParser2.default.SyntaxKind.CloseBraceToken, _jsoncParser2.default.SyntaxKind.CommaToken]);
        }
        _scanner.scan();
        if (!node.setValue(_parseValue(node, key.value))) {
            return _error('Value expected', node, [], [_jsoncParser2.default.SyntaxKind.CloseBraceToken, _jsoncParser2.default.SyntaxKind.CommaToken]);
        }
        node.end = node.value.end;
        return node;
    }
    function _parseObject(parent, name) {
        if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.OpenBraceToken) {
            return null;
        }
        var node = new ObjectASTNode(parent, name, _scanner.getTokenOffset());
        _scanner.scan();
        var keysSeen = {};
        if (node.addProperty(_parseProperty(node, keysSeen))) {
            while (_accept(_jsoncParser2.default.SyntaxKind.CommaToken)) {
                if (!node.addProperty(_parseProperty(node, keysSeen)) && !_doc.config.ignoreDanglingComma) {
                    _error('Property expected');
                }
            }
        }
        if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.CloseBraceToken) {
            return _error('Expected comma or closing brace', node);
        }
        return _finalize(node, true);
    }
    function _parseString(parent, name, isKey) {
        if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.StringLiteral) {
            return null;
        }
        var node = new StringASTNode(parent, name, isKey, _scanner.getTokenOffset());
        node.value = _scanner.getTokenValue();
        _checkScanError();
        return _finalize(node, true);
    }
    function _parseNumber(parent, name) {
        if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.NumericLiteral) {
            return null;
        }
        var node = new NumberASTNode(parent, name, _scanner.getTokenOffset());
        if (!_checkScanError()) {
            var tokenValue = _scanner.getTokenValue();
            try {
                var numberValue = JSON.parse(tokenValue);
                if (typeof numberValue !== 'number') {
                    return _error('Invalid number format', node);
                }
                node.value = numberValue;
            } catch (e) {
                return _error('Invalid number format', node);
            }
            node.isInteger = tokenValue.indexOf('.') === -1;
        }
        return _finalize(node, true);
    }
    function _parseLiteral(parent, name) {
        var node = void 0;
        switch (_scanner.getToken()) {
            case _jsoncParser2.default.SyntaxKind.NullKeyword:
                node = new NullASTNode(parent, name, _scanner.getTokenOffset());
                break;
            case _jsoncParser2.default.SyntaxKind.TrueKeyword:
                node = new BooleanASTNode(parent, name, true, _scanner.getTokenOffset());
                break;
            case _jsoncParser2.default.SyntaxKind.FalseKeyword:
                node = new BooleanASTNode(parent, name, false, _scanner.getTokenOffset());
                break;
            default:
                return null;
        }
        return _finalize(node, true);
    }
    function _parseValue(parent, name) {
        return _parseArray(parent, name) || _parseObject(parent, name) || _parseString(parent, name, false) || _parseNumber(parent, name) || _parseLiteral(parent, name);
    }
    _scanner.scan();
    _doc.root = _parseValue(null, null);
    if (!_doc.root) {
        _error('Expected a JSON object, array or literal');
    } else if (_scanner.getToken() !== _jsoncParser2.default.SyntaxKind.EOF) {
        _error('End of file expected');
    }
    return _doc;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvblBhcnNlci50cyIsInZzY29kZS9wbHVnaW4vanNvblBhcnNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7Ozs7Ozs7UUF5eEJBLEssR0FBQSxLOztBQzV4QkE7Ozs7QUFDQTs7Ozs7Ozs7OztJRGtCQSxPLFdBQUEsTztBQU9JLHFCQUFZLE1BQVosRUFBNkIsSUFBN0IsRUFBMkMsSUFBM0MsRUFBeUQsS0FBekQsRUFBd0UsR0FBeEUsRUFBb0Y7QUFBQTs7QUFDaEYsYUFBSyxJQUFMLEdBQVksSUFBWjtBQUNBLGFBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxhQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsYUFBSyxHQUFMLEdBQVcsR0FBWDtBQUNBLGFBQUssTUFBTCxHQUFjLE1BQWQ7QUFDSDs7OzswQ0FFcUI7QUFDbEIsZ0JBQUksT0FBTyxLQUFLLE1BQUwsR0FBYyxLQUFLLE1BQUwsQ0FBWSxlQUFaLEVBQWQsR0FBOEMsK0JBQWlCLEVBQWpCLENBQXpEO0FBQ0EsZ0JBQUksS0FBSyxJQUFULEVBQWU7QUFDWCx1QkFBTyxLQUFLLE1BQUwsQ0FBWSxLQUFLLElBQWpCLENBQVA7QUFDSDtBQUNELG1CQUFPLElBQVA7QUFDSDs7O3dDQUdtQjtBQUNoQixtQkFBTyxFQUFQO0FBQ0g7OzttQ0FFYztBQUVYO0FBQ0g7OztpQ0FFZSxNLEVBQWtEO0FBQUEsZ0JBQWxDLGlCQUFrQyx5REFBTCxLQUFLOztBQUM5RCxtQkFBTyxVQUFVLEtBQUssS0FBZixJQUF3QixTQUFTLEtBQUssR0FBdEMsSUFBNkMscUJBQXFCLFdBQVcsS0FBSyxHQUF6RjtBQUNIOzs7OEJBRVksTyxFQUFtQztBQUM1QyxtQkFBTyxRQUFRLElBQVIsQ0FBUDtBQUNIOzs7MENBRXdCLE0sRUFBYztBQUNuQyxnQkFBSSxXQUFXLFNBQVgsUUFBVyxDQUFDLElBQUQsRUFBYztBQUN6QixvQkFBSSxVQUFVLEtBQUssS0FBZixJQUF3QixTQUFTLEtBQUss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QXBCLEtBQTZCLGFBQWEsTUFBYixFQUFxQixJQUFyQixDQUE3QixJQUEyRCxhQUFhLE1BQWIsRUFBcUIsSUFBckIsRUFBMkIsS0FBM0IsQ0FBM0QsSUFBZ0csYUFBYSxNQUFiLEVBQXFCLElBQXJCLENBQWhHLElBQThILGNBQWMsTUFBZCxFQUFzQixJQUF0QixDQUFySTtBQUNIO0FBRUQsYUFBUyxJQUFUO0FBRUEsU0FBSyxJQUFMLEdBQVksWUFBWSxJQUFaLEVBQWtCLElBQWxCLENBQVo7QUFDQSxRQUFJLENBQUMsS0FBSyxJQUFWLEVBQWdCO0FBQ1o7QUFDSCxLQUZELE1BRU8sSUFBSSxTQUFTLFFBQVQsT0FBd0Isc0JBQUssVUFBTCxDQUFnQixHQUE1QyxFQUFpRDtBQUNwRDtBQUNIO0FBQ0QsV0FBTyxJQUFQO0FBQ0giLCJmaWxlIjoidnNjb2RlL3BsdWdpbi9qc29uUGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBKc29uIGZyb20gJ2pzb25jLXBhcnNlcic7XHJcbmltcG9ydCBKc29uU2NoZW1hIGZyb20gJy4vanNvblNjaGVtYSc7XHJcbmltcG9ydCB7SlNPTkxvY2F0aW9ufSBmcm9tICcuL2pzb25Mb2NhdGlvbic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSYW5nZSB7XHJcbiAgICBzdGFydDogbnVtYmVyO1xyXG4gICAgZW5kOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUVycm9yIHtcclxuICAgIGxvY2F0aW9uOiBJUmFuZ2U7XHJcbiAgICBtZXNzYWdlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBU1ROb2RlIHtcclxuICAgIHB1YmxpYyBzdGFydDogbnVtYmVyO1xyXG4gICAgcHVibGljIGVuZDogbnVtYmVyO1xyXG4gICAgcHVibGljIHR5cGU6IHN0cmluZztcclxuICAgIHB1YmxpYyBwYXJlbnQ6IEFTVE5vZGU7XHJcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudDogQVNUTm9kZSwgdHlwZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XHJcbiAgICAgICAgdGhpcy5lbmQgPSBlbmQ7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE5vZGVMb2NhdGlvbigpOiBKU09OTG9jYXRpb24ge1xyXG4gICAgICAgIGxldCBwYXRoID0gdGhpcy5wYXJlbnQgPyB0aGlzLnBhcmVudC5nZXROb2RlTG9jYXRpb24oKSA6IG5ldyBKU09OTG9jYXRpb24oW10pO1xyXG4gICAgICAgIGlmICh0aGlzLm5hbWUpIHtcclxuICAgICAgICAgICAgcGF0aCA9IHBhdGguYXBwZW5kKHRoaXMubmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXRoO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2hpbGROb2RlcygpOiBBU1ROb2RlW10ge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0VmFsdWUoKTogYW55IHtcclxuICAgICAgICAvLyBvdmVycmlkZSBpbiBjaGlsZHJlblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29udGFpbnMob2Zmc2V0OiBudW1iZXIsIGluY2x1ZGVSaWdodEJvdW5kOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gb2Zmc2V0ID49IHRoaXMuc3RhcnQgJiYgb2Zmc2V0IDwgdGhpcy5lbmQgfHwgaW5jbHVkZVJpZ2h0Qm91bmQgJiYgb2Zmc2V0ID09PSB0aGlzLmVuZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmlzaXQodmlzaXRvcjogKG5vZGU6IEFTVE5vZGUpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdmlzaXRvcih0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm9kZUZyb21PZmZzZXQob2Zmc2V0OiBudW1iZXIpOiBBU1ROb2RlIHtcclxuICAgICAgICBsZXQgZmluZE5vZGUgPSAobm9kZTogQVNUTm9kZSk6IEFTVE5vZGUgPT4ge1xyXG4gICAgICAgICAgICBpZiAob2Zmc2V0ID49IG5vZGUuc3RhcnQgJiYgb2Zmc2V0IDwgbm9kZS5lbmQpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbiA9IG5vZGUuZ2V0Q2hpbGROb2RlcygpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGggJiYgY2hpbGRyZW5baV0uc3RhcnQgPD0gb2Zmc2V0OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbSA9IGZpbmROb2RlKGNoaWxkcmVuW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBmaW5kTm9kZSh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0OiBudW1iZXIpOiBBU1ROb2RlIHtcclxuICAgICAgICBsZXQgZmluZE5vZGUgPSAobm9kZTogQVNUTm9kZSk6IEFTVE5vZGUgPT4ge1xyXG4gICAgICAgICAgICBpZiAob2Zmc2V0ID49IG5vZGUuc3RhcnQgJiYgb2Zmc2V0IDw9IG5vZGUuZW5kKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGRyZW4gPSBub2RlLmdldENoaWxkTm9kZXMoKTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoICYmIGNoaWxkcmVuW2ldLnN0YXJ0IDw9IG9mZnNldDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW0gPSBmaW5kTm9kZShjaGlsZHJlbltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZmluZE5vZGUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbGlkYXRlKHNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzOiBJQXBwbGljYWJsZVNjaGVtYVtdLCBvZmZzZXQ6IG51bWJlciA9IC0xKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEudHlwZSkpIHtcclxuICAgICAgICAgICAgaWYgKCg8c3RyaW5nW10+c2NoZW1hLnR5cGUpLmluZGV4T2YodGhpcy50eXBlKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzY2hlbWEuZXJyb3JNZXNzYWdlIHx8IGBJbmNvcnJlY3QgdHlwZS4gRXhwZWN0ZWQgb25lIG9mICR7KDxzdHJpbmdbXT5zY2hlbWEudHlwZSkuam9pbignLCAnKX1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy50eXBlICE9PSBzY2hlbWEudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHNjaGVtYS5lcnJvck1lc3NhZ2UgfHwgYEluY29ycmVjdCB0eXBlLiBFeHBlY3RlZCBcIiR7c2NoZW1hLnR5cGV9XCJgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XHJcbiAgICAgICAgICAgIHNjaGVtYS5hbGxPZi5mb3JFYWNoKChzdWJTY2hlbWEpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGUoc3ViU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2NoZW1hLm5vdCkge1xyXG4gICAgICAgICAgICBsZXQgc3ViVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgIGxldCBzdWJNYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW10gPSBbXTtcclxuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZShzY2hlbWEubm90LCBzdWJWYWxpZGF0aW9uUmVzdWx0LCBzdWJNYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgICAgIGlmICghc3ViVmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBNYXRjaGVzIGEgc2NoZW1hIHRoYXQgaXMgbm90IGFsbG93ZWQuYFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1hdGNoaW5nU2NoZW1hcykge1xyXG4gICAgICAgICAgICAgICAgc3ViTWF0Y2hpbmdTY2hlbWFzLmZvckVhY2goKG1zKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXMuaW52ZXJ0ZWQgPSAhbXMuaW52ZXJ0ZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLnB1c2gobXMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB0ZXN0QWx0ZXJuYXRpdmVzID0gKGFsdGVybmF0aXZlczogSnNvblNjaGVtYS5JSlNPTlNjaGVtYVtdLCBtYXhPbmVNYXRjaDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2hlczogYW55W10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoZSBiZXN0IG1hdGNoIHRoYXQgaXMgdXNlZCBmb3IgZXJyb3IgbWVzc2FnZXNcclxuICAgICAgICAgICAgbGV0IGJlc3RNYXRjaDogeyBzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWE7IHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQ7IG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXTsgfSA9IG51bGw7XHJcbiAgICAgICAgICAgIGFsdGVybmF0aXZlcy5mb3JFYWNoKChzdWJTY2hlbWEpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdWJWYWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgIGxldCBzdWJNYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGUoc3ViU2NoZW1hLCBzdWJWYWxpZGF0aW9uUmVzdWx0LCBzdWJNYXRjaGluZ1NjaGVtYXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzdWJWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKHN1YlNjaGVtYSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWJlc3RNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaCA9IHsgc2NoZW1hOiBzdWJTY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IHN1YlZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogc3ViTWF0Y2hpbmdTY2hlbWFzIH07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWF4T25lTWF0Y2ggJiYgIXN1YlZhbGlkYXRpb25SZXN1bHQuaGFzRXJyb3JzKCkgJiYgIWJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIGVycm9ycywgYm90aCBhcmUgZXF1YWxseSBnb29kIG1hdGNoZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1hdGNoLm1hdGNoaW5nU2NoZW1hcy5wdXNoLmFwcGx5KGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMsIHN1Yk1hdGNoaW5nU2NoZW1hcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNNYXRjaGVzICs9IHN1YlZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMgKz0gc3ViVmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb21wYXJlUmVzdWx0ID0gc3ViVmFsaWRhdGlvblJlc3VsdC5jb21wYXJlKGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBhcmVSZXN1bHQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvdXIgbm9kZSBpcyB0aGUgYmVzdCBtYXRjaGluZyBzbyBmYXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaCA9IHsgc2NoZW1hOiBzdWJTY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IHN1YlZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogc3ViTWF0Y2hpbmdTY2hlbWFzIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tcGFyZVJlc3VsdCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUncyBhbHJlYWR5IGEgYmVzdCBtYXRjaGluZyBidXQgd2UgYXJlIGFzIGdvb2RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMucHVzaC5hcHBseShiZXN0TWF0Y2gubWF0Y2hpbmdTY2hlbWFzLCBzdWJNYXRjaGluZ1NjaGVtYXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA+IDEgJiYgbWF4T25lTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5zdGFydCArIDEgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTWF0Y2hlcyBtdWx0aXBsZSBzY2hlbWFzIHdoZW4gb25seSBvbmUgbXVzdCB2YWxpZGF0ZS5gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYmVzdE1hdGNoICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlKGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXMgKz0gYmVzdE1hdGNoLnZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXM7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMgKz0gYmVzdE1hdGNoLnZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcztcclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZ1NjaGVtYXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ1NjaGVtYXMucHVzaC5hcHBseShtYXRjaGluZ1NjaGVtYXMsIGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVzLmxlbmd0aDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcclxuICAgICAgICAgICAgdGVzdEFsdGVybmF0aXZlcyhzY2hlbWEuYW55T2YsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLm9uZU9mKSkge1xyXG4gICAgICAgICAgICB0ZXN0QWx0ZXJuYXRpdmVzKHNjaGVtYS5vbmVPZiwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZW51bSkpIHtcclxuICAgICAgICAgICAgaWYgKHNjaGVtYS5lbnVtLmluZGV4T2YodGhpcy5nZXRWYWx1ZSgpKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsdWUgaXMgbm90IGFuIGFjY2VwdGVkIHZhbHVlLiBWYWxpZCB2YWx1ZXM6ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLmVudW0pfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5lbnVtVmFsdWVNYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtYXRjaGluZ1NjaGVtYXMgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLnB1c2goeyBub2RlOiB0aGlzLCBzY2hlbWE6IHNjaGVtYSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBOdWxsQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcclxuICAgICAgICBzdXBlcihwYXJlbnQsICdudWxsJywgbmFtZSwgc3RhcnQsIGVuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFZhbHVlKCk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCb29sZWFuQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG5cclxuICAgIHByaXZhdGUgdmFsdWU6IGJvb2xlYW47XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcclxuICAgICAgICBzdXBlcihwYXJlbnQsICdib29sZWFuJywgbmFtZSwgc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRWYWx1ZSgpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFycmF5QVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG5cclxuICAgIHB1YmxpYyBpdGVtczogQVNUTm9kZVtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcclxuICAgICAgICBzdXBlcihwYXJlbnQsICdhcnJheScsIG5hbWUsIHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2hpbGROb2RlcygpOiBBU1ROb2RlW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRWYWx1ZSgpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zLm1hcCgodikgPT4gdi5nZXRWYWx1ZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkSXRlbShpdGVtOiBBU1ROb2RlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2aXNpdCh2aXNpdG9yOiAobm9kZTogQVNUTm9kZSkgPT4gYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBjdG4gPSB2aXNpdG9yKHRoaXMpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGggJiYgY3RuOyBpKyspIHtcclxuICAgICAgICAgICAgY3RuID0gdGhpcy5pdGVtc1tpXS52aXNpdCh2aXNpdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN0bjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmFsaWRhdGUoc2NoZW1hOiBKc29uU2NoZW1hLklKU09OU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW10sIG9mZnNldDogbnVtYmVyID0gLTEpOiB2b2lkIHtcclxuICAgICAgICBpZiAob2Zmc2V0ICE9PSAtMSAmJiAhdGhpcy5jb250YWlucyhvZmZzZXQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5pdGVtcykpIHtcclxuICAgICAgICAgICAgbGV0IHN1YlNjaGVtYXMgPSA8SnNvblNjaGVtYS5JSlNPTlNjaGVtYVtdPiBzY2hlbWEuaXRlbXM7XHJcbiAgICAgICAgICAgIHN1YlNjaGVtYXMuZm9yRWFjaCgoc3ViU2NoZW1hLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGl0ZW1WYWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgIGxldCBpdGVtID0gdGhpcy5pdGVtc1tpbmRleF07XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udmFsaWRhdGUoc3ViU2NoZW1hLCBpdGVtVmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQubWVyZ2VQcm9wZXJ0eU1hdGNoKGl0ZW1WYWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pdGVtcy5sZW5ndGggPj0gc3ViU2NoZW1hcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2NoZW1hLmFkZGl0aW9uYWxJdGVtcyA9PT0gZmFsc2UgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiBzdWJTY2hlbWFzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgdG9vIG1hbnkgaXRlbXMgYWNjb3JkaW5nIHRvIHNjaGVtYS4gRXhwZWN0ZWQgJHtzdWJTY2hlbWFzLmxlbmd0aH0gb3IgZmV3ZXJgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLml0ZW1zLmxlbmd0aCA+PSBzdWJTY2hlbWFzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9ICh0aGlzLml0ZW1zLmxlbmd0aCAtIHN1YlNjaGVtYXMubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzY2hlbWEuaXRlbXMpIHtcclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaXRlbVZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xyXG4gICAgICAgICAgICAgICAgaXRlbS52YWxpZGF0ZShzY2hlbWEuaXRlbXMsIGl0ZW1WYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChpdGVtVmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5taW5JdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA8IHNjaGVtYS5taW5JdGVtcykge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgdG9vIGZldyBpdGVtcy4gRXhwZWN0ZWQgJHtzY2hlbWEubWluSXRlbXN9IG9yIG1vcmVgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5tYXhJdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IHNjaGVtYS5tYXhJdGVtcykge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgdG9vIG1hbnkgaXRlbXMuIEV4cGVjdGVkICR7c2NoZW1hLm1pbkl0ZW1zfSBvciBmZXdlcmBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2NoZW1hLnVuaXF1ZUl0ZW1zID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZXMgPSB0aGlzLml0ZW1zLm1hcCgobm9kZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0VmFsdWUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGxldCBkdXBsaWNhdGVzID0gdmFsdWVzLnNvbWUoKHZhbHVlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ICE9PSB2YWx1ZXMubGFzdEluZGV4T2YodmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGR1cGxpY2F0ZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQXJyYXkgaGFzIGR1cGxpY2F0ZSBpdGVtc2BcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTnVtYmVyQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG5cclxuICAgIHB1YmxpYyBpc0ludGVnZXI6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgdmFsdWU6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kPzogbnVtYmVyKSB7XHJcbiAgICAgICAgc3VwZXIocGFyZW50LCAnbnVtYmVyJywgbmFtZSwgc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgdGhpcy5pc0ludGVnZXIgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSBOdW1iZXIuTmFOO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRWYWx1ZSgpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWxpZGF0ZShzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gd29yayBhcm91bmQgdHlwZSB2YWxpZGF0aW9uIGluIHRoZSBiYXNlIGNsYXNzXHJcbiAgICAgICAgbGV0IHR5cGVJc0ludGVnZXIgPSBmYWxzZTtcclxuICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdpbnRlZ2VyJyB8fCAoQXJyYXkuaXNBcnJheShzY2hlbWEudHlwZSkgJiYgKDxzdHJpbmdbXT5zY2hlbWEudHlwZSkuaW5kZXhPZignaW50ZWdlcicpICE9PSAtMSkpIHtcclxuICAgICAgICAgICAgdHlwZUlzSW50ZWdlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlSXNJbnRlZ2VyICYmIHRoaXMuaXNJbnRlZ2VyID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdpbnRlZ2VyJztcclxuICAgICAgICB9XHJcbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgdGhpcy50eXBlID0gJ251bWJlcic7XHJcblxyXG4gICAgICAgIGxldCB2YWwgPSB0aGlzLmdldFZhbHVlKCk7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc2NoZW1hLm11bHRpcGxlT2YgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgJSBzY2hlbWEubXVsdGlwbGVPZiAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBub3QgZGl2aXNpYmxlIGJ5ICR7c2NoZW1hLm11bHRpcGxlT2Z9YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygc2NoZW1hLm1pbmltdW0gPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIGlmIChzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAmJiB2YWwgPD0gc2NoZW1hLm1pbmltdW0pIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsdWUgaXMgYmVsb3cgdGhlIGV4Y2x1c2l2ZSBtaW5pbXVtIG9mICR7c2NoZW1hLm1pbmltdW19YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAmJiB2YWwgPCBzY2hlbWEubWluaW11bSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBiZWxvdyB0aGUgbWluaW11bSBvZiAke3NjaGVtYS5taW5pbXVtfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5tYXhpbXVtID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICBpZiAoc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gJiYgdmFsID49IHNjaGVtYS5tYXhpbXVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFZhbHVlIGlzIGFib3ZlIHRoZSBleGNsdXNpdmUgbWF4aW11bSBvZiAke3NjaGVtYS5tYXhpbXVtfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gJiYgdmFsID4gc2NoZW1hLm1heGltdW0pIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsdWUgaXMgYWJvdmUgdGhlIG1heGltdW0gb2YgJHtzY2hlbWEubWF4aW11bX1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTdHJpbmdBU1ROb2RlIGV4dGVuZHMgQVNUTm9kZSB7XHJcbiAgICBwdWJsaWMgaXNLZXk6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgdmFsdWU6IHN0cmluZztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZywgaXNLZXk6IGJvb2xlYW4sIHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xyXG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ3N0cmluZycsIG5hbWUsIHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIHRoaXMuaXNLZXkgPSBpc0tleTtcclxuICAgICAgICB0aGlzLnZhbHVlID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFZhbHVlKCk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbGlkYXRlKHNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzOiBJQXBwbGljYWJsZVNjaGVtYVtdLCBvZmZzZXQ6IG51bWJlciA9IC0xKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN1cGVyLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG5cclxuICAgICAgICBpZiAoc2NoZW1hLm1pbkxlbmd0aCAmJiB0aGlzLnZhbHVlLmxlbmd0aCA8IHNjaGVtYS5taW5MZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU3RyaW5nIGlzIHNob3J0ZXIgdGhhbiB0aGUgbWluaW11bSBsZW5ndGggb2YgJHtzY2hlbWEubWluTGVuZ3RofWBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2NoZW1hLm1heExlbmd0aCAmJiB0aGlzLnZhbHVlLmxlbmd0aCA+IHNjaGVtYS5tYXhMZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU3RyaW5nIGlzIHNob3J0ZXIgdGhhbiB0aGUgbWF4aW11bSBsZW5ndGggb2YgJHtzY2hlbWEubWF4TGVuZ3RofWBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm4pIHtcclxuICAgICAgICAgICAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChzY2hlbWEucGF0dGVybik7XHJcbiAgICAgICAgICAgIGlmICghcmVnZXgudGVzdCh0aGlzLnZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHNjaGVtYS5lcnJvck1lc3NhZ2UgfHwgYFN0cmluZyBkb2VzIG5vdCBtYXRjaCB0aGUgcGF0dGVybiBvZiBcIiR7c2NoZW1hLnBhdHRlcm59XCJgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcclxuICAgIHB1YmxpYyBrZXk6IFN0cmluZ0FTVE5vZGU7XHJcbiAgICBwdWJsaWMgdmFsdWU6IEFTVE5vZGU7XHJcbiAgICBwdWJsaWMgY29sb25PZmZzZXQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IEFTVE5vZGUsIGtleTogU3RyaW5nQVNUTm9kZSkge1xyXG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ3Byb3BlcnR5JywgbnVsbCwga2V5LnN0YXJ0KTtcclxuICAgICAgICB0aGlzLmtleSA9IGtleTtcclxuICAgICAgICBrZXkucGFyZW50ID0gdGhpcztcclxuICAgICAgICBrZXkubmFtZSA9IGtleS52YWx1ZTtcclxuICAgICAgICB0aGlzLmNvbG9uT2Zmc2V0ID0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENoaWxkTm9kZXMoKTogQVNUTm9kZVtdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA/IFt0aGlzLmtleSwgdGhpcy52YWx1ZV0gOiBbdGhpcy5rZXldO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRWYWx1ZSh2YWx1ZTogQVNUTm9kZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICByZXR1cm4gdmFsdWUgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZpc2l0KHZpc2l0b3I6IChub2RlOiBBU1ROb2RlKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHZpc2l0b3IodGhpcykgJiYgdGhpcy5rZXkudmlzaXQodmlzaXRvcikgJiYgdGhpcy52YWx1ZSAmJiB0aGlzLnZhbHVlLnZpc2l0KHZpc2l0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWxpZGF0ZShzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy52YWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE9iamVjdEFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcclxuICAgIHB1YmxpYyBwcm9wZXJ0aWVzOiBQcm9wZXJ0eUFTVE5vZGVbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kPzogbnVtYmVyKSB7XHJcbiAgICAgICAgc3VwZXIocGFyZW50LCAnb2JqZWN0JywgbmFtZSwgc3RhcnQsIGVuZCk7XHJcblxyXG4gICAgICAgIHRoaXMucHJvcGVydGllcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRDaGlsZE5vZGVzKCk6IEFTVE5vZGVbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkUHJvcGVydHkobm9kZTogUHJvcGVydHlBU1ROb2RlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYgKCFub2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEZpcnN0UHJvcGVydHkoa2V5OiBzdHJpbmcpOiBQcm9wZXJ0eUFTVE5vZGUge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXNbaV0ua2V5LnZhbHVlID09PSBrZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEtleUxpc3QoKTogc3RyaW5nW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXMubWFwKChwKSA9PiBwLmtleS5nZXRWYWx1ZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0VmFsdWUoKTogYW55IHtcclxuICAgICAgICBsZXQgdmFsdWU6IGFueSA9IHt9O1xyXG4gICAgICAgIHRoaXMucHJvcGVydGllcy5mb3JFYWNoKChwKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB2ID0gcC52YWx1ZSAmJiBwLnZhbHVlLmdldFZhbHVlKCk7XHJcbiAgICAgICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZVtwLmtleS5nZXRWYWx1ZSgpXSA9IHY7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZpc2l0KHZpc2l0b3I6IChub2RlOiBBU1ROb2RlKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgbGV0IGN0biA9IHZpc2l0b3IodGhpcyk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByb3BlcnRpZXMubGVuZ3RoICYmIGN0bjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGN0biA9IHRoaXMucHJvcGVydGllc1tpXS52aXNpdCh2aXNpdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN0bjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmFsaWRhdGUoc2NoZW1hOiBKc29uU2NoZW1hLklKU09OU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW10sIG9mZnNldDogbnVtYmVyID0gLTEpOiB2b2lkIHtcclxuICAgICAgICBpZiAob2Zmc2V0ICE9PSAtMSAmJiAhdGhpcy5jb250YWlucyhvZmZzZXQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1cGVyLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG4gICAgICAgIGxldCBzZWVuS2V5czogeyBba2V5OiBzdHJpbmddOiBBU1ROb2RlIH0gPSB7fTtcclxuICAgICAgICBsZXQgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgIHRoaXMucHJvcGVydGllcy5mb3JFYWNoKChub2RlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBrZXkgPSBub2RlLmtleS52YWx1ZTtcclxuICAgICAgICAgICAgc2VlbktleXNba2V5XSA9IG5vZGUudmFsdWU7XHJcbiAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5wdXNoKGtleSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkpIHtcclxuICAgICAgICAgICAgc2NoZW1hLnJlcXVpcmVkLmZvckVhY2goKHByb3BlcnR5TmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlZW5LZXlzW3Byb3BlcnR5TmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQga2V5ID0gdGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQgJiYgKDxQcm9wZXJ0eUFTVE5vZGU+dGhpcy5wYXJlbnQpLmtleTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYXRpb24gPSBrZXkgPyB7IHN0YXJ0OiBrZXkuc3RhcnQsIGVuZDoga2V5LmVuZCB9IDogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLnN0YXJ0ICsgMSB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE1pc3NpbmcgcHJvcGVydHkgXCIke3Byb3BlcnR5TmFtZX1cImBcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IHByb3BlcnR5UHJvY2Vzc2VkID0gKHByb3A6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSB1bnByb2Nlc3NlZFByb3BlcnRpZXMuaW5kZXhPZihwcm9wKTtcclxuICAgICAgICAgICAgd2hpbGUgKGluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSB1bnByb2Nlc3NlZFByb3BlcnRpZXMuaW5kZXhPZihwcm9wKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEucHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEucHJvcGVydGllcykuZm9yRWFjaCgocHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5UHJvY2Vzc2VkKHByb3BlcnR5TmFtZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJvcCA9IHNjaGVtYS5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBzZWVuS2V5c1twcm9wZXJ0eU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQudmFsaWRhdGUocHJvcCwgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2gocHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEucGF0dGVyblByb3BlcnRpZXMpLmZvckVhY2goKHByb3BlcnR5UGF0dGVybjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVnZXggPSBuZXcgUmVnRXhwKHByb3BlcnR5UGF0dGVybik7XHJcbiAgICAgICAgICAgICAgICB1bnByb2Nlc3NlZFByb3BlcnRpZXMuc2xpY2UoMCkuZm9yRWFjaCgocHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVnZXgudGVzdChwcm9wZXJ0eU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UHJvY2Vzc2VkKHByb3BlcnR5TmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC52YWxpZGF0ZShzY2hlbWEucGF0dGVyblByb3BlcnRpZXNbcHJvcGVydHlQYXR0ZXJuXSwgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5TmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBzZWVuS2V5c1twcm9wZXJ0eU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQudmFsaWRhdGUoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzLCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgaWYgKHVucHJvY2Vzc2VkUHJvcGVydGllcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB1bnByb2Nlc3NlZFByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBzZWVuS2V5c1twcm9wZXJ0eU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHlOb2RlID0gPFByb3BlcnR5QVNUTm9kZT5jaGlsZC5wYXJlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHByb3BlcnR5Tm9kZS5rZXkuc3RhcnQsIGVuZDogcHJvcGVydHlOb2RlLmtleS5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcm9wZXJ0eSAke3Byb3BlcnR5TmFtZX0gaXMgbm90IGFsbG93ZWRgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2NoZW1hLm1heFByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5sZW5ndGggPiBzY2hlbWEubWF4UHJvcGVydGllcykge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBPYmplY3QgaGFzIG1vcmUgcHJvcGVydGllcyB0aGFuIGxpbWl0IG9mICR7c2NoZW1hLm1heFByb3BlcnRpZXN9YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEubWluUHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLmxlbmd0aCA8IHNjaGVtYS5taW5Qcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE9iamVjdCBoYXMgZmV3ZXIgcHJvcGVydGllcyB0aGFuIHRoZSByZXF1aXJlZCBudW1iZXIgb2YgJHtzY2hlbWEubWluUHJvcGVydGllc31gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5kZXBlbmRlbmNpZXMpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmtleXMoc2NoZW1hLmRlcGVuZGVuY2llcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBwcm9wID0gc2VlbktleXNba2V5XTtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmRlcGVuZGVuY2llc1trZXldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVBc0FycmF5OiBzdHJpbmdbXSA9IHNjaGVtYS5kZXBlbmRlbmNpZXNba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVBc0FycmF5LmZvckVhY2goKHJlcXVpcmVkUHJvcDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNlZW5LZXlzW3JlcXVpcmVkUHJvcF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgT2JqZWN0IGlzIG1pc3NpbmcgcHJvcGVydHkgJHtyZXF1aXJlZFByb3AsIGtleX0gcmVxdWlyZWQgYnkgcHJvcGVydHkgezF9YFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEuZGVwZW5kZW5jaWVzW2tleV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlQXNTY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEgPSBzY2hlbWEuZGVwZW5kZW5jaWVzW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHZhbHVlQXNTY2hlbWEsIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSlNPTkRvY3VtZW50Q29uZmlnIHtcclxuICAgIHB1YmxpYyBpZ25vcmVEYW5nbGluZ0NvbW1hOiBib29sZWFuO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaWdub3JlRGFuZ2xpbmdDb21tYSA9IGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElBcHBsaWNhYmxlU2NoZW1hIHtcclxuICAgIG5vZGU6IEFTVE5vZGU7XHJcbiAgICBpbnZlcnRlZD86IGJvb2xlYW47XHJcbiAgICBzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWE7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0IHtcclxuICAgIHB1YmxpYyBlcnJvcnM6IElFcnJvcltdO1xyXG4gICAgcHVibGljIHdhcm5pbmdzOiBJRXJyb3JbXTtcclxuXHJcbiAgICBwdWJsaWMgcHJvcGVydGllc01hdGNoZXM6IG51bWJlcjtcclxuICAgIHB1YmxpYyBwcm9wZXJ0aWVzVmFsdWVNYXRjaGVzOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgZW51bVZhbHVlTWF0Y2g6IGJvb2xlYW47XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcclxuICAgICAgICB0aGlzLndhcm5pbmdzID0gW107XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzTWF0Y2hlcyA9IDA7XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzID0gMDtcclxuICAgICAgICB0aGlzLmVudW1WYWx1ZU1hdGNoID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGhhc0Vycm9ycygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gISF0aGlzLmVycm9ycy5sZW5ndGggfHwgISF0aGlzLndhcm5pbmdzLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWVyZ2VBbGwodmFsaWRhdGlvblJlc3VsdHM6IFZhbGlkYXRpb25SZXN1bHRbXSk6IHZvaWQge1xyXG4gICAgICAgIHZhbGlkYXRpb25SZXN1bHRzLmZvckVhY2goKHZhbGlkYXRpb25SZXN1bHQpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5tZXJnZSh2YWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWVyZ2UodmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZXJyb3JzID0gdGhpcy5lcnJvcnMuY29uY2F0KHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzKTtcclxuICAgICAgICB0aGlzLndhcm5pbmdzID0gdGhpcy53YXJuaW5ncy5jb25jYXQodmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eVZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLm1lcmdlKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzTWF0Y2hlcysrO1xyXG4gICAgICAgIGlmIChwcm9wZXJ0eVZhbGlkYXRpb25SZXN1bHQuZW51bVZhbHVlTWF0Y2ggfHwgIXByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSAmJiBwcm9wZXJ0eVZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzKys7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wYXJlKG90aGVyOiBWYWxpZGF0aW9uUmVzdWx0KTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgaGFzRXJyb3JzID0gdGhpcy5oYXNFcnJvcnMoKTtcclxuICAgICAgICBpZiAoaGFzRXJyb3JzICE9PSBvdGhlci5oYXNFcnJvcnMoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaGFzRXJyb3JzID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5lbnVtVmFsdWVNYXRjaCAhPT0gb3RoZXIuZW51bVZhbHVlTWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG90aGVyLmVudW1WYWx1ZU1hdGNoID8gLTEgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICE9PSBvdGhlci5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMgLSBvdGhlci5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzTWF0Y2hlcyAtIG90aGVyLnByb3BlcnRpZXNNYXRjaGVzO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEpTT05Eb2N1bWVudCB7XHJcbiAgICBwdWJsaWMgY29uZmlnOiBKU09ORG9jdW1lbnRDb25maWc7XHJcbiAgICBwdWJsaWMgcm9vdDogQVNUTm9kZTtcclxuXHJcbiAgICBwcml2YXRlIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBKU09ORG9jdW1lbnRDb25maWcpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgZXJyb3JzKCk6IElFcnJvcltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0aW9uUmVzdWx0LmVycm9ycztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHdhcm5pbmdzKCk6IElFcnJvcltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXROb2RlRnJvbU9mZnNldChvZmZzZXQ6IG51bWJlcik6IEFTVE5vZGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QgJiYgdGhpcy5yb290LmdldE5vZGVGcm9tT2Zmc2V0KG9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE5vZGVGcm9tT2Zmc2V0RW5kSW5jbHVzaXZlKG9mZnNldDogbnVtYmVyKTogQVNUTm9kZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmlzaXQodmlzaXRvcjogKG5vZGU6IEFTVE5vZGUpID0+IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAodGhpcy5yb290KSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC52aXNpdCh2aXNpdG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbGlkYXRlKHNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgbWF0Y2hpbmdTY2hlbWFzOiBJQXBwbGljYWJsZVNjaGVtYVtdID0gbnVsbCwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmICh0aGlzLnJvb3QpIHtcclxuICAgICAgICAgICAgdGhpcy5yb290LnZhbGlkYXRlKHNjaGVtYSwgdGhpcy52YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UodGV4dDogc3RyaW5nLCBjb25maWcgPSBuZXcgSlNPTkRvY3VtZW50Q29uZmlnKCkpOiBKU09ORG9jdW1lbnQge1xyXG5cclxuICAgIGxldCBfZG9jID0gbmV3IEpTT05Eb2N1bWVudChjb25maWcpO1xyXG4gICAgbGV0IF9zY2FubmVyID0gSnNvbi5jcmVhdGVTY2FubmVyKHRleHQsIHRydWUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9hY2NlcHQodG9rZW46IEpzb24uU3ludGF4S2luZCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpID09PSB0b2tlbikge1xyXG4gICAgICAgICAgICBfc2Nhbm5lci5zY2FuKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2Vycm9yPFQgZXh0ZW5kcyBBU1ROb2RlPihtZXNzYWdlOiBzdHJpbmcsIG5vZGU6IFQgPSBudWxsLCBza2lwVW50aWxBZnRlcjogSnNvbi5TeW50YXhLaW5kW10gPSBbXSwgc2tpcFVudGlsOiBKc29uLlN5bnRheEtpbmRbXSA9IFtdKTogVCB7XHJcbiAgICAgICAgaWYgKF9kb2MuZXJyb3JzLmxlbmd0aCA9PT0gMCB8fCBfZG9jLmVycm9yc1swXS5sb2NhdGlvbi5zdGFydCAhPT0gX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSkge1xyXG4gICAgICAgICAgICAvLyBpZ25vcmUgbXVsdGlwbGUgZXJyb3JzIG9uIHRoZSBzYW1lIG9mZnNldFxyXG4gICAgICAgICAgICBsZXQgZXJyb3IgPSB7IG1lc3NhZ2U6IG1lc3NhZ2UsIGxvY2F0aW9uOiB7IHN0YXJ0OiBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpLCBlbmQ6IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpIH0gfTtcclxuICAgICAgICAgICAgX2RvYy5lcnJvcnMucHVzaChlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobm9kZSkge1xyXG4gICAgICAgICAgICBfZmluYWxpemUobm9kZSwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2tpcFVudGlsQWZ0ZXIubGVuZ3RoICsgc2tpcFVudGlsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IHRva2VuID0gX3NjYW5uZXIuZ2V0VG9rZW4oKTtcclxuICAgICAgICAgICAgd2hpbGUgKHRva2VuICE9PSBKc29uLlN5bnRheEtpbmQuRU9GKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2tpcFVudGlsQWZ0ZXIuaW5kZXhPZih0b2tlbikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChza2lwVW50aWwuaW5kZXhPZih0b2tlbikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0b2tlbiA9IF9zY2FubmVyLnNjYW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfY2hlY2tTY2FuRXJyb3IoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbkVycm9yKCkpIHtcclxuICAgICAgICAgICAgY2FzZSBKc29uLlNjYW5FcnJvci5JbnZhbGlkVW5pY29kZTpcclxuICAgICAgICAgICAgICAgIF9lcnJvcihgSW52YWxpZCB1bmljb2RlIHNlcXVlbmNlIGluIHN0cmluZ2ApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGNhc2UgSnNvbi5TY2FuRXJyb3IuSW52YWxpZEVzY2FwZUNoYXJhY3RlcjpcclxuICAgICAgICAgICAgICAgIF9lcnJvcihgSW52YWxpZCBlc2NhcGUgY2hhcmFjdGVyIGluIHN0cmluZ2ApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGNhc2UgSnNvbi5TY2FuRXJyb3IuVW5leHBlY3RlZEVuZE9mTnVtYmVyOlxyXG4gICAgICAgICAgICAgICAgX2Vycm9yKGBVbmV4cGVjdGVkIGVuZCBvZiBudW1iZXJgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZkNvbW1lbnQ6XHJcbiAgICAgICAgICAgICAgICBfZXJyb3IoYFVuZXhwZWN0ZWQgZW5kIG9mIGNvbW1lbnRgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZlN0cmluZzpcclxuICAgICAgICAgICAgICAgIF9lcnJvcihgVW5leHBlY3RlZCBlbmQgb2Ygc3RyaW5nYCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9maW5hbGl6ZTxUIGV4dGVuZHMgQVNUTm9kZT4obm9kZTogVCwgc2Nhbk5leHQ6IGJvb2xlYW4pOiBUIHtcclxuICAgICAgICBub2RlLmVuZCA9IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpO1xyXG5cclxuICAgICAgICBpZiAoc2Nhbk5leHQpIHtcclxuICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3BhcnNlQXJyYXkocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcpOiBBcnJheUFTVE5vZGUge1xyXG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuT3BlbkJyYWNrZXRUb2tlbikge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG5vZGUgPSBuZXcgQXJyYXlBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgX3NjYW5uZXIuc2NhbigpOyAvLyBjb25zdW1lIE9wZW5CcmFja2V0VG9rZW5cclxuXHJcbiAgICAgICAgbGV0IGNvdW50ID0gMDtcclxuICAgICAgICBpZiAobm9kZS5hZGRJdGVtKF9wYXJzZVZhbHVlKG5vZGUsICcnICsgY291bnQrKykpKSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChfYWNjZXB0KEpzb24uU3ludGF4S2luZC5Db21tYVRva2VuKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmFkZEl0ZW0oX3BhcnNlVmFsdWUobm9kZSwgJycgKyBjb3VudCsrKSkgJiYgIV9kb2MuY29uZmlnLmlnbm9yZURhbmdsaW5nQ29tbWEpIHtcclxuICAgICAgICAgICAgICAgICAgICBfZXJyb3IoYFZhbHVlIGV4cGVjdGVkYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuQ2xvc2VCcmFja2V0VG9rZW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9lcnJvcihgRXhwZWN0ZWQgY29tbWEgb3IgY2xvc2luZyBicmFja2V0YCwgbm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9wYXJzZVByb3BlcnR5KHBhcmVudDogT2JqZWN0QVNUTm9kZSwga2V5c1NlZW46IGFueSk6IFByb3BlcnR5QVNUTm9kZSB7XHJcblxyXG4gICAgICAgIGxldCBrZXkgPSBfcGFyc2VTdHJpbmcobnVsbCwgbnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKCFrZXkpIHtcclxuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IEpzb24uU3ludGF4S2luZC5Vbmtub3duKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBnaXZlIGEgbW9yZSBoZWxwZnVsIGVycm9yIG1lc3NhZ2VcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IF9zY2FubmVyLmdldFRva2VuVmFsdWUoKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaCgvXlsnXFx3XS8pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBQcm9wZXJ0eSBrZXlzIG11c3QgYmUgZG91YmxlcXVvdGVkYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBub2RlID0gbmV3IFByb3BlcnR5QVNUTm9kZShwYXJlbnQsIGtleSk7XHJcblxyXG4gICAgICAgIGlmIChrZXlzU2VlbltrZXkudmFsdWVdKSB7XHJcbiAgICAgICAgICAgIF9kb2Mud2FybmluZ3MucHVzaCh7IGxvY2F0aW9uOiB7IHN0YXJ0OiBub2RlLmtleS5zdGFydCwgZW5kOiBub2RlLmtleS5lbmQgfSwgbWVzc2FnZTogYER1cGxpY2F0ZSBvYmplY3Qga2V5YCB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5c1NlZW5ba2V5LnZhbHVlXSA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpID09PSBKc29uLlN5bnRheEtpbmQuQ29sb25Ub2tlbikge1xyXG4gICAgICAgICAgICBub2RlLmNvbG9uT2Zmc2V0ID0gX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBDb2xvbiBleHBlY3RlZGAsIG5vZGUsIFtdLCBbSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbiwgSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW5dKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF9zY2FubmVyLnNjYW4oKTsgLy8gY29uc3VtZSBDb2xvblRva2VuXHJcblxyXG4gICAgICAgIGlmICghbm9kZS5zZXRWYWx1ZShfcGFyc2VWYWx1ZShub2RlLCBrZXkudmFsdWUpKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBWYWx1ZSBleHBlY3RlZGAsIG5vZGUsIFtdLCBbSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbiwgSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW5dKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZS5lbmQgPSBub2RlLnZhbHVlLmVuZDtcclxuICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfcGFyc2VPYmplY3QocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcpOiBPYmplY3RBU1ROb2RlIHtcclxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLk9wZW5CcmFjZVRva2VuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbm9kZSA9IG5ldyBPYmplY3RBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgX3NjYW5uZXIuc2NhbigpOyAvLyBjb25zdW1lIE9wZW5CcmFjZVRva2VuXHJcblxyXG4gICAgICAgIGxldCBrZXlzU2VlbjogYW55ID0ge307XHJcbiAgICAgICAgaWYgKG5vZGUuYWRkUHJvcGVydHkoX3BhcnNlUHJvcGVydHkobm9kZSwga2V5c1NlZW4pKSkge1xyXG4gICAgICAgICAgICB3aGlsZSAoX2FjY2VwdChKc29uLlN5bnRheEtpbmQuQ29tbWFUb2tlbikpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZS5hZGRQcm9wZXJ0eShfcGFyc2VQcm9wZXJ0eShub2RlLCBrZXlzU2VlbikpICYmICFfZG9jLmNvbmZpZy5pZ25vcmVEYW5nbGluZ0NvbW1hKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBQcm9wZXJ0eSBleHBlY3RlZGApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbikge1xyXG4gICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBFeHBlY3RlZCBjb21tYSBvciBjbG9zaW5nIGJyYWNlYCwgbm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3BhcnNlU3RyaW5nKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nLCBpc0tleTogYm9vbGVhbik6IFN0cmluZ0FTVE5vZGUge1xyXG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBub2RlID0gbmV3IFN0cmluZ0FTVE5vZGUocGFyZW50LCBuYW1lLCBpc0tleSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgbm9kZS52YWx1ZSA9IF9zY2FubmVyLmdldFRva2VuVmFsdWUoKTtcclxuXHJcbiAgICAgICAgX2NoZWNrU2NhbkVycm9yKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3BhcnNlTnVtYmVyKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nKTogTnVtYmVyQVNUTm9kZSB7XHJcbiAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IEpzb24uU3ludGF4S2luZC5OdW1lcmljTGl0ZXJhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBub2RlID0gbmV3IE51bWJlckFTVE5vZGUocGFyZW50LCBuYW1lLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcclxuICAgICAgICBpZiAoIV9jaGVja1NjYW5FcnJvcigpKSB7XHJcbiAgICAgICAgICAgIGxldCB0b2tlblZhbHVlID0gX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG51bWJlclZhbHVlID0gSlNPTi5wYXJzZSh0b2tlblZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbnVtYmVyVmFsdWUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9lcnJvcihgSW52YWxpZCBudW1iZXIgZm9ybWF0YCwgbm9kZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBub2RlLnZhbHVlID0gbnVtYmVyVmFsdWU7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYEludmFsaWQgbnVtYmVyIGZvcm1hdGAsIG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5vZGUuaXNJbnRlZ2VyID0gdG9rZW5WYWx1ZS5pbmRleE9mKCcuJykgPT09IC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9wYXJzZUxpdGVyYWwocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcpOiBBU1ROb2RlIHtcclxuICAgICAgICBsZXQgbm9kZTogQVNUTm9kZTtcclxuICAgICAgICBzd2l0Y2ggKF9zY2FubmVyLmdldFRva2VuKCkpIHtcclxuICAgICAgICAgICAgY2FzZSBKc29uLlN5bnRheEtpbmQuTnVsbEtleXdvcmQ6XHJcbiAgICAgICAgICAgICAgICBub2RlID0gbmV3IE51bGxBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBKc29uLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQ6XHJcbiAgICAgICAgICAgICAgICBub2RlID0gbmV3IEJvb2xlYW5BU1ROb2RlKHBhcmVudCwgbmFtZSwgdHJ1ZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBKc29uLlN5bnRheEtpbmQuRmFsc2VLZXl3b3JkOlxyXG4gICAgICAgICAgICAgICAgbm9kZSA9IG5ldyBCb29sZWFuQVNUTm9kZShwYXJlbnQsIG5hbWUsIGZhbHNlLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3BhcnNlVmFsdWUocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcpOiBBU1ROb2RlIHtcclxuICAgICAgICByZXR1cm4gX3BhcnNlQXJyYXkocGFyZW50LCBuYW1lKSB8fCBfcGFyc2VPYmplY3QocGFyZW50LCBuYW1lKSB8fCBfcGFyc2VTdHJpbmcocGFyZW50LCBuYW1lLCBmYWxzZSkgfHwgX3BhcnNlTnVtYmVyKHBhcmVudCwgbmFtZSkgfHwgX3BhcnNlTGl0ZXJhbChwYXJlbnQsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIF9zY2FubmVyLnNjYW4oKTtcclxuXHJcbiAgICBfZG9jLnJvb3QgPSBfcGFyc2VWYWx1ZShudWxsLCBudWxsKTtcclxuICAgIGlmICghX2RvYy5yb290KSB7XHJcbiAgICAgICAgX2Vycm9yKGBFeHBlY3RlZCBhIEpTT04gb2JqZWN0LCBhcnJheSBvciBsaXRlcmFsYCk7XHJcbiAgICB9IGVsc2UgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IEpzb24uU3ludGF4S2luZC5FT0YpIHtcclxuICAgICAgICBfZXJyb3IoYEVuZCBvZiBmaWxlIGV4cGVjdGVkYCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX2RvYztcclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5pbXBvcnQgSnNvbiBmcm9tICdqc29uYy1wYXJzZXInO1xuaW1wb3J0IHsgSlNPTkxvY2F0aW9uIH0gZnJvbSAnLi9qc29uTG9jYXRpb24nO1xuZXhwb3J0IGNsYXNzIEFTVE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgdHlwZSwgbmFtZSwgc3RhcnQsIGVuZCkge1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gICAgICAgIHRoaXMuZW5kID0gZW5kO1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB9XG4gICAgZ2V0Tm9kZUxvY2F0aW9uKCkge1xuICAgICAgICBsZXQgcGF0aCA9IHRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnQuZ2V0Tm9kZUxvY2F0aW9uKCkgOiBuZXcgSlNPTkxvY2F0aW9uKFtdKTtcbiAgICAgICAgaWYgKHRoaXMubmFtZSkge1xuICAgICAgICAgICAgcGF0aCA9IHBhdGguYXBwZW5kKHRoaXMubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICAgIGdldENoaWxkTm9kZXMoKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgZ2V0VmFsdWUoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29udGFpbnMob2Zmc2V0LCBpbmNsdWRlUmlnaHRCb3VuZCA9IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBvZmZzZXQgPj0gdGhpcy5zdGFydCAmJiBvZmZzZXQgPCB0aGlzLmVuZCB8fCBpbmNsdWRlUmlnaHRCb3VuZCAmJiBvZmZzZXQgPT09IHRoaXMuZW5kO1xuICAgIH1cbiAgICB2aXNpdCh2aXNpdG9yKSB7XG4gICAgICAgIHJldHVybiB2aXNpdG9yKHRoaXMpO1xuICAgIH1cbiAgICBnZXROb2RlRnJvbU9mZnNldChvZmZzZXQpIHtcbiAgICAgICAgbGV0IGZpbmROb2RlID0gKG5vZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPj0gbm9kZS5zdGFydCAmJiBvZmZzZXQgPCBub2RlLmVuZCkge1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZHJlbiA9IG5vZGUuZ2V0Q2hpbGROb2RlcygpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoICYmIGNoaWxkcmVuW2ldLnN0YXJ0IDw9IG9mZnNldDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpdGVtID0gZmluZE5vZGUoY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZpbmROb2RlKHRoaXMpO1xuICAgIH1cbiAgICBnZXROb2RlRnJvbU9mZnNldEVuZEluY2x1c2l2ZShvZmZzZXQpIHtcbiAgICAgICAgbGV0IGZpbmROb2RlID0gKG5vZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChvZmZzZXQgPj0gbm9kZS5zdGFydCAmJiBvZmZzZXQgPD0gbm9kZS5lbmQpIHtcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGRyZW4gPSBub2RlLmdldENoaWxkTm9kZXMoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aCAmJiBjaGlsZHJlbltpXS5zdGFydCA8PSBvZmZzZXQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbSA9IGZpbmROb2RlKGNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBmaW5kTm9kZSh0aGlzKTtcbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCA9IC0xKSB7XG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEudHlwZSkpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEudHlwZS5pbmRleE9mKHRoaXMudHlwZSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc2NoZW1hLmVycm9yTWVzc2FnZSB8fCBgSW5jb3JyZWN0IHR5cGUuIEV4cGVjdGVkIG9uZSBvZiAke3NjaGVtYS50eXBlLmpvaW4oJywgJyl9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlICE9PSBzY2hlbWEudHlwZSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHNjaGVtYS5lcnJvck1lc3NhZ2UgfHwgYEluY29ycmVjdCB0eXBlLiBFeHBlY3RlZCBcIiR7c2NoZW1hLnR5cGV9XCJgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkge1xuICAgICAgICAgICAgc2NoZW1hLmFsbE9mLmZvckVhY2goKHN1YlNjaGVtYSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGUoc3ViU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLm5vdCkge1xuICAgICAgICAgICAgbGV0IHN1YlZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICAgICAgbGV0IHN1Yk1hdGNoaW5nU2NoZW1hcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0ZShzY2hlbWEubm90LCBzdWJWYWxpZGF0aW9uUmVzdWx0LCBzdWJNYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgICAgICBpZiAoIXN1YlZhbGlkYXRpb25SZXN1bHQuaGFzRXJyb3JzKCkpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTWF0Y2hlcyBhIHNjaGVtYSB0aGF0IGlzIG5vdCBhbGxvd2VkLmBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtYXRjaGluZ1NjaGVtYXMpIHtcbiAgICAgICAgICAgICAgICBzdWJNYXRjaGluZ1NjaGVtYXMuZm9yRWFjaCgobXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbXMuaW52ZXJ0ZWQgPSAhbXMuaW52ZXJ0ZWQ7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nU2NoZW1hcy5wdXNoKG1zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgdGVzdEFsdGVybmF0aXZlcyA9IChhbHRlcm5hdGl2ZXMsIG1heE9uZU1hdGNoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgbGV0IGJlc3RNYXRjaCA9IG51bGw7XG4gICAgICAgICAgICBhbHRlcm5hdGl2ZXMuZm9yRWFjaCgoc3ViU2NoZW1hKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN1YlZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICAgICAgICAgIGxldCBzdWJNYXRjaGluZ1NjaGVtYXMgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHN1YlNjaGVtYSwgc3ViVmFsaWRhdGlvblJlc3VsdCwgc3ViTWF0Y2hpbmdTY2hlbWFzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXN1YlZhbGlkYXRpb25SZXN1bHQuaGFzRXJyb3JzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKHN1YlNjaGVtYSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghYmVzdE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaCA9IHsgc2NoZW1hOiBzdWJTY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IHN1YlZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogc3ViTWF0Y2hpbmdTY2hlbWFzIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1heE9uZU1hdGNoICYmICFzdWJWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpICYmICFiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1hdGNoLm1hdGNoaW5nU2NoZW1hcy5wdXNoLmFwcGx5KGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMsIHN1Yk1hdGNoaW5nU2NoZW1hcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcyArPSBzdWJWYWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNNYXRjaGVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1hdGNoLnZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyArPSBzdWJWYWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29tcGFyZVJlc3VsdCA9IHN1YlZhbGlkYXRpb25SZXN1bHQuY29tcGFyZShiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGFyZVJlc3VsdCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSB7IHNjaGVtYTogc3ViU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0OiBzdWJWYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXM6IHN1Yk1hdGNoaW5nU2NoZW1hcyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29tcGFyZVJlc3VsdCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMucHVzaC5hcHBseShiZXN0TWF0Y2gubWF0Y2hpbmdTY2hlbWFzLCBzdWJNYXRjaGluZ1NjaGVtYXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPiAxICYmIG1heE9uZU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5zdGFydCArIDEgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE1hdGNoZXMgbXVsdGlwbGUgc2NoZW1hcyB3aGVuIG9ubHkgb25lIG11c3QgdmFsaWRhdGUuYFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGJlc3RNYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQubWVyZ2UoYmVzdE1hdGNoLnZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXMgKz0gYmVzdE1hdGNoLnZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXM7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9IGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXM7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nU2NoZW1hcykge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ1NjaGVtYXMucHVzaC5hcHBseShtYXRjaGluZ1NjaGVtYXMsIGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFueU9mKSkge1xuICAgICAgICAgICAgdGVzdEFsdGVybmF0aXZlcyhzY2hlbWEuYW55T2YsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEub25lT2YpKSB7XG4gICAgICAgICAgICB0ZXN0QWx0ZXJuYXRpdmVzKHNjaGVtYS5vbmVPZiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmVudW0pKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLmVudW0uaW5kZXhPZih0aGlzLmdldFZhbHVlKCkpID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBub3QgYW4gYWNjZXB0ZWQgdmFsdWUuIFZhbGlkIHZhbHVlczogJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuZW51bSl9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5lbnVtVmFsdWVNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoaW5nU2NoZW1hcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLnB1c2goeyBub2RlOiB0aGlzLCBzY2hlbWE6IHNjaGVtYSB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBOdWxsQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgbmFtZSwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdXBlcihwYXJlbnQsICdudWxsJywgbmFtZSwgc3RhcnQsIGVuZCk7XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgQm9vbGVhbkFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIG5hbWUsIHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ2Jvb2xlYW4nLCBuYW1lLCBzdGFydCwgZW5kKTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEFycmF5QVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgbmFtZSwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdXBlcihwYXJlbnQsICdhcnJheScsIG5hbWUsIHN0YXJ0LCBlbmQpO1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgfVxuICAgIGdldENoaWxkTm9kZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKCh2KSA9PiB2LmdldFZhbHVlKCkpO1xuICAgIH1cbiAgICBhZGRJdGVtKGl0ZW0pIHtcbiAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmlzaXQodmlzaXRvcikge1xuICAgICAgICBsZXQgY3RuID0gdmlzaXRvcih0aGlzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aCAmJiBjdG47IGkrKykge1xuICAgICAgICAgICAgY3RuID0gdGhpcy5pdGVtc1tpXS52aXNpdCh2aXNpdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3RuO1xuICAgIH1cbiAgICB2YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0ID0gLTEpIHtcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XG4gICAgICAgICAgICBsZXQgc3ViU2NoZW1hcyA9IHNjaGVtYS5pdGVtcztcbiAgICAgICAgICAgIHN1YlNjaGVtYXMuZm9yRWFjaCgoc3ViU2NoZW1hLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpdGVtVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLml0ZW1zW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnZhbGlkYXRlKHN1YlNjaGVtYSwgaXRlbVZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2goaXRlbVZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLml0ZW1zLmxlbmd0aCA+PSBzdWJTY2hlbWFzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzY2hlbWEuYWRkaXRpb25hbEl0ZW1zID09PSBmYWxzZSAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IHN1YlNjaGVtYXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEFycmF5IGhhcyB0b28gbWFueSBpdGVtcyBhY2NvcmRpbmcgdG8gc2NoZW1hLiBFeHBlY3RlZCAke3N1YlNjaGVtYXMubGVuZ3RofSBvciBmZXdlcmBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaXRlbXMubGVuZ3RoID49IHN1YlNjaGVtYXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9ICh0aGlzLml0ZW1zLmxlbmd0aCAtIHN1YlNjaGVtYXMubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEuaXRlbXMpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpdGVtVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgaXRlbS52YWxpZGF0ZShzY2hlbWEuaXRlbXMsIGl0ZW1WYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2goaXRlbVZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS5taW5JdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA8IHNjaGVtYS5taW5JdGVtcykge1xuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgdG9vIGZldyBpdGVtcy4gRXhwZWN0ZWQgJHtzY2hlbWEubWluSXRlbXN9IG9yIG1vcmVgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLm1heEl0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gc2NoZW1hLm1heEl0ZW1zKSB7XG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEFycmF5IGhhcyB0b28gbWFueSBpdGVtcy4gRXhwZWN0ZWQgJHtzY2hlbWEubWluSXRlbXN9IG9yIGZld2VyYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVJdGVtcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlcyA9IHRoaXMuaXRlbXMubWFwKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0VmFsdWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IGR1cGxpY2F0ZXMgPSB2YWx1ZXMuc29tZSgodmFsdWUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ICE9PSB2YWx1ZXMubGFzdEluZGV4T2YodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZHVwbGljYXRlcykge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgZHVwbGljYXRlIGl0ZW1zYFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIE51bWJlckFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIG5hbWUsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgc3VwZXIocGFyZW50LCAnbnVtYmVyJywgbmFtZSwgc3RhcnQsIGVuZCk7XG4gICAgICAgIHRoaXMuaXNJbnRlZ2VyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IE51bWJlci5OYU47XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCA9IC0xKSB7XG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdHlwZUlzSW50ZWdlciA9IGZhbHNlO1xuICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdpbnRlZ2VyJyB8fCAoQXJyYXkuaXNBcnJheShzY2hlbWEudHlwZSkgJiYgc2NoZW1hLnR5cGUuaW5kZXhPZignaW50ZWdlcicpICE9PSAtMSkpIHtcbiAgICAgICAgICAgIHR5cGVJc0ludGVnZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlSXNJbnRlZ2VyICYmIHRoaXMuaXNJbnRlZ2VyID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnaW50ZWdlcic7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgIHRoaXMudHlwZSA9ICdudW1iZXInO1xuICAgICAgICBsZXQgdmFsID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5tdWx0aXBsZU9mID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaWYgKHZhbCAlIHNjaGVtYS5tdWx0aXBsZU9mICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFZhbHVlIGlzIG5vdCBkaXZpc2libGUgYnkgJHtzY2hlbWEubXVsdGlwbGVPZn1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBzY2hlbWEubWluaW11bSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAmJiB2YWwgPD0gc2NoZW1hLm1pbmltdW0pIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsdWUgaXMgYmVsb3cgdGhlIGV4Y2x1c2l2ZSBtaW5pbXVtIG9mICR7c2NoZW1hLm1pbmltdW19YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAmJiB2YWwgPCBzY2hlbWEubWluaW11bSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBiZWxvdyB0aGUgbWluaW11bSBvZiAke3NjaGVtYS5taW5pbXVtfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHNjaGVtYS5tYXhpbXVtID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaWYgKHNjaGVtYS5leGNsdXNpdmVNYXhpbXVtICYmIHZhbCA+PSBzY2hlbWEubWF4aW11bSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBhYm92ZSB0aGUgZXhjbHVzaXZlIG1heGltdW0gb2YgJHtzY2hlbWEubWF4aW11bX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNjaGVtYS5leGNsdXNpdmVNYXhpbXVtICYmIHZhbCA+IHNjaGVtYS5tYXhpbXVtKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFZhbHVlIGlzIGFib3ZlIHRoZSBtYXhpbXVtIG9mICR7c2NoZW1hLm1heGltdW19YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFN0cmluZ0FTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIG5hbWUsIGlzS2V5LCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ3N0cmluZycsIG5hbWUsIHN0YXJ0LCBlbmQpO1xuICAgICAgICB0aGlzLmlzS2V5ID0gaXNLZXk7XG4gICAgICAgIHRoaXMudmFsdWUgPSAnJztcbiAgICB9XG4gICAgZ2V0VmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICB2YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0ID0gLTEpIHtcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICBpZiAoc2NoZW1hLm1pbkxlbmd0aCAmJiB0aGlzLnZhbHVlLmxlbmd0aCA8IHNjaGVtYS5taW5MZW5ndGgpIHtcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU3RyaW5nIGlzIHNob3J0ZXIgdGhhbiB0aGUgbWluaW11bSBsZW5ndGggb2YgJHtzY2hlbWEubWluTGVuZ3RofWBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWEubWF4TGVuZ3RoICYmIHRoaXMudmFsdWUubGVuZ3RoID4gc2NoZW1hLm1heExlbmd0aCkge1xuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTdHJpbmcgaXMgc2hvcnRlciB0aGFuIHRoZSBtYXhpbXVtIGxlbmd0aCBvZiAke3NjaGVtYS5tYXhMZW5ndGh9YFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS5wYXR0ZXJuKSB7XG4gICAgICAgICAgICBsZXQgcmVnZXggPSBuZXcgUmVnRXhwKHNjaGVtYS5wYXR0ZXJuKTtcbiAgICAgICAgICAgIGlmICghcmVnZXgudGVzdCh0aGlzLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHNjaGVtYS5lcnJvck1lc3NhZ2UgfHwgYFN0cmluZyBkb2VzIG5vdCBtYXRjaCB0aGUgcGF0dGVybiBvZiBcIiR7c2NoZW1hLnBhdHRlcm59XCJgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY2xhc3MgUHJvcGVydHlBU1ROb2RlIGV4dGVuZHMgQVNUTm9kZSB7XG4gICAgY29uc3RydWN0b3IocGFyZW50LCBrZXkpIHtcbiAgICAgICAgc3VwZXIocGFyZW50LCAncHJvcGVydHknLCBudWxsLCBrZXkuc3RhcnQpO1xuICAgICAgICB0aGlzLmtleSA9IGtleTtcbiAgICAgICAga2V5LnBhcmVudCA9IHRoaXM7XG4gICAgICAgIGtleS5uYW1lID0ga2V5LnZhbHVlO1xuICAgICAgICB0aGlzLmNvbG9uT2Zmc2V0ID0gLTE7XG4gICAgfVxuICAgIGdldENoaWxkTm9kZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID8gW3RoaXMua2V5LCB0aGlzLnZhbHVlXSA6IFt0aGlzLmtleV07XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBudWxsO1xuICAgIH1cbiAgICB2aXNpdCh2aXNpdG9yKSB7XG4gICAgICAgIHJldHVybiB2aXNpdG9yKHRoaXMpICYmIHRoaXMua2V5LnZpc2l0KHZpc2l0b3IpICYmIHRoaXMudmFsdWUgJiYgdGhpcy52YWx1ZS52aXNpdCh2aXNpdG9yKTtcbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCA9IC0xKSB7XG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZS52YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBPYmplY3RBU1ROb2RlIGV4dGVuZHMgQVNUTm9kZSB7XG4gICAgY29uc3RydWN0b3IocGFyZW50LCBuYW1lLCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ29iamVjdCcsIG5hbWUsIHN0YXJ0LCBlbmQpO1xuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBbXTtcbiAgICB9XG4gICAgZ2V0Q2hpbGROb2RlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcbiAgICB9XG4gICAgYWRkUHJvcGVydHkobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3BlcnRpZXMucHVzaChub2RlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGdldEZpcnN0UHJvcGVydHkoa2V5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzW2ldLmtleS52YWx1ZSA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZ2V0S2V5TGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllcy5tYXAoKHApID0+IHAua2V5LmdldFZhbHVlKCkpO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgbGV0IHZhbHVlID0ge307XG4gICAgICAgIHRoaXMucHJvcGVydGllcy5mb3JFYWNoKChwKSA9PiB7XG4gICAgICAgICAgICBsZXQgdiA9IHAudmFsdWUgJiYgcC52YWx1ZS5nZXRWYWx1ZSgpO1xuICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZVtwLmtleS5nZXRWYWx1ZSgpXSA9IHY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHZpc2l0KHZpc2l0b3IpIHtcbiAgICAgICAgbGV0IGN0biA9IHZpc2l0b3IodGhpcyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aCAmJiBjdG47IGkrKykge1xuICAgICAgICAgICAgY3RuID0gdGhpcy5wcm9wZXJ0aWVzW2ldLnZpc2l0KHZpc2l0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdG47XG4gICAgfVxuICAgIHZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQgPSAtMSkge1xuICAgICAgICBpZiAob2Zmc2V0ICE9PSAtMSAmJiAhdGhpcy5jb250YWlucyhvZmZzZXQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgIGxldCBzZWVuS2V5cyA9IHt9O1xuICAgICAgICBsZXQgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzID0gW107XG4gICAgICAgIHRoaXMucHJvcGVydGllcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICBsZXQga2V5ID0gbm9kZS5rZXkudmFsdWU7XG4gICAgICAgICAgICBzZWVuS2V5c1trZXldID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpKSB7XG4gICAgICAgICAgICBzY2hlbWEucmVxdWlyZWQuZm9yRWFjaCgocHJvcGVydHlOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFzZWVuS2V5c1twcm9wZXJ0eU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBrZXkgPSB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5rZXk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IGtleSA/IHsgc3RhcnQ6IGtleS5zdGFydCwgZW5kOiBrZXkuZW5kIH0gOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuc3RhcnQgKyAxIH07XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTWlzc2luZyBwcm9wZXJ0eSBcIiR7cHJvcGVydHlOYW1lfVwiYFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcHJvcGVydHlQcm9jZXNzZWQgPSAocHJvcCkgPT4ge1xuICAgICAgICAgICAgbGV0IGluZGV4ID0gdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLmluZGV4T2YocHJvcCk7XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIGluZGV4ID0gdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLmluZGV4T2YocHJvcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChzY2hlbWEucHJvcGVydGllcykge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoc2NoZW1hLnByb3BlcnRpZXMpLmZvckVhY2goKHByb3BlcnR5TmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5UHJvY2Vzc2VkKHByb3BlcnR5TmFtZSk7XG4gICAgICAgICAgICAgICAgbGV0IHByb3AgPSBzY2hlbWEucHJvcGVydGllc1twcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICAgICAgICAgICAgICBjaGlsZC52YWxpZGF0ZShwcm9wLCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2gocHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEucGF0dGVyblByb3BlcnRpZXMpLmZvckVhY2goKHByb3BlcnR5UGF0dGVybikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCByZWdleCA9IG5ldyBSZWdFeHAocHJvcGVydHlQYXR0ZXJuKTtcbiAgICAgICAgICAgICAgICB1bnByb2Nlc3NlZFByb3BlcnRpZXMuc2xpY2UoMCkuZm9yRWFjaCgocHJvcGVydHlOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdleC50ZXN0KHByb3BlcnR5TmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UHJvY2Vzc2VkKHByb3BlcnR5TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBzZWVuS2V5c1twcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQudmFsaWRhdGUoc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzW3Byb3BlcnR5UGF0dGVybl0sIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQubWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBzZWVuS2V5c1twcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQudmFsaWRhdGUoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzLCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2gocHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBpZiAodW5wcm9jZXNzZWRQcm9wZXJ0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB1bnByb2Nlc3NlZFByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHlOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5Tm9kZSA9IGNoaWxkLnBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHByb3BlcnR5Tm9kZS5rZXkuc3RhcnQsIGVuZDogcHJvcGVydHlOb2RlLmtleS5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJvcGVydHkgJHtwcm9wZXJ0eU5hbWV9IGlzIG5vdCBhbGxvd2VkYFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLm1heFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMubGVuZ3RoID4gc2NoZW1hLm1heFByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgT2JqZWN0IGhhcyBtb3JlIHByb3BlcnRpZXMgdGhhbiBsaW1pdCBvZiAke3NjaGVtYS5tYXhQcm9wZXJ0aWVzfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLm1pblByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMubGVuZ3RoIDwgc2NoZW1hLm1pblByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgT2JqZWN0IGhhcyBmZXdlciBwcm9wZXJ0aWVzIHRoYW4gdGhlIHJlcXVpcmVkIG51bWJlciBvZiAke3NjaGVtYS5taW5Qcm9wZXJ0aWVzfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLmRlcGVuZGVuY2llcykge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoc2NoZW1hLmRlcGVuZGVuY2llcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHByb3AgPSBzZWVuS2V5c1trZXldO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5kZXBlbmRlbmNpZXNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZUFzQXJyYXkgPSBzY2hlbWEuZGVwZW5kZW5jaWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUFzQXJyYXkuZm9yRWFjaCgocmVxdWlyZWRQcm9wKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWVuS2V5c1tyZXF1aXJlZFByb3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE9iamVjdCBpcyBtaXNzaW5nIHByb3BlcnR5ICR7cmVxdWlyZWRQcm9wLCBrZXl9IHJlcXVpcmVkIGJ5IHByb3BlcnR5IHsxfWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzY2hlbWEuZGVwZW5kZW5jaWVzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZUFzU2NoZW1hID0gc2NoZW1hLmRlcGVuZGVuY2llc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHZhbHVlQXNTY2hlbWEsIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2gocHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEpTT05Eb2N1bWVudENvbmZpZyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaWdub3JlRGFuZ2xpbmdDb21tYSA9IGZhbHNlO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICAgICAgdGhpcy53YXJuaW5ncyA9IFtdO1xuICAgICAgICB0aGlzLnByb3BlcnRpZXNNYXRjaGVzID0gMDtcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzID0gMDtcbiAgICAgICAgdGhpcy5lbnVtVmFsdWVNYXRjaCA9IGZhbHNlO1xuICAgIH1cbiAgICBoYXNFcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuZXJyb3JzLmxlbmd0aCB8fCAhIXRoaXMud2FybmluZ3MubGVuZ3RoO1xuICAgIH1cbiAgICBtZXJnZUFsbCh2YWxpZGF0aW9uUmVzdWx0cykge1xuICAgICAgICB2YWxpZGF0aW9uUmVzdWx0cy5mb3JFYWNoKCh2YWxpZGF0aW9uUmVzdWx0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lcmdlKHZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbWVyZ2UodmFsaWRhdGlvblJlc3VsdCkge1xuICAgICAgICB0aGlzLmVycm9ycyA9IHRoaXMuZXJyb3JzLmNvbmNhdCh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycyk7XG4gICAgICAgIHRoaXMud2FybmluZ3MgPSB0aGlzLndhcm5pbmdzLmNvbmNhdCh2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzKTtcbiAgICB9XG4gICAgbWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdCkge1xuICAgICAgICB0aGlzLm1lcmdlKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdCk7XG4gICAgICAgIHRoaXMucHJvcGVydGllc01hdGNoZXMrKztcbiAgICAgICAgaWYgKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5lbnVtVmFsdWVNYXRjaCB8fCAhcHJvcGVydHlWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpICYmIHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29tcGFyZShvdGhlcikge1xuICAgICAgICBsZXQgaGFzRXJyb3JzID0gdGhpcy5oYXNFcnJvcnMoKTtcbiAgICAgICAgaWYgKGhhc0Vycm9ycyAhPT0gb3RoZXIuaGFzRXJyb3JzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBoYXNFcnJvcnMgPyAtMSA6IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZW51bVZhbHVlTWF0Y2ggIT09IG90aGVyLmVudW1WYWx1ZU1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIuZW51bVZhbHVlTWF0Y2ggPyAtMSA6IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyAhPT0gb3RoZXIucHJvcGVydGllc1ZhbHVlTWF0Y2hlcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyAtIG90aGVyLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc01hdGNoZXMgLSBvdGhlci5wcm9wZXJ0aWVzTWF0Y2hlcztcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgSlNPTkRvY3VtZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgfVxuICAgIGdldCBlcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xuICAgIH1cbiAgICBnZXQgd2FybmluZ3MoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRpb25SZXN1bHQud2FybmluZ3M7XG4gICAgfVxuICAgIGdldE5vZGVGcm9tT2Zmc2V0KG9mZnNldCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290ICYmIHRoaXMucm9vdC5nZXROb2RlRnJvbU9mZnNldChvZmZzZXQpO1xuICAgIH1cbiAgICBnZXROb2RlRnJvbU9mZnNldEVuZEluY2x1c2l2ZShvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0KTtcbiAgICB9XG4gICAgdmlzaXQodmlzaXRvcikge1xuICAgICAgICBpZiAodGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QudmlzaXQodmlzaXRvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCBtYXRjaGluZ1NjaGVtYXMgPSBudWxsLCBvZmZzZXQgPSAtMSkge1xuICAgICAgICBpZiAodGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QudmFsaWRhdGUoc2NoZW1hLCB0aGlzLnZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZSh0ZXh0LCBjb25maWcgPSBuZXcgSlNPTkRvY3VtZW50Q29uZmlnKCkpIHtcbiAgICBsZXQgX2RvYyA9IG5ldyBKU09ORG9jdW1lbnQoY29uZmlnKTtcbiAgICBsZXQgX3NjYW5uZXIgPSBKc29uLmNyZWF0ZVNjYW5uZXIodGV4dCwgdHJ1ZSk7XG4gICAgZnVuY3Rpb24gX2FjY2VwdCh0b2tlbikge1xuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSA9PT0gdG9rZW4pIHtcbiAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gX2Vycm9yKG1lc3NhZ2UsIG5vZGUgPSBudWxsLCBza2lwVW50aWxBZnRlciA9IFtdLCBza2lwVW50aWwgPSBbXSkge1xuICAgICAgICBpZiAoX2RvYy5lcnJvcnMubGVuZ3RoID09PSAwIHx8IF9kb2MuZXJyb3JzWzBdLmxvY2F0aW9uLnN0YXJ0ICE9PSBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKSB7XG4gICAgICAgICAgICBsZXQgZXJyb3IgPSB7IG1lc3NhZ2U6IG1lc3NhZ2UsIGxvY2F0aW9uOiB7IHN0YXJ0OiBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpLCBlbmQ6IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpIH0gfTtcbiAgICAgICAgICAgIF9kb2MuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBfZmluYWxpemUobm9kZSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChza2lwVW50aWxBZnRlci5sZW5ndGggKyBza2lwVW50aWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IHRva2VuID0gX3NjYW5uZXIuZ2V0VG9rZW4oKTtcbiAgICAgICAgICAgIHdoaWxlICh0b2tlbiAhPT0gSnNvbi5TeW50YXhLaW5kLkVPRikge1xuICAgICAgICAgICAgICAgIGlmIChza2lwVW50aWxBZnRlci5pbmRleE9mKHRva2VuKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2tpcFVudGlsLmluZGV4T2YodG9rZW4pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdG9rZW4gPSBfc2Nhbm5lci5zY2FuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9jaGVja1NjYW5FcnJvcigpIHtcbiAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbkVycm9yKCkpIHtcbiAgICAgICAgICAgIGNhc2UgSnNvbi5TY2FuRXJyb3IuSW52YWxpZFVuaWNvZGU6XG4gICAgICAgICAgICAgICAgX2Vycm9yKGBJbnZhbGlkIHVuaWNvZGUgc2VxdWVuY2UgaW4gc3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLkludmFsaWRFc2NhcGVDaGFyYWN0ZXI6XG4gICAgICAgICAgICAgICAgX2Vycm9yKGBJbnZhbGlkIGVzY2FwZSBjaGFyYWN0ZXIgaW4gc3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZk51bWJlcjpcbiAgICAgICAgICAgICAgICBfZXJyb3IoYFVuZXhwZWN0ZWQgZW5kIG9mIG51bWJlcmApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgY2FzZSBKc29uLlNjYW5FcnJvci5VbmV4cGVjdGVkRW5kT2ZDb21tZW50OlxuICAgICAgICAgICAgICAgIF9lcnJvcihgVW5leHBlY3RlZCBlbmQgb2YgY29tbWVudGApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgY2FzZSBKc29uLlNjYW5FcnJvci5VbmV4cGVjdGVkRW5kT2ZTdHJpbmc6XG4gICAgICAgICAgICAgICAgX2Vycm9yKGBVbmV4cGVjdGVkIGVuZCBvZiBzdHJpbmdgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9maW5hbGl6ZShub2RlLCBzY2FuTmV4dCkge1xuICAgICAgICBub2RlLmVuZCA9IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpO1xuICAgICAgICBpZiAoc2Nhbk5leHQpIHtcbiAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gX3BhcnNlQXJyYXkocGFyZW50LCBuYW1lKSB7XG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuT3BlbkJyYWNrZXRUb2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5vZGUgPSBuZXcgQXJyYXlBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XG4gICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgICAgaWYgKG5vZGUuYWRkSXRlbShfcGFyc2VWYWx1ZShub2RlLCAnJyArIGNvdW50KyspKSkge1xuICAgICAgICAgICAgd2hpbGUgKF9hY2NlcHQoSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW4pKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmFkZEl0ZW0oX3BhcnNlVmFsdWUobm9kZSwgJycgKyBjb3VudCsrKSkgJiYgIV9kb2MuY29uZmlnLmlnbm9yZURhbmdsaW5nQ29tbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBWYWx1ZSBleHBlY3RlZGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2tldFRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBFeHBlY3RlZCBjb21tYSBvciBjbG9zaW5nIGJyYWNrZXRgLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcGFyc2VQcm9wZXJ0eShwYXJlbnQsIGtleXNTZWVuKSB7XG4gICAgICAgIGxldCBrZXkgPSBfcGFyc2VTdHJpbmcobnVsbCwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSA9PT0gSnNvbi5TeW50YXhLaW5kLlVua25vd24pIHtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBfc2Nhbm5lci5nZXRUb2tlblZhbHVlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoKC9eWydcXHddLykpIHtcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBQcm9wZXJ0eSBrZXlzIG11c3QgYmUgZG91YmxlcXVvdGVkYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG5vZGUgPSBuZXcgUHJvcGVydHlBU1ROb2RlKHBhcmVudCwga2V5KTtcbiAgICAgICAgaWYgKGtleXNTZWVuW2tleS52YWx1ZV0pIHtcbiAgICAgICAgICAgIF9kb2Mud2FybmluZ3MucHVzaCh7IGxvY2F0aW9uOiB7IHN0YXJ0OiBub2RlLmtleS5zdGFydCwgZW5kOiBub2RlLmtleS5lbmQgfSwgbWVzc2FnZTogYER1cGxpY2F0ZSBvYmplY3Qga2V5YCB9KTtcbiAgICAgICAgfVxuICAgICAgICBrZXlzU2VlbltrZXkudmFsdWVdID0gdHJ1ZTtcbiAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IEpzb24uU3ludGF4S2luZC5Db2xvblRva2VuKSB7XG4gICAgICAgICAgICBub2RlLmNvbG9uT2Zmc2V0ID0gX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYENvbG9uIGV4cGVjdGVkYCwgbm9kZSwgW10sIFtKc29uLlN5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuLCBKc29uLlN5bnRheEtpbmQuQ29tbWFUb2tlbl0pO1xuICAgICAgICB9XG4gICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgaWYgKCFub2RlLnNldFZhbHVlKF9wYXJzZVZhbHVlKG5vZGUsIGtleS52YWx1ZSkpKSB7XG4gICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBWYWx1ZSBleHBlY3RlZGAsIG5vZGUsIFtdLCBbSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbiwgSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW5dKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlLmVuZCA9IG5vZGUudmFsdWUuZW5kO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gX3BhcnNlT2JqZWN0KHBhcmVudCwgbmFtZSkge1xuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLk9wZW5CcmFjZVRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbm9kZSA9IG5ldyBPYmplY3RBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XG4gICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgbGV0IGtleXNTZWVuID0ge307XG4gICAgICAgIGlmIChub2RlLmFkZFByb3BlcnR5KF9wYXJzZVByb3BlcnR5KG5vZGUsIGtleXNTZWVuKSkpIHtcbiAgICAgICAgICAgIHdoaWxlIChfYWNjZXB0KEpzb24uU3ludGF4S2luZC5Db21tYVRva2VuKSkge1xuICAgICAgICAgICAgICAgIGlmICghbm9kZS5hZGRQcm9wZXJ0eShfcGFyc2VQcm9wZXJ0eShub2RlLCBrZXlzU2VlbikpICYmICFfZG9jLmNvbmZpZy5pZ25vcmVEYW5nbGluZ0NvbW1hKSB7XG4gICAgICAgICAgICAgICAgICAgIF9lcnJvcihgUHJvcGVydHkgZXhwZWN0ZWRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IEpzb24uU3ludGF4S2luZC5DbG9zZUJyYWNlVG9rZW4pIHtcbiAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYEV4cGVjdGVkIGNvbW1hIG9yIGNsb3NpbmcgYnJhY2VgLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcGFyc2VTdHJpbmcocGFyZW50LCBuYW1lLCBpc0tleSkge1xuICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBub2RlID0gbmV3IFN0cmluZ0FTVE5vZGUocGFyZW50LCBuYW1lLCBpc0tleSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XG4gICAgICAgIG5vZGUudmFsdWUgPSBfc2Nhbm5lci5nZXRUb2tlblZhbHVlKCk7XG4gICAgICAgIF9jaGVja1NjYW5FcnJvcigpO1xuICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcGFyc2VOdW1iZXIocGFyZW50LCBuYW1lKSB7XG4gICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBub2RlID0gbmV3IE51bWJlckFTVE5vZGUocGFyZW50LCBuYW1lLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcbiAgICAgICAgaWYgKCFfY2hlY2tTY2FuRXJyb3IoKSkge1xuICAgICAgICAgICAgbGV0IHRva2VuVmFsdWUgPSBfc2Nhbm5lci5nZXRUb2tlblZhbHVlKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBudW1iZXJWYWx1ZSA9IEpTT04ucGFyc2UodG9rZW5WYWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBudW1iZXJWYWx1ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9lcnJvcihgSW52YWxpZCBudW1iZXIgZm9ybWF0YCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUudmFsdWUgPSBudW1iZXJWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9lcnJvcihgSW52YWxpZCBudW1iZXIgZm9ybWF0YCwgbm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlLmlzSW50ZWdlciA9IHRva2VuVmFsdWUuaW5kZXhPZignLicpID09PSAtMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcGFyc2VMaXRlcmFsKHBhcmVudCwgbmFtZSkge1xuICAgICAgICBsZXQgbm9kZTtcbiAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbigpKSB7XG4gICAgICAgICAgICBjYXNlIEpzb24uU3ludGF4S2luZC5OdWxsS2V5d29yZDpcbiAgICAgICAgICAgICAgICBub2RlID0gbmV3IE51bGxBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEpzb24uU3ludGF4S2luZC5UcnVlS2V5d29yZDpcbiAgICAgICAgICAgICAgICBub2RlID0gbmV3IEJvb2xlYW5BU1ROb2RlKHBhcmVudCwgbmFtZSwgdHJ1ZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEpzb24uU3ludGF4S2luZC5GYWxzZUtleXdvcmQ6XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5ldyBCb29sZWFuQVNUTm9kZShwYXJlbnQsIG5hbWUsIGZhbHNlLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9maW5hbGl6ZShub2RlLCB0cnVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gX3BhcnNlVmFsdWUocGFyZW50LCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBfcGFyc2VBcnJheShwYXJlbnQsIG5hbWUpIHx8IF9wYXJzZU9iamVjdChwYXJlbnQsIG5hbWUpIHx8IF9wYXJzZVN0cmluZyhwYXJlbnQsIG5hbWUsIGZhbHNlKSB8fCBfcGFyc2VOdW1iZXIocGFyZW50LCBuYW1lKSB8fCBfcGFyc2VMaXRlcmFsKHBhcmVudCwgbmFtZSk7XG4gICAgfVxuICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICBfZG9jLnJvb3QgPSBfcGFyc2VWYWx1ZShudWxsLCBudWxsKTtcbiAgICBpZiAoIV9kb2Mucm9vdCkge1xuICAgICAgICBfZXJyb3IoYEV4cGVjdGVkIGEgSlNPTiBvYmplY3QsIGFycmF5IG9yIGxpdGVyYWxgKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLkVPRikge1xuICAgICAgICBfZXJyb3IoYEVuZCBvZiBmaWxlIGV4cGVjdGVkYCk7XG4gICAgfVxuICAgIHJldHVybiBfZG9jO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
