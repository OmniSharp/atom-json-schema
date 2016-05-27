'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSONHover = exports.JSONHover = function () {
    function JSONHover(schemaService) {
        var contributions = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, JSONHover);

        this.schemaService = schemaService;
        this.contributions = contributions;
    }

    _createClass(JSONHover, [{
        key: 'doHover',
        value: function doHover(document, textDocumentPosition, doc) {
            var offset = document.offsetAt(textDocumentPosition.position);
            var node = doc.getNodeFromOffset(offset);
            if (node && node.type === 'string') {
                var stringNode = node;
                if (stringNode.isKey) {
                    var propertyNode = node.parent;
                    node = propertyNode.value;
                }
            }
            if (!node) {
                return Promise.resolve(void 0);
            }
            var createHover = function createHover(contents) {
                var range = new Range(document.positionAt(node.start), document.positionAt(node.end));
                var result = {
                    contents: contents,
                    range: range
                };
                return result;
            };
            var location = node.getNodeLocation();
            for (var i = this.contributions.length - 1; i >= 0; i--) {
                var contribution = this.contributions[i];
                var promise = contribution.getInfoContribution(textDocumentPosition.uri, location);
                if (promise) {
                    return promise.then(function (htmlContent) {
                        return createHover(htmlContent);
                    });
                }
            }
            return this.schemaService.getSchemaForResource(textDocumentPosition.uri, doc).then(function (schema) {
                if (schema) {
                    var _ret = function () {
                        var matchingSchemas = [];
                        doc.validate(schema.schema, matchingSchemas, node.start);
                        var description = null;
                        matchingSchemas.every(function (s) {
                            if (s.node === node && !s.inverted && s.schema) {
                                description = description || s.schema.description;
                            }
                            return true;
                        });
                        if (description) {
                            return {
                                v: createHover([description])
                            };
                        }
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                }
                return void 0;
            });
        }
    }]);

    return JSONHover;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbkhvdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7Ozs7SUFPQSxTLFdBQUEsUztBQUtDLHVCQUFZLGFBQVosRUFBMEc7QUFBQSxZQUE3QyxhQUE2Qyx5REFBRixFQUFFOztBQUFBOztBQUN6RyxhQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFDQSxhQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFDQTs7OztnQ0FFYyxRLEVBQTJCLG9CLEVBQXdDLEcsRUFBd0I7QUFFekcsZ0JBQUksU0FBUyxTQUFTLFFBQVQsQ0FBa0IscUJBQXFCLFFBQXZDLENBQWI7QUFDQSxnQkFBSSxPQUFPLElBQUksaUJBQUosQ0FBc0IsTUFBdEIsQ0FBWDtBQUdBLGdCQUFJLFFBQVEsS0FBSyxJQUFMLEtBQWMsUUFBMUIsRUFBb0M7QUFDbkMsb0JBQUksYUFBbUMsSUFBdkM7QUFDQSxvQkFBSSxXQUFXLEtBQWYsRUFBc0I7QUFDckIsd0JBQUksZUFBdUMsS0FBSyxNQUFoRDtBQUNBLDJCQUFPLGFBQWEsS0FBcEI7QUFFQTtBQUNEO0FBRUQsZ0JBQUksQ0FBQyxJQUFMLEVBQVc7QUFDVix1QkFBTyxRQUFRLE9BQVIsQ0FBZ0IsS0FBSyxDQUFyQixDQUFQO0FBQ0E7QUFFRCxnQkFBSSxjQUFjLFNBQWQsV0FBYyxDQUFDLFFBQUQsRUFBeUI7QUFDMUMsb0JBQUksUUFBUSxJQUFJLEtBQUosQ0FBVSxTQUFTLFVBQVQsQ0FBb0IsS0FBSyxLQUF6QixDQUFWLEVBQTJDLFNBQVMsVUFBVCxDQUFvQixLQUFLLEdBQXpCLENBQTNDLENBQVo7QUFDQSxvQkFBSSxTQUFnQjtBQUNuQiw4QkFBVSxRQURTO0FBRW5CLDJCQUFPO0FBRlksaUJBQXBCO0FBSUEsdUJBQU8sTUFBUDtBQUNBLGFBUEQ7QUFTQSxnQkFBSSxXQUFXLEtBQUssZUFBTCxFQUFmO0FBQ0EsaUJBQUssSUFBSSxJQUFJLEtBQUssYUFBTCxDQUFtQixNQUFuQixHQUE0QixDQUF6QyxFQUE0QyxLQUFLLENBQWpELEVBQW9ELEdBQXBELEVBQXlEO0FBQ3hELG9CQUFJLGVBQWUsS0FBSyxhQUFMLENBQW1CLENBQW5CLENBQW5CO0FBQ0Esb0JBQUksVUFBVSxhQUFhLG1CQUFiLENBQWlDLHFCQUFxQixHQUF0RCxFQUEyRCxRQUEzRCxDQUFkO0FBQ0Esb0JBQUksT0FBSixFQUFhO0FBQ1osMkJBQU8sUUFBUSxJQUFSLENBQWE7QUFBQSwrQkFBZSxZQUFZLFdBQVosQ0FBZjtBQUFBLHFCQUFiLENBQVA7QUFDQTtBQUNEO0FBRUQsbUJBQU8sS0FBSyxhQUFMLENBQW1CLG9CQUFuQixDQUF3QyxxQkFBcUIsR0FBN0QsRUFBa0UsR0FBbEUsRUFBdUUsSUFBdkUsQ0FBNEUsVUFBQyxNQUFELEVBQU87QUFDekYsb0JBQUksTUFBSixFQUFZO0FBQUE7QUFDWCw0QkFBSSxrQkFBOEMsRUFBbEQ7QUFDQSw0QkFBSSxRQUFKLENBQWEsT0FBTyxNQUFwQixFQUE0QixlQUE1QixFQUE2QyxLQUFLLEtBQWxEO0FBRUEsNEJBQUksY0FBc0IsSUFBMUI7QUFDQSx3Q0FBZ0IsS0FBaEIsQ0FBc0IsVUFBQyxDQUFELEVBQUU7QUFDdkIsZ0NBQUksRUFBRSxJQUFGLEtBQVcsSUFBWCxJQUFtQixDQUFDLEVBQUUsUUFBdEIsSUFBa0MsRUFBRSxNQUF4QyxFQUFnRDtBQUMvQyw4Q0FBYyxlQUFlLEVBQUUsTUFBRixDQUFTLFdBQXRDO0FBQ0E7QUFDRCxtQ0FBTyxJQUFQO0FBQ0EseUJBTEQ7QUFNQSw0QkFBSSxXQUFKLEVBQWlCO0FBQ2hCO0FBQUEsbUNBQU8sWUFBWSxDQUFDLFdBQUQsQ0FBWjtBQUFQO0FBQ0E7QUFiVTs7QUFBQTtBQWNYO0FBQ0QsdUJBQU8sS0FBSyxDQUFaO0FBQ0EsYUFqQk0sQ0FBUDtBQWtCQSIsImZpbGUiOiJ2c2NvZGUvcGx1Z2luL2pzb25Ib3Zlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5cclxuaW1wb3J0IFBhcnNlciBmcm9tICcuL2pzb25QYXJzZXInO1xyXG5pbXBvcnQgU2NoZW1hU2VydmljZSBmcm9tICcuL2pzb25TY2hlbWFTZXJ2aWNlJztcclxuaW1wb3J0IHtJSlNPTldvcmtlckNvbnRyaWJ1dGlvbn0gZnJvbSAnLi9qc29uQ29udHJpYnV0aW9ucyc7XHJcblxyXG5leHBvcnQgY2xhc3MgSlNPTkhvdmVyIHtcclxuXHJcblx0cHJpdmF0ZSBzY2hlbWFTZXJ2aWNlOiBTY2hlbWFTZXJ2aWNlLklKU09OU2NoZW1hU2VydmljZTtcclxuXHRwcml2YXRlIGNvbnRyaWJ1dGlvbnM6IElKU09OV29ya2VyQ29udHJpYnV0aW9uW107XHJcblxyXG5cdGNvbnN0cnVjdG9yKHNjaGVtYVNlcnZpY2U6IFNjaGVtYVNlcnZpY2UuSUpTT05TY2hlbWFTZXJ2aWNlLCBjb250cmlidXRpb25zOiBJSlNPTldvcmtlckNvbnRyaWJ1dGlvbltdID0gW10pIHtcclxuXHRcdHRoaXMuc2NoZW1hU2VydmljZSA9IHNjaGVtYVNlcnZpY2U7XHJcblx0XHR0aGlzLmNvbnRyaWJ1dGlvbnMgPSBjb250cmlidXRpb25zO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGRvSG92ZXIoZG9jdW1lbnQ6IEF0b20uVGV4dEVkaXRvciwgdGV4dERvY3VtZW50UG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIGRvYzogUGFyc2VyLkpTT05Eb2N1bWVudCk6IFByb21pc2U8SG92ZXI+IHtcclxuXHJcblx0XHRsZXQgb2Zmc2V0ID0gZG9jdW1lbnQub2Zmc2V0QXQodGV4dERvY3VtZW50UG9zaXRpb24ucG9zaXRpb24pO1xyXG5cdFx0bGV0IG5vZGUgPSBkb2MuZ2V0Tm9kZUZyb21PZmZzZXQob2Zmc2V0KTtcclxuXHJcblx0XHQvLyB1c2UgdGhlIHByb3BlcnR5IGRlc2NyaXB0aW9uIHdoZW4gaG92ZXJpbmcgb3ZlciBhbiBvYmplY3Qga2V5XHJcblx0XHRpZiAobm9kZSAmJiBub2RlLnR5cGUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdGxldCBzdHJpbmdOb2RlID0gPFBhcnNlci5TdHJpbmdBU1ROb2RlPm5vZGU7XHJcblx0XHRcdGlmIChzdHJpbmdOb2RlLmlzS2V5KSB7XHJcblx0XHRcdFx0bGV0IHByb3BlcnR5Tm9kZSA9IDxQYXJzZXIuUHJvcGVydHlBU1ROb2RlPm5vZGUucGFyZW50O1xyXG5cdFx0XHRcdG5vZGUgPSBwcm9wZXJ0eU5vZGUudmFsdWU7XHJcblxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFub2RlKSB7XHJcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUodm9pZCAwKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY3JlYXRlSG92ZXIgPSAoY29udGVudHM6IE1hcmtlZFN0cmluZ1tdKSA9PiB7XHJcblx0XHRcdGxldCByYW5nZSA9IG5ldyBSYW5nZShkb2N1bWVudC5wb3NpdGlvbkF0KG5vZGUuc3RhcnQpLCBkb2N1bWVudC5wb3NpdGlvbkF0KG5vZGUuZW5kKSk7XHJcblx0XHRcdGxldCByZXN1bHQ6IEhvdmVyID0ge1xyXG5cdFx0XHRcdGNvbnRlbnRzOiBjb250ZW50cyxcclxuXHRcdFx0XHRyYW5nZTogcmFuZ2VcclxuXHRcdFx0fTtcclxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdH07XHJcblxyXG5cdFx0bGV0IGxvY2F0aW9uID0gbm9kZS5nZXROb2RlTG9jYXRpb24oKTtcclxuXHRcdGZvciAobGV0IGkgPSB0aGlzLmNvbnRyaWJ1dGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuXHRcdFx0bGV0IGNvbnRyaWJ1dGlvbiA9IHRoaXMuY29udHJpYnV0aW9uc1tpXTtcclxuXHRcdFx0bGV0IHByb21pc2UgPSBjb250cmlidXRpb24uZ2V0SW5mb0NvbnRyaWJ1dGlvbih0ZXh0RG9jdW1lbnRQb3NpdGlvbi51cmksIGxvY2F0aW9uKTtcclxuXHRcdFx0aWYgKHByb21pc2UpIHtcclxuXHRcdFx0XHRyZXR1cm4gcHJvbWlzZS50aGVuKGh0bWxDb250ZW50ID0+IGNyZWF0ZUhvdmVyKGh0bWxDb250ZW50KSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcy5zY2hlbWFTZXJ2aWNlLmdldFNjaGVtYUZvclJlc291cmNlKHRleHREb2N1bWVudFBvc2l0aW9uLnVyaSwgZG9jKS50aGVuKChzY2hlbWEpID0+IHtcclxuXHRcdFx0aWYgKHNjaGVtYSkge1xyXG5cdFx0XHRcdGxldCBtYXRjaGluZ1NjaGVtYXM6IFBhcnNlci5JQXBwbGljYWJsZVNjaGVtYVtdID0gW107XHJcblx0XHRcdFx0ZG9jLnZhbGlkYXRlKHNjaGVtYS5zY2hlbWEsIG1hdGNoaW5nU2NoZW1hcywgbm9kZS5zdGFydCk7XHJcblxyXG5cdFx0XHRcdGxldCBkZXNjcmlwdGlvbjogc3RyaW5nID0gbnVsbDtcclxuXHRcdFx0XHRtYXRjaGluZ1NjaGVtYXMuZXZlcnkoKHMpID0+IHtcclxuXHRcdFx0XHRcdGlmIChzLm5vZGUgPT09IG5vZGUgJiYgIXMuaW52ZXJ0ZWQgJiYgcy5zY2hlbWEpIHtcclxuXHRcdFx0XHRcdFx0ZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbiB8fCBzLnNjaGVtYS5kZXNjcmlwdGlvbjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGlmIChkZXNjcmlwdGlvbikge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGNyZWF0ZUhvdmVyKFtkZXNjcmlwdGlvbl0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdm9pZCAwO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
