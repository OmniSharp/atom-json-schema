'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ProjectJSONContribution = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _strings = require('../utils/strings');

var _strings2 = _interopRequireDefault(_strings);

var _requestLight = require('request-light');

var _requestLight2 = _interopRequireDefault(_requestLight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FEED_INDEX_URL = 'https://api.nuget.org/v3/index.json';
var LIMIT = 30;
var RESOLVE_ID = 'ProjectJSONContribution-';
var CACHE_EXPIRY = 1000 * 60 * 5;

var ProjectJSONContribution = exports.ProjectJSONContribution = function () {
    function ProjectJSONContribution() {
        _classCallCheck(this, ProjectJSONContribution);

        this.cachedProjects = {};
        this.cacheSize = 0;
    }

    _createClass(ProjectJSONContribution, [{
        key: 'isProjectJSONFile',
        value: function isProjectJSONFile(resource) {
            return _strings2.default.endsWith(resource, '/project.json');
        }
    }, {
        key: 'completeWithCache',
        value: function completeWithCache(id, item) {
            var entry = this.cachedProjects[id];
            if (entry) {
                if (new Date().getTime() - entry.time > CACHE_EXPIRY) {
                    delete this.cachedProjects[id];
                    this.cacheSize--;
                    return false;
                }
                item.description = entry.description;
                item.text = item.text.replace(/\{\{\}\}/, '{{' + entry.version + '}}');
                return true;
            }
            return false;
        }
    }, {
        key: 'addCached',
        value: function addCached(id, version, description) {
            this.cachedProjects[id] = { version: version, description: description, time: new Date().getTime() };
            this.cacheSize++;
            if (this.cacheSize > 50) {
                var currentTime = new Date().getTime();
                for (var _id in this.cachedProjects) {
                    var entry = this.cachedProjects[_id];
                    if (currentTime - entry.time > CACHE_EXPIRY) {
                        delete this.cachedProjects[_id];
                        this.cacheSize--;
                    }
                }
            }
        }
    }, {
        key: 'getNugetIndex',
        value: function getNugetIndex() {
            if (!this.nugetIndexPromise) {
                this.nugetIndexPromise = this.makeJSONRequest(FEED_INDEX_URL).then(function (indexContent) {
                    var services = {};
                    if (indexContent && Array.isArray(indexContent.resources)) {
                        var resources = indexContent.resources;
                        for (var i = resources.length - 1; i >= 0; i--) {
                            var type = resources[i]['@type'];
                            var id = resources[i]['@id'];
                            if (type && id) {
                                services[type] = id;
                            }
                        }
                    }
                    return services;
                });
            }
            return this.nugetIndexPromise;
        }
    }, {
        key: 'getNugetService',
        value: function getNugetService(serviceType) {
            return this.getNugetIndex().then(function (services) {
                var serviceURL = services[serviceType];
                if (!serviceURL) {
                    return Promise.reject('NuGet index document is missing service ' + serviceType);
                }
                return serviceURL;
            });
        }
    }, {
        key: 'collectDefaultSuggestions',
        value: function collectDefaultSuggestions(resource, result) {
            if (this.isProjectJSONFile(resource)) {
                var defaultValue = {
                    'version': '{{1.0.0-*}}',
                    'dependencies': {},
                    'frameworks': {
                        'dnx451': {},
                        'dnxcore50': {}
                    }
                };
                result.add({ type: "class", displayText: 'Default project.json', text: JSON.stringify(defaultValue, null, '\t'), description: '' });
            }
            return null;
        }
    }, {
        key: 'makeJSONRequest',
        value: function makeJSONRequest(url) {
            return _requestLight2.default.xhr({
                url: url
            }).then(function (success) {
                if (success.status === 200) {
                    try {
                        return JSON.parse(success.responseText);
                    } catch (e) {
                        return Promise.reject(url + ' is not a valid JSON document');
                    }
                }
                return Promise.reject('Request to ' + url + ' failed: ' + success.responseText);
            }, function (error) {
                return Promise.reject('Request to ' + url + ' failed: ' + (0, _requestLight.getErrorStatusDescription)(error.status));
            });
        }
    }, {
        key: 'collectPropertySuggestions',
        value: function collectPropertySuggestions(resource, location, currentWord, addValue, isLast, result) {
            var _this = this;

            if (this.isProjectJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['frameworks', '*', 'dependencies']) || location.matches(['frameworks', '*', 'frameworkAssemblies']))) {
                return this.getNugetService('SearchAutocompleteService').then(function (service) {
                    var queryUrl = void 0;
                    if (currentWord.length > 0) {
                        queryUrl = service + '?q=' + encodeURIComponent(currentWord) + '&take=' + LIMIT;
                    } else {
                        queryUrl = service + '?take=' + LIMIT;
                    }
                    return _this.makeJSONRequest(queryUrl).then(function (resultObj) {
                        if (Array.isArray(resultObj.data)) {
                            var results = resultObj.data;
                            for (var i = 0; i < results.length; i++) {
                                var name = results[i];
                                var insertText = JSON.stringify(name);
                                if (addValue) {
                                    insertText += ': "{{}}"';
                                    if (!isLast) {
                                        insertText += ',';
                                    }
                                }
                                var item = { type: "property", displayText: name, text: insertText };
                                if (!_this.completeWithCache(name, item)) {
                                    item.data = RESOLVE_ID + name;
                                }
                                result.add(item);
                            }
                            if (results.length === LIMIT) {
                                result.setAsIncomplete();
                            }
                        }
                    }, function (error) {
                        result.error(error);
                    });
                }, function (error) {
                    result.error(error);
                });
            }
            ;
            return null;
        }
    }, {
        key: 'collectValueSuggestions',
        value: function collectValueSuggestions(resource, location, currentKey, result) {
            var _this2 = this;

            if (this.isProjectJSONFile(resource) && (location.matches(['dependencies']) || location.matches(['frameworks', '*', 'dependencies']) || location.matches(['frameworks', '*', 'frameworkAssemblies']))) {
                return this.getNugetService('PackageBaseAddress/3.0.0').then(function (service) {
                    var queryUrl = service + currentKey + '/index.json';
                    return _this2.makeJSONRequest(queryUrl).then(function (obj) {
                        if (Array.isArray(obj.versions)) {
                            var results = obj.versions;
                            for (var i = 0; i < results.length; i++) {
                                var curr = results[i];
                                var name = JSON.stringify(curr);
                                var label = name;
                                var documentation = '';
                                result.add({ type: "class", displayText: label, text: name, description: documentation });
                            }
                            if (results.length === LIMIT) {
                                result.setAsIncomplete();
                            }
                        }
                    }, function (error) {
                        result.error(error);
                    });
                }, function (error) {
                    result.error(error);
                });
            }
            return null;
        }
    }, {
        key: 'getInfoContribution',
        value: function getInfoContribution(resource, location) {
            var _this3 = this;

            if (this.isProjectJSONFile(resource) && (location.matches(['dependencies', '*']) || location.matches(['frameworks', '*', 'dependencies', '*']) || location.matches(['frameworks', '*', 'frameworkAssemblies', '*']))) {
                var _ret = function () {
                    var pack = location.getSegments()[location.getSegments().length - 1];
                    return {
                        v: _this3.getNugetService('SearchQueryService').then(function (service) {
                            var queryUrl = service + '?q=' + encodeURIComponent(pack) + '&take=' + 5;
                            return _this3.makeJSONRequest(queryUrl).then(function (resultObj) {
                                var htmlContent = [];
                                htmlContent.push(pack);
                                if (Array.isArray(resultObj.data)) {
                                    var results = resultObj.data;
                                    for (var i = 0; i < results.length; i++) {
                                        var res = results[i];
                                        _this3.addCached(res.id, res.version, res.description);
                                        if (res.id === pack) {
                                            if (res.description) {
                                                htmlContent.push(res.description);
                                            }
                                            if (res.version) {
                                                htmlContent.push('Latest version: ' + res.version);
                                            }
                                            break;
                                        }
                                    }
                                }
                                return htmlContent;
                            }, function (error) {
                                return null;
                            });
                        }, function (error) {
                            return null;
                        })
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
            return null;
        }
    }, {
        key: 'resolveSuggestion',
        value: function resolveSuggestion(item) {
            var _this4 = this;

            if (item.data && _strings2.default.startsWith(item.data, RESOLVE_ID)) {
                var _ret2 = function () {
                    var pack = item.data.substring(RESOLVE_ID.length);
                    if (_this4.completeWithCache(pack, item)) {
                        return {
                            v: Promise.resolve(item)
                        };
                    }
                    return {
                        v: _this4.getNugetService('SearchQueryService').then(function (service) {
                            var queryUrl = service + '?q=' + encodeURIComponent(pack) + '&take=' + 10;
                            return _this4.makeJSONRequest(queryUrl).then(function (resultObj) {
                                var itemResolved = false;
                                if (Array.isArray(resultObj.data)) {
                                    var results = resultObj.data;
                                    for (var i = 0; i < results.length; i++) {
                                        var curr = results[i];
                                        _this4.addCached(curr.id, curr.version, curr.description);
                                        if (curr.id === pack) {
                                            _this4.completeWithCache(pack, item);
                                            itemResolved = true;
                                        }
                                    }
                                }
                                return itemResolved ? item : null;
                            });
                        })
                    };
                }();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            }
            ;
            return null;
        }
    }]);

    return ProjectJSONContribution;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbmNvbnRyaWJ1dGlvbnMvcHJvamVjdEpTT05Db250cmlidXRpb24udHMiLCJ2c2NvZGUvcGx1Z2luL2pzb25jb250cmlidXRpb25zL3Byb2plY3RKU09OQ29udHJpYnV0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7OztBQ0hBOzs7O0FBQ0E7Ozs7Ozs7O0FEV0EsSUFBTSxpQkFBaUIscUNBQXZCO0FBQ0EsSUFBTSxRQUFRLEVBQWQ7QUFDQSxJQUFNLGFBQWEsMEJBQW5CO0FBRUEsSUFBTSxlQUFlLE9BQU8sRUFBUCxHQUFZLENBQWpDOztJQVNBLHVCLFdBQUEsdUI7QUFNSSx1Q0FBQTtBQUFBOztBQUpRLGFBQUEsY0FBQSxHQUEwRixFQUExRjtBQUNBLGFBQUEsU0FBQSxHQUFvQixDQUFwQjtBQUlQOzs7OzBDQUV5QixRLEVBQWdCO0FBQ3RDLG1CQUFPLGtCQUFRLFFBQVIsQ0FBaUIsUUFBakIsRUFBMkIsZUFBM0IsQ0FBUDtBQUNIOzs7MENBRXlCLEUsRUFBWSxJLEVBQWdCO0FBQ2xELGdCQUFJLFFBQVEsS0FBSyxjQUFMLENBQW9CLEVBQXBCLENBQVo7QUFDQSxnQkFBSSxLQUFKLEVBQVc7QUFDUCxvQkFBSSxJQUFJLElBQUosR0FBVyxPQUFYLEtBQXVCLE1BQU0sSUFBN0IsR0FBb0MsWUFBeEMsRUFBc0Q7QUFDbEQsMkJBQU8sS0FBSyxjQUFMLENBQW9CLEVBQXBCLENBQVA7QUFDQSx5QkFBSyxTQUFMO0FBQ0EsMkJBQU8sS0FBUDtBQUNIO0FBRUQscUJBQUssV0FBTCxHQUFtQixNQUFNLFdBQXpCO0FBQ0EscUJBQUssSUFBTCxHQUFZLEtBQUssSUFBTCxDQUFVLE9BQVYsQ0FBa0IsVUFBbEIsRUFBOEIsT0FBTyxNQUFNLE9BQWIsR0FBdUIsSUFBckQsQ0FBWjtBQUNBLHVCQUFPLElBQVA7QUFDSDtBQUNELG1CQUFPLEtBQVA7QUFDSDs7O2tDQUVpQixFLEVBQVksTyxFQUFpQixXLEVB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QUFDSjtBQUNELHVDQUFPLGVBQWUsSUFBZixHQUFzQixJQUE3QjtBQUNILDZCQWRNLENBQVA7QUFlSCx5QkFqQk07QUFBUDtBQUxzRTs7QUFBQTtBQXVCekU7QUFBQTtBQUNELG1CQUFPLElBQVA7QUFDSCIsImZpbGUiOiJ2c2NvZGUvcGx1Z2luL2pzb25jb250cmlidXRpb25zL3Byb2plY3RKU09OQ29udHJpYnV0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBTdHJpbmdzIGZyb20gJy4uL3V0aWxzL3N0cmluZ3MnO1xyXG5pbXBvcnQge1hIUlJlc3BvbnNlLCBnZXRFcnJvclN0YXR1c0Rlc2NyaXB0aW9ufSBmcm9tICdyZXF1ZXN0LWxpZ2h0JztcclxuaW1wb3J0IHtJSlNPTldvcmtlckNvbnRyaWJ1dGlvbiwgSVN1Z2dlc3Rpb25zQ29sbGVjdG9yfSBmcm9tICcuLi9qc29uQ29udHJpYnV0aW9ucyc7XHJcbmltcG9ydCB7SVJlcXVlc3RTZXJ2aWNlfSBmcm9tICcuLi9qc29uU2NoZW1hU2VydmljZSc7XHJcbmltcG9ydCB7SlNPTkxvY2F0aW9ufSBmcm9tICcuLi9qc29uTG9jYXRpb24nO1xyXG5pbXBvcnQgcmVxdWVzdCBmcm9tICdyZXF1ZXN0LWxpZ2h0JztcclxuXHJcbmNvbnN0IEZFRURfSU5ERVhfVVJMID0gJ2h0dHBzOi8vYXBpLm51Z2V0Lm9yZy92My9pbmRleC5qc29uJztcclxuY29uc3QgTElNSVQgPSAzMDtcclxuY29uc3QgUkVTT0xWRV9JRCA9ICdQcm9qZWN0SlNPTkNvbnRyaWJ1dGlvbi0nO1xyXG5cclxuY29uc3QgQ0FDSEVfRVhQSVJZID0gMTAwMCAqIDYwICogNTsgLy8gNSBtaW51dGVzXHJcblxyXG5pbnRlcmZhY2UgTnVnZXRTZXJ2aWNlcyB7XHJcbiAgICAnU2VhcmNoUXVlcnlTZXJ2aWNlJz86IHN0cmluZztcclxuICAgICdTZWFyY2hBdXRvY29tcGxldGVTZXJ2aWNlJz86IHN0cmluZztcclxuICAgICdQYWNrYWdlQmFzZUFkZHJlc3MvMy4wLjAnPzogc3RyaW5nO1xyXG4gICAgW2tleTogc3RyaW5nXTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvamVjdEpTT05Db250cmlidXRpb24gaW1wbGVtZW50cyBJSlNPTldvcmtlckNvbnRyaWJ1dGlvbiB7XHJcblxyXG4gICAgcHJpdmF0ZSBjYWNoZWRQcm9qZWN0czogeyBbaWQ6IHN0cmluZ106IHsgdmVyc2lvbjogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nLCB0aW1lOiBudW1iZXIgfX0gPSB7fTtcclxuICAgIHByaXZhdGUgY2FjaGVTaXplOiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBudWdldEluZGV4UHJvbWlzZTogUHJvbWlzZTxOdWdldFNlcnZpY2VzPjtcclxuXHJcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBpc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIFN0cmluZ3MuZW5kc1dpdGgocmVzb3VyY2UsICcvcHJvamVjdC5qc29uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjb21wbGV0ZVdpdGhDYWNoZShpZDogc3RyaW5nLCBpdGVtOiBTdWdnZXN0aW9uKSA6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBlbnRyeSA9IHRoaXMuY2FjaGVkUHJvamVjdHNbaWRdO1xyXG4gICAgICAgIGlmIChlbnRyeSkge1xyXG4gICAgICAgICAgICBpZiAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBlbnRyeS50aW1lID4gQ0FDSEVfRVhQSVJZKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5jYWNoZWRQcm9qZWN0c1tpZF07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU2l6ZS0tO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vaXRlbS5kZXRhaWwgPSBlbnRyeS52ZXJzaW9uO1xyXG4gICAgICAgICAgICBpdGVtLmRlc2NyaXB0aW9uID0gZW50cnkuZGVzY3JpcHRpb247XHJcbiAgICAgICAgICAgIGl0ZW0udGV4dCA9IGl0ZW0udGV4dC5yZXBsYWNlKC9cXHtcXHtcXH1cXH0vLCAne3snICsgZW50cnkudmVyc2lvbiArICd9fScpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkQ2FjaGVkKGlkOiBzdHJpbmcsIHZlcnNpb246IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuY2FjaGVkUHJvamVjdHNbaWRdID0geyB2ZXJzaW9uLCBkZXNjcmlwdGlvbiwgdGltZTogbmV3IERhdGUoKS5nZXRUaW1lKCl9O1xyXG4gICAgICAgIHRoaXMuY2FjaGVTaXplKys7XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVTaXplID4gNTApIHtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpZCBpbiB0aGlzLmNhY2hlZFByb2plY3RzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZW50cnkgPSB0aGlzLmNhY2hlZFByb2plY3RzW2lkXTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGltZSAtIGVudHJ5LnRpbWUgPiBDQUNIRV9FWFBJUlkpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5jYWNoZWRQcm9qZWN0c1tpZF07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWNoZVNpemUtLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldE51Z2V0SW5kZXgoKSA6IFByb21pc2U8TnVnZXRTZXJ2aWNlcz4ge1xyXG4gICAgICAgIGlmICghdGhpcy5udWdldEluZGV4UHJvbWlzZSkge1xyXG4gICAgICAgICAgICB0aGlzLm51Z2V0SW5kZXhQcm9taXNlID0gdGhpcy5tYWtlSlNPTlJlcXVlc3Q8YW55PihGRUVEX0lOREVYX1VSTCkudGhlbihpbmRleENvbnRlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNlcnZpY2VzIDogTnVnZXRTZXJ2aWNlcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4Q29udGVudCAmJiBBcnJheS5pc0FycmF5KGluZGV4Q29udGVudC5yZXNvdXJjZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc291cmNlcyA9IDxhbnlbXT4gIGluZGV4Q29udGVudC5yZXNvdXJjZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IHJlc291cmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHJlc291cmNlc1tpXVsnQHR5cGUnXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGlkID0gcmVzb3VyY2VzW2ldWydAaWQnXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgJiYgaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VzW3R5cGVdID0gaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VydmljZXM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5udWdldEluZGV4UHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldE51Z2V0U2VydmljZShzZXJ2aWNlVHlwZTogc3RyaW5nKSA6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TnVnZXRJbmRleCgpLnRoZW4oc2VydmljZXMgPT4ge1xyXG4gICAgICAgICAgICBsZXQgc2VydmljZVVSTCA9IHNlcnZpY2VzW3NlcnZpY2VUeXBlXTtcclxuICAgICAgICAgICAgaWYgKCFzZXJ2aWNlVVJMKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3Q8c3RyaW5nPihgTnVHZXQgaW5kZXggZG9jdW1lbnQgaXMgbWlzc2luZyBzZXJ2aWNlICR7c2VydmljZVR5cGV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VVUkw7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbGxlY3REZWZhdWx0U3VnZ2VzdGlvbnMocmVzb3VyY2U6IHN0cmluZywgcmVzdWx0OiBJU3VnZ2VzdGlvbnNDb2xsZWN0b3IpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGlmICh0aGlzLmlzUHJvamVjdEpTT05GaWxlKHJlc291cmNlKSkge1xyXG4gICAgICAgICAgICBsZXQgZGVmYXVsdFZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgJ3ZlcnNpb24nOiAne3sxLjAuMC0qfX0nLFxyXG4gICAgICAgICAgICAgICAgJ2RlcGVuZGVuY2llcyc6IHt9LFxyXG4gICAgICAgICAgICAgICAgJ2ZyYW1ld29ya3MnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2RueDQ1MSc6IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICdkbnhjb3JlNTAnOiB7fVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXN1bHQuYWRkKHsgdHlwZTogXCJjbGFzc1wiLCBkaXNwbGF5VGV4dDogJ0RlZmF1bHQgcHJvamVjdC5qc29uJywgdGV4dDogSlNPTi5zdHJpbmdpZnkoZGVmYXVsdFZhbHVlLCBudWxsLCAnXFx0JyksIGRlc2NyaXB0aW9uOiAnJyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBtYWtlSlNPTlJlcXVlc3Q8VD4odXJsOiBzdHJpbmcpIDogUHJvbWlzZTxUPiB7XHJcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QueGhyKHtcclxuICAgICAgICAgICAgdXJsIDogdXJsXHJcbiAgICAgICAgfSkudGhlbihzdWNjZXNzID0+IHtcclxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3Muc3RhdHVzID09PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxUPiBKU09OLnBhcnNlKHN1Y2Nlc3MucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3Q8VD4oYCR7dXJsfSBpcyBub3QgYSB2YWxpZCBKU09OIGRvY3VtZW50YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0PFQ+KGBSZXF1ZXN0IHRvICR7dXJsfSBmYWlsZWQ6ICR7c3VjY2Vzcy5yZXNwb25zZVRleHR9YCk7XHJcbiAgICAgICAgfSwgKGVycm9yOiBYSFJSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3Q8VD4oYFJlcXVlc3QgdG8gJHt1cmx9IGZhaWxlZDogJHtnZXRFcnJvclN0YXR1c0Rlc2NyaXB0aW9uKGVycm9yLnN0YXR1cyl9YCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbGxlY3RQcm9wZXJ0eVN1Z2dlc3Rpb25zKHJlc291cmNlOiBzdHJpbmcsIGxvY2F0aW9uOiBKU09OTG9jYXRpb24sIGN1cnJlbnRXb3JkOiBzdHJpbmcsIGFkZFZhbHVlOiBib29sZWFuLCBpc0xhc3Q6Ym9vbGVhbiwgcmVzdWx0OiBJU3VnZ2VzdGlvbnNDb2xsZWN0b3IpIDogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBpZiAodGhpcy5pc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZSkgJiYgKGxvY2F0aW9uLm1hdGNoZXMoWydkZXBlbmRlbmNpZXMnXSkgfHwgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZyYW1ld29ya3MnLCAnKicsICdkZXBlbmRlbmNpZXMnXSkgfHwgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZyYW1ld29ya3MnLCAnKicsICdmcmFtZXdvcmtBc3NlbWJsaWVzJ10pKSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TnVnZXRTZXJ2aWNlKCdTZWFyY2hBdXRvY29tcGxldGVTZXJ2aWNlJykudGhlbihzZXJ2aWNlID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBxdWVyeVVybCA6IHN0cmluZztcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50V29yZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlVcmwgPSBzZXJ2aWNlICsgJz9xPScgKyBlbmNvZGVVUklDb21wb25lbnQoY3VycmVudFdvcmQpICsnJnRha2U9JyArIExJTUlUO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBxdWVyeVVybCA9IHNlcnZpY2UgKyAnP3Rha2U9JyArIExJTUlUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFrZUpTT05SZXF1ZXN0PGFueT4ocXVlcnlVcmwpLnRoZW4ocmVzdWx0T2JqID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHRPYmouZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSA8YW55W10+IHJlc3VsdE9iai5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuYW1lID0gcmVzdWx0c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnNlcnRUZXh0ID0gSlNPTi5zdHJpbmdpZnkobmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0ICs9ICc6IFwie3t9fVwiJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTGFzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0ICs9ICcsJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbSA6IFN1Z2dlc3Rpb24gPSB7IHR5cGU6IFwicHJvcGVydHlcIiwgZGlzcGxheVRleHQ6IG5hbWUsdGV4dDogaW5zZXJ0VGV4dCB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNvbXBsZXRlV2l0aENhY2hlKG5hbWUsIGl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+aXRlbSkuZGF0YSA9IFJFU09MVkVfSUQgKyBuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFkZChpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IExJTUlUKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuc2V0QXNJbmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb2xsZWN0VmFsdWVTdWdnZXN0aW9ucyhyZXNvdXJjZTogc3RyaW5nLCBsb2NhdGlvbjogSlNPTkxvY2F0aW9uLCBjdXJyZW50S2V5OiBzdHJpbmcsIHJlc3VsdDogSVN1Z2dlc3Rpb25zQ29sbGVjdG9yKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBpZiAodGhpcy5pc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZSkgJiYgKGxvY2F0aW9uLm1hdGNoZXMoWydkZXBlbmRlbmNpZXMnXSkgfHwgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZyYW1ld29ya3MnLCAnKicsICdkZXBlbmRlbmNpZXMnXSkgfHwgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZyYW1ld29ya3MnLCAnKicsICdmcmFtZXdvcmtBc3NlbWJsaWVzJ10pKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXROdWdldFNlcnZpY2UoJ1BhY2thZ2VCYXNlQWRkcmVzcy8zLjAuMCcpLnRoZW4oc2VydmljZSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcXVlcnlVcmwgPSBzZXJ2aWNlICsgY3VycmVudEtleSArICcvaW5kZXguanNvbic7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYWtlSlNPTlJlcXVlc3Q8YW55PihxdWVyeVVybCkudGhlbihvYmogPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iai52ZXJzaW9ucykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSA8U3VnZ2VzdGlvbltdPiBvYmoudmVyc2lvbnM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnIgPSByZXN1bHRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBKU09OLnN0cmluZ2lmeShjdXJyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsYWJlbCA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZG9jdW1lbnRhdGlvbiA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFkZCh7IHR5cGU6IFwiY2xhc3NcIiwgZGlzcGxheVRleHQ6IGxhYmVsLCB0ZXh0OiBuYW1lLCBkZXNjcmlwdGlvbjogZG9jdW1lbnRhdGlvbiB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IExJTUlUKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuc2V0QXNJbmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEluZm9Db250cmlidXRpb24ocmVzb3VyY2U6IHN0cmluZywgbG9jYXRpb246IEpTT05Mb2NhdGlvbik6IFByb21pc2U8TWFya2VkU3RyaW5nW10+IHtcclxuICAgICAgICBpZiAodGhpcy5pc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZSkgJiYgKGxvY2F0aW9uLm1hdGNoZXMoWydkZXBlbmRlbmNpZXMnLCAnKiddKSB8fCBsb2NhdGlvbi5tYXRjaGVzKFsnZnJhbWV3b3JrcycsICcqJywgJ2RlcGVuZGVuY2llcycsICcqJ10pIHx8IGxvY2F0aW9uLm1hdGNoZXMoWydmcmFtZXdvcmtzJywgJyonLCAnZnJhbWV3b3JrQXNzZW1ibGllcycsICcqJ10pKSkge1xyXG4gICAgICAgICAgICBsZXQgcGFjayA9IGxvY2F0aW9uLmdldFNlZ21lbnRzKClbbG9jYXRpb24uZ2V0U2VnbWVudHMoKS5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE51Z2V0U2VydmljZSgnU2VhcmNoUXVlcnlTZXJ2aWNlJykudGhlbihzZXJ2aWNlID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBxdWVyeVVybCA9IHNlcnZpY2UgKyAnP3E9JyArIGVuY29kZVVSSUNvbXBvbmVudChwYWNrKSArJyZ0YWtlPScgKyA1O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFrZUpTT05SZXF1ZXN0PGFueT4ocXVlcnlVcmwpLnRoZW4ocmVzdWx0T2JqID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaHRtbENvbnRlbnQgOiBNYXJrZWRTdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWxDb250ZW50LnB1c2gocGFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0T2JqLmRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHRzID0gPGFueVtdPiByZXN1bHRPYmouZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzID0gcmVzdWx0c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2FjaGVkKHJlcy5pZCwgcmVzLnZlcnNpb24sIHJlcy5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzLmlkID09PSBwYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcy5kZXNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sQ29udGVudC5wdXNoKHJlcy5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXMudmVyc2lvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sQ29udGVudC5wdXNoKGBMYXRlc3QgdmVyc2lvbjogJHtyZXMudmVyc2lvbn1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGh0bWxDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVzb2x2ZVN1Z2dlc3Rpb24oaXRlbTogU3VnZ2VzdGlvbikgOiBQcm9taXNlPFN1Z2dlc3Rpb24+IHtcclxuICAgICAgICBpZiAoKDxhbnk+aXRlbSkuZGF0YSAmJiBTdHJpbmdzLnN0YXJ0c1dpdGgoKDxhbnk+aXRlbSkuZGF0YSwgUkVTT0xWRV9JRCkpIHtcclxuICAgICAgICAgICAgbGV0IHBhY2sgPSAoPGFueT5pdGVtKS5kYXRhLnN1YnN0cmluZyhSRVNPTFZFX0lELmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBsZXRlV2l0aENhY2hlKHBhY2ssIGl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE51Z2V0U2VydmljZSgnU2VhcmNoUXVlcnlTZXJ2aWNlJykudGhlbihzZXJ2aWNlID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBxdWVyeVVybCA9IHNlcnZpY2UgKyAnP3E9JyArIGVuY29kZVVSSUNvbXBvbmVudChwYWNrKSArJyZ0YWtlPScgKyAxMDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1ha2VKU09OUmVxdWVzdDxhbnk+KHF1ZXJ5VXJsKS50aGVuKHJlc3VsdE9iaiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW1SZXNvbHZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdE9iai5kYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0cyA9IDxhbnlbXT4gcmVzdWx0T2JqLmRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnIgPSByZXN1bHRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDYWNoZWQoY3Vyci5pZCwgY3Vyci52ZXJzaW9uLCBjdXJyLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyLmlkID09PSBwYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wbGV0ZVdpdGhDYWNoZShwYWNrLCBpdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtUmVzb2x2ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtUmVzb2x2ZWQgPyBpdGVtIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcbiIsIid1c2Ugc3RyaWN0JztcbmltcG9ydCBTdHJpbmdzIGZyb20gJy4uL3V0aWxzL3N0cmluZ3MnO1xuaW1wb3J0IHsgZ2V0RXJyb3JTdGF0dXNEZXNjcmlwdGlvbiB9IGZyb20gJ3JlcXVlc3QtbGlnaHQnO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdC1saWdodCc7XG5jb25zdCBGRUVEX0lOREVYX1VSTCA9ICdodHRwczovL2FwaS5udWdldC5vcmcvdjMvaW5kZXguanNvbic7XG5jb25zdCBMSU1JVCA9IDMwO1xuY29uc3QgUkVTT0xWRV9JRCA9ICdQcm9qZWN0SlNPTkNvbnRyaWJ1dGlvbi0nO1xuY29uc3QgQ0FDSEVfRVhQSVJZID0gMTAwMCAqIDYwICogNTtcbmV4cG9ydCBjbGFzcyBQcm9qZWN0SlNPTkNvbnRyaWJ1dGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY2FjaGVkUHJvamVjdHMgPSB7fTtcbiAgICAgICAgdGhpcy5jYWNoZVNpemUgPSAwO1xuICAgIH1cbiAgICBpc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gU3RyaW5ncy5lbmRzV2l0aChyZXNvdXJjZSwgJy9wcm9qZWN0Lmpzb24nKTtcbiAgICB9XG4gICAgY29tcGxldGVXaXRoQ2FjaGUoaWQsIGl0ZW0pIHtcbiAgICAgICAgbGV0IGVudHJ5ID0gdGhpcy5jYWNoZWRQcm9qZWN0c1tpZF07XG4gICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgICAgaWYgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gZW50cnkudGltZSA+IENBQ0hFX0VYUElSWSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNhY2hlZFByb2plY3RzW2lkXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU2l6ZS0tO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZW0uZGVzY3JpcHRpb24gPSBlbnRyeS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIGl0ZW0udGV4dCA9IGl0ZW0udGV4dC5yZXBsYWNlKC9cXHtcXHtcXH1cXH0vLCAne3snICsgZW50cnkudmVyc2lvbiArICd9fScpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhZGRDYWNoZWQoaWQsIHZlcnNpb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuY2FjaGVkUHJvamVjdHNbaWRdID0geyB2ZXJzaW9uLCBkZXNjcmlwdGlvbiwgdGltZTogbmV3IERhdGUoKS5nZXRUaW1lKCkgfTtcbiAgICAgICAgdGhpcy5jYWNoZVNpemUrKztcbiAgICAgICAgaWYgKHRoaXMuY2FjaGVTaXplID4gNTApIHtcbiAgICAgICAgICAgIGxldCBjdXJyZW50VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaWQgaW4gdGhpcy5jYWNoZWRQcm9qZWN0cykge1xuICAgICAgICAgICAgICAgIGxldCBlbnRyeSA9IHRoaXMuY2FjaGVkUHJvamVjdHNbaWRdO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGltZSAtIGVudHJ5LnRpbWUgPiBDQUNIRV9FWFBJUlkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2FjaGVkUHJvamVjdHNbaWRdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU2l6ZS0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXROdWdldEluZGV4KCkge1xuICAgICAgICBpZiAoIXRoaXMubnVnZXRJbmRleFByb21pc2UpIHtcbiAgICAgICAgICAgIHRoaXMubnVnZXRJbmRleFByb21pc2UgPSB0aGlzLm1ha2VKU09OUmVxdWVzdChGRUVEX0lOREVYX1VSTCkudGhlbihpbmRleENvbnRlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzZXJ2aWNlcyA9IHt9O1xuICAgICAgICAgICAgICAgIGlmIChpbmRleENvbnRlbnQgJiYgQXJyYXkuaXNBcnJheShpbmRleENvbnRlbnQucmVzb3VyY2VzKSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzb3VyY2VzID0gaW5kZXhDb250ZW50LnJlc291cmNlcztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IHJlc291cmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSByZXNvdXJjZXNbaV1bJ0B0eXBlJ107XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaWQgPSByZXNvdXJjZXNbaV1bJ0BpZCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgJiYgaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlc1t0eXBlXSA9IGlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm51Z2V0SW5kZXhQcm9taXNlO1xuICAgIH1cbiAgICBnZXROdWdldFNlcnZpY2Uoc2VydmljZVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TnVnZXRJbmRleCgpLnRoZW4oc2VydmljZXMgPT4ge1xuICAgICAgICAgICAgbGV0IHNlcnZpY2VVUkwgPSBzZXJ2aWNlc1tzZXJ2aWNlVHlwZV07XG4gICAgICAgICAgICBpZiAoIXNlcnZpY2VVUkwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYE51R2V0IGluZGV4IGRvY3VtZW50IGlzIG1pc3Npbmcgc2VydmljZSAke3NlcnZpY2VUeXBlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VVUkw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb2xsZWN0RGVmYXVsdFN1Z2dlc3Rpb25zKHJlc291cmNlLCByZXN1bHQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNQcm9qZWN0SlNPTkZpbGUocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICBsZXQgZGVmYXVsdFZhbHVlID0ge1xuICAgICAgICAgICAgICAgICd2ZXJzaW9uJzogJ3t7MS4wLjAtKn19JyxcbiAgICAgICAgICAgICAgICAnZGVwZW5kZW5jaWVzJzoge30sXG4gICAgICAgICAgICAgICAgJ2ZyYW1ld29ya3MnOiB7XG4gICAgICAgICAgICAgICAgICAgICdkbng0NTEnOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgJ2RueGNvcmU1MCc6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlc3VsdC5hZGQoeyB0eXBlOiBcImNsYXNzXCIsIGRpc3BsYXlUZXh0OiAnRGVmYXVsdCBwcm9qZWN0Lmpzb24nLCB0ZXh0OiBKU09OLnN0cmluZ2lmeShkZWZhdWx0VmFsdWUsIG51bGwsICdcXHQnKSwgZGVzY3JpcHRpb246ICcnIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBtYWtlSlNPTlJlcXVlc3QodXJsKSB7XG4gICAgICAgIHJldHVybiByZXF1ZXN0Lnhocih7XG4gICAgICAgICAgICB1cmw6IHVybFxuICAgICAgICB9KS50aGVuKHN1Y2Nlc3MgPT4ge1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3Muc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShzdWNjZXNzLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChgJHt1cmx9IGlzIG5vdCBhIHZhbGlkIEpTT04gZG9jdW1lbnRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYFJlcXVlc3QgdG8gJHt1cmx9IGZhaWxlZDogJHtzdWNjZXNzLnJlc3BvbnNlVGV4dH1gKTtcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYFJlcXVlc3QgdG8gJHt1cmx9IGZhaWxlZDogJHtnZXRFcnJvclN0YXR1c0Rlc2NyaXB0aW9uKGVycm9yLnN0YXR1cyl9YCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb2xsZWN0UHJvcGVydHlTdWdnZXN0aW9ucyhyZXNvdXJjZSwgbG9jYXRpb24sIGN1cnJlbnRXb3JkLCBhZGRWYWx1ZSwgaXNMYXN0LCByZXN1bHQpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNQcm9qZWN0SlNPTkZpbGUocmVzb3VyY2UpICYmIChsb2NhdGlvbi5tYXRjaGVzKFsnZGVwZW5kZW5jaWVzJ10pIHx8IGxvY2F0aW9uLm1hdGNoZXMoWydmcmFtZXdvcmtzJywgJyonLCAnZGVwZW5kZW5jaWVzJ10pIHx8IGxvY2F0aW9uLm1hdGNoZXMoWydmcmFtZXdvcmtzJywgJyonLCAnZnJhbWV3b3JrQXNzZW1ibGllcyddKSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldE51Z2V0U2VydmljZSgnU2VhcmNoQXV0b2NvbXBsZXRlU2VydmljZScpLnRoZW4oc2VydmljZSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHF1ZXJ5VXJsO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50V29yZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VXJsID0gc2VydmljZSArICc/cT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGN1cnJlbnRXb3JkKSArICcmdGFrZT0nICsgTElNSVQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBxdWVyeVVybCA9IHNlcnZpY2UgKyAnP3Rha2U9JyArIExJTUlUO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYWtlSlNPTlJlcXVlc3QocXVlcnlVcmwpLnRoZW4ocmVzdWx0T2JqID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0T2JqLmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3VsdE9iai5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5hbWUgPSByZXN1bHRzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnNlcnRUZXh0ID0gSlNPTi5zdHJpbmdpZnkobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQgKz0gJzogXCJ7e319XCInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTGFzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSAnLCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW0gPSB7IHR5cGU6IFwicHJvcGVydHlcIiwgZGlzcGxheVRleHQ6IG5hbWUsIHRleHQ6IGluc2VydFRleHQgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY29tcGxldGVXaXRoQ2FjaGUobmFtZSwgaXRlbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5kYXRhID0gUkVTT0xWRV9JRCArIG5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5hZGQoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IExJTUlUKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldEFzSW5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICA7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb2xsZWN0VmFsdWVTdWdnZXN0aW9ucyhyZXNvdXJjZSwgbG9jYXRpb24sIGN1cnJlbnRLZXksIHJlc3VsdCkge1xuICAgICAgICBpZiAodGhpcy5pc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZSkgJiYgKGxvY2F0aW9uLm1hdGNoZXMoWydkZXBlbmRlbmNpZXMnXSkgfHwgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZyYW1ld29ya3MnLCAnKicsICdkZXBlbmRlbmNpZXMnXSkgfHwgbG9jYXRpb24ubWF0Y2hlcyhbJ2ZyYW1ld29ya3MnLCAnKicsICdmcmFtZXdvcmtBc3NlbWJsaWVzJ10pKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TnVnZXRTZXJ2aWNlKCdQYWNrYWdlQmFzZUFkZHJlc3MvMy4wLjAnKS50aGVuKHNlcnZpY2UgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBxdWVyeVVybCA9IHNlcnZpY2UgKyBjdXJyZW50S2V5ICsgJy9pbmRleC5qc29uJztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYWtlSlNPTlJlcXVlc3QocXVlcnlVcmwpLnRoZW4ob2JqID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqLnZlcnNpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdHMgPSBvYmoudmVyc2lvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VyciA9IHJlc3VsdHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBKU09OLnN0cmluZ2lmeShjdXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkb2N1bWVudGF0aW9uID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmFkZCh7IHR5cGU6IFwiY2xhc3NcIiwgZGlzcGxheVRleHQ6IGxhYmVsLCB0ZXh0OiBuYW1lLCBkZXNjcmlwdGlvbjogZG9jdW1lbnRhdGlvbiB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gTElNSVQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuc2V0QXNJbmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBnZXRJbmZvQ29udHJpYnV0aW9uKHJlc291cmNlLCBsb2NhdGlvbikge1xuICAgICAgICBpZiAodGhpcy5pc1Byb2plY3RKU09ORmlsZShyZXNvdXJjZSkgJiYgKGxvY2F0aW9uLm1hdGNoZXMoWydkZXBlbmRlbmNpZXMnLCAnKiddKSB8fCBsb2NhdGlvbi5tYXRjaGVzKFsnZnJhbWV3b3JrcycsICcqJywgJ2RlcGVuZGVuY2llcycsICcqJ10pIHx8IGxvY2F0aW9uLm1hdGNoZXMoWydmcmFtZXdvcmtzJywgJyonLCAnZnJhbWV3b3JrQXNzZW1ibGllcycsICcqJ10pKSkge1xuICAgICAgICAgICAgbGV0IHBhY2sgPSBsb2NhdGlvbi5nZXRTZWdtZW50cygpW2xvY2F0aW9uLmdldFNlZ21lbnRzKCkubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXROdWdldFNlcnZpY2UoJ1NlYXJjaFF1ZXJ5U2VydmljZScpLnRoZW4oc2VydmljZSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHF1ZXJ5VXJsID0gc2VydmljZSArICc/cT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhY2spICsgJyZ0YWtlPScgKyA1O1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1ha2VKU09OUmVxdWVzdChxdWVyeVVybCkudGhlbihyZXN1bHRPYmogPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaHRtbENvbnRlbnQgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaHRtbENvbnRlbnQucHVzaChwYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0T2JqLmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3VsdE9iai5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcyA9IHJlc3VsdHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRDYWNoZWQocmVzLmlkLCByZXMudmVyc2lvbiwgcmVzLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzLmlkID09PSBwYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXMuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWxDb250ZW50LnB1c2gocmVzLmRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzLnZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWxDb250ZW50LnB1c2goYExhdGVzdCB2ZXJzaW9uOiAke3Jlcy52ZXJzaW9ufWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaHRtbENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmVzb2x2ZVN1Z2dlc3Rpb24oaXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5kYXRhICYmIFN0cmluZ3Muc3RhcnRzV2l0aChpdGVtLmRhdGEsIFJFU09MVkVfSUQpKSB7XG4gICAgICAgICAgICBsZXQgcGFjayA9IGl0ZW0uZGF0YS5zdWJzdHJpbmcoUkVTT0xWRV9JRC5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuY29tcGxldGVXaXRoQ2FjaGUocGFjaywgaXRlbSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TnVnZXRTZXJ2aWNlKCdTZWFyY2hRdWVyeVNlcnZpY2UnKS50aGVuKHNlcnZpY2UgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBxdWVyeVVybCA9IHNlcnZpY2UgKyAnP3E9JyArIGVuY29kZVVSSUNvbXBvbmVudChwYWNrKSArICcmdGFrZT0nICsgMTA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFrZUpTT05SZXF1ZXN0KHF1ZXJ5VXJsKS50aGVuKHJlc3VsdE9iaiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpdGVtUmVzb2x2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0T2JqLmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3VsdE9iai5kYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnIgPSByZXN1bHRzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkQ2FjaGVkKGN1cnIuaWQsIGN1cnIudmVyc2lvbiwgY3Vyci5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnIuaWQgPT09IHBhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wbGV0ZVdpdGhDYWNoZShwYWNrLCBpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVJlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW1SZXNvbHZlZCA/IGl0ZW0gOiBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
