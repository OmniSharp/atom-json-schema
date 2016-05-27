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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wYXJzZXIvanNvbkxvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7O0lBRUEsWSxXQUFBLFk7QUFHQywwQkFBWSxRQUFaLEVBQThCO0FBQUE7O0FBQzdCLGFBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNBOzs7OytCQUVhLE8sRUFBZTtBQUM1QixtQkFBTyxJQUFJLFlBQUosQ0FBaUIsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixPQUFyQixDQUFqQixDQUFQO0FBQ0E7OztzQ0FFaUI7QUFDakIsbUJBQU8sS0FBSyxRQUFaO0FBQ0E7OztnQ0FFYyxRLEVBQWtCO0FBQ2hDLGdCQUFJLElBQUksQ0FBUjtBQUNBLGlCQUFLLElBQUksSUFBRyxDQUFaLEVBQWUsSUFBSSxTQUFTLE1BQWIsSUFBdUIsSUFBSSxLQUFLLFFBQUwsQ0FBYyxNQUF4RCxFQUFnRSxHQUFoRSxFQUFxRTtBQUNwRSxvQkFBSSxTQUFTLENBQVQsTUFBZ0IsS0FBSyxRQUFMLENBQWMsQ0FBZCxDQUFoQixJQUFvQyxTQUFTLENBQVQsTUFBZ0IsR0FBeEQsRUFBNkQ7QUFDNUQ7QUFDQSxpQkFGRCxNQUVPLElBQUksU0FBUyxDQUFULE1BQWdCLElBQXBCLEVBQTBCO0FBQ2hDLDJCQUFRLEtBQVI7QUFDQTtBQUNEO0FBQ0QsbUJBQU8sTUFBTSxTQUFTLE1BQXRCO0FBQ0E7OzttQ0FFYztBQUNkLG1CQUFPLE1BQU0sS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixJQUFuQixDQUFOLEdBQWlDLEdBQXhDO0FBQ0EiLCJmaWxlIjoidnNjb2RlL3BhcnNlci9qc29uTG9jYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEpTT05Mb2NhdGlvbiB7XHJcblx0cHJpdmF0ZSBzZWdtZW50czogc3RyaW5nW107XHJcblxyXG5cdGNvbnN0cnVjdG9yKHNlZ21lbnRzOiBzdHJpbmdbXSkge1xyXG5cdFx0dGhpcy5zZWdtZW50cyA9IHNlZ21lbnRzO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFwcGVuZChzZWdtZW50OiBzdHJpbmcpIDogSlNPTkxvY2F0aW9uIHtcclxuXHRcdHJldHVybiBuZXcgSlNPTkxvY2F0aW9uKHRoaXMuc2VnbWVudHMuY29uY2F0KHNlZ21lbnQpKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBnZXRTZWdtZW50cygpIHtcclxuXHRcdHJldHVybiB0aGlzLnNlZ21lbnRzO1xyXG5cdH1cclxuXHJcblx0cHVibGljIG1hdGNoZXMoc2VnbWVudHM6IHN0cmluZ1tdKSB7XHJcblx0XHR2YXIgayA9IDA7XHJcblx0XHRmb3IgKHZhciBpPSAwOyBrIDwgc2VnbWVudHMubGVuZ3RoICYmIGkgPCB0aGlzLnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmIChzZWdtZW50c1trXSA9PT0gdGhpcy5zZWdtZW50c1tpXSB8fCBzZWdtZW50c1trXSA9PT0gJyonKSB7XHJcblx0XHRcdFx0aysrO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHNlZ21lbnRzW2tdICE9PSAnKionKSB7XHJcblx0XHRcdFx0cmV0dXJuICBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGsgPT09IHNlZ21lbnRzLmxlbmd0aDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB0b1N0cmluZygpIDogc3RyaW5nIHtcclxuXHRcdHJldHVybiAnWycgKyB0aGlzLnNlZ21lbnRzLmpvaW4oJ11bJykgKyAnXSc7XHJcblx0fVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
