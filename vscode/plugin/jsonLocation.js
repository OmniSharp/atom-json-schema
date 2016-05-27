'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSONLocation = exports.JSONLocation = function () {
    function JSONLocation(segments) {
        _classCallCheck(this, JSONLocation);

        this.segments = segments;
    }

    _createClass(JSONLocation, [{
        key: 'append',
        value: function append(segment) {
            return new JSONLocation(this.segments.concat(segment));
        }
    }, {
        key: 'getSegments',
        value: function getSegments() {
            return this.segments;
        }
    }, {
        key: 'matches',
        value: function matches(segments) {
            var k = 0;
            for (var i = 0; k < segments.length && i < this.segments.length; i++) {
                if (segments[k] === this.segments[i] || segments[k] === '*') {
                    k++;
                } else if (segments[k] !== '**') {
                    return false;
                }
            }
            return k === segments.length;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return '[' + this.segments.join('][') + ']';
        }
    }]);

    return JSONLocation;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vanNvbkxvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7O0lBRUEsWSxXQUFBLFk7QUFHQywwQkFBWSxRQUFaLEVBQThCO0FBQUE7O0FBQzdCLGFBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBOzs7OytCQUVhLE8sRUFBZTtBQUM1QixtQkFBTyxJQUFJLFlBQUosQ0FBaUIsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixPQUFyQixDQUFqQixDQUFQO0FBQ0E7OztzQ0FFaUI7QUFDakIsbUJBQU8sS0FBSyxRQUFaO0FBQ0E7OztnQ0FFYyxRLEVBQWtCO0FBQ2hDLGdCQUFJLElBQUksQ0FBUjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksU0FBUyxNQUFiLElBQXVCLElBQUksS0FBSyxRQUFMLENBQWMsTUFBekQsRUFBaUUsR0FBakUsRUFBc0U7QUFDckUsb0JBQUksU0FBUyxDQUFULE1BQWdCLEtBQUssUUFBTCxDQUFjLENBQWQsQ0FBaEIsSUFBb0MsU0FBUyxDQUFULE1BQWdCLEdBQXhELEVBQTZEO0FBQzVEO0FBQ0EsaUJBRkQsTUFFTyxJQUFJLFNBQVMsQ0FBVCxNQUFnQixJQUFwQixFQUEwQjtBQUNoQywyQkFBTyxLQUFQO0FBQ0E7QUFDRDtBQUNELG1CQUFPLE1BQU0sU0FBUyxNQUF0QjtBQUNBOzs7bUNBRWM7QUFDZCxtQkFBTyxNQUFNLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsSUFBbkIsQ0FBTixHQUFpQyxHQUF4QztBQUNBIiwiZmlsZSI6InZzY29kZS9wbHVnaW4vanNvbkxvY2F0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmV4cG9ydCBjbGFzcyBKU09OTG9jYXRpb24ge1xyXG5cdHByaXZhdGUgc2VnbWVudHM6IHN0cmluZ1tdO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihzZWdtZW50czogc3RyaW5nW10pIHtcclxuXHRcdHRoaXMuc2VnbWVudHMgPSBzZWdtZW50cztcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhcHBlbmQoc2VnbWVudDogc3RyaW5nKTogSlNPTkxvY2F0aW9uIHtcclxuXHRcdHJldHVybiBuZXcgSlNPTkxvY2F0aW9uKHRoaXMuc2VnbWVudHMuY29uY2F0KHNlZ21lbnQpKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBnZXRTZWdtZW50cygpIHtcclxuXHRcdHJldHVybiB0aGlzLnNlZ21lbnRzO1xyXG5cdH1cclxuXHJcblx0cHVibGljIG1hdGNoZXMoc2VnbWVudHM6IHN0cmluZ1tdKSB7XHJcblx0XHRsZXQgayA9IDA7XHJcblx0XHRmb3IgKGxldCBpID0gMDsgayA8IHNlZ21lbnRzLmxlbmd0aCAmJiBpIDwgdGhpcy5zZWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZiAoc2VnbWVudHNba10gPT09IHRoaXMuc2VnbWVudHNbaV0gfHwgc2VnbWVudHNba10gPT09ICcqJykge1xyXG5cdFx0XHRcdGsrKztcclxuXHRcdFx0fSBlbHNlIGlmIChzZWdtZW50c1trXSAhPT0gJyoqJykge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGsgPT09IHNlZ21lbnRzLmxlbmd0aDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB0b1N0cmluZygpOiBzdHJpbmcge1xyXG5cdFx0cmV0dXJuICdbJyArIHRoaXMuc2VnbWVudHMuam9pbignXVsnKSArICddJztcclxuXHR9XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
