'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONSchemaService = exports.ResolvedSchema = exports.UnresolvedSchema = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsoncParser = require('jsonc-parser');

var _jsoncParser2 = _interopRequireDefault(_jsoncParser);

var _requestLight = require('request-light');

var _uri = require('./utils/uri');

var _uri2 = _interopRequireDefault(_uri);

var _strings = require('./utils/strings');

var _strings2 = _interopRequireDefault(_strings);

var _vscodeNls = require('vscode-nls');

var nls = _interopRequireWildcard(_vscodeNls);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var localize = nls.loadMessageBundle();

var FilePatternAssociation = function () {
    function FilePatternAssociation(pattern) {
        _classCallCheck(this, FilePatternAssociation);

        this.combinedSchemaId = 'local://combinedSchema/' + encodeURIComponent(pattern);
        try {
            this.patternRegExp = new RegExp(_strings2.default.convertSimple2RegExpPattern(pattern) + '$');
        } catch (e) {
            this.patternRegExp = null;
        }
        this.schemas = [];
        this.combinedSchema = null;
    }

    _createClass(FilePatternAssociation, [{
        key: 'addSchema',
        value: function addSchema(id) {
            this.schemas.push(id);
            this.combinedSchema = null;
        }
    }, {
        key: 'matchesPattern',
        value: function matchesPattern(fileName) {
            return this.patternRegExp && this.patternRegExp.test(fileName);
        }
    }, {
        key: 'getCombinedSchema',
        value: function getCombinedSchema(service) {
            if (!this.combinedSchema) {
                this.combinedSchema = service.createCombinedSchema(this.combinedSchemaId, this.schemas);
            }
            return this.combinedSchema;
        }
    }]);

    return FilePatternAssociation;
}();

var SchemaHandle = function () {
    function SchemaHandle(service, url, unresolvedSchemaContent) {
        _classCallCheck(this, SchemaHandle);

        this.service = service;
        this.url = url;
        if (unresolvedSchemaContent) {
            this.unresolvedSchema = Promise.resolve(new UnresolvedSchema(unresolvedSchemaContent));
        }
    }

    _createClass(SchemaHandle, [{
        key: 'getUnresolvedSchema',
        value: function getUnresolvedSchema() {
            if (!this.unresolvedSchema) {
                this.unresolvedSchema = this.service.loadSchema(this.url);
            }
            return this.unresolvedSchema;
        }
    }, {
        key: 'getResolvedSchema',
        value: function getResolvedSchema() {
            var _this = this;

            if (!this.resolvedSchema) {
                this.resolvedSchema = this.getUnresolvedSchema().then(function (unresolved) {
                    return _this.service.resolveSchemaContent(unresolved);
                });
            }
            return this.resolvedSchema;
        }
    }, {
        key: 'clearSchema',
        value: function clearSchema() {
            this.resolvedSchema = null;
            this.unresolvedSchema = null;
        }
    }]);

    return SchemaHandle;
}();

var UnresolvedSchema = exports.UnresolvedSchema = function UnresolvedSchema(schema) {
    var errors = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, UnresolvedSchema);

    this.schema = schema;
    this.errors = errors;
};

var ResolvedSchema = exports.ResolvedSchema = function () {
    function ResolvedSchema(schema) {
        var errors = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, ResolvedSchema);

        this.schema = schema;
        this.errors = errors;
    }

    _createClass(ResolvedSchema, [{
        key: 'getSection',
        value: function getSection(path) {
            return this.getSectionRecursive(path, this.schema);
        }
    }, {
        key: 'getSectionRecursive',
        value: function getSectionRecursive(path, schema) {
            var _this2 = this;

            if (!schema || path.length === 0) {
                return schema;
            }
            var next = path.shift();
            if (schema.properties && schema.properties[next]) {
                return this.getSectionRecursive(path, schema.properties[next]);
            } else if (schema.patternProperties) {
                Object.keys(schema.patternProperties).forEach(function (pattern) {
                    var regex = new RegExp(pattern);
                    if (regex.test(next)) {
                        return _this2.getSectionRecursive(path, schema.patternProperties[pattern]);
                    }
                });
            } else if (schema.additionalProperties) {
                return this.getSectionRecursive(path, schema.additionalProperties);
            } else if (next.match('[0-9]+')) {
                if (schema.items) {
                    return this.getSectionRecursive(path, schema.items);
                } else if (Array.isArray(schema.items)) {
                    try {
                        var index = parseInt(next, 10);
                        if (schema.items[index]) {
                            return this.getSectionRecursive(path, schema.items[index]);
                        }
                        return null;
                    } catch (e) {
                        return null;
                    }
                }
            }
            return null;
        }
    }]);

    return ResolvedSchema;
}();

var JSONSchemaService = exports.JSONSchemaService = function () {
    function JSONSchemaService() {
        _classCallCheck(this, JSONSchemaService);

        this.callOnDispose = [];
        this.contributionSchemas = {};
        this.contributionAssociations = {};
        this.schemasById = {};
        this.filePatternAssociations = [];
        this.filePatternAssociationById = {};
    }

    _createClass(JSONSchemaService, [{
        key: 'dispose',
        value: function dispose() {
            while (this.callOnDispose.length > 0) {
                this.callOnDispose.pop()();
            }
        }
    }, {
        key: 'onResourceChange',
        value: function onResourceChange(uri) {
            var schemaFile = this.schemasById[uri];
            if (schemaFile) {
                schemaFile.clearSchema();
                return true;
            }
            return false;
        }
    }, {
        key: 'normalizeId',
        value: function normalizeId(id) {
            if (id.length > 0 && id.charAt(id.length - 1) === '#') {
                return id.substring(0, id.length - 1);
            }
            return id;
        }
    }, {
        key: 'setSchemaContributions',
        value: function setSchemaContributions(schemaContributions) {
            var _this3 = this;

            if (schemaContributions.schemas) {
                var schemas = schemaContributions.schemas;
                for (var id in schemas) {
                    var normalizedId = this.normalizeId(id);
                    this.contributionSchemas[normalizedId] = this.addSchemaHandle(normalizedId, schemas[id]);
                }
            }
            if (schemaContributions.schemaAssociations) {
                var schemaAssociations = schemaContributions.schemaAssociations;
                for (var pattern in schemaAssociations) {
                    var associations = schemaAssociations[pattern];
                    this.contributionAssociations[pattern] = associations;
                    var fpa = this.getOrAddFilePatternAssociation(pattern);
                    associations.forEach(function (schemaId) {
                        var id = _this3.normalizeId(schemaId);
                        fpa.addSchema(id);
                    });
                }
            }
        }
    }, {
        key: 'addSchemaHandle',
        value: function addSchemaHandle(id, unresolvedSchemaContent) {
            var schemaHandle = new SchemaHandle(this, id, unresolvedSchemaContent);
            this.schemasById[id] = schemaHandle;
            return schemaHandle;
        }
    }, {
        key: 'getOrAddSchemaHandle',
        value: function getOrAddSchemaHandle(id, unresolvedSchemaContent) {
            return this.schemasById[id] || this.addSchemaHandle(id, unresolvedSchemaContent);
        }
    }, {
        key: 'getOrAddFilePatternAssociation',
        value: function getOrAddFilePatternAssociation(pattern) {
            var fpa = this.filePatternAssociationById[pattern];
            if (!fpa) {
                fpa = new FilePatternAssociation(pattern);
                this.filePatternAssociationById[pattern] = fpa;
                this.filePatternAssociations.push(fpa);
            }
            return fpa;
        }
    }, {
        key: 'registerExternalSchema',
        value: function registerExternalSchema(uri) {
            var _this4 = this;

            var filePatterns = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            var unresolvedSchemaContent = arguments[2];

            var id = this.normalizeId(uri);
            if (filePatterns) {
                filePatterns.forEach(function (pattern) {
                    _this4.getOrAddFilePatternAssociation(pattern).addSchema(uri);
                });
            }
            return unresolvedSchemaContent ? this.addSchemaHandle(id, unresolvedSchemaContent) : this.getOrAddSchemaHandle(id);
        }
    }, {
        key: 'clearExternalSchemas',
        value: function clearExternalSchemas() {
            var _this5 = this;

            this.schemasById = {};
            this.filePatternAssociations = [];
            this.filePatternAssociationById = {};
            for (var id in this.contributionSchemas) {
                this.schemasById[id] = this.contributionSchemas[id];
            }
            for (var pattern in this.contributionAssociations) {
                var fpa = this.getOrAddFilePatternAssociation(pattern);
                this.contributionAssociations[pattern].forEach(function (schemaId) {
                    var id = _this5.normalizeId(schemaId);
                    fpa.addSchema(id);
                });
            }
        }
    }, {
        key: 'getResolvedSchema',
        value: function getResolvedSchema(schemaId) {
            var id = this.normalizeId(schemaId);
            var schemaHandle = this.schemasById[id];
            if (schemaHandle) {
                return schemaHandle.getResolvedSchema();
            }
            return Promise.resolve(null);
        }
    }, {
        key: 'loadSchema',
        value: function loadSchema(url) {
            return this.requestService({ url: url, followRedirects: 5 }).then(function (request) {
                var content = request.responseText;
                if (!content) {
                    var errorMessage = localize('json.schema.nocontent', 'Unable to load schema from \'{0}\': No content.', toDisplayString(url));
                    return new UnresolvedSchema({}, [errorMessage]);
                }
                var schemaContent = {};
                var jsonErrors = [];
                schemaContent = _jsoncParser2.default.parse(content, jsonErrors);
                var errors = jsonErrors.length ? [localize('json.schema.invalidFormat', 'Unable to parse content from \'{0}\': {1}.', toDisplayString(url), jsonErrors[0])] : [];
                return new UnresolvedSchema(schemaContent, errors);
            }, function (error) {
                var errorMessage = localize('json.schema.unabletoload', 'Unable to load schema from \'{0}\': {1}', toDisplayString(url), error.responseText || (0, _requestLight.getErrorStatusDescription)(error.status) || error.toString());
                return new UnresolvedSchema({}, [errorMessage]);
            });
        }
    }, {
        key: 'resolveSchemaContent',
        value: function resolveSchemaContent(schemaToResolve) {
            var _this6 = this;

            var resolveErrors = schemaToResolve.errors.slice(0);
            var schema = schemaToResolve.schema;
            var findSection = function findSection(schema, path) {
                if (!path) {
                    return schema;
                }
                var current = schema;
                path.substr(1).split('/').some(function (part) {
                    current = current[part];
                    return !current;
                });
                return current;
            };
            var resolveLink = function resolveLink(node, linkedSchema, linkPath) {
                var section = findSection(linkedSchema, linkPath);
                if (section) {
                    for (var key in section) {
                        if (section.hasOwnProperty(key) && !node.hasOwnProperty(key)) {
                            node[key] = section[key];
                        }
                    }
                } else {
                    resolveErrors.push(localize('json.schema.invalidref', '$ref \'{0}\' in {1} can not be resolved.', linkPath, linkedSchema.id));
                }
                delete node.$ref;
            };
            var resolveExternalLink = function resolveExternalLink(node, uri, linkPath) {
                return _this6.getOrAddSchemaHandle(uri).getUnresolvedSchema().then(function (unresolvedSchema) {
                    if (unresolvedSchema.errors.length) {
                        var loc = linkPath ? uri + '#' + linkPath : uri;
                        resolveErrors.push(localize('json.schema.problemloadingref', 'Problems loading reference \'{0}\': {1}', loc, unresolvedSchema.errors[0]));
                    }
                    resolveLink(node, unresolvedSchema.schema, linkPath);
                    return resolveRefs(node, unresolvedSchema.schema);
                });
            };
            var resolveRefs = function resolveRefs(node, parentSchema) {
                var toWalk = [node];
                var seen = [];
                var openPromises = [];
                var collectEntries = function collectEntries() {
                    for (var _len = arguments.length, entries = Array(_len), _key = 0; _key < _len; _key++) {
                        entries[_key] = arguments[_key];
                    }

                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = entries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var entry = _step.value;

                            if ((typeof entry === 'undefined' ? 'undefined' : _typeof(entry)) === 'object') {
                                toWalk.push(entry);
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
                };
                var collectMapEntries = function collectMapEntries() {
                    for (var _len2 = arguments.length, maps = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                        maps[_key2] = arguments[_key2];
                    }

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = maps[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var map = _step2.value;

                            if ((typeof map === 'undefined' ? 'undefined' : _typeof(map)) === 'object') {
                                for (var key in map) {
                                    var entry = map[key];
                                    toWalk.push(entry);
                                }
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
                };
                var collectArrayEntries = function collectArrayEntries() {
                    for (var _len3 = arguments.length, arrays = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                        arrays[_key3] = arguments[_key3];
                    }

                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = arrays[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var array = _step3.value;

                            if (Array.isArray(array)) {
                                toWalk.push.apply(toWalk, array);
                            }
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
                };
                while (toWalk.length) {
                    var next = toWalk.pop();
                    if (seen.indexOf(next) >= 0) {
                        continue;
                    }
                    seen.push(next);
                    if (next.$ref) {
                        var segments = next.$ref.split('#', 2);
                        if (segments[0].length > 0) {
                            openPromises.push(resolveExternalLink(next, segments[0], segments[1]));
                            continue;
                        } else {
                            resolveLink(next, parentSchema, segments[1]);
                        }
                    }
                    collectEntries(next.items, next.additionalProperties, next.not);
                    collectMapEntries(next.definitions, next.properties, next.patternProperties, next.dependencies);
                    collectArrayEntries(next.anyOf, next.allOf, next.oneOf, next.items);
                }
                return Promise.all(openPromises);
            };
            return resolveRefs(schema, schema).then(function (_) {
                return new ResolvedSchema(schema, resolveErrors);
            });
        }
    }, {
        key: 'getSchemaForResource',
        value: function getSchemaForResource(resource, document) {
            if (document && document.root && document.root.type === 'object') {
                var schemaProperties = document.root.properties.filter(function (p) {
                    return p.key.value === '$schema' && !!p.value;
                });
                if (schemaProperties.length > 0) {
                    var schemeId = schemaProperties[0].value.getValue();
                    if (schemeId) {
                        var id = this.normalizeId(schemeId);
                        return this.getOrAddSchemaHandle(id).getResolvedSchema();
                    }
                }
            }
            for (var i = this.filePatternAssociations.length - 1; i >= 0; i--) {
                var entry = this.filePatternAssociations[i];
                if (entry.matchesPattern(resource)) {
                    return entry.getCombinedSchema(this).getResolvedSchema();
                }
            }
            return Promise.resolve(null);
        }
    }, {
        key: 'createCombinedSchema',
        value: function createCombinedSchema(combinedSchemaId, schemaIds) {
            if (schemaIds.length === 1) {
                return this.getOrAddSchemaHandle(schemaIds[0]);
            } else {
                var combinedSchema = {
                    allOf: schemaIds.map(function (schemaId) {
                        return { $ref: schemaId };
                    })
                };
                return this.addSchemaHandle(combinedSchemaId, combinedSchema);
            }
        }
    }]);

    return JSONSchemaService;
}();

function toDisplayString(url) {
    try {
        var uri = _uri2.default.parse(url);
        if (uri.scheme === 'file') {
            return uri.fsPath;
        }
    } catch (e) {}
    return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvblNjaGVtYVNlcnZpY2UudHMiLCJ2c2NvZGUvcGx1Z2luL2pzb25TY2hlbWFTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7OztBQ0hBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztJRFFZLEc7Ozs7Ozs7O0FBQ1osSUFBTSxXQUFXLElBQUksaUJBQUosRUFBakI7O0lBb0RBLHNCO0FBT0ksb0NBQVksT0FBWixFQUEyQjtBQUFBOztBQUN2QixhQUFLLGdCQUFMLEdBQXdCLDRCQUE0QixtQkFBbUIsT0FBbkIsQ0FBcEQ7QUFDQSxZQUFJO0FBQ0EsaUJBQUssYUFBTCxHQUFxQixJQUFJLE1BQUosQ0FBVyxrQkFBUSwyQkFBUixDQUFvQyxPQUFwQyxJQUErQyxHQUExRCxDQUFyQjtBQUNGLFNBRkYsQ0FFRSxPQUFPLENBQVAsRUFBVTtBQUVSLGlCQUFLLGFBQUwsR0FBcUIsSUFBckI7QUFDSDtBQUNELGFBQUssT0FBTCxHQUFlLEVBQWY7QUFDQSxhQUFLLGNBQUwsR0FBc0IsSUFBdEI7QUFDSDs7OztrQ0FFZ0IsRSxFQUFVO0FBQ3ZCLGlCQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLEVBQWxCO0FBQ0EsaUJBQUssY0FBTCxHQUFzQixJQUF0QjtBQUNIOzs7dUNBRXFCLFEsRUFBZ0I7QUFDbEMsbUJBQU8sS0FBSyxhQUFMLElBQXNCLEtBQUssYUFBTCxDQUFtQixJQUFuQixDQUF3QixRQUF4QixDQUE3QjtBQUNIOzs7MENBRXdCLE8sRUFBMEI7QUFDL0MsZ0JBQUksQ0FBQyxLQUFLLGNBQVYsRUFBMEI7QUFDdEIscUJBQUssY0FBTCxHQUFzQixRQUFRLG9CQUFSLENBQTZCLEtBQUssZ0JBQWxDLEVBQW9ELEtBQUssT0FBekQsQ0FBdEI7QUFDSDtBQUNELG1CQUFPLEtBQUssY0FBWjtBQUNIOzs7Ozs7SUFHTCxZO0FBUUksMEJBQVksT0FBWixFQUF3QyxHQUF4QyxFQUFxRCx1QkFB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dUIsaUJBQWxDO0FBR0EsdUJBQU8sS0FBSyxlQUFMLENBQXFCLGdCQUFyQixFQUF1QyxjQUF2QyxDQUFQO0FBQ0g7QUFDSjs7Ozs7O0FBR0wsU0FBQSxlQUFBLENBQXlCLEdBQXpCLEVBQW9DO0FBQ2hDLFFBQUk7QUFDQSxZQUFJLE1BQU0sY0FBSSxLQUFKLENBQVUsR0FBVixDQUFWO0FBQ0EsWUFBSSxJQUFJLE1BQUosS0FBZSxNQUFuQixFQUEyQjtBQUN2QixtQkFBTyxJQUFJLE1BQVg7QUFDSDtBQUNILEtBTEYsQ0FLRSxPQUFPLENBQVAsRUFBVSxDQUVYO0FBQ0QsV0FBTyxHQUFQO0FBQ0giLCJmaWxlIjoidnNjb2RlL3BsdWdpbi9qc29uU2NoZW1hU2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5pbXBvcnQgSnNvbiBmcm9tICdqc29uYy1wYXJzZXInO1xyXG5pbXBvcnQge0lKU09OU2NoZW1hLCBJSlNPTlNjaGVtYU1hcH0gZnJvbSAnLi9qc29uU2NoZW1hJztcclxuaW1wb3J0IHtYSFJPcHRpb25zLCBYSFJSZXNwb25zZSwgZ2V0RXJyb3JTdGF0dXNEZXNjcmlwdGlvbn0gZnJvbSAncmVxdWVzdC1saWdodCc7XHJcbmltcG9ydCBVUkkgZnJvbSAnLi91dGlscy91cmknO1xyXG5pbXBvcnQgU3RyaW5ncyBmcm9tICcuL3V0aWxzL3N0cmluZ3MnO1xyXG5pbXBvcnQgUGFyc2VyIGZyb20gJy4vanNvblBhcnNlcic7XHJcblxyXG5pbXBvcnQgKiBhcyBubHMgZnJvbSAndnNjb2RlLW5scyc7XHJcbmNvbnN0IGxvY2FsaXplID0gbmxzLmxvYWRNZXNzYWdlQnVuZGxlKCk7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElKU09OU2NoZW1hU2VydmljZSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcnMgYSBzY2hlbWEgZmlsZSBpbiB0aGUgY3VycmVudCB3b3Jrc3BhY2UgdG8gYmUgYXBwbGljYWJsZSB0byBmaWxlcyB0aGF0IG1hdGNoIHRoZSBwYXR0ZXJuXHJcbiAgICAgKi9cclxuICAgIHJlZ2lzdGVyRXh0ZXJuYWxTY2hlbWEodXJpOiBzdHJpbmcsIGZpbGVQYXR0ZXJucz86IHN0cmluZ1tdLCB1bnJlc29sdmVkU2NoZW1hPzogSUpTT05TY2hlbWEpOiBJU2NoZW1hSGFuZGxlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xlYXJzIGFsbCBjYWNoZWQgc2NoZW1hIGZpbGVzXHJcbiAgICAgKi9cclxuICAgIGNsZWFyRXh0ZXJuYWxTY2hlbWFzKCk6IHZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcnMgY29udHJpYnV0ZWQgc2NoZW1hc1xyXG4gICAgICovXHJcbiAgICBzZXRTY2hlbWFDb250cmlidXRpb25zKHNjaGVtYUNvbnRyaWJ1dGlvbnM6IElTY2hlbWFDb250cmlidXRpb25zKTogdm9pZDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIExvb2tzIHVwIHRoZSBhcHByb3ByaWF0ZSBzY2hlbWEgZm9yIHRoZSBnaXZlbiBVUklcclxuICAgICAqL1xyXG4gICAgZ2V0U2NoZW1hRm9yUmVzb3VyY2UocmVzb3VyY2U6IHN0cmluZywgZG9jdW1lbnQ6IFBhcnNlci5KU09ORG9jdW1lbnQpOiBQcm9taXNlPFJlc29sdmVkU2NoZW1hPjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU2NoZW1hQXNzb2NpYXRpb25zIHtcclxuICAgIFtwYXR0ZXJuOiBzdHJpbmddOiBzdHJpbmdbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU2NoZW1hQ29udHJpYnV0aW9ucyB7XHJcbiAgICBzY2hlbWFzPzogeyBbaWQ6IHN0cmluZ106IElKU09OU2NoZW1hIH07XHJcbiAgICBzY2hlbWFBc3NvY2lhdGlvbnM/OiBJU2NoZW1hQXNzb2NpYXRpb25zO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTY2hlbWFIYW5kbGUge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgc2NoZW1hIGlkXHJcbiAgICAgKi9cclxuICAgIHVybDogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHNjaGVtYSBmcm9tIHRoZSBmaWxlLCB3aXRoIHBvdGVudGlhbCAkcmVmIHJlZmVyZW5jZXNcclxuICAgICAqL1xyXG4gICAgZ2V0VW5yZXNvbHZlZFNjaGVtYSgpOiBQcm9taXNlPFVucmVzb2x2ZWRTY2hlbWE+O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHNjaGVtYSBmcm9tIHRoZSBmaWxlLCB3aXRoIHJlZmVyZW5jZXMgcmVzb2x2ZWRcclxuICAgICAqL1xyXG4gICAgZ2V0UmVzb2x2ZWRTY2hlbWEoKTogUHJvbWlzZTxSZXNvbHZlZFNjaGVtYT47XHJcbn1cclxuXHJcblxyXG5jbGFzcyBGaWxlUGF0dGVybkFzc29jaWF0aW9uIHtcclxuXHJcbiAgICBwcml2YXRlIHNjaGVtYXM6IHN0cmluZ1tdO1xyXG4gICAgcHJpdmF0ZSBjb21iaW5lZFNjaGVtYUlkOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIHBhdHRlcm5SZWdFeHA6IFJlZ0V4cDtcclxuICAgIHByaXZhdGUgY29tYmluZWRTY2hlbWE6IElTY2hlbWFIYW5kbGU7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGF0dGVybjogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5jb21iaW5lZFNjaGVtYUlkID0gJ2xvY2FsOi8vY29tYmluZWRTY2hlbWEvJyArIGVuY29kZVVSSUNvbXBvbmVudChwYXR0ZXJuKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLnBhdHRlcm5SZWdFeHAgPSBuZXcgUmVnRXhwKFN0cmluZ3MuY29udmVydFNpbXBsZTJSZWdFeHBQYXR0ZXJuKHBhdHRlcm4pICsgJyQnKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIGludmFsaWQgcGF0dGVyblxyXG4gICAgICAgICAgICB0aGlzLnBhdHRlcm5SZWdFeHAgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNjaGVtYXMgPSBbXTtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2NoZW1hID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkU2NoZW1hKGlkOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLnNjaGVtYXMucHVzaChpZCk7XHJcbiAgICAgICAgdGhpcy5jb21iaW5lZFNjaGVtYSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hdGNoZXNQYXR0ZXJuKGZpbGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXR0ZXJuUmVnRXhwICYmIHRoaXMucGF0dGVyblJlZ0V4cC50ZXN0KGZpbGVOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q29tYmluZWRTY2hlbWEoc2VydmljZTogSlNPTlNjaGVtYVNlcnZpY2UpOiBJU2NoZW1hSGFuZGxlIHtcclxuICAgICAgICBpZiAoIXRoaXMuY29tYmluZWRTY2hlbWEpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21iaW5lZFNjaGVtYSA9IHNlcnZpY2UuY3JlYXRlQ29tYmluZWRTY2hlbWEodGhpcy5jb21iaW5lZFNjaGVtYUlkLCB0aGlzLnNjaGVtYXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lZFNjaGVtYTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2NoZW1hSGFuZGxlIGltcGxlbWVudHMgSVNjaGVtYUhhbmRsZSB7XHJcblxyXG4gICAgcHVibGljIHVybDogc3RyaW5nO1xyXG5cclxuICAgIHByaXZhdGUgcmVzb2x2ZWRTY2hlbWE6IFByb21pc2U8UmVzb2x2ZWRTY2hlbWE+O1xyXG4gICAgcHJpdmF0ZSB1bnJlc29sdmVkU2NoZW1hOiBQcm9taXNlPFVucmVzb2x2ZWRTY2hlbWE+O1xyXG4gICAgcHJpdmF0ZSBzZXJ2aWNlOiBKU09OU2NoZW1hU2VydmljZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzZXJ2aWNlOiBKU09OU2NoZW1hU2VydmljZSwgdXJsOiBzdHJpbmcsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50PzogSUpTT05TY2hlbWEpIHtcclxuICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgIGlmICh1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLnVucmVzb2x2ZWRTY2hlbWEgPSBQcm9taXNlLnJlc29sdmUobmV3IFVucmVzb2x2ZWRTY2hlbWEodW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFVucmVzb2x2ZWRTY2hlbWEoKTogUHJvbWlzZTxVbnJlc29sdmVkU2NoZW1hPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnVucmVzb2x2ZWRTY2hlbWEpIHtcclxuICAgICAgICAgICAgdGhpcy51bnJlc29sdmVkU2NoZW1hID0gdGhpcy5zZXJ2aWNlLmxvYWRTY2hlbWEodGhpcy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy51bnJlc29sdmVkU2NoZW1hO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXNvbHZlZFNjaGVtYSgpOiBQcm9taXNlPFJlc29sdmVkU2NoZW1hPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnJlc29sdmVkU2NoZW1hKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZWRTY2hlbWEgPSB0aGlzLmdldFVucmVzb2x2ZWRTY2hlbWEoKS50aGVuKHVucmVzb2x2ZWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZS5yZXNvbHZlU2NoZW1hQ29udGVudCh1bnJlc29sdmVkKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVkU2NoZW1hO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhclNjaGVtYSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnJlc29sdmVkU2NoZW1hID0gbnVsbDtcclxuICAgICAgICB0aGlzLnVucmVzb2x2ZWRTY2hlbWEgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVW5yZXNvbHZlZFNjaGVtYSB7XHJcbiAgICBwdWJsaWMgc2NoZW1hOiBJSlNPTlNjaGVtYTtcclxuICAgIHB1YmxpYyBlcnJvcnM6IHN0cmluZ1tdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNjaGVtYTogSUpTT05TY2hlbWEsIGVycm9yczogc3RyaW5nW10gPSBbXSkge1xyXG4gICAgICAgIHRoaXMuc2NoZW1hID0gc2NoZW1hO1xyXG4gICAgICAgIHRoaXMuZXJyb3JzID0gZXJyb3JzO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVzb2x2ZWRTY2hlbWEge1xyXG4gICAgcHVibGljIHNjaGVtYTogSUpTT05TY2hlbWE7XHJcbiAgICBwdWJsaWMgZXJyb3JzOiBzdHJpbmdbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihzY2hlbWE6IElKU09OU2NoZW1hLCBlcnJvcnM6IHN0cmluZ1tdID0gW10pIHtcclxuICAgICAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcclxuICAgICAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0U2VjdGlvbihwYXRoOiBzdHJpbmdbXSk6IElKU09OU2NoZW1hIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHRoaXMuc2NoZW1hKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFNlY3Rpb25SZWN1cnNpdmUocGF0aDogc3RyaW5nW10sIHNjaGVtYTogSUpTT05TY2hlbWEpOiBJSlNPTlNjaGVtYSB7XHJcbiAgICAgICAgaWYgKCFzY2hlbWEgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IG5leHQgPSBwYXRoLnNoaWZ0KCk7XHJcblxyXG4gICAgICAgIGlmIChzY2hlbWEucHJvcGVydGllcyAmJiBzY2hlbWEucHJvcGVydGllc1tuZXh0XSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYS5wcm9wZXJ0aWVzW25leHRdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY2hlbWEucGF0dGVyblByb3BlcnRpZXMpLmZvckVhY2goKHBhdHRlcm4pID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybik7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVnZXgudGVzdChuZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFNlY3Rpb25SZWN1cnNpdmUocGF0aCwgc2NoZW1hLnBhdHRlcm5Qcm9wZXJ0aWVzW3BhdHRlcm5dKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobmV4dC5tYXRjaCgnWzAtOV0rJykpIHtcclxuICAgICAgICAgICAgaWYgKHNjaGVtYS5pdGVtcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuaXRlbXMpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLml0ZW1zKSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBwYXJzZUludChuZXh0LCAxMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjaGVtYS5pdGVtc1tpbmRleF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuaXRlbXNbaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJVGVsZW1ldHJ5U2VydmljZSB7XHJcbiAgICBsb2coa2V5OiBzdHJpbmcsIGRhdGE6IGFueSk6IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVdvcmtzcGFjZUNvbnRleHRTZXJ2aWNlIHtcclxuICAgIHRvUmVzb3VyY2Uod29ya3NwYWNlUmVsYXRpdmVQYXRoOiBzdHJpbmcpOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RTZXJ2aWNlIHtcclxuICAgIChvcHRpb25zOiBYSFJPcHRpb25zKTogUHJvbWlzZTxYSFJSZXNwb25zZT47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBKU09OU2NoZW1hU2VydmljZSBpbXBsZW1lbnRzIElKU09OU2NoZW1hU2VydmljZSB7XHJcblxyXG4gICAgcHJpdmF0ZSBjb250cmlidXRpb25TY2hlbWFzOiB7IFtpZDogc3RyaW5nXTogU2NoZW1hSGFuZGxlIH07XHJcbiAgICBwcml2YXRlIGNvbnRyaWJ1dGlvbkFzc29jaWF0aW9uczogeyBbaWQ6IHN0cmluZ106IHN0cmluZ1tdIH07XHJcblxyXG4gICAgcHJpdmF0ZSBzY2hlbWFzQnlJZDogeyBbaWQ6IHN0cmluZ106IFNjaGVtYUhhbmRsZSB9O1xyXG4gICAgcHJpdmF0ZSBmaWxlUGF0dGVybkFzc29jaWF0aW9uczogRmlsZVBhdHRlcm5Bc3NvY2lhdGlvbltdO1xyXG4gICAgcHJpdmF0ZSBmaWxlUGF0dGVybkFzc29jaWF0aW9uQnlJZDogeyBbaWQ6IHN0cmluZ106IEZpbGVQYXR0ZXJuQXNzb2NpYXRpb24gfTtcclxuXHJcbiAgICBwcml2YXRlIGNhbGxPbkRpc3Bvc2U6IEZ1bmN0aW9uW107XHJcbiAgICBwcml2YXRlIHJlcXVlc3RTZXJ2aWNlOiBJUmVxdWVzdFNlcnZpY2U7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5jYWxsT25EaXNwb3NlID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9uU2NoZW1hcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9uQXNzb2NpYXRpb25zID0ge307XHJcbiAgICAgICAgdGhpcy5zY2hlbWFzQnlJZCA9IHt9O1xyXG4gICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgd2hpbGUgKHRoaXMuY2FsbE9uRGlzcG9zZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbE9uRGlzcG9zZS5wb3AoKSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25SZXNvdXJjZUNoYW5nZSh1cmk6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBzY2hlbWFGaWxlID0gdGhpcy5zY2hlbWFzQnlJZFt1cmldO1xyXG4gICAgICAgIGlmIChzY2hlbWFGaWxlKSB7XHJcbiAgICAgICAgICAgIHNjaGVtYUZpbGUuY2xlYXJTY2hlbWEoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5vcm1hbGl6ZUlkKGlkOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoaWQubGVuZ3RoID4gMCAmJiBpZC5jaGFyQXQoaWQubGVuZ3RoIC0gMSkgPT09ICcjJykge1xyXG4gICAgICAgICAgICByZXR1cm4gaWQuc3Vic3RyaW5nKDAsIGlkLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldFNjaGVtYUNvbnRyaWJ1dGlvbnMoc2NoZW1hQ29udHJpYnV0aW9uczogSVNjaGVtYUNvbnRyaWJ1dGlvbnMpOiB2b2lkIHtcclxuICAgICAgICBpZiAoc2NoZW1hQ29udHJpYnV0aW9ucy5zY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIGxldCBzY2hlbWFzID0gc2NoZW1hQ29udHJpYnV0aW9ucy5zY2hlbWFzO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZCBpbiBzY2hlbWFzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbm9ybWFsaXplZElkID0gdGhpcy5ub3JtYWxpemVJZChpZCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvblNjaGVtYXNbbm9ybWFsaXplZElkXSA9IHRoaXMuYWRkU2NoZW1hSGFuZGxlKG5vcm1hbGl6ZWRJZCwgc2NoZW1hc1tpZF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzY2hlbWFDb250cmlidXRpb25zLnNjaGVtYUFzc29jaWF0aW9ucykge1xyXG4gICAgICAgICAgICBsZXQgc2NoZW1hQXNzb2NpYXRpb25zID0gc2NoZW1hQ29udHJpYnV0aW9ucy5zY2hlbWFBc3NvY2lhdGlvbnM7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHBhdHRlcm4gaW4gc2NoZW1hQXNzb2NpYXRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYXNzb2NpYXRpb25zID0gc2NoZW1hQXNzb2NpYXRpb25zW3BhdHRlcm5dO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnNbcGF0dGVybl0gPSBhc3NvY2lhdGlvbnM7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZwYSA9IHRoaXMuZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xyXG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpb25zLmZvckVhY2goc2NoZW1hSWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBpZCA9IHRoaXMubm9ybWFsaXplSWQoc2NoZW1hSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZwYS5hZGRTY2hlbWEoaWQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGRTY2hlbWFIYW5kbGUoaWQ6IHN0cmluZywgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQ/OiBJSlNPTlNjaGVtYSk6IFNjaGVtYUhhbmRsZSB7XHJcbiAgICAgICAgbGV0IHNjaGVtYUhhbmRsZSA9IG5ldyBTY2hlbWFIYW5kbGUodGhpcywgaWQsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KTtcclxuICAgICAgICB0aGlzLnNjaGVtYXNCeUlkW2lkXSA9IHNjaGVtYUhhbmRsZTtcclxuICAgICAgICByZXR1cm4gc2NoZW1hSGFuZGxlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0T3JBZGRTY2hlbWFIYW5kbGUoaWQ6IHN0cmluZywgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQ/OiBJSlNPTlNjaGVtYSk6IElTY2hlbWFIYW5kbGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjaGVtYXNCeUlkW2lkXSB8fCB0aGlzLmFkZFNjaGVtYUhhbmRsZShpZCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm46IHN0cmluZykge1xyXG4gICAgICAgIGxldCBmcGEgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkW3BhdHRlcm5dO1xyXG4gICAgICAgIGlmICghZnBhKSB7XHJcbiAgICAgICAgICAgIGZwYSA9IG5ldyBGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkW3BhdHRlcm5dID0gZnBhO1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zLnB1c2goZnBhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZwYTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVnaXN0ZXJFeHRlcm5hbFNjaGVtYSh1cmk6IHN0cmluZywgZmlsZVBhdHRlcm5zOiBzdHJpbmdbXSA9IG51bGwsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50PzogSUpTT05TY2hlbWEpOiBJU2NoZW1hSGFuZGxlIHtcclxuICAgICAgICBsZXQgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHVyaSk7XHJcblxyXG4gICAgICAgIGlmIChmaWxlUGF0dGVybnMpIHtcclxuICAgICAgICAgICAgZmlsZVBhdHRlcm5zLmZvckVhY2gocGF0dGVybiA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldE9yQWRkRmlsZVBhdHRlcm5Bc3NvY2lhdGlvbihwYXR0ZXJuKS5hZGRTY2hlbWEodXJpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bnJlc29sdmVkU2NoZW1hQ29udGVudCA/IHRoaXMuYWRkU2NoZW1hSGFuZGxlKGlkLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudCkgOiB0aGlzLmdldE9yQWRkU2NoZW1hSGFuZGxlKGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXJFeHRlcm5hbFNjaGVtYXMoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zY2hlbWFzQnlJZCA9IHt9O1xyXG4gICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkID0ge307XHJcblxyXG4gICAgICAgIGZvciAobGV0IGlkIGluIHRoaXMuY29udHJpYnV0aW9uU2NoZW1hcykge1xyXG4gICAgICAgICAgICB0aGlzLnNjaGVtYXNCeUlkW2lkXSA9IHRoaXMuY29udHJpYnV0aW9uU2NoZW1hc1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IHBhdHRlcm4gaW4gdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyIGZwYSA9IHRoaXMuZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnNbcGF0dGVybl0uZm9yRWFjaChzY2hlbWFJZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHNjaGVtYUlkKTtcclxuICAgICAgICAgICAgICAgIGZwYS5hZGRTY2hlbWEoaWQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFJlc29sdmVkU2NoZW1hKHNjaGVtYUlkOiBzdHJpbmcpOiBQcm9taXNlPFJlc29sdmVkU2NoZW1hPiB7XHJcbiAgICAgICAgbGV0IGlkID0gdGhpcy5ub3JtYWxpemVJZChzY2hlbWFJZCk7XHJcbiAgICAgICAgbGV0IHNjaGVtYUhhbmRsZSA9IHRoaXMuc2NoZW1hc0J5SWRbaWRdO1xyXG4gICAgICAgIGlmIChzY2hlbWFIYW5kbGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYUhhbmRsZS5nZXRSZXNvbHZlZFNjaGVtYSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsb2FkU2NoZW1hKHVybDogc3RyaW5nKTogUHJvbWlzZTxVbnJlc29sdmVkU2NoZW1hPiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdFNlcnZpY2UoeyB1cmw6IHVybCwgZm9sbG93UmVkaXJlY3RzOiA1IH0pLnRoZW4oXHJcbiAgICAgICAgICAgIHJlcXVlc3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcclxuICAgICAgICAgICAgICAgIGlmICghY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBsb2NhbGl6ZSgnanNvbi5zY2hlbWEubm9jb250ZW50JywgJ1VuYWJsZSB0byBsb2FkIHNjaGVtYSBmcm9tIFxcJ3swfVxcJzogTm8gY29udGVudC4nLCB0b0Rpc3BsYXlTdHJpbmcodXJsKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVbnJlc29sdmVkU2NoZW1hKDxJSlNPTlNjaGVtYT57fSwgW2Vycm9yTWVzc2FnZV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBzY2hlbWFDb250ZW50OiBJSlNPTlNjaGVtYSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgbGV0IGpzb25FcnJvcnM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgICAgICBzY2hlbWFDb250ZW50ID0gSnNvbi5wYXJzZShjb250ZW50LCBqc29uRXJyb3JzKTtcclxuICAgICAgICAgICAgICAgIGxldCBlcnJvcnMgPSBqc29uRXJyb3JzLmxlbmd0aCA/IFtsb2NhbGl6ZSgnanNvbi5zY2hlbWEuaW52YWxpZEZvcm1hdCcsICdVbmFibGUgdG8gcGFyc2UgY29udGVudCBmcm9tIFxcJ3swfVxcJzogezF9LicsIHRvRGlzcGxheVN0cmluZyh1cmwpLCBqc29uRXJyb3JzWzBdKV0gOiBbXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVW5yZXNvbHZlZFNjaGVtYShzY2hlbWFDb250ZW50LCBlcnJvcnMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3I6IFhIUlJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gbG9jYWxpemUoJ2pzb24uc2NoZW1hLnVuYWJsZXRvbG9hZCcsICdVbmFibGUgdG8gbG9hZCBzY2hlbWEgZnJvbSBcXCd7MH1cXCc6IHsxfScsIHRvRGlzcGxheVN0cmluZyh1cmwpLCBlcnJvci5yZXNwb25zZVRleHQgfHwgZ2V0RXJyb3JTdGF0dXNEZXNjcmlwdGlvbihlcnJvci5zdGF0dXMpIHx8IGVycm9yLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVbnJlc29sdmVkU2NoZW1hKDxJSlNPTlNjaGVtYT57fSwgW2Vycm9yTWVzc2FnZV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVzb2x2ZVNjaGVtYUNvbnRlbnQoc2NoZW1hVG9SZXNvbHZlOiBVbnJlc29sdmVkU2NoZW1hKTogUHJvbWlzZTxSZXNvbHZlZFNjaGVtYT4ge1xyXG5cclxuICAgICAgICBsZXQgcmVzb2x2ZUVycm9yczogc3RyaW5nW10gPSBzY2hlbWFUb1Jlc29sdmUuZXJyb3JzLnNsaWNlKDApO1xyXG4gICAgICAgIGxldCBzY2hlbWEgPSBzY2hlbWFUb1Jlc29sdmUuc2NoZW1hO1xyXG5cclxuICAgICAgICBsZXQgZmluZFNlY3Rpb24gPSAoc2NoZW1hOiBJSlNPTlNjaGVtYSwgcGF0aDogc3RyaW5nKTogYW55ID0+IHtcclxuICAgICAgICAgICAgaWYgKCFwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NoZW1hO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50OiBhbnkgPSBzY2hlbWE7XHJcbiAgICAgICAgICAgIHBhdGguc3Vic3RyKDEpLnNwbGl0KCcvJykuc29tZSgocGFydCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFydF07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gIWN1cnJlbnQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgcmVzb2x2ZUxpbmsgPSAobm9kZTogYW55LCBsaW5rZWRTY2hlbWE6IElKU09OU2NoZW1hLCBsaW5rUGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgIGxldCBzZWN0aW9uID0gZmluZFNlY3Rpb24obGlua2VkU2NoZW1hLCBsaW5rUGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChzZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gc2VjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWN0aW9uLmhhc093blByb3BlcnR5KGtleSkgJiYgIW5vZGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlW2tleV0gPSBzZWN0aW9uW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUVycm9ycy5wdXNoKGxvY2FsaXplKCdqc29uLnNjaGVtYS5pbnZhbGlkcmVmJywgJyRyZWYgXFwnezB9XFwnIGluIHsxfSBjYW4gbm90IGJlIHJlc29sdmVkLicsIGxpbmtQYXRoLCBsaW5rZWRTY2hlbWEuaWQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWxldGUgbm9kZS4kcmVmO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCByZXNvbHZlRXh0ZXJuYWxMaW5rID0gKG5vZGU6IGFueSwgdXJpOiBzdHJpbmcsIGxpbmtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGFueT4gPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRPckFkZFNjaGVtYUhhbmRsZSh1cmkpLmdldFVucmVzb2x2ZWRTY2hlbWEoKS50aGVuKHVucmVzb2x2ZWRTY2hlbWEgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVucmVzb2x2ZWRTY2hlbWEuZXJyb3JzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBsb2MgPSBsaW5rUGF0aCA/IHVyaSArICcjJyArIGxpbmtQYXRoIDogdXJpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVFcnJvcnMucHVzaChsb2NhbGl6ZSgnanNvbi5zY2hlbWEucHJvYmxlbWxvYWRpbmdyZWYnLCAnUHJvYmxlbXMgbG9hZGluZyByZWZlcmVuY2UgXFwnezB9XFwnOiB7MX0nLCBsb2MsIHVucmVzb2x2ZWRTY2hlbWEuZXJyb3JzWzBdKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlTGluayhub2RlLCB1bnJlc29sdmVkU2NoZW1hLnNjaGVtYSwgbGlua1BhdGgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVSZWZzKG5vZGUsIHVucmVzb2x2ZWRTY2hlbWEuc2NoZW1hKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IHJlc29sdmVSZWZzID0gKG5vZGU6IElKU09OU2NoZW1hLCBwYXJlbnRTY2hlbWE6IElKU09OU2NoZW1hKTogUHJvbWlzZTxhbnk+ID0+IHtcclxuICAgICAgICAgICAgbGV0IHRvV2FsayA6IElKU09OU2NoZW1hW10gPSBbbm9kZV07XHJcbiAgICAgICAgICAgIGxldCBzZWVuOiBJSlNPTlNjaGVtYVtdID0gW107XHJcblxyXG4gICAgICAgICAgICBsZXQgb3BlblByb21pc2VzOiBQcm9taXNlPGFueT5bXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgbGV0IGNvbGxlY3RFbnRyaWVzID0gKC4uLmVudHJpZXM6IElKU09OU2NoZW1hW10pID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudHJ5ID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b1dhbGsucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgY29sbGVjdE1hcEVudHJpZXMgPSAoLi4ubWFwczogSUpTT05TY2hlbWFNYXBbXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbWFwIG9mIG1hcHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hcCA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudHJ5ID0gbWFwW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b1dhbGsucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxldCBjb2xsZWN0QXJyYXlFbnRyaWVzID0gKC4uLmFycmF5czogSUpTT05TY2hlbWFbXVtdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhcnJheSBvZiBhcnJheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhcnJheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9XYWxrLnB1c2guYXBwbHkodG9XYWxrLCBhcnJheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB3aGlsZSAodG9XYWxrLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSB0b1dhbGsucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKG5leHQpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNlZW4ucHVzaChuZXh0KTtcclxuICAgICAgICAgICAgICAgIGlmIChuZXh0LiRyZWYpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2VnbWVudHMgPSBuZXh0LiRyZWYuc3BsaXQoJyMnLCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VnbWVudHNbMF0ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuUHJvbWlzZXMucHVzaChyZXNvbHZlRXh0ZXJuYWxMaW5rKG5leHQsIHNlZ21lbnRzWzBdLCBzZWdtZW50c1sxXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlTGluayhuZXh0LCBwYXJlbnRTY2hlbWEsIHNlZ21lbnRzWzFdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0RW50cmllcyhuZXh0Lml0ZW1zLCBuZXh0LmFkZGl0aW9uYWxQcm9wZXJ0aWVzLCBuZXh0Lm5vdCk7XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0TWFwRW50cmllcyhuZXh0LmRlZmluaXRpb25zLCBuZXh0LnByb3BlcnRpZXMsIG5leHQucGF0dGVyblByb3BlcnRpZXMsIDxJSlNPTlNjaGVtYU1hcD4gbmV4dC5kZXBlbmRlbmNpZXMpO1xyXG4gICAgICAgICAgICAgICAgY29sbGVjdEFycmF5RW50cmllcyhuZXh0LmFueU9mLCBuZXh0LmFsbE9mLCBuZXh0Lm9uZU9mLCA8SUpTT05TY2hlbWFbXT4gbmV4dC5pdGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG9wZW5Qcm9taXNlcyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmVSZWZzKHNjaGVtYSwgc2NoZW1hKS50aGVuKF8gPT4gbmV3IFJlc29sdmVkU2NoZW1hKHNjaGVtYSwgcmVzb2x2ZUVycm9ycykpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTY2hlbWFGb3JSZXNvdXJjZShyZXNvdXJjZTogc3RyaW5nLCBkb2N1bWVudDogUGFyc2VyLkpTT05Eb2N1bWVudCk6IFByb21pc2U8UmVzb2x2ZWRTY2hlbWE+IHtcclxuXHJcbiAgICAgICAgLy8gZmlyc3QgdXNlICRzY2hlbWEgaWYgcHJlc2VudFxyXG4gICAgICAgIGlmIChkb2N1bWVudCAmJiBkb2N1bWVudC5yb290ICYmIGRvY3VtZW50LnJvb3QudHlwZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgbGV0IHNjaGVtYVByb3BlcnRpZXMgPSAoPFBhcnNlci5PYmplY3RBU1ROb2RlPmRvY3VtZW50LnJvb3QpLnByb3BlcnRpZXMuZmlsdGVyKChwKSA9PiAocC5rZXkudmFsdWUgPT09ICckc2NoZW1hJykgJiYgISFwLnZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKHNjaGVtYVByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjaGVtZUlkID0gPHN0cmluZz5zY2hlbWFQcm9wZXJ0aWVzWzBdLnZhbHVlLmdldFZhbHVlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1lSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHNjaGVtZUlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRPckFkZFNjaGVtYUhhbmRsZShpZCkuZ2V0UmVzb2x2ZWRTY2hlbWEoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdGhlbiBjaGVjayBmb3IgbWF0Y2hpbmcgZmlsZSBuYW1lcywgbGFzdCB0byBmaXJzdFxyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGxldCBlbnRyeSA9IHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnNbaV07XHJcbiAgICAgICAgICAgIGlmIChlbnRyeS5tYXRjaGVzUGF0dGVybihyZXNvdXJjZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeS5nZXRDb21iaW5lZFNjaGVtYSh0aGlzKS5nZXRSZXNvbHZlZFNjaGVtYSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZUNvbWJpbmVkU2NoZW1hKGNvbWJpbmVkU2NoZW1hSWQ6IHN0cmluZywgc2NoZW1hSWRzOiBzdHJpbmdbXSk6IElTY2hlbWFIYW5kbGUge1xyXG4gICAgICAgIGlmIChzY2hlbWFJZHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE9yQWRkU2NoZW1hSGFuZGxlKHNjaGVtYUlkc1swXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGNvbWJpbmVkU2NoZW1hOiBJSlNPTlNjaGVtYSA9IHtcclxuICAgICAgICAgICAgICAgIGFsbE9mOiBzY2hlbWFJZHMubWFwKHNjaGVtYUlkID0+ICh7ICRyZWY6IHNjaGVtYUlkIH0pKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRTY2hlbWFIYW5kbGUoY29tYmluZWRTY2hlbWFJZCwgY29tYmluZWRTY2hlbWEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdG9EaXNwbGF5U3RyaW5nKHVybDogc3RyaW5nKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxldCB1cmkgPSBVUkkucGFyc2UodXJsKTtcclxuICAgICAgICBpZiAodXJpLnNjaGVtZSA9PT0gJ2ZpbGUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmkuZnNQYXRoO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvLyBpZ25vcmVcclxuICAgIH1cclxuICAgIHJldHVybiB1cmw7XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xuaW1wb3J0IEpzb24gZnJvbSAnanNvbmMtcGFyc2VyJztcbmltcG9ydCB7IGdldEVycm9yU3RhdHVzRGVzY3JpcHRpb24gfSBmcm9tICdyZXF1ZXN0LWxpZ2h0JztcbmltcG9ydCBVUkkgZnJvbSAnLi91dGlscy91cmknO1xuaW1wb3J0IFN0cmluZ3MgZnJvbSAnLi91dGlscy9zdHJpbmdzJztcbmltcG9ydCAqIGFzIG5scyBmcm9tICd2c2NvZGUtbmxzJztcbmNvbnN0IGxvY2FsaXplID0gbmxzLmxvYWRNZXNzYWdlQnVuZGxlKCk7XG5jbGFzcyBGaWxlUGF0dGVybkFzc29jaWF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWFJZCA9ICdsb2NhbDovL2NvbWJpbmVkU2NoZW1hLycgKyBlbmNvZGVVUklDb21wb25lbnQocGF0dGVybik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnBhdHRlcm5SZWdFeHAgPSBuZXcgUmVnRXhwKFN0cmluZ3MuY29udmVydFNpbXBsZTJSZWdFeHBQYXR0ZXJuKHBhdHRlcm4pICsgJyQnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5wYXR0ZXJuUmVnRXhwID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVtYXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb21iaW5lZFNjaGVtYSA9IG51bGw7XG4gICAgfVxuICAgIGFkZFNjaGVtYShpZCkge1xuICAgICAgICB0aGlzLnNjaGVtYXMucHVzaChpZCk7XG4gICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWEgPSBudWxsO1xuICAgIH1cbiAgICBtYXRjaGVzUGF0dGVybihmaWxlTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXR0ZXJuUmVnRXhwICYmIHRoaXMucGF0dGVyblJlZ0V4cC50ZXN0KGZpbGVOYW1lKTtcbiAgICB9XG4gICAgZ2V0Q29tYmluZWRTY2hlbWEoc2VydmljZSkge1xuICAgICAgICBpZiAoIXRoaXMuY29tYmluZWRTY2hlbWEpIHtcbiAgICAgICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWEgPSBzZXJ2aWNlLmNyZWF0ZUNvbWJpbmVkU2NoZW1hKHRoaXMuY29tYmluZWRTY2hlbWFJZCwgdGhpcy5zY2hlbWFzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lZFNjaGVtYTtcbiAgICB9XG59XG5jbGFzcyBTY2hlbWFIYW5kbGUge1xuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2UsIHVybCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG4gICAgICAgIGlmICh1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xuICAgICAgICAgICAgdGhpcy51bnJlc29sdmVkU2NoZW1hID0gUHJvbWlzZS5yZXNvbHZlKG5ldyBVbnJlc29sdmVkU2NoZW1hKHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0VW5yZXNvbHZlZFNjaGVtYSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnVucmVzb2x2ZWRTY2hlbWEpIHtcbiAgICAgICAgICAgIHRoaXMudW5yZXNvbHZlZFNjaGVtYSA9IHRoaXMuc2VydmljZS5sb2FkU2NoZW1hKHRoaXMudXJsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy51bnJlc29sdmVkU2NoZW1hO1xuICAgIH1cbiAgICBnZXRSZXNvbHZlZFNjaGVtYSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJlc29sdmVkU2NoZW1hKSB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVkU2NoZW1hID0gdGhpcy5nZXRVbnJlc29sdmVkU2NoZW1hKCkudGhlbih1bnJlc29sdmVkID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnJlc29sdmVTY2hlbWFDb250ZW50KHVucmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWRTY2hlbWE7XG4gICAgfVxuICAgIGNsZWFyU2NoZW1hKCkge1xuICAgICAgICB0aGlzLnJlc29sdmVkU2NoZW1hID0gbnVsbDtcbiAgICAgICAgdGhpcy51bnJlc29sdmVkU2NoZW1hID0gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgVW5yZXNvbHZlZFNjaGVtYSB7XG4gICAgY29uc3RydWN0b3Ioc2NoZW1hLCBlcnJvcnMgPSBbXSkge1xuICAgICAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnM7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFJlc29sdmVkU2NoZW1hIHtcbiAgICBjb25zdHJ1Y3RvcihzY2hlbWEsIGVycm9ycyA9IFtdKSB7XG4gICAgICAgIHRoaXMuc2NoZW1hID0gc2NoZW1hO1xuICAgICAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcbiAgICB9XG4gICAgZ2V0U2VjdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFNlY3Rpb25SZWN1cnNpdmUocGF0aCwgdGhpcy5zY2hlbWEpO1xuICAgIH1cbiAgICBnZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYSkge1xuICAgICAgICBpZiAoIXNjaGVtYSB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbmV4dCA9IHBhdGguc2hpZnQoKTtcbiAgICAgICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzICYmIHNjaGVtYS5wcm9wZXJ0aWVzW25leHRdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYS5wcm9wZXJ0aWVzW25leHRdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEucGF0dGVyblByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykuZm9yRWFjaCgocGF0dGVybikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybik7XG4gICAgICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEucGF0dGVyblByb3BlcnRpZXNbcGF0dGVybl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5leHQubWF0Y2goJ1swLTldKycpKSB7XG4gICAgICAgICAgICBpZiAoc2NoZW1hLml0ZW1zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuaXRlbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gcGFyc2VJbnQobmV4dCwgMTApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLml0ZW1zW2luZGV4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuaXRlbXNbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBKU09OU2NoZW1hU2VydmljZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY2FsbE9uRGlzcG9zZSA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvblNjaGVtYXMgPSB7fTtcbiAgICAgICAgdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5zY2hlbWFzQnlJZCA9IHt9O1xuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zID0gW107XG4gICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbkJ5SWQgPSB7fTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuY2FsbE9uRGlzcG9zZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxPbkRpc3Bvc2UucG9wKCkoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBvblJlc291cmNlQ2hhbmdlKHVyaSkge1xuICAgICAgICBsZXQgc2NoZW1hRmlsZSA9IHRoaXMuc2NoZW1hc0J5SWRbdXJpXTtcbiAgICAgICAgaWYgKHNjaGVtYUZpbGUpIHtcbiAgICAgICAgICAgIHNjaGVtYUZpbGUuY2xlYXJTY2hlbWEoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgbm9ybWFsaXplSWQoaWQpIHtcbiAgICAgICAgaWYgKGlkLmxlbmd0aCA+IDAgJiYgaWQuY2hhckF0KGlkLmxlbmd0aCAtIDEpID09PSAnIycpIHtcbiAgICAgICAgICAgIHJldHVybiBpZC5zdWJzdHJpbmcoMCwgaWQubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbiAgICBzZXRTY2hlbWFDb250cmlidXRpb25zKHNjaGVtYUNvbnRyaWJ1dGlvbnMpIHtcbiAgICAgICAgaWYgKHNjaGVtYUNvbnRyaWJ1dGlvbnMuc2NoZW1hcykge1xuICAgICAgICAgICAgbGV0IHNjaGVtYXMgPSBzY2hlbWFDb250cmlidXRpb25zLnNjaGVtYXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpZCBpbiBzY2hlbWFzKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5vcm1hbGl6ZWRJZCA9IHRoaXMubm9ybWFsaXplSWQoaWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJpYnV0aW9uU2NoZW1hc1tub3JtYWxpemVkSWRdID0gdGhpcy5hZGRTY2hlbWFIYW5kbGUobm9ybWFsaXplZElkLCBzY2hlbWFzW2lkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjaGVtYUNvbnRyaWJ1dGlvbnMuc2NoZW1hQXNzb2NpYXRpb25zKSB7XG4gICAgICAgICAgICBsZXQgc2NoZW1hQXNzb2NpYXRpb25zID0gc2NoZW1hQ29udHJpYnV0aW9ucy5zY2hlbWFBc3NvY2lhdGlvbnM7XG4gICAgICAgICAgICBmb3IgKGxldCBwYXR0ZXJuIGluIHNjaGVtYUFzc29jaWF0aW9ucykge1xuICAgICAgICAgICAgICAgIGxldCBhc3NvY2lhdGlvbnMgPSBzY2hlbWFBc3NvY2lhdGlvbnNbcGF0dGVybl07XG4gICAgICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnNbcGF0dGVybl0gPSBhc3NvY2lhdGlvbnM7XG4gICAgICAgICAgICAgICAgdmFyIGZwYSA9IHRoaXMuZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xuICAgICAgICAgICAgICAgIGFzc29jaWF0aW9ucy5mb3JFYWNoKHNjaGVtYUlkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlkID0gdGhpcy5ub3JtYWxpemVJZChzY2hlbWFJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZwYS5hZGRTY2hlbWEoaWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGFkZFNjaGVtYUhhbmRsZShpZCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpIHtcbiAgICAgICAgbGV0IHNjaGVtYUhhbmRsZSA9IG5ldyBTY2hlbWFIYW5kbGUodGhpcywgaWQsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KTtcbiAgICAgICAgdGhpcy5zY2hlbWFzQnlJZFtpZF0gPSBzY2hlbWFIYW5kbGU7XG4gICAgICAgIHJldHVybiBzY2hlbWFIYW5kbGU7XG4gICAgfVxuICAgIGdldE9yQWRkU2NoZW1hSGFuZGxlKGlkLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2hlbWFzQnlJZFtpZF0gfHwgdGhpcy5hZGRTY2hlbWFIYW5kbGUoaWQsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KTtcbiAgICB9XG4gICAgZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pIHtcbiAgICAgICAgbGV0IGZwYSA9IHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbkJ5SWRbcGF0dGVybl07XG4gICAgICAgIGlmICghZnBhKSB7XG4gICAgICAgICAgICBmcGEgPSBuZXcgRmlsZVBhdHRlcm5Bc3NvY2lhdGlvbihwYXR0ZXJuKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbkJ5SWRbcGF0dGVybl0gPSBmcGE7XG4gICAgICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zLnB1c2goZnBhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnBhO1xuICAgIH1cbiAgICByZWdpc3RlckV4dGVybmFsU2NoZW1hKHVyaSwgZmlsZVBhdHRlcm5zID0gbnVsbCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5ub3JtYWxpemVJZCh1cmkpO1xuICAgICAgICBpZiAoZmlsZVBhdHRlcm5zKSB7XG4gICAgICAgICAgICBmaWxlUGF0dGVybnMuZm9yRWFjaChwYXR0ZXJuID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdldE9yQWRkRmlsZVBhdHRlcm5Bc3NvY2lhdGlvbihwYXR0ZXJuKS5hZGRTY2hlbWEodXJpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bnJlc29sdmVkU2NoZW1hQ29udGVudCA/IHRoaXMuYWRkU2NoZW1hSGFuZGxlKGlkLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudCkgOiB0aGlzLmdldE9yQWRkU2NoZW1hSGFuZGxlKGlkKTtcbiAgICB9XG4gICAgY2xlYXJFeHRlcm5hbFNjaGVtYXMoKSB7XG4gICAgICAgIHRoaXMuc2NoZW1hc0J5SWQgPSB7fTtcbiAgICAgICAgdGhpcy5maWxlUGF0dGVybkFzc29jaWF0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkID0ge307XG4gICAgICAgIGZvciAobGV0IGlkIGluIHRoaXMuY29udHJpYnV0aW9uU2NoZW1hcykge1xuICAgICAgICAgICAgdGhpcy5zY2hlbWFzQnlJZFtpZF0gPSB0aGlzLmNvbnRyaWJ1dGlvblNjaGVtYXNbaWRdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHBhdHRlcm4gaW4gdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBmcGEgPSB0aGlzLmdldE9yQWRkRmlsZVBhdHRlcm5Bc3NvY2lhdGlvbihwYXR0ZXJuKTtcbiAgICAgICAgICAgIHRoaXMuY29udHJpYnV0aW9uQXNzb2NpYXRpb25zW3BhdHRlcm5dLmZvckVhY2goc2NoZW1hSWQgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBpZCA9IHRoaXMubm9ybWFsaXplSWQoc2NoZW1hSWQpO1xuICAgICAgICAgICAgICAgIGZwYS5hZGRTY2hlbWEoaWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0UmVzb2x2ZWRTY2hlbWEoc2NoZW1hSWQpIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5ub3JtYWxpemVJZChzY2hlbWFJZCk7XG4gICAgICAgIGxldCBzY2hlbWFIYW5kbGUgPSB0aGlzLnNjaGVtYXNCeUlkW2lkXTtcbiAgICAgICAgaWYgKHNjaGVtYUhhbmRsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYUhhbmRsZS5nZXRSZXNvbHZlZFNjaGVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfVxuICAgIGxvYWRTY2hlbWEodXJsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3RTZXJ2aWNlKHsgdXJsOiB1cmwsIGZvbGxvd1JlZGlyZWN0czogNSB9KS50aGVuKHJlcXVlc3QgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnQgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBsb2NhbGl6ZSgnanNvbi5zY2hlbWEubm9jb250ZW50JywgJ1VuYWJsZSB0byBsb2FkIHNjaGVtYSBmcm9tIFxcJ3swfVxcJzogTm8gY29udGVudC4nLCB0b0Rpc3BsYXlTdHJpbmcodXJsKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVbnJlc29sdmVkU2NoZW1hKHt9LCBbZXJyb3JNZXNzYWdlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgc2NoZW1hQ29udGVudCA9IHt9O1xuICAgICAgICAgICAgbGV0IGpzb25FcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIHNjaGVtYUNvbnRlbnQgPSBKc29uLnBhcnNlKGNvbnRlbnQsIGpzb25FcnJvcnMpO1xuICAgICAgICAgICAgbGV0IGVycm9ycyA9IGpzb25FcnJvcnMubGVuZ3RoID8gW2xvY2FsaXplKCdqc29uLnNjaGVtYS5pbnZhbGlkRm9ybWF0JywgJ1VuYWJsZSB0byBwYXJzZSBjb250ZW50IGZyb20gXFwnezB9XFwnOiB7MX0uJywgdG9EaXNwbGF5U3RyaW5nKHVybCksIGpzb25FcnJvcnNbMF0pXSA6IFtdO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVbnJlc29sdmVkU2NoZW1hKHNjaGVtYUNvbnRlbnQsIGVycm9ycyk7XG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IGxvY2FsaXplKCdqc29uLnNjaGVtYS51bmFibGV0b2xvYWQnLCAnVW5hYmxlIHRvIGxvYWQgc2NoZW1hIGZyb20gXFwnezB9XFwnOiB7MX0nLCB0b0Rpc3BsYXlTdHJpbmcodXJsKSwgZXJyb3IucmVzcG9uc2VUZXh0IHx8IGdldEVycm9yU3RhdHVzRGVzY3JpcHRpb24oZXJyb3Iuc3RhdHVzKSB8fCBlcnJvci50b1N0cmluZygpKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVW5yZXNvbHZlZFNjaGVtYSh7fSwgW2Vycm9yTWVzc2FnZV0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVzb2x2ZVNjaGVtYUNvbnRlbnQoc2NoZW1hVG9SZXNvbHZlKSB7XG4gICAgICAgIGxldCByZXNvbHZlRXJyb3JzID0gc2NoZW1hVG9SZXNvbHZlLmVycm9ycy5zbGljZSgwKTtcbiAgICAgICAgbGV0IHNjaGVtYSA9IHNjaGVtYVRvUmVzb2x2ZS5zY2hlbWE7XG4gICAgICAgIGxldCBmaW5kU2VjdGlvbiA9IChzY2hlbWEsIHBhdGgpID0+IHtcbiAgICAgICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY2hlbWE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgY3VycmVudCA9IHNjaGVtYTtcbiAgICAgICAgICAgIHBhdGguc3Vic3RyKDEpLnNwbGl0KCcvJykuc29tZSgocGFydCkgPT4ge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdO1xuICAgICAgICAgICAgICAgIHJldHVybiAhY3VycmVudDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXNvbHZlTGluayA9IChub2RlLCBsaW5rZWRTY2hlbWEsIGxpbmtQYXRoKSA9PiB7XG4gICAgICAgICAgICBsZXQgc2VjdGlvbiA9IGZpbmRTZWN0aW9uKGxpbmtlZFNjaGVtYSwgbGlua1BhdGgpO1xuICAgICAgICAgICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gc2VjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VjdGlvbi5oYXNPd25Qcm9wZXJ0eShrZXkpICYmICFub2RlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVba2V5XSA9IHNlY3Rpb25ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmVFcnJvcnMucHVzaChsb2NhbGl6ZSgnanNvbi5zY2hlbWEuaW52YWxpZHJlZicsICckcmVmIFxcJ3swfVxcJyBpbiB7MX0gY2FuIG5vdCBiZSByZXNvbHZlZC4nLCBsaW5rUGF0aCwgbGlua2VkU2NoZW1hLmlkKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgbm9kZS4kcmVmO1xuICAgICAgICB9O1xuICAgICAgICBsZXQgcmVzb2x2ZUV4dGVybmFsTGluayA9IChub2RlLCB1cmksIGxpbmtQYXRoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRPckFkZFNjaGVtYUhhbmRsZSh1cmkpLmdldFVucmVzb2x2ZWRTY2hlbWEoKS50aGVuKHVucmVzb2x2ZWRTY2hlbWEgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh1bnJlc29sdmVkU2NoZW1hLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxvYyA9IGxpbmtQYXRoID8gdXJpICsgJyMnICsgbGlua1BhdGggOiB1cmk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVFcnJvcnMucHVzaChsb2NhbGl6ZSgnanNvbi5zY2hlbWEucHJvYmxlbWxvYWRpbmdyZWYnLCAnUHJvYmxlbXMgbG9hZGluZyByZWZlcmVuY2UgXFwnezB9XFwnOiB7MX0nLCBsb2MsIHVucmVzb2x2ZWRTY2hlbWEuZXJyb3JzWzBdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmVMaW5rKG5vZGUsIHVucmVzb2x2ZWRTY2hlbWEuc2NoZW1hLCBsaW5rUGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVSZWZzKG5vZGUsIHVucmVzb2x2ZWRTY2hlbWEuc2NoZW1hKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBsZXQgcmVzb2x2ZVJlZnMgPSAobm9kZSwgcGFyZW50U2NoZW1hKSA9PiB7XG4gICAgICAgICAgICBsZXQgdG9XYWxrID0gW25vZGVdO1xuICAgICAgICAgICAgbGV0IHNlZW4gPSBbXTtcbiAgICAgICAgICAgIGxldCBvcGVuUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICAgIGxldCBjb2xsZWN0RW50cmllcyA9ICguLi5lbnRyaWVzKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVudHJ5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9XYWxrLnB1c2goZW50cnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxldCBjb2xsZWN0TWFwRW50cmllcyA9ICguLi5tYXBzKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbWFwIG9mIG1hcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXAgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gbWFwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudHJ5ID0gbWFwW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9XYWxrLnB1c2goZW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxldCBjb2xsZWN0QXJyYXlFbnRyaWVzID0gKC4uLmFycmF5cykgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGFycmF5IG9mIGFycmF5cykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhcnJheSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvV2Fsay5wdXNoLmFwcGx5KHRvV2FsaywgYXJyYXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdoaWxlICh0b1dhbGsubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5leHQgPSB0b1dhbGsucG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKHNlZW4uaW5kZXhPZihuZXh0KSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWVuLnB1c2gobmV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQuJHJlZikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2VnbWVudHMgPSBuZXh0LiRyZWYuc3BsaXQoJyMnLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlZ21lbnRzWzBdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5Qcm9taXNlcy5wdXNoKHJlc29sdmVFeHRlcm5hbExpbmsobmV4dCwgc2VnbWVudHNbMF0sIHNlZ21lbnRzWzFdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVMaW5rKG5leHQsIHBhcmVudFNjaGVtYSwgc2VnbWVudHNbMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbGxlY3RFbnRyaWVzKG5leHQuaXRlbXMsIG5leHQuYWRkaXRpb25hbFByb3BlcnRpZXMsIG5leHQubm90KTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0TWFwRW50cmllcyhuZXh0LmRlZmluaXRpb25zLCBuZXh0LnByb3BlcnRpZXMsIG5leHQucGF0dGVyblByb3BlcnRpZXMsIG5leHQuZGVwZW5kZW5jaWVzKTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0QXJyYXlFbnRyaWVzKG5leHQuYW55T2YsIG5leHQuYWxsT2YsIG5leHQub25lT2YsIG5leHQuaXRlbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG9wZW5Qcm9taXNlcyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiByZXNvbHZlUmVmcyhzY2hlbWEsIHNjaGVtYSkudGhlbihfID0+IG5ldyBSZXNvbHZlZFNjaGVtYShzY2hlbWEsIHJlc29sdmVFcnJvcnMpKTtcbiAgICB9XG4gICAgZ2V0U2NoZW1hRm9yUmVzb3VyY2UocmVzb3VyY2UsIGRvY3VtZW50KSB7XG4gICAgICAgIGlmIChkb2N1bWVudCAmJiBkb2N1bWVudC5yb290ICYmIGRvY3VtZW50LnJvb3QudHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGxldCBzY2hlbWFQcm9wZXJ0aWVzID0gZG9jdW1lbnQucm9vdC5wcm9wZXJ0aWVzLmZpbHRlcigocCkgPT4gKHAua2V5LnZhbHVlID09PSAnJHNjaGVtYScpICYmICEhcC52YWx1ZSk7XG4gICAgICAgICAgICBpZiAoc2NoZW1hUHJvcGVydGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjaGVtZUlkID0gc2NoZW1hUHJvcGVydGllc1swXS52YWx1ZS5nZXRWYWx1ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChzY2hlbWVJZCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHNjaGVtZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUoaWQpLmdldFJlc29sdmVkU2NoZW1hKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZXQgZW50cnkgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zW2ldO1xuICAgICAgICAgICAgaWYgKGVudHJ5Lm1hdGNoZXNQYXR0ZXJuKHJlc291cmNlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeS5nZXRDb21iaW5lZFNjaGVtYSh0aGlzKS5nZXRSZXNvbHZlZFNjaGVtYSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfVxuICAgIGNyZWF0ZUNvbWJpbmVkU2NoZW1hKGNvbWJpbmVkU2NoZW1hSWQsIHNjaGVtYUlkcykge1xuICAgICAgICBpZiAoc2NoZW1hSWRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUoc2NoZW1hSWRzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBjb21iaW5lZFNjaGVtYSA9IHtcbiAgICAgICAgICAgICAgICBhbGxPZjogc2NoZW1hSWRzLm1hcChzY2hlbWFJZCA9PiAoeyAkcmVmOiBzY2hlbWFJZCB9KSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRTY2hlbWFIYW5kbGUoY29tYmluZWRTY2hlbWFJZCwgY29tYmluZWRTY2hlbWEpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gdG9EaXNwbGF5U3RyaW5nKHVybCkge1xuICAgIHRyeSB7XG4gICAgICAgIGxldCB1cmkgPSBVUkkucGFyc2UodXJsKTtcbiAgICAgICAgaWYgKHVyaS5zY2hlbWUgPT09ICdmaWxlJykge1xuICAgICAgICAgICAgcmV0dXJuIHVyaS5mc1BhdGg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
