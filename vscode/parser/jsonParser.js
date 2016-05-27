'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONParser = exports.JSONDocument = exports.ValidationResult = exports.JSONDocumentConfig = exports.ObjectASTNode = exports.PropertyASTNode = exports.StringASTNode = exports.NumberASTNode = exports.ArrayASTNode = exports.BooleanASTNode = exports.NullASTNode = exports.ASTNode = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _json = require('../common/json');

var _json2 = _interopRequireDefault(_json);

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
                if (_lodash2.default.includes(schema.type, this.type) === false) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: schema.errorMessage || 'Incorrect type. Expected one of ' + schema.type.join()
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
                if (_lodash2.default.includes(schema.enum, this.getValue()) === false) {
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
                if (schema.additionalItems === false && this.items.length > subSchemas.length) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Array has too many items according to schema. Expected ' + subSchemas.length + ' or fewer'
                    });
                } else if (this.items.length >= subSchemas.length) {
                    validationResult.propertiesValueMatches += this.items.length - subSchemas.length;
                }
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
                var values = this.items.map(function (node) {
                    return node.getValue();
                });
                var duplicates = values.some(function (value, index) {
                    return index !== values.lastIndexOf(value);
                });
                if (duplicates) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Array has duplicate items'
                    });
                }
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
            if (schema.type === 'integer' || Array.isArray(schema.type) && _lodash2.default.includes(schema.type, 'integer')) {
                typeIsInteger = true;
            }
            if (typeIsInteger && this.isInteger === true) {
                this.type = 'integer';
            }
            _get(Object.getPrototypeOf(NumberASTNode.prototype), 'validate', this).call(this, schema, validationResult, matchingSchemas, offset);
            this.type = 'number';
            var val = this.getValue();
            if (_lodash2.default.isNumber(schema.multipleOf)) {
                if (val % schema.multipleOf !== 0) {
                    validationResult.warnings.push({
                        location: { start: this.start, end: this.end },
                        message: 'Value is not divisible by ' + schema.multipleOf
                    });
                }
            }
            if (!_lodash2.default.isUndefined(schema.minimum)) {
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
            if (!_lodash2.default.isUndefined(schema.maximum)) {
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
            if (_lodash2.default.isObject(schema.additionalProperties)) {
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
            if (_lodash2.default.isObject(schema.dependencies)) {
                Object.keys(schema.dependencies).forEach(function (key) {
                    var prop = seenKeys[key];
                    if (prop) {
                        if (Array.isArray(schema.dependencies[key])) {
                            var valueAsArray = schema.dependencies[key];
                            valueAsArray.forEach(function (requiredProp) {
                                if (!seenKeys[requiredProp]) {
                                    validationResult.warnings.push({
                                        location: { start: _this10.start, end: _this10.end },
                                        message: 'Object is missing property ' + requiredProp + ' required by property ' + key
                                    });
                                } else {
                                    validationResult.propertiesValueMatches++;
                                }
                            });
                        } else if (_lodash2.default.isObject(schema.dependencies[key])) {
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

var JSONParser = exports.JSONParser = function () {
    function JSONParser() {
        _classCallCheck(this, JSONParser);
    }

    _createClass(JSONParser, [{
        key: 'parse',
        value: function parse(text) {
            var config = arguments.length <= 1 || arguments[1] === undefined ? new JSONDocumentConfig() : arguments[1];

            var _doc = new JSONDocument(config);
            var _scanner = _json2.default.createScanner(text, true);
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
                    while (token !== _json2.default.SyntaxKind.EOF) {
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
                    case _json2.default.ScanError.InvalidUnicode:
                        _error('Invalid unicode sequence in string');
                        return true;
                    case _json2.default.ScanError.InvalidEscapeCharacter:
                        _error('Invalid escape character in string');
                        return true;
                    case _json2.default.ScanError.UnexpectedEndOfNumber:
                        _error('Unexpected end of number');
                        return true;
                    case _json2.default.ScanError.UnexpectedEndOfComment:
                        _error('Unexpected end of comment');
                        return true;
                    case _json2.default.ScanError.UnexpectedEndOfString:
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
                if (_scanner.getToken() !== _json2.default.SyntaxKind.OpenBracketToken) {
                    return null;
                }
                var node = new ArrayASTNode(parent, name, _scanner.getTokenOffset());
                _scanner.scan();
                var count = 0;
                if (node.addItem(_parseValue(node, '' + count++))) {
                    while (_accept(_json2.default.SyntaxKind.CommaToken)) {
                        if (!node.addItem(_parseValue(node, '' + count++)) && !_doc.config.ignoreDanglingComma) {
                            _error('Value expected');
                        }
                    }
                }
                if (_scanner.getToken() !== _json2.default.SyntaxKind.CloseBracketToken) {
                    return _error('Expected comma or closing bracket', node);
                }
                return _finalize(node, true);
            }
            function _parseProperty(parent, keysSeen) {
                var key = _parseString(null, null, true);
                if (!key) {
                    if (_scanner.getToken() === _json2.default.SyntaxKind.Unknown) {
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
                if (_scanner.getToken() === _json2.default.SyntaxKind.ColonToken) {
                    node.colonOffset = _scanner.getTokenOffset();
                } else {
                    return _error('Colon expected', node, [], [_json2.default.SyntaxKind.CloseBraceToken, _json2.default.SyntaxKind.CommaToken]);
                }
                _scanner.scan();
                if (!node.setValue(_parseValue(node, key.value))) {
                    return _error('Value expected', node, [], [_json2.default.SyntaxKind.CloseBraceToken, _json2.default.SyntaxKind.CommaToken]);
                }
                node.end = node.value.end;
                return node;
            }
            function _parseObject(parent, name) {
                if (_scanner.getToken() !== _json2.default.SyntaxKind.OpenBraceToken) {
                    return null;
                }
                var node = new ObjectASTNode(parent, name, _scanner.getTokenOffset());
                _scanner.scan();
                var keysSeen = {};
                if (node.addProperty(_parseProperty(node, keysSeen))) {
                    while (_accept(_json2.default.SyntaxKind.CommaToken)) {
                        if (!node.addProperty(_parseProperty(node, keysSeen)) && !_doc.config.ignoreDanglingComma) {
                            _error('Property expected');
                        }
                    }
                }
                if (_scanner.getToken() !== _json2.default.SyntaxKind.CloseBraceToken) {
                    return _error('Expected comma or closing brace', node);
                }
                return _finalize(node, true);
            }
            function _parseString(parent, name, isKey) {
                if (_scanner.getToken() !== _json2.default.SyntaxKind.StringLiteral) {
                    return null;
                }
                var node = new StringASTNode(parent, name, isKey, _scanner.getTokenOffset());
                node.value = _scanner.getTokenValue();
                _checkScanError();
                return _finalize(node, true);
            }
            function _parseNumber(parent, name) {
                if (_scanner.getToken() !== _json2.default.SyntaxKind.NumericLiteral) {
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
                var node;
                switch (_scanner.getToken()) {
                    case _json2.default.SyntaxKind.NullKeyword:
                        node = new NullASTNode(parent, name, _scanner.getTokenOffset());
                        break;
                    case _json2.default.SyntaxKind.TrueKeyword:
                        node = new BooleanASTNode(parent, name, true, _scanner.getTokenOffset());
                        break;
                    case _json2.default.SyntaxKind.FalseKeyword:
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
            } else if (_scanner.getToken() !== _json2.default.SyntaxKind.EOF) {
                _error('End of file expected');
            }
            return _doc;
        }
    }]);

    return JSONParser;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wYXJzZXIvanNvblBhcnNlci50cyIsInZzY29kZS9wYXJzZXIvanNvblBhcnNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7Ozs7Ozs7QUNIQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7SURrQkEsTyxXQUFBLE87QUFPSSxxQkFBWSxNQUFaLEVBQTZCLElBQTdCLEVBQTJDLElBQTNDLEVBQXlELEtBQXpELEVBQXdFLEdBQXhFLEVBQW9GO0FBQUE7O0FBQ2hGLGFBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxhQUFLLElBQUwsR0FBWSxJQUFaO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLGFBQUssR0FBTCxHQUFXLEdBQVg7QUFDQSxhQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0g7Ozs7MENBRXFCO0FBQ2xCLGdCQUFJLE9BQU8sS0FBSyxNQUFMLEdBQWMsS0FBSyxNQUFMLENBQVksZUFBWixFQUFkLEdBQThDLCtCQUFpQixFQUFqQixDQUF6RDtBQUNBLGdCQUFJLEtBQUssSUFBVCxFQUFlO0FBQ1gsdUJBQU8sS0FBSyxNQUFMLENBQVksS0FBSyxJQUFqQixDQUFQO0FBQ0g7QUFDRCxtQkFBTyxJQUFQO0FBQ0g7Ozt3Q0FHbUI7QUFDaEIsbUJBQU8sRUFBUDtBQUNIOzs7bUNBRWM7QUFFWDtBQUNIOzs7aUNBRWUsTSxFQUFrRDtBQUFBLGdCQUFsQyxpQkFBa0MseURBQUwsS0FBSzs7QUFDOUQsbUJBQU8sVUFBVSxLQUFLLEtBQWYsSUFBd0IsU0FBUyxLQUFLLEdBQXRDLElBQTZDLHFCQUFxQixXQUFXLEtBQUssR0FBekY7QUFDSDs7OzhCQUVZLE8sRUFBbUM7QUFDNUMsbUJBQU8sUUFBUSxJQUFSLENBQVA7QUFDSDs7OzBDQUV3QixNLEVBQWM7QUFDbkMsZ0JBQUksV0FBVyxTQUFYLFFBQVcsQ0FBQyxJQUFELEVBQWM7QUFDekIsb0JBQUksVUFBVSxLQUFLLEtBQWYsSUFBd0IsU0FBUyxLQUFLLEdBQTFDLEVBQStD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QUFDSDtBQUVELHFCQUFBLFdBQUEsQ0FBcUIsTUFBckIsRUFBc0MsSUFBdEMsRUFBa0Q7QUFDOUMsdUJBQU8sWUFBWSxNQUFaLEVBQW9CLElBQXBCLEtBQTZCLGFBQWEsTUFBYixFQUFxQixJQUFyQixDQUE3QixJQUEyRCxhQUFhLE1BQWIsRUFBcUIsSUFBckIsRUFBMkIsS0FBM0IsQ0FBM0QsSUFBZ0csYUFBYSxNQUFiLEVBQXFCLElBQXJCLENBQWhHLElBQThILGNBQWMsTUFBZCxFQUFzQixJQUF0QixDQUFySTtBQUNIO0FBRUQscUJBQVMsSUFBVDtBQUVBLGlCQUFLLElBQUwsR0FBWSxZQUFZLElBQVosRUFBa0IsSUFBbEIsQ0FBWjtBQUNBLGdCQUFJLENBQUMsS0FBSyxJQUFWLEVBQWdCO0FBQ1o7QUFDSCxhQUZELE1BRU8sSUFBSSxTQUFTLFFBQVQsT0FBd0IsZUFBSyxVQUFMLENBQWdCLEdBQTVDLEVBQWlEO0FBQ3BEO0FBQ0g7QUFDRCxtQkFBTyxJQUFQO0FBQ0giLCJmaWxlIjoidnNjb2RlL3BhcnNlci9qc29uUGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCBKc29uIGZyb20gJy4uL2NvbW1vbi9qc29uJztcclxuaW1wb3J0IEpzb25TY2hlbWEgZnJvbSAnLi4vY29tbW9uL2pzb25TY2hlbWEnO1xyXG5pbXBvcnQge0pTT05Mb2NhdGlvbn0gZnJvbSAnLi9qc29uTG9jYXRpb24nO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJUmFuZ2Uge1xyXG4gICAgc3RhcnQ6IG51bWJlcjtcclxuICAgIGVuZDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElFcnJvciB7XHJcbiAgICBsb2NhdGlvbjogSVJhbmdlO1xyXG4gICAgbWVzc2FnZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQVNUTm9kZSB7XHJcbiAgICBwdWJsaWMgc3RhcnQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBlbmQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyB0eXBlOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcGFyZW50OiBBU1ROb2RlO1xyXG4gICAgcHVibGljIG5hbWU6IHN0cmluZztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IEFTVE5vZGUsIHR5cGU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5zdGFydCA9IHN0YXJ0O1xyXG4gICAgICAgIHRoaXMuZW5kID0gZW5kO1xyXG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXROb2RlTG9jYXRpb24oKTogSlNPTkxvY2F0aW9uIHtcclxuICAgICAgICB2YXIgcGF0aCA9IHRoaXMucGFyZW50ID8gdGhpcy5wYXJlbnQuZ2V0Tm9kZUxvY2F0aW9uKCkgOiBuZXcgSlNPTkxvY2F0aW9uKFtdKTtcclxuICAgICAgICBpZiAodGhpcy5uYW1lKSB7XHJcbiAgICAgICAgICAgIHBhdGggPSBwYXRoLmFwcGVuZCh0aGlzLm5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcGF0aDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIGdldENoaWxkTm9kZXMoKTogQVNUTm9kZVtdIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFZhbHVlKCk6IGFueSB7XHJcbiAgICAgICAgLy8gb3ZlcnJpZGUgaW4gY2hpbGRyZW5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnRhaW5zKG9mZnNldDogbnVtYmVyLCBpbmNsdWRlUmlnaHRCb3VuZDogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIG9mZnNldCA+PSB0aGlzLnN0YXJ0ICYmIG9mZnNldCA8IHRoaXMuZW5kIHx8IGluY2x1ZGVSaWdodEJvdW5kICYmIG9mZnNldCA9PT0gdGhpcy5lbmQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZpc2l0KHZpc2l0b3I6IChub2RlOiBBU1ROb2RlKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHZpc2l0b3IodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE5vZGVGcm9tT2Zmc2V0KG9mZnNldDogbnVtYmVyKTogQVNUTm9kZSB7XHJcbiAgICAgICAgdmFyIGZpbmROb2RlID0gKG5vZGU6IEFTVE5vZGUpOiBBU1ROb2RlID0+IHtcclxuICAgICAgICAgICAgaWYgKG9mZnNldCA+PSBub2RlLnN0YXJ0ICYmIG9mZnNldCA8IG5vZGUuZW5kKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBub2RlLmdldENoaWxkTm9kZXMoKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoICYmIGNoaWxkcmVuW2ldLnN0YXJ0IDw9IG9mZnNldDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBmaW5kTm9kZShjaGlsZHJlbltpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZmluZE5vZGUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE5vZGVGcm9tT2Zmc2V0RW5kSW5jbHVzaXZlKG9mZnNldDogbnVtYmVyKTogQVNUTm9kZSB7XHJcbiAgICAgICAgdmFyIGZpbmROb2RlID0gKG5vZGU6IEFTVE5vZGUpOiBBU1ROb2RlID0+IHtcclxuICAgICAgICAgICAgaWYgKG9mZnNldCA+PSBub2RlLnN0YXJ0ICYmIG9mZnNldCA8PSBub2RlLmVuZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5nZXRDaGlsZE5vZGVzKCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aCAmJiBjaGlsZHJlbltpXS5zdGFydCA8PSBvZmZzZXQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gZmluZE5vZGUoY2hpbGRyZW5baV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGZpbmROb2RlKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWxpZGF0ZShzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLnR5cGUpKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmluY2x1ZGVzKDxzdHJpbmdbXT5zY2hlbWEudHlwZSwgdGhpcy50eXBlKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzY2hlbWEuZXJyb3JNZXNzYWdlIHx8IGBJbmNvcnJlY3QgdHlwZS4gRXhwZWN0ZWQgb25lIG9mICR7KDxzdHJpbmdbXT5zY2hlbWEudHlwZSkuam9pbigpfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgIT09IHNjaGVtYS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc2NoZW1hLmVycm9yTWVzc2FnZSB8fCBgSW5jb3JyZWN0IHR5cGUuIEV4cGVjdGVkIFwiJHtzY2hlbWEudHlwZX1cImBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikpIHtcclxuICAgICAgICAgICAgc2NoZW1hLmFsbE9mLmZvckVhY2goKHN1YlNjaGVtYSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0ZShzdWJTY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzY2hlbWEubm90KSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJWYWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgdmFyIHN1Yk1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHNjaGVtYS5ub3QsIHN1YlZhbGlkYXRpb25SZXN1bHQsIHN1Yk1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgaWYgKCFzdWJWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE1hdGNoZXMgYSBzY2hlbWEgdGhhdCBpcyBub3QgYWxsb3dlZC5gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobWF0Y2hpbmdTY2hlbWFzKSB7XHJcbiAgICAgICAgICAgICAgICBzdWJNYXRjaGluZ1NjaGVtYXMuZm9yRWFjaCgobXMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBtcy5pbnZlcnRlZCA9ICFtcy5pbnZlcnRlZDtcclxuICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ1NjaGVtYXMucHVzaChtcyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRlc3RBbHRlcm5hdGl2ZXMgPSAoYWx0ZXJuYXRpdmVzOiBKc29uU2NoZW1hLklKU09OU2NoZW1hW10sIG1heE9uZU1hdGNoOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gW107XHJcblxyXG4gICAgICAgICAgICAvLyByZW1lbWJlciB0aGUgYmVzdCBtYXRjaCB0aGF0IGlzIHVzZWQgZm9yIGVycm9yIG1lc3NhZ2VzXHJcbiAgICAgICAgICAgIHZhciBiZXN0TWF0Y2g6IHsgc2NoZW1hOiBKc29uU2NoZW1hLklKU09OU2NoZW1hOyB2YWxpZGF0aW9uUmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0OyBtYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW107IH0gPSBudWxsO1xyXG4gICAgICAgICAgICBhbHRlcm5hdGl2ZXMuZm9yRWFjaCgoc3ViU2NoZW1hKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3ViVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3ViTWF0Y2hpbmdTY2hlbWFzOiBJQXBwbGljYWJsZVNjaGVtYVtdID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHN1YlNjaGVtYSwgc3ViVmFsaWRhdGlvblJlc3VsdCwgc3ViTWF0Y2hpbmdTY2hlbWFzKTtcclxuICAgICAgICAgICAgICAgIGlmICghc3ViVmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaChzdWJTY2hlbWEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFiZXN0TWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSB7IHNjaGVtYTogc3ViU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0OiBzdWJWYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXM6IHN1Yk1hdGNoaW5nU2NoZW1hcyB9O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1heE9uZU1hdGNoICYmICFzdWJWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpICYmICFiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBlcnJvcnMsIGJvdGggYXJlIGVxdWFsbHkgZ29vZCBtYXRjaGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMucHVzaC5hcHBseShiZXN0TWF0Y2gubWF0Y2hpbmdTY2hlbWFzLCBzdWJNYXRjaGluZ1NjaGVtYXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcyArPSBzdWJWYWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNNYXRjaGVzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9IHN1YlZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tcGFyZVJlc3VsdCA9IHN1YlZhbGlkYXRpb25SZXN1bHQuY29tcGFyZShiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXJlUmVzdWx0ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3VyIG5vZGUgaXMgdGhlIGJlc3QgbWF0Y2hpbmcgc28gZmFyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSB7IHNjaGVtYTogc3ViU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0OiBzdWJWYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXM6IHN1Yk1hdGNoaW5nU2NoZW1hcyB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbXBhcmVSZXN1bHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZXJlJ3MgYWxyZWFkeSBhIGJlc3QgbWF0Y2hpbmcgYnV0IHdlIGFyZSBhcyBnb29kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2gubWF0Y2hpbmdTY2hlbWFzLnB1c2guYXBwbHkoYmVzdE1hdGNoLm1hdGNoaW5nU2NoZW1hcywgc3ViTWF0Y2hpbmdTY2hlbWFzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPiAxICYmIG1heE9uZU1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuc3RhcnQgKyAxIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE1hdGNoZXMgbXVsdGlwbGUgc2NoZW1hcyB3aGVuIG9ubHkgb25lIG11c3QgdmFsaWRhdGUuYFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGJlc3RNYXRjaCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZShiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNNYXRjaGVzICs9IGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNNYXRjaGVzO1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9IGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXM7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdTY2hlbWFzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLnB1c2guYXBwbHkobWF0Y2hpbmdTY2hlbWFzLCBiZXN0TWF0Y2gubWF0Y2hpbmdTY2hlbWFzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcy5sZW5ndGg7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XHJcbiAgICAgICAgICAgIHRlc3RBbHRlcm5hdGl2ZXMoc2NoZW1hLmFueU9mLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5vbmVPZikpIHtcclxuICAgICAgICAgICAgdGVzdEFsdGVybmF0aXZlcyhzY2hlbWEub25lT2YsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmVudW0pKSB7XHJcbiAgICAgICAgICAgIGlmIChfLmluY2x1ZGVzKHNjaGVtYS5lbnVtLCB0aGlzLmdldFZhbHVlKCkpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBub3QgYW4gYWNjZXB0ZWQgdmFsdWUuIFZhbGlkIHZhbHVlczogJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuZW51bSl9YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LmVudW1WYWx1ZU1hdGNoID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1hdGNoaW5nU2NoZW1hcyAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBtYXRjaGluZ1NjaGVtYXMucHVzaCh7IG5vZGU6IHRoaXMsIHNjaGVtYTogc2NoZW1hIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE51bGxBU1ROb2RlIGV4dGVuZHMgQVNUTm9kZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xyXG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ251bGwnLCBuYW1lLCBzdGFydCwgZW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0VmFsdWUoKTogYW55IHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJvb2xlYW5BU1ROb2RlIGV4dGVuZHMgQVNUTm9kZSB7XHJcblxyXG4gICAgcHJpdmF0ZSB2YWx1ZTogYm9vbGVhbjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4sIHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xyXG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ2Jvb2xlYW4nLCBuYW1lLCBzdGFydCwgZW5kKTtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFZhbHVlKCk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXJyYXlBU1ROb2RlIGV4dGVuZHMgQVNUTm9kZSB7XHJcblxyXG4gICAgcHVibGljIGl0ZW1zOiBBU1ROb2RlW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xyXG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ2FycmF5JywgbmFtZSwgc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRDaGlsZE5vZGVzKCk6IEFTVE5vZGVbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFZhbHVlKCk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKCh2KSA9PiB2LmdldFZhbHVlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRJdGVtKGl0ZW06IEFTVE5vZGUpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZpc2l0KHZpc2l0b3I6IChub2RlOiBBU1ROb2RlKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgdmFyIGN0biA9IHZpc2l0b3IodGhpcyk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aCAmJiBjdG47IGkrKykge1xyXG4gICAgICAgICAgICBjdG4gPSB0aGlzLml0ZW1zW2ldLnZpc2l0KHZpc2l0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3RuO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWxpZGF0ZShzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdXBlci52YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLml0ZW1zKSkge1xyXG4gICAgICAgICAgICB2YXIgc3ViU2NoZW1hcyA9IDxKc29uU2NoZW1hLklKU09OU2NoZW1hW10+c2NoZW1hLml0ZW1zO1xyXG4gICAgICAgICAgICBzdWJTY2hlbWFzLmZvckVhY2goKHN1YlNjaGVtYSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbXNbaW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLnZhbGlkYXRlKHN1YlNjaGVtYSwgaXRlbVZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChpdGVtVmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXRlbXMubGVuZ3RoID49IHN1YlNjaGVtYXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNjaGVtYS5hZGRpdGlvbmFsSXRlbXMgPT09IGZhbHNlICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gc3ViU2NoZW1hcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQXJyYXkgaGFzIHRvbyBtYW55IGl0ZW1zIGFjY29yZGluZyB0byBzY2hlbWEuIEV4cGVjdGVkICR7c3ViU2NoZW1hcy5sZW5ndGh9IG9yIGZld2VyYFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pdGVtcy5sZW5ndGggPj0gc3ViU2NoZW1hcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyArPSAodGhpcy5pdGVtcy5sZW5ndGggLSBzdWJTY2hlbWFzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoc2NoZW1hLml0ZW1zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1WYWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgIGl0ZW0udmFsaWRhdGUoc2NoZW1hLml0ZW1zLCBpdGVtVmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2goaXRlbVZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEubWluSXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPCBzY2hlbWEubWluSXRlbXMpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQXJyYXkgaGFzIHRvbyBmZXcgaXRlbXMuIEV4cGVjdGVkICR7c2NoZW1hLm1pbkl0ZW1zfSBvciBtb3JlYFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiBzY2hlbWEubWF4SXRlbXMpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQXJyYXkgaGFzIHRvbyBtYW55IGl0ZW1zLiBFeHBlY3RlZCAke3NjaGVtYS5taW5JdGVtc30gb3IgZmV3ZXJgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVJdGVtcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy5pdGVtcy5tYXAoKG5vZGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmdldFZhbHVlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB2YXIgZHVwbGljYXRlcyA9IHZhbHVlcy5zb21lKCh2YWx1ZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbmRleCAhPT0gdmFsdWVzLmxhc3RJbmRleE9mKHZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChkdXBsaWNhdGVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEFycmF5IGhhcyBkdXBsaWNhdGUgaXRlbXNgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE51bWJlckFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcclxuXHJcbiAgICBwdWJsaWMgaXNJbnRlZ2VyOiBib29sZWFuO1xyXG4gICAgcHVibGljIHZhbHVlOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcikge1xyXG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ251bWJlcicsIG5hbWUsIHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgIHRoaXMuaXNJbnRlZ2VyID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnZhbHVlID0gTnVtYmVyLk5hTjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0VmFsdWUoKTogYW55IHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmFsaWRhdGUoc2NoZW1hOiBKc29uU2NoZW1hLklKU09OU2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW10sIG9mZnNldDogbnVtYmVyID0gLTEpOiB2b2lkIHtcclxuICAgICAgICBpZiAob2Zmc2V0ICE9PSAtMSAmJiAhdGhpcy5jb250YWlucyhvZmZzZXQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHdvcmsgYXJvdW5kIHR5cGUgdmFsaWRhdGlvbiBpbiB0aGUgYmFzZSBjbGFzc1xyXG4gICAgICAgIHZhciB0eXBlSXNJbnRlZ2VyID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSAnaW50ZWdlcicgfHwgKEFycmF5LmlzQXJyYXkoc2NoZW1hLnR5cGUpICYmIF8uaW5jbHVkZXMoPHN0cmluZ1tdPnNjaGVtYS50eXBlLCAnaW50ZWdlcicpKSkge1xyXG4gICAgICAgICAgICB0eXBlSXNJbnRlZ2VyID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVJc0ludGVnZXIgJiYgdGhpcy5pc0ludGVnZXIgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gJ2ludGVnZXInO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdXBlci52YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICB0aGlzLnR5cGUgPSAnbnVtYmVyJztcclxuXHJcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuZ2V0VmFsdWUoKTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIoc2NoZW1hLm11bHRpcGxlT2YpKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgJSBzY2hlbWEubXVsdGlwbGVPZiAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBub3QgZGl2aXNpYmxlIGJ5ICR7c2NoZW1hLm11bHRpcGxlT2Z9YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChzY2hlbWEubWluaW11bSkpIHtcclxuICAgICAgICAgICAgaWYgKHNjaGVtYS5leGNsdXNpdmVNaW5pbXVtICYmIHZhbCA8PSBzY2hlbWEubWluaW11bSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBiZWxvdyB0aGUgZXhjbHVzaXZlIG1pbmltdW0gb2YgJHtzY2hlbWEubWluaW11bX1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXNjaGVtYS5leGNsdXNpdmVNaW5pbXVtICYmIHZhbCA8IHNjaGVtYS5taW5pbXVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFZhbHVlIGlzIGJlbG93IHRoZSBtaW5pbXVtIG9mICR7c2NoZW1hLm1pbmltdW19YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChzY2hlbWEubWF4aW11bSkpIHtcclxuICAgICAgICAgICAgaWYgKHNjaGVtYS5leGNsdXNpdmVNYXhpbXVtICYmIHZhbCA+PSBzY2hlbWEubWF4aW11bSkge1xyXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBhYm92ZSB0aGUgZXhjbHVzaXZlIG1heGltdW0gb2YgJHtzY2hlbWEubWF4aW11bX1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXNjaGVtYS5leGNsdXNpdmVNYXhpbXVtICYmIHZhbCA+IHNjaGVtYS5tYXhpbXVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFZhbHVlIGlzIGFib3ZlIHRoZSBtYXhpbXVtIG9mICR7c2NoZW1hLm1heGltdW19YFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3RyaW5nQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG4gICAgcHVibGljIGlzS2V5OiBib29sZWFuO1xyXG4gICAgcHVibGljIHZhbHVlOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50OiBBU1ROb2RlLCBuYW1lOiBzdHJpbmcsIGlzS2V5OiBib29sZWFuLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcclxuICAgICAgICBzdXBlcihwYXJlbnQsICdzdHJpbmcnLCBuYW1lLCBzdGFydCwgZW5kKTtcclxuICAgICAgICB0aGlzLmlzS2V5ID0gaXNLZXk7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRWYWx1ZSgpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWxpZGF0ZShzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdXBlci52YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5taW5MZW5ndGggJiYgdGhpcy52YWx1ZS5sZW5ndGggPCBzY2hlbWEubWluTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYFN0cmluZyBpcyBzaG9ydGVyIHRoYW4gdGhlIG1pbmltdW0gbGVuZ3RoIG9mICR7c2NoZW1hLm1pbkxlbmd0aH1gXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoc2NoZW1hLm1heExlbmd0aCAmJiB0aGlzLnZhbHVlLmxlbmd0aCA+IHNjaGVtYS5tYXhMZW5ndGgpIHtcclxuICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBgU3RyaW5nIGlzIHNob3J0ZXIgdGhhbiB0aGUgbWF4aW11bSBsZW5ndGggb2YgJHtzY2hlbWEubWF4TGVuZ3RofWBcclxuICAgIH0pO1xyXG59XHJcblxyXG5pZiAoc2NoZW1hLnBhdHRlcm4pIHtcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc2NoZW1hLnBhdHRlcm4pO1xyXG4gICAgaWYgKCFyZWdleC50ZXN0KHRoaXMudmFsdWUpKSB7XHJcbiAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgbWVzc2FnZTogc2NoZW1hLmVycm9yTWVzc2FnZSB8fCBgU3RyaW5nIGRvZXMgbm90IG1hdGNoIHRoZSBwYXR0ZXJuIG9mIFwiJHtzY2hlbWEucGF0dGVybn1cImBcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFByb3BlcnR5QVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG4gICAgcHVibGljIGtleTogU3RyaW5nQVNUTm9kZTtcclxuICAgIHB1YmxpYyB2YWx1ZTogQVNUTm9kZTtcclxuICAgIHB1YmxpYyBjb2xvbk9mZnNldDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudDogQVNUTm9kZSwga2V5OiBTdHJpbmdBU1ROb2RlKSB7XHJcbiAgICAgICAgc3VwZXIocGFyZW50LCAncHJvcGVydHknLCBudWxsLCBrZXkuc3RhcnQpO1xyXG4gICAgICAgIHRoaXMua2V5ID0ga2V5O1xyXG4gICAgICAgIGtleS5wYXJlbnQgPSB0aGlzO1xyXG4gICAgICAgIGtleS5uYW1lID0ga2V5LnZhbHVlO1xyXG4gICAgICAgIHRoaXMuY29sb25PZmZzZXQgPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q2hpbGROb2RlcygpOiBBU1ROb2RlW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID8gW3RoaXMua2V5LCB0aGlzLnZhbHVlXSA6IFt0aGlzLmtleV07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFZhbHVlKHZhbHVlOiBBU1ROb2RlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmlzaXQodmlzaXRvcjogKG5vZGU6IEFTVE5vZGUpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdmlzaXRvcih0aGlzKSAmJiB0aGlzLmtleS52aXNpdCh2aXNpdG9yKSAmJiB0aGlzLnZhbHVlICYmIHRoaXMudmFsdWUudmlzaXQodmlzaXRvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHZhbGlkYXRlKHNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzOiBJQXBwbGljYWJsZVNjaGVtYVtdLCBvZmZzZXQ6IG51bWJlciA9IC0xKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT2JqZWN0QVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xyXG4gICAgcHVibGljIHByb3BlcnRpZXM6IFByb3BlcnR5QVNUTm9kZVtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpIHtcclxuICAgICAgICBzdXBlcihwYXJlbnQsICdvYmplY3QnLCBuYW1lLCBzdGFydCwgZW5kKTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENoaWxkTm9kZXMoKTogQVNUTm9kZVtdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRQcm9wZXJ0eShub2RlOiBQcm9wZXJ0eUFTVE5vZGUpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoIW5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnByb3BlcnRpZXMucHVzaChub2RlKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Rmlyc3RQcm9wZXJ0eShrZXk6IHN0cmluZyk6IFByb3BlcnR5QVNUTm9kZSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1tpXS5rZXkudmFsdWUgPT09IGtleSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0S2V5TGlzdCgpOiBzdHJpbmdbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllcy5tYXAoKHApID0+IHAua2V5LmdldFZhbHVlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRWYWx1ZSgpOiBhbnkge1xyXG4gICAgICAgIHZhciB2YWx1ZTogYW55ID0ge307XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmZvckVhY2goKHApID0+IHtcclxuICAgICAgICAgICAgdmFyIHYgPSBwLnZhbHVlICYmIHAudmFsdWUuZ2V0VmFsdWUoKTtcclxuICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlW3Aua2V5LmdldFZhbHVlKCldID0gdjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmlzaXQodmlzaXRvcjogKG5vZGU6IEFTVE5vZGUpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICB2YXIgY3RuID0gdmlzaXRvcih0aGlzKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGggJiYgY3RuOyBpKyspIHtcclxuICAgICAgICAgICAgY3RuID0gdGhpcy5wcm9wZXJ0aWVzW2ldLnZpc2l0KHZpc2l0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3RuO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2YWxpZGF0ZShzY2hlbWE6IEpzb25TY2hlbWEuSUpTT05TY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogSUFwcGxpY2FibGVTY2hlbWFbXSwgb2Zmc2V0OiBudW1iZXIgPSAtMSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgdmFyIHNlZW5LZXlzOiB7IFtrZXk6IHN0cmluZ106IEFTVE5vZGUgfSA9IHt9O1xyXG4gICAgICAgIHZhciB1bnByb2Nlc3NlZFByb3BlcnRpZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmZvckVhY2goKG5vZGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IG5vZGUua2V5LnZhbHVlO1xyXG4gICAgICAgICAgICBzZWVuS2V5c1trZXldID0gbm9kZS52YWx1ZTtcclxuICAgICAgICAgICAgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLnB1c2goa2V5KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLnJlcXVpcmVkKSkge1xyXG4gICAgICAgICAgICBzY2hlbWEucmVxdWlyZWQuZm9yRWFjaCgocHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghc2VlbktleXNbcHJvcGVydHlOYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSB0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudCAmJiAoPFByb3BlcnR5QVNUTm9kZT50aGlzLnBhcmVudCkua2V5O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IGtleSA/IHsgc3RhcnQ6IGtleS5zdGFydCwgZW5kOiBrZXkuZW5kIH0gOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuc3RhcnQgKyAxIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTWlzc2luZyBwcm9wZXJ0eSBcIiR7cHJvcGVydHlOYW1lfVwiYFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB2YXIgcHJvcGVydHlQcm9jZXNzZWQgPSAocHJvcDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHVucHJvY2Vzc2VkUHJvcGVydGllcy5pbmRleE9mKHByb3ApO1xyXG4gICAgICAgICAgICB3aGlsZSAoaW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgICAgICBpbmRleCA9IHVucHJvY2Vzc2VkUHJvcGVydGllcy5pbmRleE9mKHByb3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYS5wcm9wZXJ0aWVzKS5mb3JFYWNoKChwcm9wZXJ0eU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlQcm9jZXNzZWQocHJvcGVydHlOYW1lKTtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wID0gc2NoZW1hLnByb3BlcnRpZXNbcHJvcGVydHlOYW1lXTtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZC52YWxpZGF0ZShwcm9wLCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykuZm9yRWFjaCgocHJvcGVydHlQYXR0ZXJuOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAocHJvcGVydHlQYXR0ZXJuKTtcclxuICAgICAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5zbGljZSgwKS5mb3JFYWNoKChwcm9wZXJ0eU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdleC50ZXN0KHByb3BlcnR5TmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQcm9jZXNzZWQocHJvcGVydHlOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gc2VlbktleXNbcHJvcGVydHlOYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnZhbGlkYXRlKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllc1twcm9wZXJ0eVBhdHRlcm5dLCBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQubWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICB1bnByb2Nlc3NlZFByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZC52YWxpZGF0ZShzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMsIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQubWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBpZiAodW5wcm9jZXNzZWRQcm9wZXJ0aWVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5vZGUgPSA8UHJvcGVydHlBU1ROb2RlPmNoaWxkLnBhcmVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogcHJvcGVydHlOb2RlLmtleS5zdGFydCwgZW5kOiBwcm9wZXJ0eU5vZGUua2V5LmVuZCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByb3BlcnR5ICR7cHJvcGVydHlOYW1lfSBpcyBub3QgYWxsb3dlZGBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEubWF4UHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLmxlbmd0aCA+IHNjaGVtYS5tYXhQcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYE9iamVjdCBoYXMgbW9yZSBwcm9wZXJ0aWVzIHRoYW4gbGltaXQgb2YgJHtzY2hlbWEubWF4UHJvcGVydGllc31gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5taW5Qcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXMubGVuZ3RoIDwgc2NoZW1hLm1pblByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgT2JqZWN0IGhhcyBmZXdlciBwcm9wZXJ0aWVzIHRoYW4gdGhlIHJlcXVpcmVkIG51bWJlciBvZiAke3NjaGVtYS5taW5Qcm9wZXJ0aWVzfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXy5pc09iamVjdChzY2hlbWEuZGVwZW5kZW5jaWVzKSkge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEuZGVwZW5kZW5jaWVzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3AgPSBzZWVuS2V5c1trZXldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZGVwZW5kZW5jaWVzW2tleV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZUFzQXJyYXk6IHN0cmluZ1tdID0gc2NoZW1hLmRlcGVuZGVuY2llc1trZXldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUFzQXJyYXkuZm9yRWFjaCgocmVxdWlyZWRQcm9wOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VlbktleXNbcmVxdWlyZWRQcm9wXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBPYmplY3QgaXMgbWlzc2luZyBwcm9wZXJ0eSAkeyAgcmVxdWlyZWRQcm9wfSByZXF1aXJlZCBieSBwcm9wZXJ0eSAke2tleX1gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3Qoc2NoZW1hLmRlcGVuZGVuY2llc1trZXldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVBc1NjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYSA9IHNjaGVtYS5kZXBlbmRlbmNpZXNba2V5XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGUodmFsdWVBc1NjaGVtYSwgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQubWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBKU09ORG9jdW1lbnRDb25maWcge1xyXG4gICAgcHVibGljIGlnbm9yZURhbmdsaW5nQ29tbWE6IGJvb2xlYW47XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5pZ25vcmVEYW5nbGluZ0NvbW1hID0gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUFwcGxpY2FibGVTY2hlbWEge1xyXG4gICAgbm9kZTogQVNUTm9kZTtcclxuICAgIGludmVydGVkPzogYm9vbGVhbjtcclxuICAgIHNjaGVtYTogSnNvblNjaGVtYS5JSlNPTlNjaGVtYTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25SZXN1bHQge1xyXG4gICAgcHVibGljIGVycm9yczogSUVycm9yW107XHJcbiAgICBwdWJsaWMgd2FybmluZ3M6IElFcnJvcltdO1xyXG5cclxuICAgIHB1YmxpYyBwcm9wZXJ0aWVzTWF0Y2hlczogbnVtYmVyO1xyXG4gICAgcHVibGljIHByb3BlcnRpZXNWYWx1ZU1hdGNoZXM6IG51bWJlcjtcclxuICAgIHB1YmxpYyBlbnVtVmFsdWVNYXRjaDogYm9vbGVhbjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmVycm9ycyA9IFtdO1xyXG4gICAgICAgIHRoaXMud2FybmluZ3MgPSBbXTtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXNNYXRjaGVzID0gMDtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMgPSAwO1xyXG4gICAgICAgIHRoaXMuZW51bVZhbHVlTWF0Y2ggPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGFzRXJyb3JzKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAhIXRoaXMuZXJyb3JzLmxlbmd0aCB8fCAhIXRoaXMud2FybmluZ3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZUFsbCh2YWxpZGF0aW9uUmVzdWx0czogVmFsaWRhdGlvblJlc3VsdFtdKTogdm9pZCB7XHJcbiAgICAgICAgdmFsaWRhdGlvblJlc3VsdHMuZm9yRWFjaCgodmFsaWRhdGlvblJlc3VsdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1lcmdlKHZhbGlkYXRpb25SZXN1bHQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtZXJnZSh2YWxpZGF0aW9uUmVzdWx0OiBWYWxpZGF0aW9uUmVzdWx0KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5lcnJvcnMgPSB0aGlzLmVycm9ycy5jb25jYXQodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMpO1xyXG4gICAgICAgIHRoaXMud2FybmluZ3MgPSB0aGlzLndhcm5pbmdzLmNvbmNhdCh2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubWVyZ2UocHJvcGVydHlWYWxpZGF0aW9uUmVzdWx0KTtcclxuICAgICAgICB0aGlzLnByb3BlcnRpZXNNYXRjaGVzKys7XHJcbiAgICAgICAgaWYgKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5lbnVtVmFsdWVNYXRjaCB8fCAhcHJvcGVydHlWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpICYmIHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcykge1xyXG4gICAgICAgICAgICB0aGlzLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXBhcmUob3RoZXI6IFZhbGlkYXRpb25SZXN1bHQpOiBudW1iZXIge1xyXG4gICAgICAgIHZhciBoYXNFcnJvcnMgPSB0aGlzLmhhc0Vycm9ycygpO1xyXG4gICAgICAgIGlmIChoYXNFcnJvcnMgIT09IG90aGVyLmhhc0Vycm9ycygpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBoYXNFcnJvcnMgPyAtMSA6IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmVudW1WYWx1ZU1hdGNoICE9PSBvdGhlci5lbnVtVmFsdWVNYXRjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gb3RoZXIuZW51bVZhbHVlTWF0Y2ggPyAtMSA6IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMgIT09IG90aGVyLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyAtIG90aGVyLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXNNYXRjaGVzIC0gb3RoZXIucHJvcGVydGllc01hdGNoZXM7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSlNPTkRvY3VtZW50IHtcclxuICAgIHB1YmxpYyBjb25maWc6IEpTT05Eb2N1bWVudENvbmZpZztcclxuICAgIHB1YmxpYyByb290OiBBU1ROb2RlO1xyXG5cclxuICAgIHByaXZhdGUgdmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IEpTT05Eb2N1bWVudENvbmZpZykge1xyXG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBlcnJvcnMoKTogSUVycm9yW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgd2FybmluZ3MoKTogSUVycm9yW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRpb25SZXN1bHQud2FybmluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE5vZGVGcm9tT2Zmc2V0KG9mZnNldDogbnVtYmVyKTogQVNUTm9kZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuZ2V0Tm9kZUZyb21PZmZzZXQob2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0OiBudW1iZXIpOiBBU1ROb2RlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb290ICYmIHRoaXMucm9vdC5nZXROb2RlRnJvbU9mZnNldEVuZEluY2x1c2l2ZShvZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2aXNpdCh2aXNpdG9yOiAobm9kZTogQVNUTm9kZSkgPT4gYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh0aGlzLnJvb3QpIHtcclxuICAgICAgICAgICAgdGhpcy5yb290LnZpc2l0KHZpc2l0b3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdmFsaWRhdGUoc2NoZW1hOiBKc29uU2NoZW1hLklKU09OU2NoZW1hLCBtYXRjaGluZ1NjaGVtYXM6IElBcHBsaWNhYmxlU2NoZW1hW10gPSBudWxsLCBvZmZzZXQ6IG51bWJlciA9IC0xKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRoaXMucm9vdCkge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3QudmFsaWRhdGUoc2NoZW1hLCB0aGlzLnZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBKU09OUGFyc2VyIHtcclxuICAgIHB1YmxpYyBwYXJzZSh0ZXh0OiBzdHJpbmcsIGNvbmZpZyA9IG5ldyBKU09ORG9jdW1lbnRDb25maWcoKSk6IEpTT05Eb2N1bWVudCB7XHJcblxyXG4gICAgICAgIHZhciBfZG9jID0gbmV3IEpTT05Eb2N1bWVudChjb25maWcpO1xyXG4gICAgICAgIHZhciBfc2Nhbm5lciA9IEpzb24uY3JlYXRlU2Nhbm5lcih0ZXh0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX2FjY2VwdCh0b2tlbjogSnNvbi5TeW50YXhLaW5kKTogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpID09PSB0b2tlbikge1xyXG4gICAgICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX2Vycm9yPFQgZXh0ZW5kcyBBU1ROb2RlPihtZXNzYWdlOiBzdHJpbmcsIG5vZGU6IFQgPSBudWxsLCBza2lwVW50aWxBZnRlcjogSnNvbi5TeW50YXhLaW5kW10gPSBbXSwgc2tpcFVudGlsOiBKc29uLlN5bnRheEtpbmRbXSA9IFtdKTogVCB7XHJcbiAgICAgICAgICAgIGlmIChfZG9jLmVycm9ycy5sZW5ndGggPT09IDAgfHwgX2RvYy5lcnJvcnNbMF0ubG9jYXRpb24uc3RhcnQgIT09IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlnbm9yZSBtdWx0aXBsZSBlcnJvcnMgb24gdGhlIHNhbWUgb2Zmc2V0XHJcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSB7IG1lc3NhZ2U6IG1lc3NhZ2UsIGxvY2F0aW9uOiB7IHN0YXJ0OiBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpLCBlbmQ6IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpIH0gfTtcclxuICAgICAgICAgICAgICAgIF9kb2MuZXJyb3JzLnB1c2goZXJyb3IpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgX2ZpbmFsaXplKG5vZGUsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2tpcFVudGlsQWZ0ZXIubGVuZ3RoICsgc2tpcFVudGlsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0b2tlbiA9IF9zY2FubmVyLmdldFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodG9rZW4gIT09IEpzb24uU3ludGF4S2luZC5FT0YpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2tpcFVudGlsQWZ0ZXIuaW5kZXhPZih0b2tlbikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChza2lwVW50aWwuaW5kZXhPZih0b2tlbikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IF9zY2FubmVyLnNjYW4oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9jaGVja1NjYW5FcnJvcigpOiBib29sZWFuIHtcclxuICAgICAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbkVycm9yKCkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgSnNvbi5TY2FuRXJyb3IuSW52YWxpZFVuaWNvZGU6XHJcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBJbnZhbGlkIHVuaWNvZGUgc2VxdWVuY2UgaW4gc3RyaW5nYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLkludmFsaWRFc2NhcGVDaGFyYWN0ZXI6XHJcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBJbnZhbGlkIGVzY2FwZSBjaGFyYWN0ZXIgaW4gc3RyaW5nYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZk51bWJlcjpcclxuICAgICAgICAgICAgICAgICAgICBfZXJyb3IoYFVuZXhwZWN0ZWQgZW5kIG9mIG51bWJlcmApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBKc29uLlNjYW5FcnJvci5VbmV4cGVjdGVkRW5kT2ZDb21tZW50OlxyXG4gICAgICAgICAgICAgICAgICAgIF9lcnJvcihgVW5leHBlY3RlZCBlbmQgb2YgY29tbWVudGApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBKc29uLlNjYW5FcnJvci5VbmV4cGVjdGVkRW5kT2ZTdHJpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBVbmV4cGVjdGVkIGVuZCBvZiBzdHJpbmdgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfZmluYWxpemU8VCBleHRlbmRzIEFTVE5vZGU+KG5vZGU6IFQsIHNjYW5OZXh0OiBib29sZWFuKTogVCB7XHJcbiAgICAgICAgICAgIG5vZGUuZW5kID0gX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSArIF9zY2FubmVyLmdldFRva2VuTGVuZ3RoKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2Nhbk5leHQpIHtcclxuICAgICAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfcGFyc2VBcnJheShwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZyk6IEFycmF5QVNUTm9kZSB7XHJcbiAgICAgICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuT3BlbkJyYWNrZXRUb2tlbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgQXJyYXlBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTsgLy8gY29uc3VtZSBPcGVuQnJhY2tldFRva2VuXHJcblxyXG4gICAgICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgICAgICBpZiAobm9kZS5hZGRJdGVtKF9wYXJzZVZhbHVlKG5vZGUsICcnICsgY291bnQrKykpKSB7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoX2FjY2VwdChKc29uLlN5bnRheEtpbmQuQ29tbWFUb2tlbikpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW5vZGUuYWRkSXRlbShfcGFyc2VWYWx1ZShub2RlLCAnJyArIGNvdW50KyspKSAmJiAhX2RvYy5jb25maWcuaWdub3JlRGFuZ2xpbmdDb21tYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfZXJyb3IoYFZhbHVlIGV4cGVjdGVkYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2tldFRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBFeHBlY3RlZCBjb21tYSBvciBjbG9zaW5nIGJyYWNrZXRgLCBub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF9maW5hbGl6ZShub2RlLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9wYXJzZVByb3BlcnR5KHBhcmVudDogT2JqZWN0QVNUTm9kZSwga2V5c1NlZW46IGFueSk6IFByb3BlcnR5QVNUTm9kZSB7XHJcblxyXG4gICAgICAgICAgICB2YXIga2V5ID0gX3BhcnNlU3RyaW5nKG51bGwsIG51bGwsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAoIWtleSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IEpzb24uU3ludGF4S2luZC5Vbmtub3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2l2ZSBhIG1vcmUgaGVscGZ1bCBlcnJvciBtZXNzYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaCgvXlsnXFx3XS8pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9lcnJvcihgUHJvcGVydHkga2V5cyBtdXN0IGJlIGRvdWJsZXF1b3RlZGApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBub2RlID0gbmV3IFByb3BlcnR5QVNUTm9kZShwYXJlbnQsIGtleSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoa2V5c1NlZW5ba2V5LnZhbHVlXSkge1xyXG4gICAgICAgICAgICAgICAgX2RvYy53YXJuaW5ncy5wdXNoKHsgbG9jYXRpb246IHsgc3RhcnQ6IG5vZGUua2V5LnN0YXJ0LCBlbmQ6IG5vZGUua2V5LmVuZCB9LCBtZXNzYWdlOiBgRHVwbGljYXRlIG9iamVjdCBrZXlgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtleXNTZWVuW2tleS52YWx1ZV0gPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IEpzb24uU3ludGF4S2luZC5Db2xvblRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLmNvbG9uT2Zmc2V0ID0gX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYENvbG9uIGV4cGVjdGVkYCwgbm9kZSwgW10sIFtKc29uLlN5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuLCBKc29uLlN5bnRheEtpbmQuQ29tbWFUb2tlbl0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBfc2Nhbm5lci5zY2FuKCk7IC8vIGNvbnN1bWUgQ29sb25Ub2tlblxyXG5cclxuICAgICAgICAgICAgaWYgKCFub2RlLnNldFZhbHVlKF9wYXJzZVZhbHVlKG5vZGUsIGtleS52YWx1ZSkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBWYWx1ZSBleHBlY3RlZGAsIG5vZGUsIFtdLCBbSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbiwgSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW5dKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBub2RlLmVuZCA9IG5vZGUudmFsdWUuZW5kO1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9wYXJzZU9iamVjdChwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZyk6IE9iamVjdEFTVE5vZGUge1xyXG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLk9wZW5CcmFjZVRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IG5ldyBPYmplY3RBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTsgLy8gY29uc3VtZSBPcGVuQnJhY2VUb2tlblxyXG5cclxuICAgICAgICAgICAgdmFyIGtleXNTZWVuOiBhbnkgPSB7fTtcclxuICAgICAgICAgICAgaWYgKG5vZGUuYWRkUHJvcGVydHkoX3BhcnNlUHJvcGVydHkobm9kZSwga2V5c1NlZW4pKSkge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKF9hY2NlcHQoSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW4pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLmFkZFByb3BlcnR5KF9wYXJzZVByb3BlcnR5KG5vZGUsIGtleXNTZWVuKSkgJiYgIV9kb2MuY29uZmlnLmlnbm9yZURhbmdsaW5nQ29tbWEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBQcm9wZXJ0eSBleHBlY3RlZGApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IEpzb24uU3ludGF4S2luZC5DbG9zZUJyYWNlVG9rZW4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYEV4cGVjdGVkIGNvbW1hIG9yIGNsb3NpbmcgYnJhY2VgLCBub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlU3RyaW5nKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nLCBpc0tleTogYm9vbGVhbik6IFN0cmluZ0FTVE5vZGUge1xyXG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLlN0cmluZ0xpdGVyYWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IG5ldyBTdHJpbmdBU1ROb2RlKHBhcmVudCwgbmFtZSwgaXNLZXksIF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpO1xyXG4gICAgICAgICAgICBub2RlLnZhbHVlID0gX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpO1xyXG5cclxuICAgICAgICAgICAgX2NoZWNrU2NhbkVycm9yKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlTnVtYmVyKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nKTogTnVtYmVyQVNUTm9kZSB7XHJcbiAgICAgICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuTnVtZXJpY0xpdGVyYWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IG5ldyBOdW1iZXJBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgIGlmICghX2NoZWNrU2NhbkVycm9yKCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0b2tlblZhbHVlID0gX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbnVtYmVyVmFsdWUgPSBKU09OLnBhcnNlKHRva2VuVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbnVtYmVyVmFsdWUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYEludmFsaWQgbnVtYmVyIGZvcm1hdGAsIG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBub2RlLnZhbHVlID0gbnVtYmVyVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9lcnJvcihgSW52YWxpZCBudW1iZXIgZm9ybWF0YCwgbm9kZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBub2RlLmlzSW50ZWdlciA9IHRva2VuVmFsdWUuaW5kZXhPZignLicpID09PSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2ZpbmFsaXplKG5vZGUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlTGl0ZXJhbChwYXJlbnQ6IEFTVE5vZGUsIG5hbWU6IHN0cmluZyk6IEFTVE5vZGUge1xyXG4gICAgICAgICAgICB2YXIgbm9kZTogQVNUTm9kZTtcclxuICAgICAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbigpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU3ludGF4S2luZC5OdWxsS2V5d29yZDpcclxuICAgICAgICAgICAgICAgICAgICBub2RlID0gbmV3IE51bGxBU1ROb2RlKHBhcmVudCwgbmFtZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU3ludGF4S2luZC5UcnVlS2V5d29yZDpcclxuICAgICAgICAgICAgICAgICAgICBub2RlID0gbmV3IEJvb2xlYW5BU1ROb2RlKHBhcmVudCwgbmFtZSwgdHJ1ZSwgX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU3ludGF4S2luZC5GYWxzZUtleXdvcmQ6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5ldyBCb29sZWFuQVNUTm9kZShwYXJlbnQsIG5hbWUsIGZhbHNlLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIF9maW5hbGl6ZShub2RlLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9wYXJzZVZhbHVlKHBhcmVudDogQVNUTm9kZSwgbmFtZTogc3RyaW5nKTogQVNUTm9kZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfcGFyc2VBcnJheShwYXJlbnQsIG5hbWUpIHx8IF9wYXJzZU9iamVjdChwYXJlbnQsIG5hbWUpIHx8IF9wYXJzZVN0cmluZyhwYXJlbnQsIG5hbWUsIGZhbHNlKSB8fCBfcGFyc2VOdW1iZXIocGFyZW50LCBuYW1lKSB8fCBfcGFyc2VMaXRlcmFsKHBhcmVudCwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfc2Nhbm5lci5zY2FuKCk7XHJcblxyXG4gICAgICAgIF9kb2Mucm9vdCA9IF9wYXJzZVZhbHVlKG51bGwsIG51bGwpO1xyXG4gICAgICAgIGlmICghX2RvYy5yb290KSB7XHJcbiAgICAgICAgICAgIF9lcnJvcihgRXhwZWN0ZWQgYSBKU09OIG9iamVjdCwgYXJyYXkgb3IgbGl0ZXJhbGApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLkVPRikge1xyXG4gICAgICAgICAgICBfZXJyb3IoYEVuZCBvZiBmaWxlIGV4cGVjdGVkYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfZG9jO1xyXG4gICAgfVxyXG59XHJcbiIsIid1c2Ugc3RyaWN0JztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgSnNvbiBmcm9tICcuLi9jb21tb24vanNvbic7XG5pbXBvcnQgeyBKU09OTG9jYXRpb24gfSBmcm9tICcuL2pzb25Mb2NhdGlvbic7XG5leHBvcnQgY2xhc3MgQVNUTm9kZSB7XG4gICAgY29uc3RydWN0b3IocGFyZW50LCB0eXBlLCBuYW1lLCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgICAgICAgdGhpcy5lbmQgPSBlbmQ7XG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIH1cbiAgICBnZXROb2RlTG9jYXRpb24oKSB7XG4gICAgICAgIHZhciBwYXRoID0gdGhpcy5wYXJlbnQgPyB0aGlzLnBhcmVudC5nZXROb2RlTG9jYXRpb24oKSA6IG5ldyBKU09OTG9jYXRpb24oW10pO1xuICAgICAgICBpZiAodGhpcy5uYW1lKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5hcHBlbmQodGhpcy5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG4gICAgZ2V0Q2hpbGROb2RlcygpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb250YWlucyhvZmZzZXQsIGluY2x1ZGVSaWdodEJvdW5kID0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIG9mZnNldCA+PSB0aGlzLnN0YXJ0ICYmIG9mZnNldCA8IHRoaXMuZW5kIHx8IGluY2x1ZGVSaWdodEJvdW5kICYmIG9mZnNldCA9PT0gdGhpcy5lbmQ7XG4gICAgfVxuICAgIHZpc2l0KHZpc2l0b3IpIHtcbiAgICAgICAgcmV0dXJuIHZpc2l0b3IodGhpcyk7XG4gICAgfVxuICAgIGdldE5vZGVGcm9tT2Zmc2V0KG9mZnNldCkge1xuICAgICAgICB2YXIgZmluZE5vZGUgPSAobm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKG9mZnNldCA+PSBub2RlLnN0YXJ0ICYmIG9mZnNldCA8IG5vZGUuZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5nZXRDaGlsZE5vZGVzKCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGggJiYgY2hpbGRyZW5baV0uc3RhcnQgPD0gb2Zmc2V0OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBmaW5kTm9kZShjaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZmluZE5vZGUodGhpcyk7XG4gICAgfVxuICAgIGdldE5vZGVGcm9tT2Zmc2V0RW5kSW5jbHVzaXZlKG9mZnNldCkge1xuICAgICAgICB2YXIgZmluZE5vZGUgPSAobm9kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKG9mZnNldCA+PSBub2RlLnN0YXJ0ICYmIG9mZnNldCA8PSBub2RlLmVuZCkge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuZ2V0Q2hpbGROb2RlcygpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoICYmIGNoaWxkcmVuW2ldLnN0YXJ0IDw9IG9mZnNldDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gZmluZE5vZGUoY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZpbmROb2RlKHRoaXMpO1xuICAgIH1cbiAgICB2YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0ID0gLTEpIHtcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS50eXBlKSkge1xuICAgICAgICAgICAgaWYgKF8uaW5jbHVkZXMoc2NoZW1hLnR5cGUsIHRoaXMudHlwZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc2NoZW1hLmVycm9yTWVzc2FnZSB8fCBgSW5jb3JyZWN0IHR5cGUuIEV4cGVjdGVkIG9uZSBvZiAke3NjaGVtYS50eXBlLmpvaW4oKX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NoZW1hLnR5cGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgIT09IHNjaGVtYS50eXBlKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc2NoZW1hLmVycm9yTWVzc2FnZSB8fCBgSW5jb3JyZWN0IHR5cGUuIEV4cGVjdGVkIFwiJHtzY2hlbWEudHlwZX1cImBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgICAgICAgICBzY2hlbWEuYWxsT2YuZm9yRWFjaCgoc3ViU2NoZW1hKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0ZShzdWJTY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWEubm90KSB7XG4gICAgICAgICAgICB2YXIgc3ViVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICB2YXIgc3ViTWF0Y2hpbmdTY2hlbWFzID0gW107XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHNjaGVtYS5ub3QsIHN1YlZhbGlkYXRpb25SZXN1bHQsIHN1Yk1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgICAgIGlmICghc3ViVmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBNYXRjaGVzIGEgc2NoZW1hIHRoYXQgaXMgbm90IGFsbG93ZWQuYFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoaW5nU2NoZW1hcykge1xuICAgICAgICAgICAgICAgIHN1Yk1hdGNoaW5nU2NoZW1hcy5mb3JFYWNoKChtcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtcy5pbnZlcnRlZCA9ICFtcy5pbnZlcnRlZDtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLnB1c2gobXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciB0ZXN0QWx0ZXJuYXRpdmVzID0gKGFsdGVybmF0aXZlcywgbWF4T25lTWF0Y2gpID0+IHtcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gW107XG4gICAgICAgICAgICB2YXIgYmVzdE1hdGNoID0gbnVsbDtcbiAgICAgICAgICAgIGFsdGVybmF0aXZlcy5mb3JFYWNoKChzdWJTY2hlbWEpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgc3ViVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHN1Yk1hdGNoaW5nU2NoZW1hcyA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdGUoc3ViU2NoZW1hLCBzdWJWYWxpZGF0aW9uUmVzdWx0LCBzdWJNYXRjaGluZ1NjaGVtYXMpO1xuICAgICAgICAgICAgICAgIGlmICghc3ViVmFsaWRhdGlvblJlc3VsdC5oYXNFcnJvcnMoKSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2goc3ViU2NoZW1hKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFiZXN0TWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgYmVzdE1hdGNoID0geyBzY2hlbWE6IHN1YlNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdDogc3ViVmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzOiBzdWJNYXRjaGluZ1NjaGVtYXMgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbWF4T25lTWF0Y2ggJiYgIXN1YlZhbGlkYXRpb25SZXN1bHQuaGFzRXJyb3JzKCkgJiYgIWJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2gubWF0Y2hpbmdTY2hlbWFzLnB1c2guYXBwbHkoYmVzdE1hdGNoLm1hdGNoaW5nU2NoZW1hcywgc3ViTWF0Y2hpbmdTY2hlbWFzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNNYXRjaGVzICs9IHN1YlZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc01hdGNoZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9IHN1YlZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb21wYXJlUmVzdWx0ID0gc3ViVmFsaWRhdGlvblJlc3VsdC5jb21wYXJlKGJlc3RNYXRjaC52YWxpZGF0aW9uUmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXJlUmVzdWx0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaCA9IHsgc2NoZW1hOiBzdWJTY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQ6IHN1YlZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hczogc3ViTWF0Y2hpbmdTY2hlbWFzIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb21wYXJlUmVzdWx0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVzdE1hdGNoLm1hdGNoaW5nU2NoZW1hcy5wdXNoLmFwcGx5KGJlc3RNYXRjaC5tYXRjaGluZ1NjaGVtYXMsIHN1Yk1hdGNoaW5nU2NoZW1hcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA+IDEgJiYgbWF4T25lTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLnN0YXJ0ICsgMSB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTWF0Y2hlcyBtdWx0aXBsZSBzY2hlbWFzIHdoZW4gb25seSBvbmUgbXVzdCB2YWxpZGF0ZS5gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYmVzdE1hdGNoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZShiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdCk7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcyArPSBiZXN0TWF0Y2gudmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcztcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMgKz0gYmVzdE1hdGNoLnZhbGlkYXRpb25SZXN1bHQucHJvcGVydGllc1ZhbHVlTWF0Y2hlcztcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdTY2hlbWFzKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nU2NoZW1hcy5wdXNoLmFwcGx5KG1hdGNoaW5nU2NoZW1hcywgYmVzdE1hdGNoLm1hdGNoaW5nU2NoZW1hcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXMubGVuZ3RoO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgICAgICAgICB0ZXN0QWx0ZXJuYXRpdmVzKHNjaGVtYS5hbnlPZiwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5vbmVPZikpIHtcbiAgICAgICAgICAgIHRlc3RBbHRlcm5hdGl2ZXMoc2NoZW1hLm9uZU9mLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuZW51bSkpIHtcbiAgICAgICAgICAgIGlmIChfLmluY2x1ZGVzKHNjaGVtYS5lbnVtLCB0aGlzLmdldFZhbHVlKCkpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBub3QgYW4gYWNjZXB0ZWQgdmFsdWUuIFZhbGlkIHZhbHVlczogJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuZW51bSl9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5lbnVtVmFsdWVNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoaW5nU2NoZW1hcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbWF0Y2hpbmdTY2hlbWFzLnB1c2goeyBub2RlOiB0aGlzLCBzY2hlbWE6IHNjaGVtYSB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBOdWxsQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgbmFtZSwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdXBlcihwYXJlbnQsICdudWxsJywgbmFtZSwgc3RhcnQsIGVuZCk7XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgQm9vbGVhbkFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIG5hbWUsIHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gICAgICAgIHN1cGVyKHBhcmVudCwgJ2Jvb2xlYW4nLCBuYW1lLCBzdGFydCwgZW5kKTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEFycmF5QVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgbmFtZSwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdXBlcihwYXJlbnQsICdhcnJheScsIG5hbWUsIHN0YXJ0LCBlbmQpO1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgfVxuICAgIGdldENoaWxkTm9kZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKCh2KSA9PiB2LmdldFZhbHVlKCkpO1xuICAgIH1cbiAgICBhZGRJdGVtKGl0ZW0pIHtcbiAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmlzaXQodmlzaXRvcikge1xuICAgICAgICB2YXIgY3RuID0gdmlzaXRvcih0aGlzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aCAmJiBjdG47IGkrKykge1xuICAgICAgICAgICAgY3RuID0gdGhpcy5pdGVtc1tpXS52aXNpdCh2aXNpdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3RuO1xuICAgIH1cbiAgICB2YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0ID0gLTEpIHtcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XG4gICAgICAgICAgICB2YXIgc3ViU2NoZW1hcyA9IHNjaGVtYS5pdGVtcztcbiAgICAgICAgICAgIHN1YlNjaGVtYXMuZm9yRWFjaCgoc3ViU2NoZW1hLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLml0ZW1zW2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnZhbGlkYXRlKHN1YlNjaGVtYSwgaXRlbVZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2goaXRlbVZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLml0ZW1zLmxlbmd0aCA+PSBzdWJTY2hlbWFzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChzY2hlbWEuYWRkaXRpb25hbEl0ZW1zID09PSBmYWxzZSAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IHN1YlNjaGVtYXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEFycmF5IGhhcyB0b28gbWFueSBpdGVtcyBhY2NvcmRpbmcgdG8gc2NoZW1hLiBFeHBlY3RlZCAke3N1YlNjaGVtYXMubGVuZ3RofSBvciBmZXdlcmBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaXRlbXMubGVuZ3RoID49IHN1YlNjaGVtYXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzICs9ICh0aGlzLml0ZW1zLmxlbmd0aCAtIHN1YlNjaGVtYXMubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEuaXRlbXMpIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtVmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgaXRlbS52YWxpZGF0ZShzY2hlbWEuaXRlbXMsIGl0ZW1WYWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2goaXRlbVZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS5taW5JdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA8IHNjaGVtYS5taW5JdGVtcykge1xuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgdG9vIGZldyBpdGVtcy4gRXhwZWN0ZWQgJHtzY2hlbWEubWluSXRlbXN9IG9yIG1vcmVgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLm1heEl0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gc2NoZW1hLm1heEl0ZW1zKSB7XG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEFycmF5IGhhcyB0b28gbWFueSBpdGVtcy4gRXhwZWN0ZWQgJHtzY2hlbWEubWluSXRlbXN9IG9yIGZld2VyYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVJdGVtcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMuaXRlbXMubWFwKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuZ2V0VmFsdWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGR1cGxpY2F0ZXMgPSB2YWx1ZXMuc29tZSgodmFsdWUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ICE9PSB2YWx1ZXMubGFzdEluZGV4T2YodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZHVwbGljYXRlcykge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBBcnJheSBoYXMgZHVwbGljYXRlIGl0ZW1zYFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIE51bWJlckFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIG5hbWUsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgc3VwZXIocGFyZW50LCAnbnVtYmVyJywgbmFtZSwgc3RhcnQsIGVuZCk7XG4gICAgICAgIHRoaXMuaXNJbnRlZ2VyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IE51bWJlci5OYU47XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCA9IC0xKSB7XG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdHlwZUlzSW50ZWdlciA9IGZhbHNlO1xuICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICdpbnRlZ2VyJyB8fCAoQXJyYXkuaXNBcnJheShzY2hlbWEudHlwZSkgJiYgXy5pbmNsdWRlcyhzY2hlbWEudHlwZSwgJ2ludGVnZXInKSkpIHtcbiAgICAgICAgICAgIHR5cGVJc0ludGVnZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlSXNJbnRlZ2VyICYmIHRoaXMuaXNJbnRlZ2VyID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnaW50ZWdlcic7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgIHRoaXMudHlwZSA9ICdudW1iZXInO1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgICBpZiAoXy5pc051bWJlcihzY2hlbWEubXVsdGlwbGVPZikpIHtcbiAgICAgICAgICAgIGlmICh2YWwgJSBzY2hlbWEubXVsdGlwbGVPZiAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBub3QgZGl2aXNpYmxlIGJ5ICR7c2NoZW1hLm11bHRpcGxlT2Z9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChzY2hlbWEubWluaW11bSkpIHtcbiAgICAgICAgICAgIGlmIChzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAmJiB2YWwgPD0gc2NoZW1hLm1pbmltdW0pIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsdWUgaXMgYmVsb3cgdGhlIGV4Y2x1c2l2ZSBtaW5pbXVtIG9mICR7c2NoZW1hLm1pbmltdW19YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzY2hlbWEuZXhjbHVzaXZlTWluaW11bSAmJiB2YWwgPCBzY2hlbWEubWluaW11bSkge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBWYWx1ZSBpcyBiZWxvdyB0aGUgbWluaW11bSBvZiAke3NjaGVtYS5taW5pbXVtfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQoc2NoZW1hLm1heGltdW0pKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gJiYgdmFsID49IHNjaGVtYS5tYXhpbXVtKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFZhbHVlIGlzIGFib3ZlIHRoZSBleGNsdXNpdmUgbWF4aW11bSBvZiAke3NjaGVtYS5tYXhpbXVtfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gJiYgdmFsID4gc2NoZW1hLm1heGltdW0pIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsdWUgaXMgYWJvdmUgdGhlIG1heGltdW0gb2YgJHtzY2hlbWEubWF4aW11bX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY2xhc3MgU3RyaW5nQVNUTm9kZSBleHRlbmRzIEFTVE5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHBhcmVudCwgbmFtZSwgaXNLZXksIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgc3VwZXIocGFyZW50LCAnc3RyaW5nJywgbmFtZSwgc3RhcnQsIGVuZCk7XG4gICAgICAgIHRoaXMuaXNLZXkgPSBpc0tleTtcbiAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xuICAgIH1cbiAgICBnZXRWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICAgIHZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQgPSAtMSkge1xuICAgICAgICBpZiAob2Zmc2V0ICE9PSAtMSAmJiAhdGhpcy5jb250YWlucyhvZmZzZXQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIudmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgIGlmIChzY2hlbWEubWluTGVuZ3RoICYmIHRoaXMudmFsdWUubGVuZ3RoIDwgc2NoZW1hLm1pbkxlbmd0aCkge1xuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogdGhpcy5zdGFydCwgZW5kOiB0aGlzLmVuZCB9LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTdHJpbmcgaXMgc2hvcnRlciB0aGFuIHRoZSBtaW5pbXVtIGxlbmd0aCBvZiAke3NjaGVtYS5taW5MZW5ndGh9YFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYS5tYXhMZW5ndGggJiYgdGhpcy52YWx1ZS5sZW5ndGggPiBzY2hlbWEubWF4TGVuZ3RoKSB7XG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzLnB1c2goe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYFN0cmluZyBpcyBzaG9ydGVyIHRoYW4gdGhlIG1heGltdW0gbGVuZ3RoIG9mICR7c2NoZW1hLm1heExlbmd0aH1gXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NoZW1hLnBhdHRlcm4pIHtcbiAgICAgICAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc2NoZW1hLnBhdHRlcm4pO1xuICAgICAgICAgICAgaWYgKCFyZWdleC50ZXN0KHRoaXMudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5lbmQgfSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc2NoZW1hLmVycm9yTWVzc2FnZSB8fCBgU3RyaW5nIGRvZXMgbm90IG1hdGNoIHRoZSBwYXR0ZXJuIG9mIFwiJHtzY2hlbWEucGF0dGVybn1cImBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eUFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIGtleSkge1xuICAgICAgICBzdXBlcihwYXJlbnQsICdwcm9wZXJ0eScsIG51bGwsIGtleS5zdGFydCk7XG4gICAgICAgIHRoaXMua2V5ID0ga2V5O1xuICAgICAgICBrZXkucGFyZW50ID0gdGhpcztcbiAgICAgICAga2V5Lm5hbWUgPSBrZXkudmFsdWU7XG4gICAgICAgIHRoaXMuY29sb25PZmZzZXQgPSAtMTtcbiAgICB9XG4gICAgZ2V0Q2hpbGROb2RlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPyBbdGhpcy5rZXksIHRoaXMudmFsdWVdIDogW3RoaXMua2V5XTtcbiAgICB9XG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IG51bGw7XG4gICAgfVxuICAgIHZpc2l0KHZpc2l0b3IpIHtcbiAgICAgICAgcmV0dXJuIHZpc2l0b3IodGhpcykgJiYgdGhpcy5rZXkudmlzaXQodmlzaXRvcikgJiYgdGhpcy52YWx1ZSAmJiB0aGlzLnZhbHVlLnZpc2l0KHZpc2l0b3IpO1xuICAgIH1cbiAgICB2YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0ID0gLTEpIHtcbiAgICAgICAgaWYgKG9mZnNldCAhPT0gLTEgJiYgIXRoaXMuY29udGFpbnMob2Zmc2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlLnZhbGlkYXRlKHNjaGVtYSwgdmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIE9iamVjdEFTVE5vZGUgZXh0ZW5kcyBBU1ROb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihwYXJlbnQsIG5hbWUsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgc3VwZXIocGFyZW50LCAnb2JqZWN0JywgbmFtZSwgc3RhcnQsIGVuZCk7XG4gICAgICAgIHRoaXMucHJvcGVydGllcyA9IFtdO1xuICAgIH1cbiAgICBnZXRDaGlsZE5vZGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzO1xuICAgIH1cbiAgICBhZGRQcm9wZXJ0eShub2RlKSB7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvcGVydGllcy5wdXNoKG5vZGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZ2V0Rmlyc3RQcm9wZXJ0eShrZXkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BlcnRpZXNbaV0ua2V5LnZhbHVlID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBnZXRLZXlMaXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzLm1hcCgocCkgPT4gcC5rZXkuZ2V0VmFsdWUoKSk7XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSB7fTtcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmZvckVhY2goKHApID0+IHtcbiAgICAgICAgICAgIHZhciB2ID0gcC52YWx1ZSAmJiBwLnZhbHVlLmdldFZhbHVlKCk7XG4gICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgIHZhbHVlW3Aua2V5LmdldFZhbHVlKCldID0gdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgdmlzaXQodmlzaXRvcikge1xuICAgICAgICB2YXIgY3RuID0gdmlzaXRvcih0aGlzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BlcnRpZXMubGVuZ3RoICYmIGN0bjsgaSsrKSB7XG4gICAgICAgICAgICBjdG4gPSB0aGlzLnByb3BlcnRpZXNbaV0udmlzaXQodmlzaXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN0bjtcbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCB2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCA9IC0xKSB7XG4gICAgICAgIGlmIChvZmZzZXQgIT09IC0xICYmICF0aGlzLmNvbnRhaW5zKG9mZnNldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci52YWxpZGF0ZShzY2hlbWEsIHZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgdmFyIHNlZW5LZXlzID0ge307XG4gICAgICAgIHZhciB1bnByb2Nlc3NlZFByb3BlcnRpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBub2RlLmtleS52YWx1ZTtcbiAgICAgICAgICAgIHNlZW5LZXlzW2tleV0gPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkpIHtcbiAgICAgICAgICAgIHNjaGVtYS5yZXF1aXJlZC5mb3JFYWNoKChwcm9wZXJ0eU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXNlZW5LZXlzW3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50LmtleTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0ga2V5ID8geyBzdGFydDoga2V5LnN0YXJ0LCBlbmQ6IGtleS5lbmQgfSA6IHsgc3RhcnQ6IHRoaXMuc3RhcnQsIGVuZDogdGhpcy5zdGFydCArIDEgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBNaXNzaW5nIHByb3BlcnR5IFwiJHtwcm9wZXJ0eU5hbWV9XCJgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcm9wZXJ0eVByb2Nlc3NlZCA9IChwcm9wKSA9PiB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB1bnByb2Nlc3NlZFByb3BlcnRpZXMuaW5kZXhPZihwcm9wKTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgaW5kZXggPSB1bnByb2Nlc3NlZFByb3BlcnRpZXMuaW5kZXhPZihwcm9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEucHJvcGVydGllcykuZm9yRWFjaCgocHJvcGVydHlOYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlQcm9jZXNzZWQocHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcCA9IHNjaGVtYS5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gc2VlbktleXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLnZhbGlkYXRlKHByb3AsIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWEucGF0dGVyblByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykuZm9yRWFjaCgocHJvcGVydHlQYXR0ZXJuKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChwcm9wZXJ0eVBhdHRlcm4pO1xuICAgICAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5zbGljZSgwKS5mb3JFYWNoKChwcm9wZXJ0eU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QocHJvcGVydHlOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQcm9jZXNzZWQocHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC52YWxpZGF0ZShzY2hlbWEucGF0dGVyblByb3BlcnRpZXNbcHJvcGVydHlQYXR0ZXJuXSwgcHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0LCBtYXRjaGluZ1NjaGVtYXMsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2gocHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKSkge1xuICAgICAgICAgICAgdW5wcm9jZXNzZWRQcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5TmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IHNlZW5LZXlzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICAgICAgICAgICAgICBjaGlsZC52YWxpZGF0ZShzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMsIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0Lm1lcmdlUHJvcGVydHlNYXRjaChwcm9wZXJ0eXZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmICh1bnByb2Nlc3NlZFByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHVucHJvY2Vzc2VkUHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eU5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gc2VlbktleXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlOb2RlID0gY2hpbGQucGFyZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBzdGFydDogcHJvcGVydHlOb2RlLmtleS5zdGFydCwgZW5kOiBwcm9wZXJ0eU5vZGUua2V5LmVuZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcm9wZXJ0eSAke3Byb3BlcnR5TmFtZX0gaXMgbm90IGFsbG93ZWRgXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWEubWF4UHJvcGVydGllcykge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5sZW5ndGggPiBzY2hlbWEubWF4UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBPYmplY3QgaGFzIG1vcmUgcHJvcGVydGllcyB0aGFuIGxpbWl0IG9mICR7c2NoZW1hLm1heFByb3BlcnRpZXN9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzY2hlbWEubWluUHJvcGVydGllcykge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5sZW5ndGggPCBzY2hlbWEubWluUHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHQud2FybmluZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBPYmplY3QgaGFzIGZld2VyIHByb3BlcnRpZXMgdGhhbiB0aGUgcmVxdWlyZWQgbnVtYmVyIG9mICR7c2NoZW1hLm1pblByb3BlcnRpZXN9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHNjaGVtYS5kZXBlbmRlbmNpZXMpKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEuZGVwZW5kZW5jaWVzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcCA9IHNlZW5LZXlzW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmRlcGVuZGVuY2llc1trZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlQXNBcnJheSA9IHNjaGVtYS5kZXBlbmRlbmNpZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlQXNBcnJheS5mb3JFYWNoKChyZXF1aXJlZFByb3ApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNlZW5LZXlzW3JlcXVpcmVkUHJvcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHN0YXJ0OiB0aGlzLnN0YXJ0LCBlbmQ6IHRoaXMuZW5kIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgT2JqZWN0IGlzIG1pc3NpbmcgcHJvcGVydHkgJHtyZXF1aXJlZFByb3B9IHJlcXVpcmVkIGJ5IHByb3BlcnR5ICR7a2V5fWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0LnByb3BlcnRpZXNWYWx1ZU1hdGNoZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChfLmlzT2JqZWN0KHNjaGVtYS5kZXBlbmRlbmNpZXNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZUFzU2NoZW1hID0gc2NoZW1hLmRlcGVuZGVuY2llc1trZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRlKHZhbHVlQXNTY2hlbWEsIHByb3BlcnR5dmFsaWRhdGlvblJlc3VsdCwgbWF0Y2hpbmdTY2hlbWFzLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdC5tZXJnZVByb3BlcnR5TWF0Y2gocHJvcGVydHl2YWxpZGF0aW9uUmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEpTT05Eb2N1bWVudENvbmZpZyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaWdub3JlRGFuZ2xpbmdDb21tYSA9IGZhbHNlO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXTtcbiAgICAgICAgdGhpcy53YXJuaW5ncyA9IFtdO1xuICAgICAgICB0aGlzLnByb3BlcnRpZXNNYXRjaGVzID0gMDtcbiAgICAgICAgdGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzID0gMDtcbiAgICAgICAgdGhpcy5lbnVtVmFsdWVNYXRjaCA9IGZhbHNlO1xuICAgIH1cbiAgICBoYXNFcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuZXJyb3JzLmxlbmd0aCB8fCAhIXRoaXMud2FybmluZ3MubGVuZ3RoO1xuICAgIH1cbiAgICBtZXJnZUFsbCh2YWxpZGF0aW9uUmVzdWx0cykge1xuICAgICAgICB2YWxpZGF0aW9uUmVzdWx0cy5mb3JFYWNoKCh2YWxpZGF0aW9uUmVzdWx0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lcmdlKHZhbGlkYXRpb25SZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbWVyZ2UodmFsaWRhdGlvblJlc3VsdCkge1xuICAgICAgICB0aGlzLmVycm9ycyA9IHRoaXMuZXJyb3JzLmNvbmNhdCh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycyk7XG4gICAgICAgIHRoaXMud2FybmluZ3MgPSB0aGlzLndhcm5pbmdzLmNvbmNhdCh2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzKTtcbiAgICB9XG4gICAgbWVyZ2VQcm9wZXJ0eU1hdGNoKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdCkge1xuICAgICAgICB0aGlzLm1lcmdlKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdCk7XG4gICAgICAgIHRoaXMucHJvcGVydGllc01hdGNoZXMrKztcbiAgICAgICAgaWYgKHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5lbnVtVmFsdWVNYXRjaCB8fCAhcHJvcGVydHlWYWxpZGF0aW9uUmVzdWx0Lmhhc0Vycm9ycygpICYmIHByb3BlcnR5VmFsaWRhdGlvblJlc3VsdC5wcm9wZXJ0aWVzTWF0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzVmFsdWVNYXRjaGVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29tcGFyZShvdGhlcikge1xuICAgICAgICB2YXIgaGFzRXJyb3JzID0gdGhpcy5oYXNFcnJvcnMoKTtcbiAgICAgICAgaWYgKGhhc0Vycm9ycyAhPT0gb3RoZXIuaGFzRXJyb3JzKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBoYXNFcnJvcnMgPyAtMSA6IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZW51bVZhbHVlTWF0Y2ggIT09IG90aGVyLmVudW1WYWx1ZU1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIuZW51bVZhbHVlTWF0Y2ggPyAtMSA6IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyAhPT0gb3RoZXIucHJvcGVydGllc1ZhbHVlTWF0Y2hlcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc1ZhbHVlTWF0Y2hlcyAtIG90aGVyLnByb3BlcnRpZXNWYWx1ZU1hdGNoZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllc01hdGNoZXMgLSBvdGhlci5wcm9wZXJ0aWVzTWF0Y2hlcztcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgSlNPTkRvY3VtZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdCA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgfVxuICAgIGdldCBlcnJvcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xuICAgIH1cbiAgICBnZXQgd2FybmluZ3MoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRpb25SZXN1bHQud2FybmluZ3M7XG4gICAgfVxuICAgIGdldE5vZGVGcm9tT2Zmc2V0KG9mZnNldCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290ICYmIHRoaXMucm9vdC5nZXROb2RlRnJvbU9mZnNldChvZmZzZXQpO1xuICAgIH1cbiAgICBnZXROb2RlRnJvbU9mZnNldEVuZEluY2x1c2l2ZShvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuZ2V0Tm9kZUZyb21PZmZzZXRFbmRJbmNsdXNpdmUob2Zmc2V0KTtcbiAgICB9XG4gICAgdmlzaXQodmlzaXRvcikge1xuICAgICAgICBpZiAodGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QudmlzaXQodmlzaXRvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFsaWRhdGUoc2NoZW1hLCBtYXRjaGluZ1NjaGVtYXMgPSBudWxsLCBvZmZzZXQgPSAtMSkge1xuICAgICAgICBpZiAodGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QudmFsaWRhdGUoc2NoZW1hLCB0aGlzLnZhbGlkYXRpb25SZXN1bHQsIG1hdGNoaW5nU2NoZW1hcywgb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBKU09OUGFyc2VyIHtcbiAgICBwYXJzZSh0ZXh0LCBjb25maWcgPSBuZXcgSlNPTkRvY3VtZW50Q29uZmlnKCkpIHtcbiAgICAgICAgdmFyIF9kb2MgPSBuZXcgSlNPTkRvY3VtZW50KGNvbmZpZyk7XG4gICAgICAgIHZhciBfc2Nhbm5lciA9IEpzb24uY3JlYXRlU2Nhbm5lcih0ZXh0LCB0cnVlKTtcbiAgICAgICAgZnVuY3Rpb24gX2FjY2VwdCh0b2tlbikge1xuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IHRva2VuKSB7XG4gICAgICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9lcnJvcihtZXNzYWdlLCBub2RlID0gbnVsbCwgc2tpcFVudGlsQWZ0ZXIgPSBbXSwgc2tpcFVudGlsID0gW10pIHtcbiAgICAgICAgICAgIGlmIChfZG9jLmVycm9ycy5sZW5ndGggPT09IDAgfHwgX2RvYy5lcnJvcnNbMF0ubG9jYXRpb24uc3RhcnQgIT09IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSB7IG1lc3NhZ2U6IG1lc3NhZ2UsIGxvY2F0aW9uOiB7IHN0YXJ0OiBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpLCBlbmQ6IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpIH0gfTtcbiAgICAgICAgICAgICAgICBfZG9jLmVycm9ycy5wdXNoKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgX2ZpbmFsaXplKG5vZGUsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChza2lwVW50aWxBZnRlci5sZW5ndGggKyBza2lwVW50aWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbiA9IF9zY2FubmVyLmdldFRva2VuKCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHRva2VuICE9PSBKc29uLlN5bnRheEtpbmQuRU9GKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChza2lwVW50aWxBZnRlci5pbmRleE9mKHRva2VuKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNraXBVbnRpbC5pbmRleE9mKHRva2VuKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9jaGVja1NjYW5FcnJvcigpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoX3NjYW5uZXIuZ2V0VG9rZW5FcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBKc29uLlNjYW5FcnJvci5JbnZhbGlkVW5pY29kZTpcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBJbnZhbGlkIHVuaWNvZGUgc2VxdWVuY2UgaW4gc3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgSnNvbi5TY2FuRXJyb3IuSW52YWxpZEVzY2FwZUNoYXJhY3RlcjpcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBJbnZhbGlkIGVzY2FwZSBjaGFyYWN0ZXIgaW4gc3RyaW5nYCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgSnNvbi5TY2FuRXJyb3IuVW5leHBlY3RlZEVuZE9mTnVtYmVyOlxuICAgICAgICAgICAgICAgICAgICBfZXJyb3IoYFVuZXhwZWN0ZWQgZW5kIG9mIG51bWJlcmApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZkNvbW1lbnQ6XG4gICAgICAgICAgICAgICAgICAgIF9lcnJvcihgVW5leHBlY3RlZCBlbmQgb2YgY29tbWVudGApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjYXNlIEpzb24uU2NhbkVycm9yLlVuZXhwZWN0ZWRFbmRPZlN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgX2Vycm9yKGBVbmV4cGVjdGVkIGVuZCBvZiBzdHJpbmdgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX2ZpbmFsaXplKG5vZGUsIHNjYW5OZXh0KSB7XG4gICAgICAgICAgICBub2RlLmVuZCA9IF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkgKyBfc2Nhbm5lci5nZXRUb2tlbkxlbmd0aCgpO1xuICAgICAgICAgICAgaWYgKHNjYW5OZXh0KSB7XG4gICAgICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlQXJyYXkocGFyZW50LCBuYW1lKSB7XG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLk9wZW5CcmFja2V0VG9rZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBub2RlID0gbmV3IEFycmF5QVNUTm9kZShwYXJlbnQsIG5hbWUsIF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpO1xuICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgICAgICAgIGlmIChub2RlLmFkZEl0ZW0oX3BhcnNlVmFsdWUobm9kZSwgJycgKyBjb3VudCsrKSkpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoX2FjY2VwdChKc29uLlN5bnRheEtpbmQuQ29tbWFUb2tlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlLmFkZEl0ZW0oX3BhcnNlVmFsdWUobm9kZSwgJycgKyBjb3VudCsrKSkgJiYgIV9kb2MuY29uZmlnLmlnbm9yZURhbmdsaW5nQ29tbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9lcnJvcihgVmFsdWUgZXhwZWN0ZWRgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuQ2xvc2VCcmFja2V0VG9rZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBFeHBlY3RlZCBjb21tYSBvciBjbG9zaW5nIGJyYWNrZXRgLCBub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlUHJvcGVydHkocGFyZW50LCBrZXlzU2Vlbikge1xuICAgICAgICAgICAgdmFyIGtleSA9IF9wYXJzZVN0cmluZyhudWxsLCBudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgPT09IEpzb24uU3ludGF4S2luZC5Vbmtub3duKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IF9zY2FubmVyLmdldFRva2VuVmFsdWUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoKC9eWydcXHddLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9lcnJvcihgUHJvcGVydHkga2V5cyBtdXN0IGJlIGRvdWJsZXF1b3RlZGApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgUHJvcGVydHlBU1ROb2RlKHBhcmVudCwga2V5KTtcbiAgICAgICAgICAgIGlmIChrZXlzU2VlbltrZXkudmFsdWVdKSB7XG4gICAgICAgICAgICAgICAgX2RvYy53YXJuaW5ncy5wdXNoKHsgbG9jYXRpb246IHsgc3RhcnQ6IG5vZGUua2V5LnN0YXJ0LCBlbmQ6IG5vZGUua2V5LmVuZCB9LCBtZXNzYWdlOiBgRHVwbGljYXRlIG9iamVjdCBrZXlgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2V5c1NlZW5ba2V5LnZhbHVlXSA9IHRydWU7XG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSA9PT0gSnNvbi5TeW50YXhLaW5kLkNvbG9uVG9rZW4pIHtcbiAgICAgICAgICAgICAgICBub2RlLmNvbG9uT2Zmc2V0ID0gX3NjYW5uZXIuZ2V0VG9rZW5PZmZzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYENvbG9uIGV4cGVjdGVkYCwgbm9kZSwgW10sIFtKc29uLlN5bnRheEtpbmQuQ2xvc2VCcmFjZVRva2VuLCBKc29uLlN5bnRheEtpbmQuQ29tbWFUb2tlbl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgaWYgKCFub2RlLnNldFZhbHVlKF9wYXJzZVZhbHVlKG5vZGUsIGtleS52YWx1ZSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9lcnJvcihgVmFsdWUgZXhwZWN0ZWRgLCBub2RlLCBbXSwgW0pzb24uU3ludGF4S2luZC5DbG9zZUJyYWNlVG9rZW4sIEpzb24uU3ludGF4S2luZC5Db21tYVRva2VuXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlLmVuZCA9IG5vZGUudmFsdWUuZW5kO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlT2JqZWN0KHBhcmVudCwgbmFtZSkge1xuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IEpzb24uU3ludGF4S2luZC5PcGVuQnJhY2VUb2tlbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgT2JqZWN0QVNUTm9kZShwYXJlbnQsIG5hbWUsIF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpO1xuICAgICAgICAgICAgX3NjYW5uZXIuc2NhbigpO1xuICAgICAgICAgICAgdmFyIGtleXNTZWVuID0ge307XG4gICAgICAgICAgICBpZiAobm9kZS5hZGRQcm9wZXJ0eShfcGFyc2VQcm9wZXJ0eShub2RlLCBrZXlzU2VlbikpKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKF9hY2NlcHQoSnNvbi5TeW50YXhLaW5kLkNvbW1hVG9rZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbm9kZS5hZGRQcm9wZXJ0eShfcGFyc2VQcm9wZXJ0eShub2RlLCBrZXlzU2VlbikpICYmICFfZG9jLmNvbmZpZy5pZ25vcmVEYW5nbGluZ0NvbW1hKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZXJyb3IoYFByb3BlcnR5IGV4cGVjdGVkYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoX3NjYW5uZXIuZ2V0VG9rZW4oKSAhPT0gSnNvbi5TeW50YXhLaW5kLkNsb3NlQnJhY2VUb2tlbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYEV4cGVjdGVkIGNvbW1hIG9yIGNsb3NpbmcgYnJhY2VgLCBub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlU3RyaW5nKHBhcmVudCwgbmFtZSwgaXNLZXkpIHtcbiAgICAgICAgICAgIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgU3RyaW5nQVNUTm9kZShwYXJlbnQsIG5hbWUsIGlzS2V5LCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBfc2Nhbm5lci5nZXRUb2tlblZhbHVlKCk7XG4gICAgICAgICAgICBfY2hlY2tTY2FuRXJyb3IoKTtcbiAgICAgICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlTnVtYmVyKHBhcmVudCwgbmFtZSkge1xuICAgICAgICAgICAgaWYgKF9zY2FubmVyLmdldFRva2VuKCkgIT09IEpzb24uU3ludGF4S2luZC5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgTnVtYmVyQVNUTm9kZShwYXJlbnQsIG5hbWUsIF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpO1xuICAgICAgICAgICAgaWYgKCFfY2hlY2tTY2FuRXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlblZhbHVlID0gX3NjYW5uZXIuZ2V0VG9rZW5WYWx1ZSgpO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBudW1iZXJWYWx1ZSA9IEpTT04ucGFyc2UodG9rZW5WYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbnVtYmVyVmFsdWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2Vycm9yKGBJbnZhbGlkIG51bWJlciBmb3JtYXRgLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBub2RlLnZhbHVlID0gbnVtYmVyVmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfZXJyb3IoYEludmFsaWQgbnVtYmVyIGZvcm1hdGAsIG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlLmlzSW50ZWdlciA9IHRva2VuVmFsdWUuaW5kZXhPZignLicpID09PSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlTGl0ZXJhbChwYXJlbnQsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciBub2RlO1xuICAgICAgICAgICAgc3dpdGNoIChfc2Nhbm5lci5nZXRUb2tlbigpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBKc29uLlN5bnRheEtpbmQuTnVsbEtleXdvcmQ6XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgTnVsbEFTVE5vZGUocGFyZW50LCBuYW1lLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBKc29uLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQ6XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgQm9vbGVhbkFTVE5vZGUocGFyZW50LCBuYW1lLCB0cnVlLCBfc2Nhbm5lci5nZXRUb2tlbk9mZnNldCgpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBKc29uLlN5bnRheEtpbmQuRmFsc2VLZXl3b3JkOlxuICAgICAgICAgICAgICAgICAgICBub2RlID0gbmV3IEJvb2xlYW5BU1ROb2RlKHBhcmVudCwgbmFtZSwgZmFsc2UsIF9zY2FubmVyLmdldFRva2VuT2Zmc2V0KCkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfZmluYWxpemUobm9kZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX3BhcnNlVmFsdWUocGFyZW50LCBuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gX3BhcnNlQXJyYXkocGFyZW50LCBuYW1lKSB8fCBfcGFyc2VPYmplY3QocGFyZW50LCBuYW1lKSB8fCBfcGFyc2VTdHJpbmcocGFyZW50LCBuYW1lLCBmYWxzZSkgfHwgX3BhcnNlTnVtYmVyKHBhcmVudCwgbmFtZSkgfHwgX3BhcnNlTGl0ZXJhbChwYXJlbnQsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIF9zY2FubmVyLnNjYW4oKTtcbiAgICAgICAgX2RvYy5yb290ID0gX3BhcnNlVmFsdWUobnVsbCwgbnVsbCk7XG4gICAgICAgIGlmICghX2RvYy5yb290KSB7XG4gICAgICAgICAgICBfZXJyb3IoYEV4cGVjdGVkIGEgSlNPTiBvYmplY3QsIGFycmF5IG9yIGxpdGVyYWxgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChfc2Nhbm5lci5nZXRUb2tlbigpICE9PSBKc29uLlN5bnRheEtpbmQuRU9GKSB7XG4gICAgICAgICAgICBfZXJyb3IoYEVuZCBvZiBmaWxlIGV4cGVjdGVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9kb2M7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
