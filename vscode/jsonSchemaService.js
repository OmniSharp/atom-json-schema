'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONSchemaService = exports.ResolvedSchema = exports.UnresolvedSchema = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _json = require("./common/json");

var _json2 = _interopRequireDefault(_json);

var _http = require("./common/http");

var _http2 = _interopRequireDefault(_http);

var _strings = require("./common/strings");

var _strings2 = _interopRequireDefault(_strings);

var _uri = require("./common/uri");

var _uri2 = _interopRequireDefault(_uri);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _disposables = require("../disposables");

var _requestLight = require("request-light");

var _requestLight2 = _interopRequireDefault(_requestLight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = undefined && undefined.__param || function (paramIndex, decorator) {
    return function (target, key) {
        decorator(target, key, paramIndex);
    };
};

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
        key: "addSchema",
        value: function addSchema(id) {
            this.schemas.push(id);
            this.combinedSchema = null;
        }
    }, {
        key: "matchesPattern",
        value: function matchesPattern(fileName) {
            return this.patternRegExp && this.patternRegExp.test(fileName);
        }
    }, {
        key: "getCombinedSchema",
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
        key: "getUnresolvedSchema",
        value: function getUnresolvedSchema() {
            if (!this.unresolvedSchema) {
                this.unresolvedSchema = this.service.loadSchema(this.url);
            }
            return this.unresolvedSchema;
        }
    }, {
        key: "getResolvedSchema",
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
        key: "clearSchema",
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
        key: "getSection",
        value: function getSection(path) {
            return this.getSectionRecursive(path, this.schema);
        }
    }, {
        key: "getSectionRecursive",
        value: function getSectionRecursive(path, schema) {
            var _this2 = this;

            if (!schema || path.length === 0) {
                return schema;
            }
            var next = path.shift();
            if (schema.properties && schema.properties[next]) {
                return this.getSectionRecursive(path, schema.properties[next]);
            } else if (_lodash2.default.isObject(schema.patternProperties)) {
                Object.keys(schema.patternProperties).forEach(function (pattern) {
                    var regex = new RegExp(pattern);
                    if (regex.test(next)) {
                        return _this2.getSectionRecursive(path, schema.patternProperties[pattern]);
                    }
                });
            } else if (_lodash2.default.isObject(schema.additionalProperties)) {
                return this.getSectionRecursive(path, schema.additionalProperties);
            } else if (next.match('[0-9]+')) {
                if (_lodash2.default.isObject(schema.items)) {
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
    function JSONSchemaService(contextService) {
        _classCallCheck(this, JSONSchemaService);

        this.contextService = contextService;
        this.callOnDispose = new _disposables.CompositeDisposable();
        this.contributionSchemas = {};
        this.contributionAssociations = {};
        this.schemasById = {};
        this.filePatternAssociations = [];
        this.filePatternAssociationById = {};
    }

    _createClass(JSONSchemaService, [{
        key: "dispose",
        value: function dispose() {
            this.callOnDispose.dispose();
        }
    }, {
        key: "normalizeId",
        value: function normalizeId(id) {
            if (id.length > 0 && id.charAt(id.length - 1) === '#') {
                return id.substring(0, id.length - 1);
            }
            return id;
        }
    }, {
        key: "addSchemaHandle",
        value: function addSchemaHandle(id, unresolvedSchemaContent) {
            var schemaHandle = new SchemaHandle(this, id, unresolvedSchemaContent);
            this.schemasById[id] = schemaHandle;
            return schemaHandle;
        }
    }, {
        key: "getOrAddSchemaHandle",
        value: function getOrAddSchemaHandle(id, unresolvedSchemaContent) {
            return this.schemasById[id] || this.addSchemaHandle(id, unresolvedSchemaContent);
        }
    }, {
        key: "getOrAddFilePatternAssociation",
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
        key: "registerExternalSchema",
        value: function registerExternalSchema(uri) {
            var _this3 = this;

            var filePatterns = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            var unresolvedSchemaContent = arguments[2];

            var id = this.normalizeId(uri);
            if (filePatterns) {
                filePatterns.forEach(function (pattern) {
                    _this3.getOrAddFilePatternAssociation(pattern).addSchema(uri);
                });
            }
            return unresolvedSchemaContent ? this.addSchemaHandle(id, unresolvedSchemaContent) : this.getOrAddSchemaHandle(id);
        }
    }, {
        key: "clearExternalSchemas",
        value: function clearExternalSchemas() {
            var _this4 = this;

            this.schemasById = {};
            this.filePatternAssociations = [];
            this.filePatternAssociationById = {};
            for (var id in this.contributionSchemas) {
                this.schemasById[id] = this.contributionSchemas[id];
            }
            for (var pattern in this.contributionAssociations) {
                var fpa = this.getOrAddFilePatternAssociation(pattern);
                this.contributionAssociations[pattern].forEach(function (schemaId) {
                    var id = _this4.normalizeId(schemaId);
                    fpa.addSchema(id);
                });
            }
        }
    }, {
        key: "getResolvedSchema",
        value: function getResolvedSchema(schemaId) {
            var id = this.normalizeId(schemaId);
            var schemaHandle = this.schemasById[id];
            if (schemaHandle) {
                return schemaHandle.getResolvedSchema();
            }
            return Promise.resolve(null);
        }
    }, {
        key: "loadSchema",
        value: function loadSchema(url) {
            return _requestLight2.default.xhr({ url: url }).then(function (request) {
                var content = request.responseText;
                if (!content) {
                    var errorMessage = "Unable to load schema from '" + toDisplayString(url) + "': No content.";
                    return new UnresolvedSchema({}, [errorMessage]);
                }
                var schemaContent = {};
                var jsonErrors = [];
                schemaContent = _json2.default.parse(content, jsonErrors);
                var errors = jsonErrors.length ? ["Unable to parse content from '" + toDisplayString(url) + "': " + _json2.default.getParseErrorMessage(jsonErrors[0].error) + "."] : [];
                return new UnresolvedSchema(schemaContent, errors);
            }, function (error) {
                var errorMessage = "Unable to load schema from '" + toDisplayString(url) + "': " + (error.responseText || _http2.default.getErrorStatusDescription(error.status) || error.toString());
                return new UnresolvedSchema({}, [errorMessage]);
            });
        }
    }, {
        key: "resolveSchemaContent",
        value: function resolveSchemaContent(schemaToResolve) {
            var _this5 = this;

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
                if ((typeof section === "undefined" ? "undefined" : _typeof(section)) === 'object') {
                    _lodash2.default.mixin(node, section, false);
                } else {
                    resolveErrors.push("$ref '" + linkPath + "' in " + linkedSchema.id + " can not be resolved.");
                }
                delete node.$ref;
            };
            var resolveExternalLink = function resolveExternalLink(node, uri, linkPath) {
                return _this5.getOrAddSchemaHandle(uri).getUnresolvedSchema().then(function (unresolvedSchema) {
                    if (unresolvedSchema.errors.length) {
                        var loc = linkPath ? uri + '#' + linkPath : uri;
                        resolveErrors.push("Problems loading reference '" + loc + "': " + unresolvedSchema.errors[0]);
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

                            if ((typeof entry === "undefined" ? "undefined" : _typeof(entry)) === 'object') {
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

                            if ((typeof map === "undefined" ? "undefined" : _typeof(map)) === 'object') {
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
        key: "getSchemaForResource",
        value: function getSchemaForResource(resource, document) {
            if (document && document.root && document.root.type === 'object') {
                var schemaProperties = document.root.properties.filter(function (p) {
                    return p.key.value === '$schema' && !!p.value;
                });
                if (schemaProperties.length > 0) {
                    var schemeId = schemaProperties[0].value.getValue();
                    if (!_strings2.default.startsWith(schemeId, 'http://') && !_strings2.default.startsWith(schemeId, 'https://') && !_strings2.default.startsWith(schemeId, 'file://')) {
                        var resourceURL = this.contextService.toResource(schemeId);
                        if (resourceURL) {
                            schemeId = resourceURL.toString();
                        }
                    }
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
        key: "createCombinedSchema",
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

exports.JSONSchemaService = JSONSchemaService = __decorate([__param(0, IWorkspaceContextService)], JSONSchemaService);
function toDisplayString(url) {
    try {
        var uri = _uri2.default.parse(url);
        if (uri.scheme === 'file') {
            return uri.fsPath;
        }
    } catch (e) {}
    return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9qc29uU2NoZW1hU2VydmljZS50cyIsInZzY29kZS9qc29uU2NoZW1hU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQTs7Ozs7Ozs7Ozs7QUNLQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBZkEsSUFBSSxhQUFjLGFBQVEsVUFBSyxVQUFkLElBQTZCLFVBQVUsVUFBVixFQUFzQixNQUF0QixFQUE4QixHQUE5QixFQUFtQyxJQUFuQyxFQUF5QztBQUNuRixRQUFJLElBQUksVUFBVSxNQUFsQjtRQUEwQixJQUFJLElBQUksQ0FBSixHQUFRLE1BQVIsR0FBaUIsU0FBUyxJQUFULEdBQWdCLE9BQU8sT0FBTyx3QkFBUCxDQUFnQyxNQUFoQyxFQUF3QyxHQUF4QyxDQUF2QixHQUFzRSxJQUFySDtRQUEySCxDQUEzSDtBQUNBLFFBQUksUUFBTyxPQUFQLHlDQUFPLE9BQVAsT0FBbUIsUUFBbkIsSUFBK0IsT0FBTyxRQUFRLFFBQWYsS0FBNEIsVUFBL0QsRUFBMkUsSUFBSSxRQUFRLFFBQVIsQ0FBaUIsVUFBakIsRUFBNkIsTUFBN0IsRUFBcUMsR0FBckMsRUFBMEMsSUFBMUMsQ0FBSixDQUEzRSxLQUNLLEtBQUssSUFBSSxJQUFJLFdBQVcsTUFBWCxHQUFvQixDQUFqQyxFQUFvQyxLQUFLLENBQXpDLEVBQTRDLEdBQTVDO0FBQWlELFlBQUksSUFBSSxXQUFXLENBQVgsQ0FBUixFQUF1QixJQUFJLENBQUMsSUFBSSxDQUFKLEdBQVEsRUFBRSxDQUFGLENBQVIsR0FBZSxJQUFJLENBQUosR0FBUSxFQUFFLE1BQUYsRUFBVSxHQUFWLEVBQWUsQ0FBZixDQUFSLEdBQTRCLEVBQUUsTUFBRixFQUFVLEdBQVYsQ0FBNUMsS0FBK0QsQ0FBbkU7QUFBeEUsS0FDTCxPQUFPLElBQUksQ0FBSixJQUFTLENBQVQsSUFBYyxPQUFPLGNBQVAsQ0FBc0IsTUFBdEIsRUFBOEIsR0FBOUIsRUFBbUMsQ0FBbkMsQ0FBZCxFQUFxRCxDQUE1RDtBQUNILENBTEQ7QUFNQSxJQUFJLFVBQVcsYUFBUSxVQUFLLE9BQWQsSUFBMEIsVUFBVSxVQUFWLEVBQXNCLFNBQXRCLEVBQWlDO0FBQ3JFLFdBQU8sVUFBVSxNQUFWLEVBQWtCLEdBQWxCLEVBQXVCO0FBQUUsa0JBQVUsTUFBVixFQUFrQixHQUFsQixFQUF1QixVQUF2QjtBQUFxQyxLQUFyRTtBQUNILENBRkQ7O0lENkRBLHNCO0FBT0ksb0NBQVksT0FBWixFQUEyQjtBQUFBOztBQUN2QixhQUFLLGdCQUFMLEdBQXdCLDRCQUE0QixtQkFBbUIsT0FBbkIsQ0FBcEQ7QUFDQSxZQUFJO0FBQ0EsaUJBQUssYUFBTCxHQUFxQixJQUFJLE1BQUosQ0FBVyxrQkFBUSwyQkFBUixDQUFvQyxPQUFwQyxJQUErQyxHQUExRCxDQUFyQjtBQUNGLFNBRkYsQ0FFRSxPQUFPLENBQVAsRUFBVTtBQUVSLGlCQUFLLGFBQUwsR0FBcUIsSUFBckI7QUFDSDtBQUNELGFBQUssT0FBTCxHQUFlLEVBQWY7QUFDQSxhQUFLLGNBQUwsR0FBc0IsSUFBdEI7QUFDSDs7OztrQ0FFZ0IsRSxFQUFVO0FBQ3ZCLGlCQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLEVBQWxCO0FBQ0EsaUJBQUssY0FBTCxHQUFzQixJQUF0QjtBQUNIOzs7dUNBRXFCLFEsRUFBZ0I7QUFDbEMsbUJBQU8sS0FBSyxhQUFMLElBQXNCLEtBQUssYUFBTCxDQUFtQixJQUFuQixDQUF3QixRQUF4QixDQUE3QjtBQUNIOzs7MENBRXdCLE8sRUFBMEI7QUFDL0MsZ0JBQUksQ0FBQyxLQUFLLGNBQVYsRUFBMEI7QUFDdEIscUJBQUssY0FBTCxHQUFzQixRQUFRLG9CQUFSLENBQTZCLEtBQUssZ0JBQWxDLEVBQW9ELEtBQUssT0FBekQsQ0FBdEI7QUFDSDtBQUNELG1CQUFPLEtBQUssY0FBWjtBQUNIOzs7Ozs7SUFHTCxZO0FBUUksMEJBQVksT0FBWixFQUF3QyxHQUF4QyxFQUFvRCx1QkFBcEQsRUFBeUY7QUFBQTs7QUFDckYsYUFBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLGFBQUssR0FBTCxHQUFXLEdBQVg7QUFDQSxZQUFJLHVCQUFKLEVBQTZCO0FBQ3pCLGlCQUFLLGdCQUFMLEdBQXdCLFFBQVEsT0FBUixDQUFnQixJQUFJLGdCQUFKLENBQXFCLHVCQUFyQixDQUFoQixDQUF4QjtBQUNIO0FBQ0o7Ozs7OENBRXlCO0FBQ3RCLGdCQUFJLENBQUMsS0FBSyxnQkFBVixFQUE0QjtBQUN4QixxQkFBSyxnQkFBTCxHQUF3QixLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLEtBQUssR0FBN0IsQ0FBeEI7QUFDSDtBQUNELG1CQUFPLEtBQUssZ0JBQVo7QUFDSDs7OzRDQUV1QjtBQUFBOztBQUNwQixnQkFBSSxDQUFDLEtBQUssY0FBVixFQUEwQjtBQUN0QixxQkFBSyxjQUFMLEdBQXNCLEtBQUssbUJBQUwsR0FBMkIsSUFBM0IsQ0FBZ0Msc0JBQVU7QUFDNUQsMkJBQU8sTUFBSyxPQUFMLENBQWEsb0JBQWIsQ0FBa0MsVUFBbEMsQ0FBUDtBQUNILGlCQUZxQixDQUF0QjtBQUdIO0FBQ0QsbUJBQU8sS0FBSyxjQUFaO0FBQ0g7OztzQ0FFaUI7QUFDZCxpQkFBSyxjQUFMLEdBQXNCLElBQXRCO0FBQ0EsaUJBQUssZ0JBQUwsR0FBd0IsSUFBeEI7QUFDSDs7Ozs7O0lBR0wsZ0IsV0FBQSxnQixHQUlJLDBCQUFZLE1BQVosRUFBc0Q7QUFBQSxRQUFyQixNQUFxQix5REFBRixFQUFFOztBQUFBOztBQUNsRCxTQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsU0FBSyxNQUFMLEdBQWMsTUFBZDtBQUNILEM7O0lBR0wsYyxXQUFBLGM7QUFJSSw0QkFBWSxNQUFaLEVBQXNEO0FBQUEsWUFBckIsTUFBcUIseURBQUYsRUFBRTs7QUFBQTs7QUFDbEQsYUFBSyxNQUFMLEdBQWMsTUFBZDtBQUNBLGFBQUssTUFBTCxHQUFjLE1BQWQ7QUFDSDs7OzttQ0FFaUIsSSxFQUFjO0FBQzVCLG1CQUFPLEtBQUssbUJBQUwsQ0FBeUIsSUFBekIsRUFBK0IsS0FBSyxNQUFwQyxDQUFQO0FBQ0g7Ozs0Q0FFMkIsSSxFQUFnQixNLEVBQW1CO0FBQUE7O0FBQzNELGdCQUFJLENBQUMsTUFBRCxJQUFXLEtBQUssTUFBTCxLQUFnQixDQUEvQixFQUFrQztBQUM5Qix1QkFBTyxNQUFQO0FBQ0g7QUFDRCxnQkFBSSxPQUFPLEtBQUssS0FBTCxFQUFYO0FBRUEsZ0JBQUksT0FBTyxVQUFQLElBQXFCLE9BQU8sVUFBUCxDQUFrQixJQUFsQixDQUF6QixFQUFrRDtBQUM5Qyx1QkFBTyxLQUFLLG1CQUFMLENBQXlCLElBQXpCLEVBQStCLE9BQU8sVUFBUCxDQUFrQixJQUFsQixDQUEvQixDQUFQO0FBQ0gsYUFGRCxNQUVPLElBQUksaUJBQUUsUUFBRixDQUFXLE9BQU8saUJBQWxCLENBQUosRUFBMEM7QUFDN0MsdUJBQU8sSUFBUCxDQUFZLE9BQU8saUJBQW5CLEVBQXNDLE9BQXRDLENBQThDLFVBQUMsT0FBRCxFQUFRO0FBQ2xELHdCQUFJLFFBQVEsSUFBSSxNQUFKLENBQVcsT0FBWCxDQUFaO0FBQ0Esd0JBQUksTUFBTSxJQUFOLENBQVcsSUFBWCxDQUFKLEVBQXNCO0FBQ2xCLCtCQUFPLE9BQUssbUJBQUwsQ0FBeUIsSUFBekIsRUFBK0IsT0FBTyxpQkFBUCxDQUF5QixPQUF6QixDQUEvQixDQUFQO0FBQ0g7QUFDSixpQkFMRDtBQU1ILGFBUE0sTUFPQSxJQUFJLGlCQUFFLFFBQUYsQ0FBVyxPQUFPLG9CQUFsQixDQUFKLEVBQTZDO0FBQ2hELHVCQUFPLEtBQUssbUJBQUwsQ0FBeUIsSUFBekIsRUFBK0IsT0FBTyxvQkFBdEMsQ0FBUDtBQUNILGFBRk0sTUFFQSxJQUFJLEtBQUssS0FBTCxDQUFXLFFBQVgsQ0FBSixFQUEwQjtBQUM3QixvQkFBSSxpQkFBRSxRQUFGLENBQVcsT0FBTyxLQUFsQixDQUFKLEVBQThCO0FBQzFCLDJCQUFPLEtBQUssbUJBQUwsQ0FBeUIsSUFBekIsRUFBK0IsT0FBTyxLQUF0QyxDQUFQO0FBQ0gsaUJBRkQsTUFFTyxJQUFJLE1BQU0sT0FBTixDQUFjLE9BQU8sS0FBckIsQ0FBSixFQUFpQztBQUNwQyx3QkFBSTtBQUNBLDRCQUFJLFFBQVEsU0FBUyxJQUFULEVBQWUsRUFBZixDQUFaO0FBQ0EsNEJBQUksT0FBTyxLQUFQLENBQWEsS0FBYixDQUFKLEVBQXlCO0FBQ3JCLG1DQUFPLEtBQUssbUJBQUwsQ0FBeUIsSUFBekIsRUFBK0IsT0FBTyxLQUFQLENBQWEsS0FBYixDQUEvQixDQUFQO0FBQ0g7QUFDRCwrQkFBTyxJQUFQO0FBRUoscUJBUEEsQ0FPQSxPQUFPLENBQVAsRUFBVTtBQUNOLCtCQUFPLElBQVA7QUFDSDtBQUNKO0FBQ0o7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7Ozs7OztJQUdMLGlCLFdBQUEsaUI7QUFZSSwrQkFDOEIsY0FEOUIsRUFDdUU7QUFBQTs7QUFDbkUsYUFBSyxjQUFMLEdBQXNCLGNBQXRCO0FBQ0EsYUFBSyxhQUFMLEdBQXFCLHNDQUFyQjtBQU1BLGFBQUssbUJBQUwsR0FBMkIsRUFBM0I7QUFDQSxhQUFLLHdCQUFMLEdBQWdDLEVBQWhDO0FBQ0EsYUFBSyxXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsYUFBSyx1QkFBTCxHQUErQixFQUEvQjtBQUNBLGFBQUssMEJBQUwsR0FBa0MsRUFBbEM7QUFDSDs7OztrQ0FFYTtBQUNWLGlCQUFLLGFBQUwsQ0FBbUIsT0FBbkI7QUFDSDs7O29DQVVtQixFLEVBQVU7QUFDMUIsZ0JBQUksR0FBRyxNQUFILEdBQVksQ0FBWixJQUFpQixHQUFHLE1BQUgsQ0FBVSxHQUFHLE1BQUgsR0FBWSxDQUF0QixNQUE2QixHQUFsRCxFQUF1RDtBQUNuRCx1QkFBTyxHQUFHLFNBQUgsQ0FBYSxDQUFiLEVBQWdCLEdBQUcsTUFBSCxHQUFZLENBQTVCLENBQVA7QUFDSDtBQUNELG1CQUFPLEVBQVA7QUFDSDs7O3dDQVl1QixFLEVBQVcsdUIsRUFBcUM7QUFDcEUsZ0JBQUksZUFBZSxJQUFJLFlBQUosQ0FBaUIsSUFBakIsRUFBdUIsRUFBdkIsRUFBMkIsdUJBQTNCLENBQW5CO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixFQUFqQixJQUF1QixZQUF2QjtBQUNBLG1CQUFPLFlBQVA7QUFDSDs7OzZDQUU0QixFLEVBQVcsdUIsRUFBcUM7QUFDekUsbUJBQU8sS0FBSyxXQUFMLENBQWlCLEVBQWpCLEtBQXdCLEtBQUssZUFBTCxDQUFxQixFQUFyQixFQUF5Qix1QkFBekIsQ0FBL0I7QUFDSDs7O3VEQUVzQyxPLEVBQWU7QUFDbEQsZ0JBQUksTUFBTSxLQUFLLDBCQUFMLENBQWdDLE9BQWhDLENBQVY7QUFDQSxnQkFBSSxDQUFDLEdBQUwsRUFBVTtBQUNOLHNCQUFNLElBQUksc0JBQUosQ0FBMkIsT0FBM0IsQ0FBTjtBQUNBLHFCQUFLLDBCQUFMLENBQWdDLE9BQWhDLElBQTJDLEdBQTNDO0FBQ0EscUJBQUssdUJBQUwsQ0FBNkIsSUFBN0IsQ0FBa0MsR0FBbEM7QUFDSDtBQUNELG1CQUFPLEdBQVA7QUFDSDs7OytDQUU2QixHLEVBQWdGO0FBQUE7O0FBQUEsZ0JBQXBFLFlBQW9FLHlEQUEzQyxJQUEyQztBQUFBLGdCQUFyQyx1QkFBcUM7O0FBQzFHLGdCQUFJLEtBQUssS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQVQ7QUFFQSxnQkFBSSxZQUFKLEVBQWtCO0FBQ2QsNkJBQWEsT0FBYixDQUFxQixtQkFBTztBQUN4QiwyQkFBSyw4QkFBTCxDQUFvQyxPQUFwQyxFQUE2QyxTQUE3QyxDQUF1RCxHQUF2RDtBQUNILGlCQUZEO0FBR0g7QUFDRCxtQkFBTywwQkFBMEIsS0FBSyxlQUFMLENBQXFCLEVBQXJCLEVBQXlCLHVCQUF6QixDQUExQixHQUE4RSxLQUFLLG9CQUFMLENBQTBCLEVBQTFCLENBQXJGO0FBQ0g7OzsrQ0FFMEI7QUFBQTs7QUFDdkIsaUJBQUssV0FBTCxHQUFtQixFQUFuQjtBQUNBLGlCQUFLLHVCQUFMLEdBQStCLEVBQS9CO0FBQ0EsaUJBQUssMEJBQUwsR0FBa0MsRUFBbEM7QUFFQSxpQkFBSyxJQUFJLEVBQVQsSUFBZSxLQUFLLG1CQUFwQixFQUF5QztBQUNyQyxxQkFBSyxXQUFMLENBQWlCLEVBQWpCLElBQXVCLEtBQUssbUJBQUwsQ0FBeUIsRUFBekIsQ0FBdkI7QUFDSDtBQUNELGlCQUFLLElBQUksT0FBVCxJQUFvQixLQUFLLHdCQUF6QixFQUFtRDtBQUMvQyxvQkFBSSxNQUFNLEtBQUssOEJBQUwsQ0FBb0MsT0FBcEMsQ0FBVjtBQUVBLHFCQUFLLHdCQUFMLENBQThCLE9BQTlCLEVBQXVDLE9BQXZDLENBQStDLG9CQUFRO0FBQ25ELHdCQUFJLEtBQUssT0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQVQ7QUFDQSx3QkFBSSxTQUFKLENBQWMsRUFBZDtBQUNILGlCQUhEO0FBSUg7QUFDSjs7OzBDQUV3QixRLEVBQWU7QUFDcEMsZ0JBQUksS0FBSyxLQUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBVDtBQUNBLGdCQUFJLGVBQWUsS0FBSyxXQUFMLENBQWlCLEVBQWpCLENBQW5CO0FBQ0EsZ0JBQUksWUFBSixFQUFrQjtBQUNkLHVCQUFPLGFBQWEsaUJBQWIsRUFBUDtBQUNIO0FBQ0QsbUJBQU8sUUFBUSxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDSDs7O21DQUVpQixHLEVBQVU7QUFDeEIsbUJBQU8sdUJBQVEsR0FBUixDQUFZLEVBQUUsS0FBSyxHQUFQLEVBQVosRUFBMEIsSUFBMUIsQ0FDSCxtQkFBTztBQUNILG9CQUFJLFVBQVUsUUFBUSxZQUF0QjtBQUNBLG9CQUFJLENBQUMsT0FBTCxFQUFjO0FBQ1Ysd0JBQUksZ0RBQThDLGdCQUFnQixHQUFoQixDQUE5QyxtQkFBSjtBQUNBLDJCQUFPLElBQUksZ0JBQUosQ0FBbUMsRUFBbkMsRUFBdUMsQ0FBRSxZQUFGLENBQXZDLENBQVA7QUFDSDtBQUVELG9CQUFJLGdCQUE2QixFQUFqQztBQUNBLG9CQUFJLGFBQWdDLEVBQXBDO0FBQ0EsZ0NBQWdCLGVBQUssS0FBTCxDQUFXLE9BQVgsRUFBb0IsVUFBcEIsQ0FBaEI7QUFDQSxvQkFBSSxTQUFTLFdBQVcsTUFBWCxHQUFvQixvQ0FBbUMsZ0JBQWdCLEdBQWhCLENBQW5DLFdBQTZELGVBQUssb0JBQUwsQ0FBMEIsV0FBVyxDQUFYLEVBQWMsS0FBeEMsQ0FBN0QsT0FBcEIsR0FBc0ksRUFBbko7QUFDQSx1QkFBTyxJQUFJLGdCQUFKLENBQXFCLGFBQXJCLEVBQW9DLE1BQXBDLENBQVA7QUFDSCxhQWJFLEVBY0gsVUFBQyxLQUFELEVBQTBCO0FBQ3RCLG9CQUFJLGdEQUE4QyxnQkFBZ0IsR0FBaEIsQ0FBOUMsWUFBd0UsTUFBTSxZQUFOLElBQXNCLGVBQUsseUJBQUwsQ0FBK0IsTUFBTSxNQUFyQyxDQUF0QixJQUFzRSxNQUFNLFFBQU4sRUFBOUksQ0FBSjtBQUNBLHVCQUFPLElBQUksZ0JBQUosQ0FBbUMsRUFBbkMsRUFBdUMsQ0FBRSxZQUFGLENBQXZDLENBQVA7QUFDSCxhQWpCRSxDQUFQO0FBbUJIOzs7NkNBRTJCLGUsRUFBaUM7QUFBQTs7QUFFekQsZ0JBQUksZ0JBQTJCLGdCQUFnQixNQUFoQixDQUF1QixLQUF2QixDQUE2QixDQUE3QixDQUEvQjtBQUNBLGdCQUFJLFNBQVMsZ0JBQWdCLE1BQTdCO0FBRUEsZ0JBQUksY0FBYyxTQUFkLFdBQWMsQ0FBQyxNQUFELEVBQXNCLElBQXRCLEVBQWtDO0FBQ2hELG9CQUFJLENBQUMsSUFBTCxFQUFXO0FBQ1AsMkJBQU8sTUFBUDtBQUNIO0FBQ0Qsb0JBQUksVUFBZSxNQUFuQjtBQUNBLHFCQUFLLE1BQUwsQ0FBWSxDQUFaLEVBQWUsS0FBZixDQUFxQixHQUFyQixFQUEwQixJQUExQixDQUErQixVQUFDLElBQUQsRUFBSztBQUNoQyw4QkFBVSxRQUFRLElBQVIsQ0FBVjtBQUNBLDJCQUFPLENBQUMsT0FBUjtBQUNILGlCQUhEO0FBSUEsdUJBQU8sT0FBUDtBQUNILGFBVkQ7QUFZQSxnQkFBSSxjQUFjLFNBQWQsV0FBYyxDQUFDLElBQUQsRUFBWSxZQUFaLEVBQXVDLFFBQXZDLEVBQXVEO0FBQ3JFLG9CQUFJLFVBQVUsWUFBWSxZQUFaLEVBQTBCLFFBQTFCLENBQWQ7QUFDQSxvQkFBSSxRQUFPLE9BQVAseUNBQU8sT0FBUCxPQUFtQixRQUF2QixFQUFpQztBQUM3QixxQ0FBRSxLQUFGLENBQVEsSUFBUixFQUFjLE9BQWQsRUFBdUIsS0FBdkI7QUFDSCxpQkFGRCxNQUVPO0FBQ0gsa0NBQWMsSUFBZCxZQUE0QixRQUE1QixhQUE0QyxhQUFhLEVBQXpEO0FBQ0g7QUFDRCx1QkFBTyxLQUFLLElBQVo7QUFDSCxhQVJEO0FBVUEsZ0JBQUksc0JBQXNCLFNBQXRCLG1CQUFzQixDQUFDLElBQUQsRUFBWSxHQUFaLEVBQXlCLFFBQXpCLEVBQXlDO0FBQy9ELHVCQUFPLE9BQUssb0JBQUwsQ0FBMEIsR0FBMUIsRUFBK0IsbUJBQS9CLEdBQXFELElBQXJELENBQTBELDRCQUFnQjtBQUM3RSx3QkFBSSxpQkFBaUIsTUFBakIsQ0FBd0IsTUFBNUIsRUFBb0M7QUFDaEMsNEJBQUksTUFBTSxXQUFXLE1BQU0sR0FBTixHQUFZLFFBQXZCLEdBQWtDLEdBQTVDO0FBQ0Esc0NBQWMsSUFBZCxrQ0FBa0QsR0FBbEQsV0FBMkQsaUJBQWlCLE1BQWpCLENBQXdCLENBQXhCLENBQTNEO0FBQ0g7QUFDRCxnQ0FBWSxJQUFaLEVBQWtCLGlCQUFpQixNQUFuQyxFQUEyQyxRQUEzQztBQUNBLDJCQUFPLFlBQVksSUFBWixFQUFrQixpQkFBaUIsTUFBbkMsQ0FBUDtBQUNILGlCQVBNLENBQVA7QUFRSCxhQVREO0FBV0EsZ0JBQUksY0FBYyxTQUFkLFdBQWMsQ0FBQyxJQUFELEVBQW9CLFlBQXBCLEVBQTZDO0FBQzNELG9CQUFJLFNBQXlCLENBQUMsSUFBRCxDQUE3QjtBQUNBLG9CQUFJLE9BQXNCLEVBQTFCO0FBRUEsb0JBQUksZUFBK0IsRUFBbkM7QUFFQSxvQkFBSSxpQkFBaUIsU0FBakIsY0FBaUIsR0FBMEI7QUFBQSxzREFBdEIsT0FBc0I7QUFBdEIsK0JBQXNCO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQzNDLDZDQUFrQixPQUFsQiw4SEFBMkI7QUFBQSxnQ0FBbEIsS0FBa0I7O0FBQ3ZCLGdDQUFJLFFBQU8sS0FBUCx5Q0FBTyxLQUFQLE9BQWlCLFFBQXJCLEVBQStCO0FBQzNCLHVDQUFPLElBQVAsQ0FBWSxLQUFaO0FBQ0g7QUFDSjtBQUwwQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTTlDLGlCQU5EO0FBT0Esb0JBQUksb0JBQW9CLFNBQXBCLGlCQUFvQixHQUEwQjtBQUFBLHVEQUF0QixJQUFzQjtBQUF0Qiw0QkFBc0I7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDOUMsOENBQWdCLElBQWhCLG1JQUFzQjtBQUFBLGdDQUFiLEdBQWE7O0FBQ2xCLGdDQUFJLFFBQU8sR0FBUCx5Q0FBTyxHQUFQLE9BQWUsUUFBbkIsRUFBNkI7QUFDekIscUNBQUssSUFBSSxHQUFULElBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLHdDQUFJLFFBQVEsSUFBSSxHQUFKLENBQVo7QUFDQSwyQ0FBTyxJQUFQLENBQVksS0FBWjtBQUNIO0FBQ0o7QUFDSjtBQVI2QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBU2pELGlCQVREO0FBVUEsb0JBQUksc0JBQXNCLFNBQXRCLG1CQUFzQixHQUEyQjtBQUFBLHVEQUF2QixNQUF1QjtBQUF2Qiw4QkFBdUI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDakQsOENBQWtCLE1BQWxCLG1JQUEwQjtBQUFBLGdDQUFqQixLQUFpQjs7QUFDdEIsZ0NBQUksTUFBTSxPQUFOLENBQWMsS0FBZCxDQUFKLEVBQTBCO0FBQ3RCLHVDQUFPLElBQVAsQ0FBWSxLQUFaLENBQWtCLE1BQWxCLEVBQTBCLEtBQTFCO0FBQ0g7QUFDSjtBQUxnRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBTXBELGlCQU5EO0FBT0EsdUJBQU8sT0FBTyxNQUFkLEVBQXNCO0FBQ2xCLHdCQUFJLE9BQU8sT0FBTyxHQUFQLEVBQVg7QUFDQSx3QkFBSSxLQUFLLE9BQUwsQ0FBYSxJQUFiLEtBQXNCLENBQTFCLEVBQTZCO0FBQ3pCO0FBQ0g7QUFDRCx5QkFBSyxJQUFMLENBQVUsSUFBVjtBQUNBLHdCQUFJLEtBQUssSUFBVCxFQUFlO0FBQ1gsNEJBQUksV0FBVyxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLEdBQWhCLEVBQXFCLENBQXJCLENBQWY7QUFDQSw0QkFBSSxTQUFTLENBQVQsRUFBWSxNQUFaLEdBQXFCLENBQXpCLEVBQTRCO0FBQ3hCLHlDQUFhLElBQWIsQ0FBa0Isb0JBQW9CLElBQXBCLEVBQTBCLFNBQVMsQ0FBVCxDQUExQixFQUF1QyxTQUFTLENBQVQsQ0FBdkMsQ0FBbEI7QUFDQTtBQUNILHlCQUhELE1BR087QUFDSCx3Q0FBWSxJQUFaLEVBQWtCLFlBQWxCLEVBQWdDLFNBQVMsQ0FBVCxDQUFoQztBQUNIO0FBQ0o7QUFDRCxtQ0FBZSxLQUFLLEtBQXBCLEVBQTJCLEtBQUssb0JBQWhDLEVBQXNELEtBQUssR0FBM0Q7QUFDQSxzQ0FBa0IsS0FBSyxXQUF2QixFQUFvQyxLQUFLLFVBQXpDLEVBQXFELEtBQUssaUJBQTFELEVBQThGLEtBQUssWUFBbkc7QUFDQSx3Q0FBb0IsS0FBSyxLQUF6QixFQUFnQyxLQUFLLEtBQXJDLEVBQTRDLEtBQUssS0FBakQsRUFBd0UsS0FBSyxLQUE3RTtBQUNIO0FBRUQsdUJBQU8sUUFBUSxHQUFSLENBQVksWUFBWixDQUFQO0FBQ0gsYUFuREQ7QUFxREEsbUJBQU8sWUFBWSxNQUFaLEVBQW9CLE1BQXBCLEVBQTRCLElBQTVCLENBQWlDO0FBQUEsdUJBQUssSUFBSSxjQUFKLENBQW1CLE1BQW5CLEVBQTJCLGFBQTNCLENBQUw7QUFBQSxhQUFqQyxDQUFQO0FBQ0g7Ozs2Q0FFMkIsUSxFQUFrQixRLEVBQTZCO0FBR3ZFLGdCQUFJLFlBQVksU0FBUyxJQUFyQixJQUE2QixTQUFTLElBQVQsQ0FBYyxJQUFkLEtBQXVCLFFBQXhELEVBQWtFO0FBQzlELG9CQUFJLG1CQUEyQyxTQUFTLElBQVQsQ0FBZSxVQUFmLENBQTBCLE1BQTFCLENBQWlDLFVBQUMsQ0FBRDtBQUFBLDJCQUFRLEVBQUUsR0FBRixDQUFNLEtBQU4sS0FBZ0IsU0FBakIsSUFBK0IsQ0FBQyxDQUFDLEVBQUUsS0FBMUM7QUFBQSxpQkFBakMsQ0FBL0M7QUFDQSxvQkFBSSxpQkFBaUIsTUFBakIsR0FBMEIsQ0FBOUIsRUFBaUM7QUFDN0Isd0JBQUksV0FBb0IsaUJBQWlCLENBQWpCLEVBQW9CLEtBQXBCLENBQTBCLFFBQTFCLEVBQXhCO0FBQ0Esd0JBQUksQ0FBQyxrQkFBUSxVQUFSLENBQW1CLFFBQW5CLEVBQTZCLFNBQTdCLENBQUQsSUFBNEMsQ0FBQyxrQkFBUSxVQUFSLENBQW1CLFFBQW5CLEVBQTZCLFVBQTdCLENBQTdDLElBQXlGLENBQUMsa0JBQVEsVUFBUixDQUFtQixRQUFuQixFQUE2QixTQUE3QixDQUE5RixFQUF1STtBQUNuSSw0QkFBSSxjQUFjLEtBQUssY0FBTCxDQUFvQixVQUFwQixDQUErQixRQUEvQixDQUFsQjtBQUNBLDRCQUFJLFdBQUosRUFBaUI7QUFDYix1Q0FBVyxZQUFZLFFBQVosRUFBWDtBQUNIO0FBQ0o7QUFDRCx3QkFBSSxRQUFKLEVBQWM7QUFDViw0QkFBSSxLQUFLLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUFUO0FBQ0EsK0JBQU8sS0FBSyxvQkFBTCxDQUEwQixFQUExQixFQUE4QixpQkFBOUIsRUFBUDtBQUNIO0FBQ0o7QUFDSjtBQUdELGlCQUFLLElBQUksSUFBRyxLQUFLLHVCQUFMLENBQTZCLE1BQTdCLEdBQXNDLENBQWxELEVBQXFELEtBQUssQ0FBMUQsRUFBOEQsR0FBOUQsRUFBbUU7QUFDL0Qsb0JBQUksUUFBUSxLQUFLLHVCQUFMLENBQTZCLENBQTdCLENBQVo7QUFDQSxvQkFBSSxNQUFNLGNBQU4sQ0FBcUIsUUFBckIsQ0FBSixFQUFvQztBQUNoQywyQkFBTyxNQUFNLGlCQUFOLENBQXdCLElBQXhCLEVBQThCLGlCQUE5QixFQUFQO0FBQ0g7QUFDSjtBQUNELG1CQUFPLFFBQVEsT0FBUixDQUFnQixJQUFoQixDQUFQO0FBQ0g7Ozs2Q0FFMkIsZ0IsRUFBMEIsUyxFQUFtQjtBQUNyRSxnQkFBSSxVQUFVLE1BQVYsS0FBcUIsQ0FBekIsRUFBNEI7QUFDeEIsdUJBQU8sS0FBSyxvQkFBTCxDQUEwQixVQUFVLENBQVYsQ0FBMUIsQ0FBUDtBQUNILGFBRkQsTUFFTztBQUNILG9CQUFJLGlCQUE4QjtBQUM5QiwyQkFBTyxVQUFVLEdBQVYsQ0FBYztBQUFBLCtCQUFhLEVBQUUsTUFBTSxRQUFSLEVBQWI7QUFBQSxxQkFBZDtBQUR1QixpQkFBbEM7QUFHQSx1QkFBTyxLQUFLLGVBQUwsQ0FBcUIsZ0JBQXJCLEVBQXVDLGNBQXZDLENBQVA7QUFDSDtBQUNKOzs7Ozs7QUFqUUcsUUFiUixpQkFhUSx1QkFBQSxXQUFBLENDb0hKLFFBQVEsQ0FBUixFRHBISyx3QkNvSEwsQ0RwSEksQ0FBQSxFQ3FITCxpQkRySEssQ0FBQTtBQW9RUixTQUFBLGVBQUEsQ0FBeUIsR0FBekIsRUFBbUM7QUFDL0IsUUFBSTtBQUNBLFlBQUksTUFBTSxjQUFJLEtBQUosQ0FBVSxHQUFWLENBQVY7QUFDQSxZQUFJLElBQUksTUFBSixLQUFlLE1BQW5CLEVBQTJCO0FBQ3ZCLG1CQUFPLElBQUksTUFBWDtBQUNIO0FBQ0gsS0FMRixDQUtFLE9BQU8sQ0FBUCxFQUFVLENBRVg7QUFDRCxXQUFPLEdBQVA7QUFDSCIsImZpbGUiOiJ2c2NvZGUvanNvblNjaGVtYVNlcnZpY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBKc29uIGZyb20gJy4vY29tbW9uL2pzb24nO1xyXG5pbXBvcnQgaHR0cCBmcm9tICcuL2NvbW1vbi9odHRwJztcclxuaW1wb3J0IHtJSlNPTlNjaGVtYSwgSUpTT05TY2hlbWFNYXB9IGZyb20gJy4vY29tbW9uL2pzb25TY2hlbWEnO1xyXG5pbXBvcnQgU3RyaW5ncyBmcm9tICcuL2NvbW1vbi9zdHJpbmdzJztcclxuaW1wb3J0IFVSSSBmcm9tICcuL2NvbW1vbi91cmknO1xyXG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XHJcbmltcG9ydCBQYXJzZXIgZnJvbSAnLi9wYXJzZXIvanNvblBhcnNlcic7XHJcbi8vaW1wb3J0IHtJUmVzb3VyY2VTZXJ2aWNlLCBSZXNvdXJjZUV2ZW50cywgSVJlc291cmNlQ2hhbmdlZEV2ZW50fSBmcm9tICd2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3Jlc291cmNlU2VydmljZSc7XHJcbi8vaW1wb3J0IHtJUmVxdWVzdFNlcnZpY2V9IGZyb20gJ3ZzL3BsYXRmb3JtL3JlcXVlc3QvY29tbW9uL3JlcXVlc3QnO1xyXG4vL2ltcG9ydCB7SVdvcmtzcGFjZUNvbnRleHRTZXJ2aWNlfSBmcm9tICd2cy9wbGF0Zm9ybS93b3Jrc3BhY2UvY29tbW9uL3dvcmtzcGFjZSc7XHJcbi8vaW1wb3J0IHtJU2NoZW1hQ29udHJpYnV0aW9uc30gZnJvbSAndnMvcGxhdGZvcm0vanNvbnNjaGVtYXMvY29tbW9uL2pzb25Db250cmlidXRpb25SZWdpc3RyeSc7XHJcbmltcG9ydCB7SURpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gJy4uL2Rpc3Bvc2FibGVzJztcclxuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdC1saWdodCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElKU09OU2NoZW1hU2VydmljZSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcnMgYSBzY2hlbWEgZmlsZSBpbiB0aGUgY3VycmVudCB3b3Jrc3BhY2UgdG8gYmUgYXBwbGljYWJsZSB0byBmaWxlcyB0aGF0IG1hdGNoIHRoZSBwYXR0ZXJuXHJcbiAgICAgKi9cclxuICAgIHJlZ2lzdGVyRXh0ZXJuYWxTY2hlbWEodXJpOnN0cmluZywgZmlsZVBhdHRlcm5zPzogc3RyaW5nW10sIHVucmVzb2x2ZWRTY2hlbWE/OiBJSlNPTlNjaGVtYSk6SVNjaGVtYUhhbmRsZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFycyBhbGwgY2FjaGVkIHNjaGVtYSBmaWxlc1xyXG4gICAgICovXHJcbiAgICBjbGVhckV4dGVybmFsU2NoZW1hcygpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcnMgY29udHJpYnV0ZWQgc2NoZW1hc1xyXG4gICAgICovXHJcbiAgICAvLyBzZXRTY2hlbWFDb250cmlidXRpb25zKHNjaGVtYUNvbnRyaWJ1dGlvbnM6SVNjaGVtYUNvbnRyaWJ1dGlvbnMpOnZvaWQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb29rcyB1cCB0aGUgYXBwcm9wcmlhdGUgc2NoZW1hIGZvciB0aGUgZ2l2ZW4gVVJJXHJcbiAgICAgKi9cclxuICAgIGdldFNjaGVtYUZvclJlc291cmNlKHJlc291cmNlOnN0cmluZywgZG9jdW1lbnQ6IFBhcnNlci5KU09ORG9jdW1lbnQpOlByb21pc2U8UmVzb2x2ZWRTY2hlbWE+O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTY2hlbWFIYW5kbGUge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgc2NoZW1hIGlkXHJcbiAgICAgKi9cclxuICAgIHVybDogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHNjaGVtYSBmcm9tIHRoZSBmaWxlLCB3aXRoIHBvdGVudGlhbCAkcmVmIHJlZmVyZW5jZXNcclxuICAgICAqL1xyXG4gICAgZ2V0VW5yZXNvbHZlZFNjaGVtYSgpOlByb21pc2U8VW5yZXNvbHZlZFNjaGVtYT47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgc2NoZW1hIGZyb20gdGhlIGZpbGUsIHdpdGggcmVmZXJlbmNlcyByZXNvbHZlZFxyXG4gICAgICovXHJcbiAgICBnZXRSZXNvbHZlZFNjaGVtYSgpOlByb21pc2U8UmVzb2x2ZWRTY2hlbWE+O1xyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIElubGluZVJlZmVyZW5jZVBvaW50ZXIge1xyXG4gICAgcGFyZW50OiBhbnk7XHJcbiAgICBrZXk6IGFueTtcclxuICAgIHZhbHVlOiBhbnk7XHJcbn1cclxuXHJcbmNsYXNzIEZpbGVQYXR0ZXJuQXNzb2NpYXRpb24ge1xyXG5cclxuICAgIHByaXZhdGUgc2NoZW1hczogc3RyaW5nW107XHJcbiAgICBwcml2YXRlIGNvbWJpbmVkU2NoZW1hSWQ6IHN0cmluZztcclxuICAgIHByaXZhdGUgcGF0dGVyblJlZ0V4cDogUmVnRXhwO1xyXG4gICAgcHJpdmF0ZSBjb21iaW5lZFNjaGVtYTogSVNjaGVtYUhhbmRsZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwYXR0ZXJuOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2NoZW1hSWQgPSAnbG9jYWw6Ly9jb21iaW5lZFNjaGVtYS8nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhdHRlcm4pO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF0dGVyblJlZ0V4cCA9IG5ldyBSZWdFeHAoU3RyaW5ncy5jb252ZXJ0U2ltcGxlMlJlZ0V4cFBhdHRlcm4ocGF0dGVybikgKyAnJCcpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgLy8gaW52YWxpZCBwYXR0ZXJuXHJcbiAgICAgICAgICAgIHRoaXMucGF0dGVyblJlZ0V4cCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2NoZW1hcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWEgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRTY2hlbWEoaWQ6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuc2NoZW1hcy5wdXNoKGlkKTtcclxuICAgICAgICB0aGlzLmNvbWJpbmVkU2NoZW1hID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWF0Y2hlc1BhdHRlcm4oZmlsZU5hbWU6IHN0cmluZykgOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXR0ZXJuUmVnRXhwICYmIHRoaXMucGF0dGVyblJlZ0V4cC50ZXN0KGZpbGVOYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q29tYmluZWRTY2hlbWEoc2VydmljZTogSlNPTlNjaGVtYVNlcnZpY2UpIDogSVNjaGVtYUhhbmRsZSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNvbWJpbmVkU2NoZW1hKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWEgPSBzZXJ2aWNlLmNyZWF0ZUNvbWJpbmVkU2NoZW1hKHRoaXMuY29tYmluZWRTY2hlbWFJZCwgdGhpcy5zY2hlbWFzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tYmluZWRTY2hlbWE7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFNjaGVtYUhhbmRsZSBpbXBsZW1lbnRzIElTY2hlbWFIYW5kbGUge1xyXG5cclxuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVkU2NoZW1hOiBQcm9taXNlPFJlc29sdmVkU2NoZW1hPjtcclxuICAgIHByaXZhdGUgdW5yZXNvbHZlZFNjaGVtYTogUHJvbWlzZTxVbnJlc29sdmVkU2NoZW1hPjtcclxuICAgIHByaXZhdGUgc2VydmljZTogSlNPTlNjaGVtYVNlcnZpY2U7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2VydmljZTogSlNPTlNjaGVtYVNlcnZpY2UsIHVybDpzdHJpbmcsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50PzogSUpTT05TY2hlbWEpIHtcclxuICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgIGlmICh1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xyXG4gICAgICAgICAgICB0aGlzLnVucmVzb2x2ZWRTY2hlbWEgPSBQcm9taXNlLnJlc29sdmUobmV3IFVucmVzb2x2ZWRTY2hlbWEodW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFVucmVzb2x2ZWRTY2hlbWEoKTpQcm9taXNlPFVucmVzb2x2ZWRTY2hlbWE+IHtcclxuICAgICAgICBpZiAoIXRoaXMudW5yZXNvbHZlZFNjaGVtYSkge1xyXG4gICAgICAgICAgICB0aGlzLnVucmVzb2x2ZWRTY2hlbWEgPSB0aGlzLnNlcnZpY2UubG9hZFNjaGVtYSh0aGlzLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnVucmVzb2x2ZWRTY2hlbWE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFJlc29sdmVkU2NoZW1hKCk6UHJvbWlzZTxSZXNvbHZlZFNjaGVtYT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5yZXNvbHZlZFNjaGVtYSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlc29sdmVkU2NoZW1hID0gdGhpcy5nZXRVbnJlc29sdmVkU2NoZW1hKCkudGhlbih1bnJlc29sdmVkID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2UucmVzb2x2ZVNjaGVtYUNvbnRlbnQodW5yZXNvbHZlZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlZFNjaGVtYTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXJTY2hlbWEoKSA6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucmVzb2x2ZWRTY2hlbWEgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudW5yZXNvbHZlZFNjaGVtYSA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBVbnJlc29sdmVkU2NoZW1hIHtcclxuICAgIHB1YmxpYyBzY2hlbWE6IElKU09OU2NoZW1hO1xyXG4gICAgcHVibGljIGVycm9yczogc3RyaW5nW107XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2NoZW1hOiBJSlNPTlNjaGVtYSwgZXJyb3JzOiBzdHJpbmdbXSA9IFtdKSB7XHJcbiAgICAgICAgdGhpcy5zY2hlbWEgPSBzY2hlbWE7XHJcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZXNvbHZlZFNjaGVtYSB7XHJcbiAgICBwdWJsaWMgc2NoZW1hOiBJSlNPTlNjaGVtYTtcclxuICAgIHB1YmxpYyBlcnJvcnM6IHN0cmluZ1tdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNjaGVtYTogSUpTT05TY2hlbWEsIGVycm9yczogc3RyaW5nW10gPSBbXSkge1xyXG4gICAgICAgIHRoaXMuc2NoZW1hID0gc2NoZW1hO1xyXG4gICAgICAgIHRoaXMuZXJyb3JzID0gZXJyb3JzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRTZWN0aW9uKHBhdGg6IHN0cmluZ1tdKTogSUpTT05TY2hlbWEge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFNlY3Rpb25SZWN1cnNpdmUocGF0aCwgdGhpcy5zY2hlbWEpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoOiBzdHJpbmdbXSwgc2NoZW1hOiBJSlNPTlNjaGVtYSk6IElKU09OU2NoZW1hIHtcclxuICAgICAgICBpZiAoIXNjaGVtYSB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbmV4dCA9IHBhdGguc2hpZnQoKTtcclxuXHJcbiAgICAgICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzICYmIHNjaGVtYS5wcm9wZXJ0aWVzW25leHRdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFNlY3Rpb25SZWN1cnNpdmUocGF0aCwgc2NoZW1hLnByb3BlcnRpZXNbbmV4dF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXy5pc09iamVjdChzY2hlbWEucGF0dGVyblByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykuZm9yRWFjaCgocGF0dGVybikgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChwYXR0ZXJuKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZWdleC50ZXN0KG5leHQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEucGF0dGVyblByb3BlcnRpZXNbcGF0dGVybl0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKF8uaXNPYmplY3Qoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllcyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXh0Lm1hdGNoKCdbMC05XSsnKSkge1xyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdChzY2hlbWEuaXRlbXMpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYS5pdGVtcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KG5leHQsIDEwKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLml0ZW1zW2luZGV4XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYS5pdGVtc1tpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSlNPTlNjaGVtYVNlcnZpY2UgaW1wbGVtZW50cyBJSlNPTlNjaGVtYVNlcnZpY2Uge1xyXG5cclxuICAgIHByaXZhdGUgY29udHJpYnV0aW9uU2NoZW1hczp7IFtpZDpzdHJpbmddOlNjaGVtYUhhbmRsZSB9O1xyXG4gICAgcHJpdmF0ZSBjb250cmlidXRpb25Bc3NvY2lhdGlvbnM6eyBbaWQ6c3RyaW5nXTpzdHJpbmdbXSB9O1xyXG5cclxuICAgIHByaXZhdGUgc2NoZW1hc0J5SWQ6IHsgW2lkOnN0cmluZ106U2NoZW1hSGFuZGxlIH07XHJcbiAgICBwcml2YXRlIGZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zOiBGaWxlUGF0dGVybkFzc29jaWF0aW9uW107XHJcbiAgICBwcml2YXRlIGZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkOiB7IFtpZDpzdHJpbmddOiBGaWxlUGF0dGVybkFzc29jaWF0aW9uIH07XHJcblxyXG4gICAgcHJpdmF0ZSBjb250ZXh0U2VydmljZSA6IElXb3Jrc3BhY2VDb250ZXh0U2VydmljZTtcclxuICAgIHByaXZhdGUgY2FsbE9uRGlzcG9zZTpDb21wb3NpdGVEaXNwb3NhYmxlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIEBJV29ya3NwYWNlQ29udGV4dFNlcnZpY2UgY29udGV4dFNlcnZpY2U/OiBJV29ya3NwYWNlQ29udGV4dFNlcnZpY2UpIHtcclxuICAgICAgICB0aGlzLmNvbnRleHRTZXJ2aWNlID0gY29udGV4dFNlcnZpY2U7XHJcbiAgICAgICAgdGhpcy5jYWxsT25EaXNwb3NlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcblxyXG4gICAgICAgIC8vIGlmIChyZXNvdXJjZVNlcnZpY2UpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5jYWxsT25EaXNwb3NlLmFkZChyZXNvdXJjZVNlcnZpY2UuYWRkTGlzdGVuZXIyXyhSZXNvdXJjZUV2ZW50cy5DSEFOR0VELCAoZTogSVJlc291cmNlQ2hhbmdlZEV2ZW50KSA9PiB0aGlzLm9uUmVzb3VyY2VDaGFuZ2UoZSkpKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9uU2NoZW1hcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9uQXNzb2NpYXRpb25zID0ge307XHJcbiAgICAgICAgdGhpcy5zY2hlbWFzQnlJZCA9IHt9O1xyXG4gICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jYWxsT25EaXNwb3NlLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBwcml2YXRlIG9uUmVzb3VyY2VDaGFuZ2UoZTogSVJlc291cmNlQ2hhbmdlZEV2ZW50KTogdm9pZCB7XHJcbiAgICAvLyAgICAgdmFyIHVybCA9IGUudXJsLnRvU3RyaW5nKCk7XHJcbiAgICAvLyAgICAgdmFyIHNjaGVtYUZpbGUgPSB0aGlzLnNjaGVtYXNCeUlkW3VybF07XHJcbiAgICAvLyAgICAgaWYgKHNjaGVtYUZpbGUpIHtcclxuICAgIC8vICAgICAgICAgc2NoZW1hRmlsZS5jbGVhclNjaGVtYSgpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vIH1cclxuXHJcbiAgICBwcml2YXRlIG5vcm1hbGl6ZUlkKGlkOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAoaWQubGVuZ3RoID4gMCAmJiBpZC5jaGFyQXQoaWQubGVuZ3RoIC0gMSkgPT09ICcjJykge1xyXG4gICAgICAgICAgICByZXR1cm4gaWQuc3Vic3RyaW5nKDAsIGlkLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcHVibGljIHNldFNjaGVtYUNvbnRyaWJ1dGlvbnMoc2NoZW1hQ29udHJpYnV0aW9uczogSVNjaGVtYUNvbnRyaWJ1dGlvbnMpOiB2b2lkIHtcclxuICAgIC8vICAgICBpZiAoc2NoZW1hQ29udHJpYnV0aW9ucy5zY2hlbWFzKSB7XHJcbiAgICAvLyAgICAgICAgIHZhciBzY2hlbWFzID0gc2NoZW1hQ29udHJpYnV0aW9ucy5zY2hlbWFzO1xyXG4gICAgLy8gICAgICAgICBmb3IgKGxldCBpZCBpbiBzY2hlbWFzKSB7XHJcbiAgICAvLyAgICAgICAgICAgICBpZCA9IHRoaXMubm9ybWFsaXplSWQoaWQpO1xyXG4gICAgLy8gICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25TY2hlbWFzW2lkXSA9IHRoaXMuYWRkU2NoZW1hSGFuZGxlKGlkLCBzY2hlbWFzW2lkXSk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuICAgIC8vICAgICB9XHJcbiAgICAvLyB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGRTY2hlbWFIYW5kbGUoaWQ6c3RyaW5nLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudD86IElKU09OU2NoZW1hKSA6IFNjaGVtYUhhbmRsZSB7XHJcbiAgICAgICAgdmFyIHNjaGVtYUhhbmRsZSA9IG5ldyBTY2hlbWFIYW5kbGUodGhpcywgaWQsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KTtcclxuICAgICAgICB0aGlzLnNjaGVtYXNCeUlkW2lkXSA9IHNjaGVtYUhhbmRsZTtcclxuICAgICAgICByZXR1cm4gc2NoZW1hSGFuZGxlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0T3JBZGRTY2hlbWFIYW5kbGUoaWQ6c3RyaW5nLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudD86IElKU09OU2NoZW1hKSA6IElTY2hlbWFIYW5kbGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjaGVtYXNCeUlkW2lkXSB8fCB0aGlzLmFkZFNjaGVtYUhhbmRsZShpZCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm46IHN0cmluZykge1xyXG4gICAgICAgIHZhciBmcGEgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkW3BhdHRlcm5dO1xyXG4gICAgICAgIGlmICghZnBhKSB7XHJcbiAgICAgICAgICAgIGZwYSA9IG5ldyBGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkW3BhdHRlcm5dID0gZnBhO1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zLnB1c2goZnBhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZwYTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVnaXN0ZXJFeHRlcm5hbFNjaGVtYSh1cmk6c3RyaW5nLCBmaWxlUGF0dGVybnM6IHN0cmluZ1tdID0gbnVsbCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQ/OiBJSlNPTlNjaGVtYSkgOiBJU2NoZW1hSGFuZGxlIHtcclxuICAgICAgICB2YXIgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHVyaSk7XHJcblxyXG4gICAgICAgIGlmIChmaWxlUGF0dGVybnMpIHtcclxuICAgICAgICAgICAgZmlsZVBhdHRlcm5zLmZvckVhY2gocGF0dGVybiA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldE9yQWRkRmlsZVBhdHRlcm5Bc3NvY2lhdGlvbihwYXR0ZXJuKS5hZGRTY2hlbWEodXJpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bnJlc29sdmVkU2NoZW1hQ29udGVudCA/IHRoaXMuYWRkU2NoZW1hSGFuZGxlKGlkLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudCkgOiB0aGlzLmdldE9yQWRkU2NoZW1hSGFuZGxlKGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXJFeHRlcm5hbFNjaGVtYXMoKTp2b2lkIHtcclxuICAgICAgICB0aGlzLnNjaGVtYXNCeUlkID0ge307XHJcbiAgICAgICAgdGhpcy5maWxlUGF0dGVybkFzc29jaWF0aW9ucyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbkJ5SWQgPSB7fTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5jb250cmlidXRpb25TY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2NoZW1hc0J5SWRbaWRdID0gdGhpcy5jb250cmlidXRpb25TY2hlbWFzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgcGF0dGVybiBpbiB0aGlzLmNvbnRyaWJ1dGlvbkFzc29jaWF0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgZnBhID0gdGhpcy5nZXRPckFkZEZpbGVQYXR0ZXJuQXNzb2NpYXRpb24ocGF0dGVybik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRyaWJ1dGlvbkFzc29jaWF0aW9uc1twYXR0ZXJuXS5mb3JFYWNoKHNjaGVtYUlkID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBpZCA9IHRoaXMubm9ybWFsaXplSWQoc2NoZW1hSWQpO1xyXG4gICAgICAgICAgICAgICAgZnBhLmFkZFNjaGVtYShpZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0UmVzb2x2ZWRTY2hlbWEoc2NoZW1hSWQ6c3RyaW5nKTogUHJvbWlzZTxSZXNvbHZlZFNjaGVtYT4ge1xyXG4gICAgICAgIHZhciBpZCA9IHRoaXMubm9ybWFsaXplSWQoc2NoZW1hSWQpO1xyXG4gICAgICAgIHZhciBzY2hlbWFIYW5kbGUgPSB0aGlzLnNjaGVtYXNCeUlkW2lkXTtcclxuICAgICAgICBpZiAoc2NoZW1hSGFuZGxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzY2hlbWFIYW5kbGUuZ2V0UmVzb2x2ZWRTY2hlbWEoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZFNjaGVtYSh1cmw6c3RyaW5nKSA6IFByb21pc2U8VW5yZXNvbHZlZFNjaGVtYT4ge1xyXG4gICAgICAgIHJldHVybiByZXF1ZXN0Lnhocih7IHVybDogdXJsIH0pLnRoZW4oXHJcbiAgICAgICAgICAgIHJlcXVlc3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcclxuICAgICAgICAgICAgICAgIGlmICghY29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvck1lc3NhZ2UgPSBgVW5hYmxlIHRvIGxvYWQgc2NoZW1hIGZyb20gJyR7dG9EaXNwbGF5U3RyaW5nKHVybCl9JzogTm8gY29udGVudC5gO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVW5yZXNvbHZlZFNjaGVtYSg8SUpTT05TY2hlbWE+IHt9LCBbIGVycm9yTWVzc2FnZSBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc2NoZW1hQ29udGVudDogSUpTT05TY2hlbWEgPSB7fTtcclxuICAgICAgICAgICAgICAgIHZhciBqc29uRXJyb3JzOiBKc29uLlBhcnNlRXJyb3JbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgc2NoZW1hQ29udGVudCA9IEpzb24ucGFyc2UoY29udGVudCwganNvbkVycm9ycyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0ganNvbkVycm9ycy5sZW5ndGggPyBbIGBVbmFibGUgdG8gcGFyc2UgY29udGVudCBmcm9tICcke3RvRGlzcGxheVN0cmluZyh1cmwpfSc6ICR7SnNvbi5nZXRQYXJzZUVycm9yTWVzc2FnZShqc29uRXJyb3JzWzBdLmVycm9yKX0uYF0gOiBbXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVW5yZXNvbHZlZFNjaGVtYShzY2hlbWFDb250ZW50LCBlcnJvcnMpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAoZXJyb3IgOiBodHRwLklYSFJSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IGBVbmFibGUgdG8gbG9hZCBzY2hlbWEgZnJvbSAnJHt0b0Rpc3BsYXlTdHJpbmcodXJsKX0nOiAke2Vycm9yLnJlc3BvbnNlVGV4dCB8fCBodHRwLmdldEVycm9yU3RhdHVzRGVzY3JpcHRpb24oZXJyb3Iuc3RhdHVzKSB8fCBlcnJvci50b1N0cmluZygpfWA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVucmVzb2x2ZWRTY2hlbWEoPElKU09OU2NoZW1hPiB7fSwgWyBlcnJvck1lc3NhZ2UgXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXNvbHZlU2NoZW1hQ29udGVudChzY2hlbWFUb1Jlc29sdmU6IFVucmVzb2x2ZWRTY2hlbWEpOiBQcm9taXNlPFJlc29sdmVkU2NoZW1hPiB7XHJcblxyXG4gICAgICAgIHZhciByZXNvbHZlRXJyb3JzIDogc3RyaW5nW10gPSBzY2hlbWFUb1Jlc29sdmUuZXJyb3JzLnNsaWNlKDApO1xyXG4gICAgICAgIHZhciBzY2hlbWEgPSBzY2hlbWFUb1Jlc29sdmUuc2NoZW1hO1xyXG5cclxuICAgICAgICB2YXIgZmluZFNlY3Rpb24gPSAoc2NoZW1hOiBJSlNPTlNjaGVtYSwgcGF0aDogc3RyaW5nKTogYW55ID0+IHtcclxuICAgICAgICAgICAgaWYgKCFwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NoZW1hO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50OiBhbnkgPSBzY2hlbWE7XHJcbiAgICAgICAgICAgIHBhdGguc3Vic3RyKDEpLnNwbGl0KCcvJykuc29tZSgocGFydCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFydF07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gIWN1cnJlbnQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVzb2x2ZUxpbmsgPSAobm9kZTogYW55LCBsaW5rZWRTY2hlbWE6IElKU09OU2NoZW1hLCBsaW5rUGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgIHZhciBzZWN0aW9uID0gZmluZFNlY3Rpb24obGlua2VkU2NoZW1hLCBsaW5rUGF0aCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2VjdGlvbiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIF8ubWl4aW4obm9kZSwgc2VjdGlvbiwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUVycm9ycy5wdXNoKGAkcmVmICcke2xpbmtQYXRofScgaW4gJHtsaW5rZWRTY2hlbWEuaWR9IGNhbiBub3QgYmUgcmVzb2x2ZWQuYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVsZXRlIG5vZGUuJHJlZjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVzb2x2ZUV4dGVybmFsTGluayA9IChub2RlOiBhbnksIHVyaTogc3RyaW5nLCBsaW5rUGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnk+ID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUodXJpKS5nZXRVbnJlc29sdmVkU2NoZW1hKCkudGhlbih1bnJlc29sdmVkU2NoZW1hID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh1bnJlc29sdmVkU2NoZW1hLmVycm9ycy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9jID0gbGlua1BhdGggPyB1cmkgKyAnIycgKyBsaW5rUGF0aCA6IHVyaTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlRXJyb3JzLnB1c2goYFByb2JsZW1zIGxvYWRpbmcgcmVmZXJlbmNlICcke2xvY30nOiAke3VucmVzb2x2ZWRTY2hlbWEuZXJyb3JzWzBdfWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUxpbmsobm9kZSwgdW5yZXNvbHZlZFNjaGVtYS5zY2hlbWEsIGxpbmtQYXRoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlUmVmcyhub2RlLCB1bnJlc29sdmVkU2NoZW1hLnNjaGVtYSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCByZXNvbHZlUmVmcyA9IChub2RlOiBJSlNPTlNjaGVtYSwgcGFyZW50U2NoZW1hOiBJSlNPTlNjaGVtYSk6IFByb21pc2U8YW55PiA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0b1dhbGsgOiBJSlNPTlNjaGVtYVtdID0gW25vZGVdO1xyXG4gICAgICAgICAgICBsZXQgc2VlbjogSUpTT05TY2hlbWFbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdmFyIG9wZW5Qcm9taXNlczogUHJvbWlzZTxhbnk+W10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjb2xsZWN0RW50cmllcyA9ICguLi5lbnRyaWVzOiBJSlNPTlNjaGVtYVtdKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBlbnRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9XYWxrLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IGNvbGxlY3RNYXBFbnRyaWVzID0gKC4uLm1hcHM6IElKU09OU2NoZW1hTWFwW10pID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG1hcCBvZiBtYXBzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXAgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRyeSA9IG1hcFtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9XYWxrLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgY29sbGVjdEFycmF5RW50cmllcyA9ICguLi5hcnJheXM6IElKU09OU2NoZW1hW11bXSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYXJyYXkgb2YgYXJyYXlzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvV2Fsay5wdXNoLmFwcGx5KHRvV2FsaywgYXJyYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgd2hpbGUgKHRvV2Fsay5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gdG9XYWxrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlZW4uaW5kZXhPZihuZXh0KSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZWVuLnB1c2gobmV4dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dC4kcmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlZ21lbnRzID0gbmV4dC4kcmVmLnNwbGl0KCcjJywgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlZ21lbnRzWzBdLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlblByb21pc2VzLnB1c2gocmVzb2x2ZUV4dGVybmFsTGluayhuZXh0LCBzZWdtZW50c1swXSwgc2VnbWVudHNbMV0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUxpbmsobmV4dCwgcGFyZW50U2NoZW1hLCBzZWdtZW50c1sxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29sbGVjdEVudHJpZXMobmV4dC5pdGVtcywgbmV4dC5hZGRpdGlvbmFsUHJvcGVydGllcywgbmV4dC5ub3QpO1xyXG4gICAgICAgICAgICAgICAgY29sbGVjdE1hcEVudHJpZXMobmV4dC5kZWZpbml0aW9ucywgbmV4dC5wcm9wZXJ0aWVzLCBuZXh0LnBhdHRlcm5Qcm9wZXJ0aWVzLCA8SUpTT05TY2hlbWFNYXA+IG5leHQuZGVwZW5kZW5jaWVzKTtcclxuICAgICAgICAgICAgICAgIGNvbGxlY3RBcnJheUVudHJpZXMobmV4dC5hbnlPZiwgbmV4dC5hbGxPZiwgbmV4dC5vbmVPZiwgPElKU09OU2NoZW1hW10+IG5leHQuaXRlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwob3BlblByb21pc2VzKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzb2x2ZVJlZnMoc2NoZW1hLCBzY2hlbWEpLnRoZW4oXyA9PiBuZXcgUmVzb2x2ZWRTY2hlbWEoc2NoZW1hLCByZXNvbHZlRXJyb3JzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFNjaGVtYUZvclJlc291cmNlKHJlc291cmNlOiBzdHJpbmcsIGRvY3VtZW50OiBQYXJzZXIuSlNPTkRvY3VtZW50KTogUHJvbWlzZTxSZXNvbHZlZFNjaGVtYT4ge1xyXG5cclxuICAgICAgICAvLyBmaXJzdCB1c2UgJHNjaGVtYSBpZiBwcmVzZW50XHJcbiAgICAgICAgaWYgKGRvY3VtZW50ICYmIGRvY3VtZW50LnJvb3QgJiYgZG9jdW1lbnQucm9vdC50eXBlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB2YXIgc2NoZW1hUHJvcGVydGllcyA9ICg8UGFyc2VyLk9iamVjdEFTVE5vZGU+IGRvY3VtZW50LnJvb3QpLnByb3BlcnRpZXMuZmlsdGVyKChwKSA9PiAocC5rZXkudmFsdWUgPT09ICckc2NoZW1hJykgJiYgISFwLnZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKHNjaGVtYVByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNjaGVtZUlkID0gPHN0cmluZz4gc2NoZW1hUHJvcGVydGllc1swXS52YWx1ZS5nZXRWYWx1ZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFTdHJpbmdzLnN0YXJ0c1dpdGgoc2NoZW1lSWQsICdodHRwOi8vJykgJiYgIVN0cmluZ3Muc3RhcnRzV2l0aChzY2hlbWVJZCwgJ2h0dHBzOi8vJykgJiYgIVN0cmluZ3Muc3RhcnRzV2l0aChzY2hlbWVJZCwgJ2ZpbGU6Ly8nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNvdXJjZVVSTCA9IHRoaXMuY29udGV4dFNlcnZpY2UudG9SZXNvdXJjZShzY2hlbWVJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlVVJMKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtZUlkID0gcmVzb3VyY2VVUkwudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1lSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHNjaGVtZUlkKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRPckFkZFNjaGVtYUhhbmRsZShpZCkuZ2V0UmVzb2x2ZWRTY2hlbWEoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdGhlbiBjaGVjayBmb3IgbWF0Y2hpbmcgZmlsZSBuYW1lcywgbGFzdCB0byBmaXJzdFxyXG4gICAgICAgIGZvciAodmFyIGk9IHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwIDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnNbaV07XHJcbiAgICAgICAgICAgIGlmIChlbnRyeS5tYXRjaGVzUGF0dGVybihyZXNvdXJjZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeS5nZXRDb21iaW5lZFNjaGVtYSh0aGlzKS5nZXRSZXNvbHZlZFNjaGVtYSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNyZWF0ZUNvbWJpbmVkU2NoZW1hKGNvbWJpbmVkU2NoZW1hSWQ6IHN0cmluZywgc2NoZW1hSWRzOiBzdHJpbmdbXSkgOiBJU2NoZW1hSGFuZGxlIHtcclxuICAgICAgICBpZiAoc2NoZW1hSWRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRPckFkZFNjaGVtYUhhbmRsZShzY2hlbWFJZHNbMF0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb21iaW5lZFNjaGVtYTogSUpTT05TY2hlbWEgPSB7XHJcbiAgICAgICAgICAgICAgICBhbGxPZjogc2NoZW1hSWRzLm1hcChzY2hlbWFJZCA9PiAoeyAkcmVmOiBzY2hlbWFJZCB9KSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkU2NoZW1hSGFuZGxlKGNvbWJpbmVkU2NoZW1hSWQsIGNvbWJpbmVkU2NoZW1hKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvRGlzcGxheVN0cmluZyh1cmw6c3RyaW5nKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciB1cmkgPSBVUkkucGFyc2UodXJsKTtcclxuICAgICAgICBpZiAodXJpLnNjaGVtZSA9PT0gJ2ZpbGUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmkuZnNQYXRoO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvLyBpZ25vcmVcclxuICAgIH1cclxuICAgIHJldHVybiB1cmw7XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fcGFyYW0gPSAodGhpcyAmJiB0aGlzLl9fcGFyYW0pIHx8IGZ1bmN0aW9uIChwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn07XG5pbXBvcnQgSnNvbiBmcm9tICcuL2NvbW1vbi9qc29uJztcbmltcG9ydCBodHRwIGZyb20gJy4vY29tbW9uL2h0dHAnO1xuaW1wb3J0IFN0cmluZ3MgZnJvbSAnLi9jb21tb24vc3RyaW5ncyc7XG5pbXBvcnQgVVJJIGZyb20gJy4vY29tbW9uL3VyaSc7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnLi4vZGlzcG9zYWJsZXMnO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdC1saWdodCc7XG5jbGFzcyBGaWxlUGF0dGVybkFzc29jaWF0aW9uIHtcbiAgICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWFJZCA9ICdsb2NhbDovL2NvbWJpbmVkU2NoZW1hLycgKyBlbmNvZGVVUklDb21wb25lbnQocGF0dGVybik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnBhdHRlcm5SZWdFeHAgPSBuZXcgUmVnRXhwKFN0cmluZ3MuY29udmVydFNpbXBsZTJSZWdFeHBQYXR0ZXJuKHBhdHRlcm4pICsgJyQnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5wYXR0ZXJuUmVnRXhwID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVtYXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb21iaW5lZFNjaGVtYSA9IG51bGw7XG4gICAgfVxuICAgIGFkZFNjaGVtYShpZCkge1xuICAgICAgICB0aGlzLnNjaGVtYXMucHVzaChpZCk7XG4gICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWEgPSBudWxsO1xuICAgIH1cbiAgICBtYXRjaGVzUGF0dGVybihmaWxlTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXR0ZXJuUmVnRXhwICYmIHRoaXMucGF0dGVyblJlZ0V4cC50ZXN0KGZpbGVOYW1lKTtcbiAgICB9XG4gICAgZ2V0Q29tYmluZWRTY2hlbWEoc2VydmljZSkge1xuICAgICAgICBpZiAoIXRoaXMuY29tYmluZWRTY2hlbWEpIHtcbiAgICAgICAgICAgIHRoaXMuY29tYmluZWRTY2hlbWEgPSBzZXJ2aWNlLmNyZWF0ZUNvbWJpbmVkU2NoZW1hKHRoaXMuY29tYmluZWRTY2hlbWFJZCwgdGhpcy5zY2hlbWFzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jb21iaW5lZFNjaGVtYTtcbiAgICB9XG59XG5jbGFzcyBTY2hlbWFIYW5kbGUge1xuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2UsIHVybCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG4gICAgICAgIGlmICh1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xuICAgICAgICAgICAgdGhpcy51bnJlc29sdmVkU2NoZW1hID0gUHJvbWlzZS5yZXNvbHZlKG5ldyBVbnJlc29sdmVkU2NoZW1hKHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0VW5yZXNvbHZlZFNjaGVtYSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnVucmVzb2x2ZWRTY2hlbWEpIHtcbiAgICAgICAgICAgIHRoaXMudW5yZXNvbHZlZFNjaGVtYSA9IHRoaXMuc2VydmljZS5sb2FkU2NoZW1hKHRoaXMudXJsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy51bnJlc29sdmVkU2NoZW1hO1xuICAgIH1cbiAgICBnZXRSZXNvbHZlZFNjaGVtYSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJlc29sdmVkU2NoZW1hKSB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVkU2NoZW1hID0gdGhpcy5nZXRVbnJlc29sdmVkU2NoZW1hKCkudGhlbih1bnJlc29sdmVkID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnJlc29sdmVTY2hlbWFDb250ZW50KHVucmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWRTY2hlbWE7XG4gICAgfVxuICAgIGNsZWFyU2NoZW1hKCkge1xuICAgICAgICB0aGlzLnJlc29sdmVkU2NoZW1hID0gbnVsbDtcbiAgICAgICAgdGhpcy51bnJlc29sdmVkU2NoZW1hID0gbnVsbDtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgVW5yZXNvbHZlZFNjaGVtYSB7XG4gICAgY29uc3RydWN0b3Ioc2NoZW1hLCBlcnJvcnMgPSBbXSkge1xuICAgICAgICB0aGlzLnNjaGVtYSA9IHNjaGVtYTtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBlcnJvcnM7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFJlc29sdmVkU2NoZW1hIHtcbiAgICBjb25zdHJ1Y3RvcihzY2hlbWEsIGVycm9ycyA9IFtdKSB7XG4gICAgICAgIHRoaXMuc2NoZW1hID0gc2NoZW1hO1xuICAgICAgICB0aGlzLmVycm9ycyA9IGVycm9ycztcbiAgICB9XG4gICAgZ2V0U2VjdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFNlY3Rpb25SZWN1cnNpdmUocGF0aCwgdGhpcy5zY2hlbWEpO1xuICAgIH1cbiAgICBnZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYSkge1xuICAgICAgICBpZiAoIXNjaGVtYSB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV4dCA9IHBhdGguc2hpZnQoKTtcbiAgICAgICAgaWYgKHNjaGVtYS5wcm9wZXJ0aWVzICYmIHNjaGVtYS5wcm9wZXJ0aWVzW25leHRdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTZWN0aW9uUmVjdXJzaXZlKHBhdGgsIHNjaGVtYS5wcm9wZXJ0aWVzW25leHRdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChfLmlzT2JqZWN0KHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykpIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcykuZm9yRWFjaCgocGF0dGVybikgPT4ge1xuICAgICAgICAgICAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybik7XG4gICAgICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEucGF0dGVyblByb3BlcnRpZXNbcGF0dGVybl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKF8uaXNPYmplY3Qoc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5leHQubWF0Y2goJ1swLTldKycpKSB7XG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdChzY2hlbWEuaXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuaXRlbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuaXRlbXMpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQobmV4dCwgMTApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLml0ZW1zW2luZGV4XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VjdGlvblJlY3Vyc2l2ZShwYXRoLCBzY2hlbWEuaXRlbXNbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBKU09OU2NoZW1hU2VydmljZSB7XG4gICAgY29uc3RydWN0b3IoY29udGV4dFNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0U2VydmljZSA9IGNvbnRleHRTZXJ2aWNlO1xuICAgICAgICB0aGlzLmNhbGxPbkRpc3Bvc2UgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICAgICAgdGhpcy5jb250cmlidXRpb25TY2hlbWFzID0ge307XG4gICAgICAgIHRoaXMuY29udHJpYnV0aW9uQXNzb2NpYXRpb25zID0ge307XG4gICAgICAgIHRoaXMuc2NoZW1hc0J5SWQgPSB7fTtcbiAgICAgICAgdGhpcy5maWxlUGF0dGVybkFzc29jaWF0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25CeUlkID0ge307XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuY2FsbE9uRGlzcG9zZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIG5vcm1hbGl6ZUlkKGlkKSB7XG4gICAgICAgIGlmIChpZC5sZW5ndGggPiAwICYmIGlkLmNoYXJBdChpZC5sZW5ndGggLSAxKSA9PT0gJyMnKSB7XG4gICAgICAgICAgICByZXR1cm4gaWQuc3Vic3RyaW5nKDAsIGlkLmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgYWRkU2NoZW1hSGFuZGxlKGlkLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xuICAgICAgICB2YXIgc2NoZW1hSGFuZGxlID0gbmV3IFNjaGVtYUhhbmRsZSh0aGlzLCBpZCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpO1xuICAgICAgICB0aGlzLnNjaGVtYXNCeUlkW2lkXSA9IHNjaGVtYUhhbmRsZTtcbiAgICAgICAgcmV0dXJuIHNjaGVtYUhhbmRsZTtcbiAgICB9XG4gICAgZ2V0T3JBZGRTY2hlbWFIYW5kbGUoaWQsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjaGVtYXNCeUlkW2lkXSB8fCB0aGlzLmFkZFNjaGVtYUhhbmRsZShpZCwgdW5yZXNvbHZlZFNjaGVtYUNvbnRlbnQpO1xuICAgIH1cbiAgICBnZXRPckFkZEZpbGVQYXR0ZXJuQXNzb2NpYXRpb24ocGF0dGVybikge1xuICAgICAgICB2YXIgZnBhID0gdGhpcy5maWxlUGF0dGVybkFzc29jaWF0aW9uQnlJZFtwYXR0ZXJuXTtcbiAgICAgICAgaWYgKCFmcGEpIHtcbiAgICAgICAgICAgIGZwYSA9IG5ldyBGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xuICAgICAgICAgICAgdGhpcy5maWxlUGF0dGVybkFzc29jaWF0aW9uQnlJZFtwYXR0ZXJuXSA9IGZwYTtcbiAgICAgICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbnMucHVzaChmcGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmcGE7XG4gICAgfVxuICAgIHJlZ2lzdGVyRXh0ZXJuYWxTY2hlbWEodXJpLCBmaWxlUGF0dGVybnMgPSBudWxsLCB1bnJlc29sdmVkU2NoZW1hQ29udGVudCkge1xuICAgICAgICB2YXIgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHVyaSk7XG4gICAgICAgIGlmIChmaWxlUGF0dGVybnMpIHtcbiAgICAgICAgICAgIGZpbGVQYXR0ZXJucy5mb3JFYWNoKHBhdHRlcm4gPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pLmFkZFNjaGVtYSh1cmkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50ID8gdGhpcy5hZGRTY2hlbWFIYW5kbGUoaWQsIHVucmVzb2x2ZWRTY2hlbWFDb250ZW50KSA6IHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUoaWQpO1xuICAgIH1cbiAgICBjbGVhckV4dGVybmFsU2NoZW1hcygpIHtcbiAgICAgICAgdGhpcy5zY2hlbWFzQnlJZCA9IHt9O1xuICAgICAgICB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zID0gW107XG4gICAgICAgIHRoaXMuZmlsZVBhdHRlcm5Bc3NvY2lhdGlvbkJ5SWQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5jb250cmlidXRpb25TY2hlbWFzKSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVtYXNCeUlkW2lkXSA9IHRoaXMuY29udHJpYnV0aW9uU2NoZW1hc1tpZF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgcGF0dGVybiBpbiB0aGlzLmNvbnRyaWJ1dGlvbkFzc29jaWF0aW9ucykge1xuICAgICAgICAgICAgdmFyIGZwYSA9IHRoaXMuZ2V0T3JBZGRGaWxlUGF0dGVybkFzc29jaWF0aW9uKHBhdHRlcm4pO1xuICAgICAgICAgICAgdGhpcy5jb250cmlidXRpb25Bc3NvY2lhdGlvbnNbcGF0dGVybl0uZm9yRWFjaChzY2hlbWFJZCA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gdGhpcy5ub3JtYWxpemVJZChzY2hlbWFJZCk7XG4gICAgICAgICAgICAgICAgZnBhLmFkZFNjaGVtYShpZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRSZXNvbHZlZFNjaGVtYShzY2hlbWFJZCkge1xuICAgICAgICB2YXIgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHNjaGVtYUlkKTtcbiAgICAgICAgdmFyIHNjaGVtYUhhbmRsZSA9IHRoaXMuc2NoZW1hc0J5SWRbaWRdO1xuICAgICAgICBpZiAoc2NoZW1hSGFuZGxlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hSGFuZGxlLmdldFJlc29sdmVkU2NoZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gICAgbG9hZFNjaGVtYSh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QueGhyKHsgdXJsOiB1cmwgfSkudGhlbihyZXF1ZXN0ID0+IHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gYFVuYWJsZSB0byBsb2FkIHNjaGVtYSBmcm9tICcke3RvRGlzcGxheVN0cmluZyh1cmwpfSc6IE5vIGNvbnRlbnQuYDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVucmVzb2x2ZWRTY2hlbWEoe30sIFtlcnJvck1lc3NhZ2VdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzY2hlbWFDb250ZW50ID0ge307XG4gICAgICAgICAgICB2YXIganNvbkVycm9ycyA9IFtdO1xuICAgICAgICAgICAgc2NoZW1hQ29udGVudCA9IEpzb24ucGFyc2UoY29udGVudCwganNvbkVycm9ycyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JzID0ganNvbkVycm9ycy5sZW5ndGggPyBbYFVuYWJsZSB0byBwYXJzZSBjb250ZW50IGZyb20gJyR7dG9EaXNwbGF5U3RyaW5nKHVybCl9JzogJHtKc29uLmdldFBhcnNlRXJyb3JNZXNzYWdlKGpzb25FcnJvcnNbMF0uZXJyb3IpfS5gXSA6IFtdO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVbnJlc29sdmVkU2NoZW1hKHNjaGVtYUNvbnRlbnQsIGVycm9ycyk7XG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IGBVbmFibGUgdG8gbG9hZCBzY2hlbWEgZnJvbSAnJHt0b0Rpc3BsYXlTdHJpbmcodXJsKX0nOiAke2Vycm9yLnJlc3BvbnNlVGV4dCB8fCBodHRwLmdldEVycm9yU3RhdHVzRGVzY3JpcHRpb24oZXJyb3Iuc3RhdHVzKSB8fCBlcnJvci50b1N0cmluZygpfWA7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVucmVzb2x2ZWRTY2hlbWEoe30sIFtlcnJvck1lc3NhZ2VdKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlc29sdmVTY2hlbWFDb250ZW50KHNjaGVtYVRvUmVzb2x2ZSkge1xuICAgICAgICB2YXIgcmVzb2x2ZUVycm9ycyA9IHNjaGVtYVRvUmVzb2x2ZS5lcnJvcnMuc2xpY2UoMCk7XG4gICAgICAgIHZhciBzY2hlbWEgPSBzY2hlbWFUb1Jlc29sdmUuc2NoZW1hO1xuICAgICAgICB2YXIgZmluZFNlY3Rpb24gPSAoc2NoZW1hLCBwYXRoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NoZW1hO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBzY2hlbWE7XG4gICAgICAgICAgICBwYXRoLnN1YnN0cigxKS5zcGxpdCgnLycpLnNvbWUoKHBhcnQpID0+IHtcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtwYXJ0XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWN1cnJlbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVzb2x2ZUxpbmsgPSAobm9kZSwgbGlua2VkU2NoZW1hLCBsaW5rUGF0aCkgPT4ge1xuICAgICAgICAgICAgdmFyIHNlY3Rpb24gPSBmaW5kU2VjdGlvbihsaW5rZWRTY2hlbWEsIGxpbmtQYXRoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2VjdGlvbiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBfLm1peGluKG5vZGUsIHNlY3Rpb24sIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmVFcnJvcnMucHVzaChgJHJlZiAnJHtsaW5rUGF0aH0nIGluICR7bGlua2VkU2NoZW1hLmlkfSBjYW4gbm90IGJlIHJlc29sdmVkLmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIG5vZGUuJHJlZjtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlc29sdmVFeHRlcm5hbExpbmsgPSAobm9kZSwgdXJpLCBsaW5rUGF0aCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUodXJpKS5nZXRVbnJlc29sdmVkU2NoZW1hKCkudGhlbih1bnJlc29sdmVkU2NoZW1hID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodW5yZXNvbHZlZFNjaGVtYS5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2MgPSBsaW5rUGF0aCA/IHVyaSArICcjJyArIGxpbmtQYXRoIDogdXJpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlRXJyb3JzLnB1c2goYFByb2JsZW1zIGxvYWRpbmcgcmVmZXJlbmNlICcke2xvY30nOiAke3VucmVzb2x2ZWRTY2hlbWEuZXJyb3JzWzBdfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlTGluayhub2RlLCB1bnJlc29sdmVkU2NoZW1hLnNjaGVtYSwgbGlua1BhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlUmVmcyhub2RlLCB1bnJlc29sdmVkU2NoZW1hLnNjaGVtYSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlc29sdmVSZWZzID0gKG5vZGUsIHBhcmVudFNjaGVtYSkgPT4ge1xuICAgICAgICAgICAgbGV0IHRvV2FsayA9IFtub2RlXTtcbiAgICAgICAgICAgIGxldCBzZWVuID0gW107XG4gICAgICAgICAgICB2YXIgb3BlblByb21pc2VzID0gW107XG4gICAgICAgICAgICBsZXQgY29sbGVjdEVudHJpZXMgPSAoLi4uZW50cmllcykgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvV2Fsay5wdXNoKGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgY29sbGVjdE1hcEVudHJpZXMgPSAoLi4ubWFwcykgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IG1hcCBvZiBtYXBzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWFwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIG1hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbnRyeSA9IG1hcFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvV2Fsay5wdXNoKGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgY29sbGVjdEFycmF5RW50cmllcyA9ICguLi5hcnJheXMpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhcnJheSBvZiBhcnJheXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b1dhbGsucHVzaC5hcHBseSh0b1dhbGssIGFycmF5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3aGlsZSAodG9XYWxrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGxldCBuZXh0ID0gdG9XYWxrLnBvcCgpO1xuICAgICAgICAgICAgICAgIGlmIChzZWVuLmluZGV4T2YobmV4dCkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2Vlbi5wdXNoKG5leHQpO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0LiRyZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlZ21lbnRzID0gbmV4dC4kcmVmLnNwbGl0KCcjJywgMik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWdtZW50c1swXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuUHJvbWlzZXMucHVzaChyZXNvbHZlRXh0ZXJuYWxMaW5rKG5leHQsIHNlZ21lbnRzWzBdLCBzZWdtZW50c1sxXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlTGluayhuZXh0LCBwYXJlbnRTY2hlbWEsIHNlZ21lbnRzWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb2xsZWN0RW50cmllcyhuZXh0Lml0ZW1zLCBuZXh0LmFkZGl0aW9uYWxQcm9wZXJ0aWVzLCBuZXh0Lm5vdCk7XG4gICAgICAgICAgICAgICAgY29sbGVjdE1hcEVudHJpZXMobmV4dC5kZWZpbml0aW9ucywgbmV4dC5wcm9wZXJ0aWVzLCBuZXh0LnBhdHRlcm5Qcm9wZXJ0aWVzLCBuZXh0LmRlcGVuZGVuY2llcyk7XG4gICAgICAgICAgICAgICAgY29sbGVjdEFycmF5RW50cmllcyhuZXh0LmFueU9mLCBuZXh0LmFsbE9mLCBuZXh0Lm9uZU9mLCBuZXh0Lml0ZW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChvcGVuUHJvbWlzZXMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcmVzb2x2ZVJlZnMoc2NoZW1hLCBzY2hlbWEpLnRoZW4oXyA9PiBuZXcgUmVzb2x2ZWRTY2hlbWEoc2NoZW1hLCByZXNvbHZlRXJyb3JzKSk7XG4gICAgfVxuICAgIGdldFNjaGVtYUZvclJlc291cmNlKHJlc291cmNlLCBkb2N1bWVudCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQgJiYgZG9jdW1lbnQucm9vdCAmJiBkb2N1bWVudC5yb290LnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB2YXIgc2NoZW1hUHJvcGVydGllcyA9IGRvY3VtZW50LnJvb3QucHJvcGVydGllcy5maWx0ZXIoKHApID0+IChwLmtleS52YWx1ZSA9PT0gJyRzY2hlbWEnKSAmJiAhIXAudmFsdWUpO1xuICAgICAgICAgICAgaWYgKHNjaGVtYVByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBzY2hlbWVJZCA9IHNjaGVtYVByb3BlcnRpZXNbMF0udmFsdWUuZ2V0VmFsdWUoKTtcbiAgICAgICAgICAgICAgICBpZiAoIVN0cmluZ3Muc3RhcnRzV2l0aChzY2hlbWVJZCwgJ2h0dHA6Ly8nKSAmJiAhU3RyaW5ncy5zdGFydHNXaXRoKHNjaGVtZUlkLCAnaHR0cHM6Ly8nKSAmJiAhU3RyaW5ncy5zdGFydHNXaXRoKHNjaGVtZUlkLCAnZmlsZTovLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNvdXJjZVVSTCA9IHRoaXMuY29udGV4dFNlcnZpY2UudG9SZXNvdXJjZShzY2hlbWVJZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNvdXJjZVVSTCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1lSWQgPSByZXNvdXJjZVVSTC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2hlbWVJZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSB0aGlzLm5vcm1hbGl6ZUlkKHNjaGVtZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUoaWQpLmdldFJlc29sdmVkU2NoZW1hKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbGVQYXR0ZXJuQXNzb2NpYXRpb25zW2ldO1xuICAgICAgICAgICAgaWYgKGVudHJ5Lm1hdGNoZXNQYXR0ZXJuKHJlc291cmNlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeS5nZXRDb21iaW5lZFNjaGVtYSh0aGlzKS5nZXRSZXNvbHZlZFNjaGVtYSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfVxuICAgIGNyZWF0ZUNvbWJpbmVkU2NoZW1hKGNvbWJpbmVkU2NoZW1hSWQsIHNjaGVtYUlkcykge1xuICAgICAgICBpZiAoc2NoZW1hSWRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JBZGRTY2hlbWFIYW5kbGUoc2NoZW1hSWRzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBjb21iaW5lZFNjaGVtYSA9IHtcbiAgICAgICAgICAgICAgICBhbGxPZjogc2NoZW1hSWRzLm1hcChzY2hlbWFJZCA9PiAoeyAkcmVmOiBzY2hlbWFJZCB9KSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRTY2hlbWFIYW5kbGUoY29tYmluZWRTY2hlbWFJZCwgY29tYmluZWRTY2hlbWEpO1xuICAgICAgICB9XG4gICAgfVxufVxuSlNPTlNjaGVtYVNlcnZpY2UgPSBfX2RlY29yYXRlKFtcbiAgICBfX3BhcmFtKDAsIElXb3Jrc3BhY2VDb250ZXh0U2VydmljZSlcbl0sIEpTT05TY2hlbWFTZXJ2aWNlKTtcbmZ1bmN0aW9uIHRvRGlzcGxheVN0cmluZyh1cmwpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIgdXJpID0gVVJJLnBhcnNlKHVybCk7XG4gICAgICAgIGlmICh1cmkuc2NoZW1lID09PSAnZmlsZScpIHtcbiAgICAgICAgICAgIHJldHVybiB1cmkuZnNQYXRoO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
