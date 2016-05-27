"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SerialDisposable = exports.SerialDisposable = function () {
    function SerialDisposable() {
        _classCallCheck(this, SerialDisposable);

        this._isDisposed = false;
    }

    _createClass(SerialDisposable, [{
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
            var shouldDispose = this.isDisposed;
            if (!shouldDispose) {
                this._currentDisposable = value;
            }
            if (!this.isDisposed) this._currentDisposable = value;
            if (this.isDisposed && value) value.dispose();
        }
    }]);

    return SerialDisposable;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpc3Bvc2FibGVzL1NlcmlhbERpc3Bvc2FibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztJQUVBLGdCLFdBQUEsZ0I7QUFBQSxnQ0FBQTtBQUFBOztBQUVZLGFBQUEsV0FBQSxHQUFjLEtBQWQ7QUFzQlg7Ozs7a0NBUmlCO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLFVBQVYsRUFBc0I7QUFDbEIscUJBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLG9CQUFNLE1BQU0sS0FBSyxrQkFBakI7QUFDQSxxQkFBSyxrQkFBTCxHQUEwQixJQUExQjtBQUNBLG9CQUFJLEdBQUosRUFBUyxJQUFJLE9BQUo7QUFDWjtBQUNKOzs7NEJBbkJvQjtBQUFLLG1CQUFPLEtBQUssV0FBWjtBQUEwQjs7OzRCQUUvQjtBQUFLLG1CQUFPLEtBQUssa0JBQVo7QUFBaUMsUzswQkFDckMsSyxFQUFLO0FBQ3ZCLGdCQUFNLGdCQUFnQixLQUFLLFVBQTNCO0FBQ0EsZ0JBQUksQ0FBQyxhQUFMLEVBQW9CO0FBQ2hCLHFCQUFLLGtCQUFMLEdBQTBCLEtBQTFCO0FBQ0g7QUFDRCxnQkFBSSxDQUFDLEtBQUssVUFBVixFQUFzQixLQUFLLGtCQUFMLEdBQTBCLEtBQTFCO0FBQ3RCLGdCQUFJLEtBQUssVUFBTCxJQUFtQixLQUF2QixFQUE4QixNQUFNLE9BQU47QUFDakMiLCJmaWxlIjoiZGlzcG9zYWJsZXMvU2VyaWFsRGlzcG9zYWJsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7SURpc3Bvc2FibGV9IGZyb20gXCIuL0Rpc3Bvc2FibGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTZXJpYWxEaXNwb3NhYmxlIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBfY3VycmVudERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xyXG4gICAgcHJpdmF0ZSBfaXNEaXNwb3NlZCA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBnZXQgaXNEaXNwb3NlZCgpIHsgcmV0dXJuIHRoaXMuX2lzRGlzcG9zZWQ7IH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGRpc3Bvc2FibGUoKSB7IHJldHVybiB0aGlzLl9jdXJyZW50RGlzcG9zYWJsZTsgfVxyXG4gICAgcHVibGljIHNldCBkaXNwb3NhYmxlKHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgc2hvdWxkRGlzcG9zZSA9IHRoaXMuaXNEaXNwb3NlZDtcclxuICAgICAgICBpZiAoIXNob3VsZERpc3Bvc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5fY3VycmVudERpc3Bvc2FibGUgPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRGlzcG9zZWQpIHRoaXMuX2N1cnJlbnREaXNwb3NhYmxlID0gdmFsdWU7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNEaXNwb3NlZCAmJiB2YWx1ZSkgdmFsdWUuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCBvbGQgPSB0aGlzLl9jdXJyZW50RGlzcG9zYWJsZTtcclxuICAgICAgICAgICAgdGhpcy5fY3VycmVudERpc3Bvc2FibGUgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAob2xkKSBvbGQuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
