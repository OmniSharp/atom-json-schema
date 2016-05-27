"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RefCountDisposable = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Disposable2 = require("./Disposable");

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RefCountDisposable = exports.RefCountDisposable = function () {
    function RefCountDisposable(underlyingDisposable) {
        _classCallCheck(this, RefCountDisposable);

        this._isDisposed = false;
        this._isPrimaryDisposed = false;
        this._count = 0;
        this._underlyingDisposable = _Disposable2.Disposable.of(underlyingDisposable);
    }

    _createClass(RefCountDisposable, [{
        key: "dispose",
        value: function dispose() {
            if (!this.isDisposed && !this._isPrimaryDisposed) {
                this._isPrimaryDisposed = true;
                if (this._count === 0) {
                    this._isDisposed = true;
                    this._underlyingDisposable.dispose();
                }
            }
        }
    }, {
        key: "getDisposable",
        value: function getDisposable() {
            var _this = this;

            if (this.isDisposed) return _Disposable2.Disposable.empty;
            this._count++;
            return new InnerDisposable(this, function () {
                _this._count--;
                if (_this._count === 0 && _this._isPrimaryDisposed) {
                    _this._isDisposed = true;
                    _this._underlyingDisposable.dispose();
                }
            });
        }
    }, {
        key: "isDisposed",
        get: function get() {
            return this._isDisposed;
        }
    }]);

    return RefCountDisposable;
}();

var InnerDisposable = function (_Disposable) {
    _inherits(InnerDisposable, _Disposable);

    function InnerDisposable(_reference, action) {
        _classCallCheck(this, InnerDisposable);

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(InnerDisposable).call(this, action));

        _this2._reference = _reference;
        return _this2;
    }

    _createClass(InnerDisposable, [{
        key: "dispose",
        value: function dispose() {
            if (!this._reference.isDisposed && !this.isDisposed) {
                _get(Object.getPrototypeOf(InnerDisposable.prototype), "dispose", this).call(this);
            }
        }
    }]);

    return InnerDisposable;
}(_Disposable2.Disposable);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpc3Bvc2FibGVzL1JlZkNvdW50RGlzcG9zYWJsZS5qcyIsImRpc3Bvc2FibGVzL1JlZkNvdW50RGlzcG9zYWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7Ozs7OztJQ0VBLGtCLFdBQUEsa0I7QUFNSSxnQ0FBWSxvQkFBWixFQUEyRDtBQUFBOztBQUpuRCxhQUFBLFdBQUEsR0FBYyxLQUFkO0FBQ0EsYUFBQSxrQkFBQSxHQUFxQixLQUFyQjtBQUNBLGFBQUEsTUFBQSxHQUFTLENBQVQ7QUFHSixhQUFLLHFCQUFMLEdBQTZCLHdCQUFXLEVBQVgsQ0FBYyxvQkFBZCxDQUE3QjtBQUNIOzs7O2tDQUlhO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLFVBQU4sSUFBb0IsQ0FBQyxLQUFLLGtCQUE5QixFQUFrRDtBQUM5QyxxQkFBSyxrQkFBTCxHQUEwQixJQUExQjtBQUNBLG9CQUFJLEtBQUssTUFBTCxLQUFnQixDQUFwQixFQUF1QjtBQUNuQix5QkFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EseUJBQUsscUJBQUwsQ0FBMkIsT0FBM0I7QUFDSDtBQUNKO0FBQ0o7Ozt3Q0FFbUI7QUFBQTs7QUFDaEIsZ0JBQUksS0FBSyxVQUFULEVBQXFCLE9BQU8sd0JBQVcsS0FBbEI7QUFFckIsaUJBQUssTUFBTDtBQUNBLG1CQUFPLElBQUksZUFBSixDQUFvQixJQUFwQixFQUEwQixZQUFBO0FBQzdCLHNCQUFLLE1BQUw7QUFDQSxvQkFBSSxNQUFLLE1BQUwsS0FBZ0IsQ0FBaEIsSUFBcUIsTUFBSyxrQkFBOUIsRUFBa0Q7QUFDOUMsMEJBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLDBCQUFLLHFCQUFMLENBQTJCLE9BQTNCO0FBQ0g7QUFDSixhQU5NLENBQVA7QUFPSDs7OzRCQXZCb0I7QUFBSyxtQkFBTyxLQUFLLFdBQVo7QUFBMEI7Ozs7OztJQTBCeEQsZTs7O0FBQ0ksNkJBQW9CLFVBQXBCLEVBQW9ELE1BQXBELEVBQXNFO0FBQUE7O0FBQUEsd0dBQzVELE1BRDREOztBQUFsRCxlQUFBLFVBQUEsR0FBQSxVQUFBO0FBQWtEO0FBRXJFOzs7O2tDQUVhO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLFVBQUwsQ0FBZ0IsVUFBakIsSUFBK0IsQ0FBQyxLQUFLLFVBQXpDLEVBQXFEO0FBQ2pEO0FBQ0g7QUFDSiIsImZpbGUiOiJkaXNwb3NhYmxlcy9SZWZDb3VudERpc3Bvc2FibGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXNwb3NhYmxlIH0gZnJvbSBcIi4vRGlzcG9zYWJsZVwiO1xuZXhwb3J0IGNsYXNzIFJlZkNvdW50RGlzcG9zYWJsZSB7XG4gICAgY29uc3RydWN0b3IodW5kZXJseWluZ0Rpc3Bvc2FibGUpIHtcbiAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc1ByaW1hcnlEaXNwb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jb3VudCA9IDA7XG4gICAgICAgIHRoaXMuX3VuZGVybHlpbmdEaXNwb3NhYmxlID0gRGlzcG9zYWJsZS5vZih1bmRlcmx5aW5nRGlzcG9zYWJsZSk7XG4gICAgfVxuICAgIGdldCBpc0Rpc3Bvc2VkKCkgeyByZXR1cm4gdGhpcy5faXNEaXNwb3NlZDsgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0Rpc3Bvc2VkICYmICF0aGlzLl9pc1ByaW1hcnlEaXNwb3NlZCkge1xuICAgICAgICAgICAgdGhpcy5faXNQcmltYXJ5RGlzcG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGdldERpc3Bvc2FibGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGlzcG9zZWQpXG4gICAgICAgICAgICByZXR1cm4gRGlzcG9zYWJsZS5lbXB0eTtcbiAgICAgICAgdGhpcy5fY291bnQrKztcbiAgICAgICAgcmV0dXJuIG5ldyBJbm5lckRpc3Bvc2FibGUodGhpcywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fY291bnQtLTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb3VudCA9PT0gMCAmJiB0aGlzLl9pc1ByaW1hcnlEaXNwb3NlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VuZGVybHlpbmdEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuY2xhc3MgSW5uZXJEaXNwb3NhYmxlIGV4dGVuZHMgRGlzcG9zYWJsZSB7XG4gICAgY29uc3RydWN0b3IoX3JlZmVyZW5jZSwgYWN0aW9uKSB7XG4gICAgICAgIHN1cGVyKGFjdGlvbik7XG4gICAgICAgIHRoaXMuX3JlZmVyZW5jZSA9IF9yZWZlcmVuY2U7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIGlmICghdGhpcy5fcmVmZXJlbmNlLmlzRGlzcG9zZWQgJiYgIXRoaXMuaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgc3VwZXIuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtJRGlzcG9zYWJsZSwgSURpc3Bvc2FibGVPclN1YnNjcmlwdGlvbiwgRGlzcG9zYWJsZX0gZnJvbSBcIi4vRGlzcG9zYWJsZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlZkNvdW50RGlzcG9zYWJsZSBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX3VuZGVybHlpbmdEaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2lzRGlzcG9zZWQgPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX2lzUHJpbWFyeURpc3Bvc2VkID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9jb3VudCA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IodW5kZXJseWluZ0Rpc3Bvc2FibGU6IElEaXNwb3NhYmxlT3JTdWJzY3JpcHRpb24pIHtcclxuICAgICAgICB0aGlzLl91bmRlcmx5aW5nRGlzcG9zYWJsZSA9IERpc3Bvc2FibGUub2YodW5kZXJseWluZ0Rpc3Bvc2FibGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaXNEaXNwb3NlZCgpIHsgcmV0dXJuIHRoaXMuX2lzRGlzcG9zZWQ7IH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNEaXNwb3NlZCAmJiAhdGhpcy5faXNQcmltYXJ5RGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5faXNQcmltYXJ5RGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fY291bnQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXREaXNwb3NhYmxlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmlzRGlzcG9zZWQpIHJldHVybiBEaXNwb3NhYmxlLmVtcHR5O1xyXG5cclxuICAgICAgICB0aGlzLl9jb3VudCsrO1xyXG4gICAgICAgIHJldHVybiBuZXcgSW5uZXJEaXNwb3NhYmxlKHRoaXMsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fY291bnQtLTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvdW50ID09PSAwICYmIHRoaXMuX2lzUHJpbWFyeURpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3VuZGVybHlpbmdEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbm5lckRpc3Bvc2FibGUgZXh0ZW5kcyBEaXNwb3NhYmxlIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3JlZmVyZW5jZTogUmVmQ291bnREaXNwb3NhYmxlLCBhY3Rpb246ICgpID0+IHZvaWQpIHtcclxuICAgICAgICBzdXBlcihhY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fcmVmZXJlbmNlLmlzRGlzcG9zZWQgJiYgIXRoaXMuaXNEaXNwb3NlZCkge1xyXG4gICAgICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
