'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Location = exports.JSONDocumentSymbols = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _textBuffer = require('text-buffer');

var _textBuffer2 = _interopRequireDefault(_textBuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Range = _textBuffer2.default.Range;

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
            var collectOutlineEntries = function collectOutlineEntries(result, node, containerName) {
                if (node.type === 'array') {
                    node.items.forEach(function (node) {
                        collectOutlineEntries(result, node, containerName);
                    });
                } else if (node.type === 'object') {
                    var objectNode = node;
                    objectNode.properties.forEach(function (property) {
                        var location = { uri: document.getURI(), range: new Range(property.start, property.end) };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbkRvY3VtZW50U3ltYm9scy50cyIsInZzY29kZS9wbHVnaW4vanNvbkRvY3VtZW50U3ltYm9scy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7Ozs7O0FDSEE7Ozs7Ozs7O0FEUUEsSUFBTSxRQUFRLHFCQUFXLEtBQXpCOztJQUVBLG1CLFdBQUEsbUI7QUFFSSxtQ0FBQTtBQUFBO0FBQ0M7Ozs7Z0NBRWMsUSxFQUEyQixHLEVBQXdCO0FBQUE7O0FBRTlELGdCQUFJLE9BQU8sSUFBSSxJQUFmO0FBQ0EsZ0JBQUksQ0FBQyxJQUFMLEVBQVc7QUFDUCx1QkFBTyxRQUFRLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FBUDtBQUNIO0FBRUQsZ0JBQUksd0JBQXdCLFNBQXhCLHFCQUF3QixDQUFDLE1BQUQsRUFBOEIsSUFBOUIsRUFBb0QsYUFBcEQsRUFBeUU7QUFDakcsb0JBQUksS0FBSyxJQUFMLEtBQWMsT0FBbEIsRUFBMkI7QUFDRCx5QkFBTSxLQUFOLENBQVksT0FBWixDQUFvQixVQUFDLElBQUQsRUFBcUI7QUFDM0QsOENBQXNCLE1BQXRCLEVBQThCLElBQTlCLEVBQW9DLGFBQXBDO0FBQ0gscUJBRnFCO0FBR3pCLGlCQUpELE1BSU8sSUFBSSxLQUFLLElBQUwsS0FBYyxRQUFsQixFQUE0QjtBQUMvQix3QkFBSSxhQUFtQyxJQUF2QztBQUVBLCtCQUFXLFVBQVgsQ0FBc0IsT0FBdEIsQ0FBOEIsVUFBQyxRQUFELEVBQWlDO0FBQzNELDRCQUFJLFdBQVcsRUFBRSxLQUFLLFNBQVMsTUFBVCxFQUFQLEVBQTBCLE9BQU8sSUFBSSxLQUFKLENBQVUsU0FBUyxLQUFuQixFQUEwQixTQUFTLEdBQW5DLENBQWpDLEVBQWY7QUFDQSw0QkFBSSxZQUFZLFNBQVMsS0FBekI7QUFDQSw0QkFBSSxTQUFKLEVBQWU7QUFDWCxnQ0FBSSxxQkFBcUIsZ0JBQWdCLGdCQUFnQixHQUFoQixHQUFzQixTQUFTLEdBQVQsQ0FBYSxJQUFuRCxHQUEwRCxTQUFTLEdBQVQsQ0FBYSxJQUFoRztBQUNBLG1DQUFPLElBQVAsQ0FBWSxFQUFFLE1BQU0sU0FBUyxHQUFULENBQWEsUUFBYixFQUFSLEVBQWlDLE1BQU0sTUFBSyxhQUFMLENBQW1CLFVBQVUsSUFBN0IsQ0FBdkMsRUFBMkUsVUFBVSxRQUFyRixFQUErRixlQUFlLGFBQTlHLEVBQVo7QUFDQSxrREFBc0IsTUFBdEIsRUFBOEIsU0FBOUIsRUFBeUMsa0JBQXpDO0FBQ0g7QUFDSixxQkFSRDtBQVNIO0FBQ0QsdUJBQU8sTUFBUDtBQUNILGFBbkJEO0FBb0JBLGdCQUFJLFNBQVMsc0JBQXNCLEVBQXRCLEVBQTBCLElBQTFCLEVBQWdDLEtBQUssQ0FBckMsQ0FBYjtBQUNBLG1CQUFPLFFBQVEsT0FBUixDQUFnQixNQUFoQixDQUFQO0FBQ0g7OztzQ0FFcUIsUSxFQUFnQjtBQUNsQyxvQkFBUSxRQUFSO0FBQ0kscUJBQUssUUFBTDtBQUNBLHFCQUFLLFFBQUw7QUFDQSxxQkFBSyxRQUFMO0FBQ0EscUJBQUssT0FBTDtBQUNBLHFCQUFLLFNBQUw7QUFDSSwyQkFBTyxRQUFQO0FBQ0o7QUFDSSwyQkFBTyxVQUFQO0FBUlI7QUFVSDs7Ozs7O0lBWUwsUSxXQUFBLFEiLCJmaWxlIjoidnNjb2RlL3BsdWdpbi9qc29uRG9jdW1lbnRTeW1ib2xzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBQYXJzZXIgZnJvbSAnLi9qc29uUGFyc2VyJztcclxuaW1wb3J0IHtQb2ludH0gZnJvbSBcImF0b21cIjtcclxuaW1wb3J0IFRleHRCdWZmZXIgZnJvbSBcInRleHQtYnVmZmVyXCI7XHJcbmNvbnN0IFJhbmdlID0gVGV4dEJ1ZmZlci5SYW5nZTtcclxuXHJcbmV4cG9ydCBjbGFzcyBKU09ORG9jdW1lbnRTeW1ib2xzIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZShkb2N1bWVudDogQXRvbS5UZXh0RWRpdG9yLCBkb2M6IFBhcnNlci5KU09ORG9jdW1lbnQpOiBQcm9taXNlPFN5bWJvbEluZm9ybWF0aW9uW10+IHtcclxuXHJcbiAgICAgICAgbGV0IHJvb3QgPSBkb2Mucm9vdDtcclxuICAgICAgICBpZiAoIXJvb3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBjb2xsZWN0T3V0bGluZUVudHJpZXMgPSAocmVzdWx0OiBTeW1ib2xJbmZvcm1hdGlvbltdLCBub2RlOiBQYXJzZXIuQVNUTm9kZSwgY29udGFpbmVyTmFtZTogc3RyaW5nKTogU3ltYm9sSW5mb3JtYXRpb25bXSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09ICdhcnJheScpIHtcclxuICAgICAgICAgICAgICAgICg8UGFyc2VyLkFycmF5QVNUTm9kZT5ub2RlKS5pdGVtcy5mb3JFYWNoKChub2RlOiBQYXJzZXIuQVNUTm9kZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPdXRsaW5lRW50cmllcyhyZXN1bHQsIG5vZGUsIGNvbnRhaW5lck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdE5vZGUgPSA8UGFyc2VyLk9iamVjdEFTVE5vZGU+bm9kZTtcclxuXHJcbiAgICAgICAgICAgICAgICBvYmplY3ROb2RlLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHk6IFBhcnNlci5Qcm9wZXJ0eUFTVE5vZGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYXRpb24gPSB7IHVyaTogZG9jdW1lbnQuZ2V0VVJJKCksIHJhbmdlOiBuZXcgUmFuZ2UocHJvcGVydHkuc3RhcnQsIHByb3BlcnR5LmVuZCkgfTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVOb2RlID0gcHJvcGVydHkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGRDb250YWluZXJOYW1lID0gY29udGFpbmVyTmFtZSA/IGNvbnRhaW5lck5hbWUgKyAnLicgKyBwcm9wZXJ0eS5rZXkubmFtZSA6IHByb3BlcnR5LmtleS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7IG5hbWU6IHByb3BlcnR5LmtleS5nZXRWYWx1ZSgpLCBraW5kOiB0aGlzLmdldFN5bWJvbEtpbmQodmFsdWVOb2RlLnR5cGUpLCBsb2NhdGlvbjogbG9jYXRpb24sIGNvbnRhaW5lck5hbWU6IGNvbnRhaW5lck5hbWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPdXRsaW5lRW50cmllcyhyZXN1bHQsIHZhbHVlTm9kZSwgY2hpbGRDb250YWluZXJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbGxlY3RPdXRsaW5lRW50cmllcyhbXSwgcm9vdCwgdm9pZCAwKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRTeW1ib2xLaW5kKG5vZGVUeXBlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHN3aXRjaCAobm9kZVR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcclxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcclxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgY2FzZSAnYXJyYXknOlxyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlVHlwZTtcclxuICAgICAgICAgICAgZGVmYXVsdDogLy8gJ251bGwnXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ2YXJpYWJsZVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN5bWJvbEluZm9ybWF0aW9uIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGNvbnRhaW5lck5hbWU/OiBzdHJpbmc7XHJcbiAgICBraW5kOiBzdHJpbmc7XHJcbiAgICBsb2NhdGlvbjogTG9jYXRpb247XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMb2NhdGlvbiB7XHJcbiAgICB1cmk6IHN0cmluZztcclxuICAgIHJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlO1xyXG59XHJcbiIsIid1c2Ugc3RyaWN0JztcbmltcG9ydCBUZXh0QnVmZmVyIGZyb20gXCJ0ZXh0LWJ1ZmZlclwiO1xuY29uc3QgUmFuZ2UgPSBUZXh0QnVmZmVyLlJhbmdlO1xuZXhwb3J0IGNsYXNzIEpTT05Eb2N1bWVudFN5bWJvbHMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgIH1cbiAgICBjb21wdXRlKGRvY3VtZW50LCBkb2MpIHtcbiAgICAgICAgbGV0IHJvb3QgPSBkb2Mucm9vdDtcbiAgICAgICAgaWYgKCFyb290KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjb2xsZWN0T3V0bGluZUVudHJpZXMgPSAocmVzdWx0LCBub2RlLCBjb250YWluZXJOYW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pdGVtcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPdXRsaW5lRW50cmllcyhyZXN1bHQsIG5vZGUsIGNvbnRhaW5lck5hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobm9kZS50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGxldCBvYmplY3ROb2RlID0gbm9kZTtcbiAgICAgICAgICAgICAgICBvYmplY3ROb2RlLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxvY2F0aW9uID0geyB1cmk6IGRvY3VtZW50LmdldFVSSSgpLCByYW5nZTogbmV3IFJhbmdlKHByb3BlcnR5LnN0YXJ0LCBwcm9wZXJ0eS5lbmQpIH07XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZU5vZGUgPSBwcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkQ29udGFpbmVyTmFtZSA9IGNvbnRhaW5lck5hbWUgPyBjb250YWluZXJOYW1lICsgJy4nICsgcHJvcGVydHkua2V5Lm5hbWUgOiBwcm9wZXJ0eS5rZXkubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHsgbmFtZTogcHJvcGVydHkua2V5LmdldFZhbHVlKCksIGtpbmQ6IHRoaXMuZ2V0U3ltYm9sS2luZCh2YWx1ZU5vZGUudHlwZSksIGxvY2F0aW9uOiBsb2NhdGlvbiwgY29udGFpbmVyTmFtZTogY29udGFpbmVyTmFtZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3RPdXRsaW5lRW50cmllcyhyZXN1bHQsIHZhbHVlTm9kZSwgY2hpbGRDb250YWluZXJOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGNvbGxlY3RPdXRsaW5lRW50cmllcyhbXSwgcm9vdCwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xuICAgIH1cbiAgICBnZXRTeW1ib2xLaW5kKG5vZGVUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAobm9kZVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlVHlwZTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidmFyaWFibGVcIjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBMb2NhdGlvbiB7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
