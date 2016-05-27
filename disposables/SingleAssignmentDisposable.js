"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SingleAssignmentDisposable = exports.SingleAssignmentDisposable = function () {
    function SingleAssignmentDisposable() {
        _classCallCheck(this, SingleAssignmentDisposable);

        this._isDisposed = false;
    }

    _createClass(SingleAssignmentDisposable, [{
        key: "dispose",
        value: function dispose() {
            if (!this.isDisposed) {
                this._isDisposed = true;
                var old = this._currentDisposable;
                this._currentDisposable = null;
                if (old) old.dispose();
            }
        }
    }, {
        key: "isDisposed",
        get: function get() {
            return this._isDisposed;
        }
    }, {
        key: "disposable",
        get: function get() {
            return this._currentDisposable;
        },
        set: function set(value) {
            if (this._currentDisposable) {
                throw new Error("Disposable has already been assigned");
            }
            if (!this.isDisposed) this._currentDisposable = value;
            if (this.isDisposed && value) value.dispose();
        }
    }]);

    return SingleAssignmentDisposable;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpc3Bvc2FibGVzL1NpbmdsZUFzc2lnbm1lbnREaXNwb3NhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7SUFFQSwwQixXQUFBLDBCO0FBQUEsMENBQUE7QUFBQTs7QUFFWSxhQUFBLFdBQUEsR0FBYyxLQUFkO0FBbUJYOzs7O2tDQVJpQjtBQUNWLGdCQUFJLENBQUMsS0FBSyxVQUFWLEVBQXNCO0FBQ2xCLHFCQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxvQkFBSSxNQUFNLEtBQUssa0JBQWY7QUFDQSxxQkFBSyxrQkFBTCxHQUEwQixJQUExQjtBQUNBLG9CQUFJLEdBQUosRUFBUyxJQUFJLE9BQUo7QUFDWjtBQUNKOzs7NEJBaEJvQjtBQUFLLG1CQUFPLEtBQUssV0FBWjtBQUEwQjs7OzRCQUUvQjtBQUFLLG1CQUFPLEtBQUssa0JBQVo7QUFBaUMsUzswQkFDckMsSyxFQUFLO0FBQ3ZCLGdCQUFJLEtBQUssa0JBQVQsRUFBNkI7QUFBRSxzQkFBTSxJQUFJLEtBQUosQ0FBVSxzQ0FBVixDQUFOO0FBQTBEO0FBQ3pGLGdCQUFJLENBQUMsS0FBSyxVQUFWLEVBQXNCLEtBQUssa0JBQUwsR0FBMEIsS0FBMUI7QUFDdEIsZ0JBQUksS0FBSyxVQUFMLElBQW1CLEtBQXZCLEVBQThCLE1BQU0sT0FBTjtBQUNqQyIsImZpbGUiOiJkaXNwb3NhYmxlcy9TaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7SURpc3Bvc2FibGV9IGZyb20gXCIuL0Rpc3Bvc2FibGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTaW5nbGVBc3NpZ25tZW50RGlzcG9zYWJsZSBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHByaXZhdGUgX2N1cnJlbnREaXNwb3NhYmxlOiBJRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgX2lzRGlzcG9zZWQgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzRGlzcG9zZWQoKSB7IHJldHVybiB0aGlzLl9pc0Rpc3Bvc2VkOyB9XHJcblxyXG4gICAgcHVibGljIGdldCBkaXNwb3NhYmxlKCkgeyByZXR1cm4gdGhpcy5fY3VycmVudERpc3Bvc2FibGU7IH1cclxuICAgIHB1YmxpYyBzZXQgZGlzcG9zYWJsZSh2YWx1ZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50RGlzcG9zYWJsZSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJEaXNwb3NhYmxlIGhhcyBhbHJlYWR5IGJlZW4gYXNzaWduZWRcIik7IH1cclxuICAgICAgICBpZiAoIXRoaXMuaXNEaXNwb3NlZCkgdGhpcy5fY3VycmVudERpc3Bvc2FibGUgPSB2YWx1ZTtcclxuICAgICAgICBpZiAodGhpcy5pc0Rpc3Bvc2VkICYmIHZhbHVlKSB2YWx1ZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBvbGQgPSB0aGlzLl9jdXJyZW50RGlzcG9zYWJsZTtcclxuICAgICAgICAgICAgdGhpcy5fY3VycmVudERpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAob2xkKSBvbGQuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
