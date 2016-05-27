'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Location = exports.JSONDocumentSymbols = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _strings = require('./utils/strings');

var _strings2 = _interopRequireDefault(_strings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSONDocumentSymbols = exports.JSONDocumentSymbols = function () {
    function JSONDocumentSymbols() {
        _classCallCheck(this, JSONDocumentSymbols);
    }

    _createClass(JSONDocumentSymbols, [{
        key: 'compute',
        value: function compute(document, doc) {
            var _this = this;

            var root = doc.root;
            if (!root) {
                return Promise.resolve(null);
            }
            var resourceString = document.getURI();
            if (resourceString === 'vscode://defaultsettings/keybindings.json' || _strings2.default.endsWith(resourceString.toLowerCase(), '/user/keybindings.json')) {
                if (root.type === 'array') {
                    var _ret = function () {
                        var result = [];
                        root.items.forEach(function (item) {
                            if (item.type === 'object') {
                                var property = item.getFirstProperty('key');
                                if (property && property.value) {
                                    var location = Location.create(document.getURI(), new Range(item.start, item.end));
                                    result.push({ name: property.value.getValue(), kind: SymbolKind.Function, location: location });
                                }
                            }
                        });
                        return {
                            v: Promise.resolve(result)
                        };
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                }
            }
            var collectOutlineEntries = function collectOutlineEntries(result, node, containerName) {
                if (node.type === 'array') {
                    node.items.forEach(function (node) {
                        collectOutlineEntries(result, node, containerName);
                    });
                } else if (node.type === 'object') {
                    var objectNode = node;
                    objectNode.properties.forEach(function (property) {
                        var location = Location.create(document.getURI(), new Range(property.start, property.end));
                        var valueNode = property.value;
                        if (valueNode) {
                            var childContainerName = containerName ? containerName + '.' + property.key.name : property.key.name;
                            result.push({ name: property.key.getValue(), kind: _this.getSymbolKind(valueNode.type), location: location, containerName: containerName });
                            collectOutlineEntries(result, valueNode, childContainerName);
                        }
                    });
                }
                return result;
            };
            var result = collectOutlineEntries([], root, void 0);
            return Promise.resolve(result);
        }
    }, {
        key: 'getSymbolKind',
        value: function getSymbolKind(nodeType) {
            switch (nodeType) {
                case 'object':
                case 'string':
                case 'number':
                case 'array':
                case 'boolean':
                    return nodeType;
                default:
                    return "variable";
            }
        }
    }]);

    return JSONDocumentSymbols;
}();

var Location = exports.Location = function Location() {
    _classCallCheck(this, Location);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbkRvY3VtZW50U3ltYm9scy50cyIsInZzY29kZS9wbHVnaW4vanNvbkRvY3VtZW50U3ltYm9scy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7Ozs7Ozs7QUNIQTs7Ozs7Ozs7SURRQSxtQixXQUFBLG1CO0FBRUksbUNBQUE7QUFBQTtBQUNDOzs7O2dDQUVjLFEsRUFBMkIsRyxFQUF3QjtBQUFBOztBQUU5RCxnQkFBSSxPQUFPLElBQUksSUFBZjtBQUNBLGdCQUFJLENBQUMsSUFBTCxFQUFXO0FBQ1AsdUJBQU8sUUFBUSxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDSDtBQUdELGdCQUFJLGlCQUFpQixTQUFTLE1BQVQsRUFBckI7QUFDQSxnQkFBSyxtQkFBbUIsMkNBQXBCLElBQW9FLGtCQUFRLFFBQVIsQ0FBaUIsZUFBZSxXQUFmLEVBQWpCLEVBQStDLHdCQUEvQyxDQUF4RSxFQUFrSjtBQUM5SSxvQkFBSSxLQUFLLElBQUwsS0FBYyxPQUFsQixFQUEyQjtBQUFBO0FBQ3ZCLDRCQUFJLFNBQThCLEVBQWxDO0FBQ3NCLDZCQUFNLEtBQU4sQ0FBWSxPQUFaLENBQW9CLFVBQUMsSUFBRCxFQUFLO0FBQzNDLGdDQUFJLEtBQUssSUFBTCxLQUFjLFFBQWxCLEVBQTRCO0FBQ3hCLG9DQUFJLFdBQWtDLEtBQU0sZ0JBQU4sQ0FBdUIsS0FBdkIsQ0FBdEM7QUFDQSxvQ0FBSSxZQUFZLFNBQVMsS0FBekIsRUFBZ0M7QUFDNUIsd0NBQUksV0FBVyxTQUFTLE1BQVQsQ0FBZ0IsU0FBUyxNQUFULEVBQWhCLEVBQW1DLElBQUksS0FBSixDQUFVLEtBQUssS0FBZixFQUFzQixLQUFLLEdBQTNCLENBQW5DLENBQWY7QUFDQSwyQ0FBTyxJQUFQLENBQVksRUFBRSxNQUFNLFNBQVMsS0FBVCxDQUFlLFFBQWYsRUFBUixFQUFtQyxNQUFNLFdBQVcsUUFBcEQsRUFBOEQsVUFBVSxRQUF4RSxFQUFaO0FBQ0g7QUFDSjtBQUNKLHlCQVJxQjtBQVN0QjtBQUFBLCtCQUFPLFFBQVEsT0FBUixDQUFnQixNQUFoQjtBQUFQO0FBWHVCOztBQUFBO0FBWTFCO0FBQ0o7QUFFRCxnQkFBSSx3QkFBd0IsU0FBeEIscUJBQXdCLENBQUMsTUFBRCxFQUE4QixJQUE5QixFQUFvRCxhQUFwRCxFQUF5RTtBQUNqRyxvQkFBSSxLQUFLLElBQUwsS0FBYyxPQUFsQixFQUEyQjtBQUNELHlCQUFNLEtBQU4sQ0FBWSxPQUFaLENBQW9CLFVBQUMsSUFBRCxFQUFxQjtBQUMzRCw4Q0FBc0IsTUFBdEIsRUFBOEIsSUFBOUIsRUFBb0MsYUFBcEM7QUFDSCxxQkFGcUI7QUFHekIsaUJBSkQsTUFJTyxJQUFJLEtBQUssSUFBTCxLQUFjLFFBQWxCLEVBQTRCO0FBQy9CLHdCQUFJLGFBQW1DLElBQXZDO0FBRUEsK0JBQVcsVUFBWCxDQUFzQixPQUF0QixDQUE4QixVQUFDLFFBQUQsRUFBaUM7QUFDM0QsNEJBQUksV0FBVyxTQUFTLE1BQVQsQ0FBZ0IsU0FBUyxNQUFULEVBQWhCLEVBQW1DLElBQUksS0FBSixDQUFVLFNBQVMsS0FBbkIsRUFBMEIsU0FBUyxHQUFuQyxDQUFuQyxDQUFmO0FBQ0EsNEJBQUksWUFBWSxTQUFTLEtBQXpCO0FBQ0EsNEJBQUksU0FBSixFQUFlO0FBQ1gsZ0NBQUkscUJBQXFCLGdCQUFnQixnQkFBZ0IsR0FBaEIsR0FBc0IsU0FBUyxHQUFULENBQWEsSUFBbkQsR0FBMEQsU0FBUyxHQUFULENBQWEsSUFBaEc7QUFDQSxtQ0FBTyxJQUFQLENBQVksRUFBRSxNQUFNLFNBQVMsR0FBVCxDQUFhLFFBQWIsRUFBUixFQUFpQyxNQUFNLE1BQUssYUFBTCxDQUFtQixVQUFVLElBQTdCLENBQXZDLEVBQTJFLFVBQVUsUUFBckYsRUFBK0YsZUFBZSxhQUE5RyxFQUFaO0FBQ0Esa0RBQXNCLE1BQXRCLEVBQThCLFNBQTlCLEVBQXlDLGtCQUF6QztBQUNIO0FBQ0oscUJBUkQ7QUFTSDtBQUNELHVCQUFPLE1BQVA7QUFDSCxhQW5CRDtBQW9CQSxnQkFBSSxTQUFTLHNCQUFzQixFQUF0QixFQUEwQixJQUExQixFQUFnQyxLQUFLLENBQXJDLENBQWI7QUFDQSxtQkFBTyxRQUFRLE9BQVIsQ0FBZ0IsTUFBaEIsQ0FBUDtBQUNIOzs7c0NBRXFCLFEsRUFBZ0I7QUFDbEMsb0JBQVEsUUFBUjtBQUNJLHFCQUFLLFFBQUw7QUFDQSxxQkFBSyxRQUFMO0FBQ0EscUJBQUssUUFBTDtBQUNBLHFCQUFLLE9BQUw7QUFDQSxxQkFBSyxTQUFMO0FBQ0ksMkJBQU8sUUFBUDtBQUNKO0FBQ0ksMkJBQU8sVUFBUDtBQVJSO0FBVUg7Ozs7OztJQWlCTCxRLFdBQUEsUSIsImZpbGUiOiJ2c2NvZGUvcGx1Z2luL2pzb25Eb2N1bWVudFN5bWJvbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuaW1wb3J0IFBhcnNlciBmcm9tICcuL2pzb25QYXJzZXInO1xyXG5pbXBvcnQgU3RyaW5ncyBmcm9tICcuL3V0aWxzL3N0cmluZ3MnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEpTT05Eb2N1bWVudFN5bWJvbHMge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKGRvY3VtZW50OiBBdG9tLlRleHRFZGl0b3IsIGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCk6IFByb21pc2U8U3ltYm9sSW5mb3JtYXRpb25bXT4ge1xyXG5cclxuICAgICAgICBsZXQgcm9vdCA9IGRvYy5yb290O1xyXG4gICAgICAgIGlmICghcm9vdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc3BlY2lhbCBoYW5kbGluZyBmb3Iga2V5IGJpbmRpbmdzXHJcbiAgICAgICAgbGV0IHJlc291cmNlU3RyaW5nID0gZG9jdW1lbnQuZ2V0VVJJKCk7XHJcbiAgICAgICAgaWYgKChyZXNvdXJjZVN0cmluZyA9PT0gJ3ZzY29kZTovL2RlZmF1bHRzZXR0aW5ncy9rZXliaW5kaW5ncy5qc29uJykgfHwgU3RyaW5ncy5lbmRzV2l0aChyZXNvdXJjZVN0cmluZy50b0xvd2VyQ2FzZSgpLCAnL3VzZXIva2V5YmluZGluZ3MuanNvbicpKSB7XHJcbiAgICAgICAgICAgIGlmIChyb290LnR5cGUgPT09ICdhcnJheScpIHtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQ6IFN5bWJvbEluZm9ybWF0aW9uW10gPSBbXTtcclxuICAgICAgICAgICAgICAgICg8UGFyc2VyLkFycmF5QVNUTm9kZT5yb290KS5pdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5ID0gKDxQYXJzZXIuT2JqZWN0QVNUTm9kZT5pdGVtKS5nZXRGaXJzdFByb3BlcnR5KCdrZXknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ICYmIHByb3BlcnR5LnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYXRpb24gPSBMb2NhdGlvbi5jcmVhdGUoZG9jdW1lbnQuZ2V0VVJJKCksIG5ldyBSYW5nZShpdGVtLnN0YXJ0LCBpdGVtLmVuZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyBuYW1lOiBwcm9wZXJ0eS52YWx1ZS5nZXRWYWx1ZSgpLCBraW5kOiBTeW1ib2xLaW5kLkZ1bmN0aW9uLCBsb2NhdGlvbjogbG9jYXRpb24gfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNvbGxlY3RPdXRsaW5lRW50cmllcyA9IChyZXN1bHQ6IFN5bWJvbEluZm9ybWF0aW9uW10sIG5vZGU6IFBhcnNlci5BU1ROb2RlLCBjb250YWluZXJOYW1lOiBzdHJpbmcpOiBTeW1ib2xJbmZvcm1hdGlvbltdID0+IHtcclxuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gJ2FycmF5Jykge1xyXG4gICAgICAgICAgICAgICAgKDxQYXJzZXIuQXJyYXlBU1ROb2RlPm5vZGUpLml0ZW1zLmZvckVhY2goKG5vZGU6IFBhcnNlci5BU1ROb2RlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdE91dGxpbmVFbnRyaWVzKHJlc3VsdCwgbm9kZSwgY29udGFpbmVyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0Tm9kZSA9IDxQYXJzZXIuT2JqZWN0QVNUTm9kZT5ub2RlO1xyXG5cclxuICAgICAgICAgICAgICAgIG9iamVjdE5vZGUucHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eTogUGFyc2VyLlByb3BlcnR5QVNUTm9kZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IExvY2F0aW9uLmNyZWF0ZShkb2N1bWVudC5nZXRVUkkoKSwgbmV3IFJhbmdlKHByb3BlcnR5LnN0YXJ0LCBwcm9wZXJ0eS5lbmQpKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVOb2RlID0gcHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGRDb250YWluZXJOYW1lID0gY29udGFpbmVyTmFtZSA/IGNvbnRhaW5lck5hbWUgKyAnLicgKyBwcm9wZXJ0eS5rZXkubmFtZSA6IHByb3BlcnR5LmtleS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IG5hbWU6IHByb3BlcnR5LmtleS5nZXRWYWx1ZSgpLCBraW5kOiB0aGlzLmdldFN5bWJvbEtpbmQodmFsdWVOb2RlLnR5cGUpLCBsb2NhdGlvbjogbG9jYXRpb24sIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPdXRsaW5lRW50cmllcyhyZXN1bHQsIHZhbHVlTm9kZSwgY2hpbGRDb250YWluZXJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbGxlY3RPdXRsaW5lRW50cmllcyhbXSwgcm9vdCwgdm9pZCAwKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRTeW1ib2xLaW5kKG5vZGVUeXBlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHN3aXRjaCAobm9kZVR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcclxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcclxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgY2FzZSAnYXJyYXknOlxyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlVHlwZTtcclxuICAgICAgICAgICAgZGVmYXVsdDogLy8gJ251bGwnXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ2YXJpYWJsZVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN5bWJvbEluZm9ybWF0aW9uIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGNvbnRhaW5lck5hbWU/OiBzdHJpbmc7XHJcbiAgICBraW5kOiBzdHJpbmc7XHJcbiAgICBsb2NhdGlvbjogTG9jYXRpb247XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUZvcm1hdHRpbmdPcHRpb25zIHtcclxuICAgIHRhYlNpemU6bnVtYmVyO1xyXG4gICAgaW5zZXJ0U3BhY2VzOmJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMb2NhdGlvbiB7XHJcbiAgICB1cmk6IFVSSTtcclxuICAgIHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhvdmVyIHtcclxuICAgIGh0bWxDb250ZW50OiBIdG1sQ29udGVudC5JSFRNTENvbnRlbnRFbGVtZW50W107XHJcblxyXG4gICAgcmFuZ2U6IFtudW1iZXIsIG51bWJlcl07XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xuaW1wb3J0IFN0cmluZ3MgZnJvbSAnLi91dGlscy9zdHJpbmdzJztcbmV4cG9ydCBjbGFzcyBKU09ORG9jdW1lbnRTeW1ib2xzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG4gICAgY29tcHV0ZShkb2N1bWVudCwgZG9jKSB7XG4gICAgICAgIGxldCByb290ID0gZG9jLnJvb3Q7XG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzb3VyY2VTdHJpbmcgPSBkb2N1bWVudC5nZXRVUkkoKTtcbiAgICAgICAgaWYgKChyZXNvdXJjZVN0cmluZyA9PT0gJ3ZzY29kZTovL2RlZmF1bHRzZXR0aW5ncy9rZXliaW5kaW5ncy5qc29uJykgfHwgU3RyaW5ncy5lbmRzV2l0aChyZXNvdXJjZVN0cmluZy50b0xvd2VyQ2FzZSgpLCAnL3VzZXIva2V5YmluZGluZ3MuanNvbicpKSB7XG4gICAgICAgICAgICBpZiAocm9vdC50eXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgIHJvb3QuaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5ID0gaXRlbS5nZXRGaXJzdFByb3BlcnR5KCdrZXknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSAmJiBwcm9wZXJ0eS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IExvY2F0aW9uLmNyZWF0ZShkb2N1bWVudC5nZXRVUkkoKSwgbmV3IFJhbmdlKGl0ZW0uc3RhcnQsIGl0ZW0uZW5kKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyBuYW1lOiBwcm9wZXJ0eS52YWx1ZS5nZXRWYWx1ZSgpLCBraW5kOiBTeW1ib2xLaW5kLkZ1bmN0aW9uLCBsb2NhdGlvbjogbG9jYXRpb24gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvbGxlY3RPdXRsaW5lRW50cmllcyA9IChyZXN1bHQsIG5vZGUsIGNvbnRhaW5lck5hbWUpID0+IHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgICAgICAgICAgICBub2RlLml0ZW1zLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdE91dGxpbmVFbnRyaWVzKHJlc3VsdCwgbm9kZSwgY29udGFpbmVyTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdE5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgIG9iamVjdE5vZGUucHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYXRpb24gPSBMb2NhdGlvbi5jcmVhdGUoZG9jdW1lbnQuZ2V0VVJJKCksIG5ldyBSYW5nZShwcm9wZXJ0eS5zdGFydCwgcHJvcGVydHkuZW5kKSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZU5vZGUgPSBwcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29udGFpbmVyTmFtZSA9IGNvbnRhaW5lck5hbWUgPyBjb250YWluZXJOYW1lICsgJy4nICsgcHJvcGVydHkua2V5Lm5hbWUgOiBwcm9wZXJ0eS5rZXkubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHsgbmFtZTogcHJvcGVydHkua2V5LmdldFZhbHVlKCksIGtpbmQ6IHRoaXMuZ2V0U3ltYm9sS2luZCh2YWx1ZU5vZGUudHlwZSksIGxvY2F0aW9uOiBsb2NhdGlvbiwgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPdXRsaW5lRW50cmllcyhyZXN1bHQsIHZhbHVlTm9kZSwgY2hpbGRDb250YWluZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbGxlY3RPdXRsaW5lRW50cmllcyhbXSwgcm9vdCwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xuICAgIH1cbiAgICBnZXRTeW1ib2xLaW5kKG5vZGVUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAobm9kZVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlVHlwZTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidmFyaWFibGVcIjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBMb2NhdGlvbiB7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
