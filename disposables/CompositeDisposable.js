"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CompositeDisposable = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Disposable = require("./Disposable");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CompositeDisposable = exports.CompositeDisposable = function () {
    function CompositeDisposable() {
        var _this = this;

        _classCallCheck(this, CompositeDisposable);

        this._disposables = new Set();
        this._isDisposed = false;

        for (var _len = arguments.length, disposables = Array(_len), _key = 0; _key < _len; _key++) {
            disposables[_key] = arguments[_key];
        }

        disposables.forEach(function (item) {
            return _this._disposables.add(item);
        });
    }

    _createClass(CompositeDisposable, [{
        key: "dispose",
        value: function dispose() {
            this._isDisposed = true;
            if (this._disposables.size) {
                this._disposables.forEach(function (disposable) {
                    return _Disposable.Disposable.of(disposable).dispose();
                });
                this._disposables.clear();
            }
        }
    }, {
        key: "add",
        value: function add() {
            var _this2 = this;

            for (var _len2 = arguments.length, disposables = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                disposables[_key2] = arguments[_key2];
            }

            if (this.isDisposed) {
                disposables.forEach(function (item) {
                    return _Disposable.Disposable.of(item).dispose();
                });
            } else {
                disposables.forEach(function (item) {
                    return _this2._disposables.add(item);
                });
            }
        }
    }, {
        key: "remove",
        value: function remove(disposable) {
            return this._disposables.delete(disposable);
        }
    }, {
        key: "isDisposed",
        get: function get() {
            return this._isDisposed;
        }
    }]);

    return CompositeDisposable;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpc3Bvc2FibGVzL0NvbXBvc2l0ZURpc3Bvc2FibGUuanMiLCJkaXNwb3NhYmxlcy9Db21wb3NpdGVEaXNwb3NhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0lDQ0EsbUIsV0FBQSxtQjtBQUlJLG1DQUF1RDtBQUFBOztBQUFBOztBQUgvQyxhQUFBLFlBQUEsR0FBZSxJQUFJLEdBQUosRUFBZjtBQUNBLGFBQUEsV0FBQSxHQUFjLEtBQWQ7O0FBRStDLDBDQUF4QyxXQUF3QztBQUF4Qyx1QkFBd0M7QUFBQTs7QUFDbkQsb0JBQVksT0FBWixDQUFvQixVQUFDLElBQUQ7QUFBQSxtQkFBZSxNQUFLLFlBQUwsQ0FBa0IsR0FBbEIsQ0FBc0IsSUFBdEIsQ0FBZjtBQUFBLFNBQXBCO0FBQ0g7Ozs7a0NBSWE7QUFDVixpQkFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsZ0JBQUksS0FBSyxZQUFMLENBQWtCLElBQXRCLEVBQTRCO0FBQ3hCLHFCQUFLLFlBQUwsQ0FBa0IsT0FBbEIsQ0FBMEI7QUFBQSwyQkFBYyx1QkFBVyxFQUFYLENBQWMsVUFBZCxFQUEwQixPQUExQixFQUFkO0FBQUEsaUJBQTFCO0FBQ0EscUJBQUssWUFBTCxDQUFrQixLQUFsQjtBQUNIO0FBQ0o7Ozs4QkFFcUQ7QUFBQTs7QUFBQSwrQ0FBeEMsV0FBd0M7QUFBeEMsMkJBQXdDO0FBQUE7O0FBQ2xELGdCQUFJLEtBQUssVUFBVCxFQUFxQjtBQUNqQiw0QkFBWSxPQUFaLENBQW9CLFVBQUMsSUFBRDtBQUFBLDJCQUFlLHVCQUFXLEVBQVgsQ0FBYyxJQUFkLEVBQW9CLE9BQXBCLEVBQWY7QUFBQSxpQkFBcEI7QUFDSCxhQUZELE1BRU87QUFDSCw0QkFBWSxPQUFaLENBQW9CLFVBQUMsSUFBRDtBQUFBLDJCQUFlLE9BQUssWUFBTCxDQUFrQixHQUFsQixDQUFzQixJQUF0QixDQUFmO0FBQUEsaUJBQXBCO0FBQ0g7QUFDSjs7OytCQUVhLFUsRUFBcUM7QUFDL0MsbUJBQU8sS0FBSyxZQUFMLENBQWtCLE1BQWxCLENBQXlCLFVBQXpCLENBQVA7QUFDSDs7OzRCQXBCb0I7QUFBSyxtQkFBTyxLQUFLLFdBQVo7QUFBMEIiLCJmaWxlIjoiZGlzcG9zYWJsZXMvQ29tcG9zaXRlRGlzcG9zYWJsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpc3Bvc2FibGUgfSBmcm9tIFwiLi9EaXNwb3NhYmxlXCI7XG5leHBvcnQgY2xhc3MgQ29tcG9zaXRlRGlzcG9zYWJsZSB7XG4gICAgY29uc3RydWN0b3IoLi4uZGlzcG9zYWJsZXMpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX2lzRGlzcG9zZWQgPSBmYWxzZTtcbiAgICAgICAgZGlzcG9zYWJsZXMuZm9yRWFjaCgoaXRlbSkgPT4gdGhpcy5fZGlzcG9zYWJsZXMuYWRkKGl0ZW0pKTtcbiAgICB9XG4gICAgZ2V0IGlzRGlzcG9zZWQoKSB7IHJldHVybiB0aGlzLl9pc0Rpc3Bvc2VkOyB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLl9kaXNwb3NhYmxlcy5zaXplKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlcy5mb3JFYWNoKGRpc3Bvc2FibGUgPT4gRGlzcG9zYWJsZS5vZihkaXNwb3NhYmxlKS5kaXNwb3NlKCkpO1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZXMuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhZGQoLi4uZGlzcG9zYWJsZXMpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgZGlzcG9zYWJsZXMuZm9yRWFjaCgoaXRlbSkgPT4gRGlzcG9zYWJsZS5vZihpdGVtKS5kaXNwb3NlKCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGlzcG9zYWJsZXMuZm9yRWFjaCgoaXRlbSkgPT4gdGhpcy5fZGlzcG9zYWJsZXMuYWRkKGl0ZW0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZW1vdmUoZGlzcG9zYWJsZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzcG9zYWJsZXMuZGVsZXRlKGRpc3Bvc2FibGUpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7SURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlT3JTdWJzY3JpcHRpb259IGZyb20gXCIuL0Rpc3Bvc2FibGVcIjtcclxuZXhwb3J0IGNsYXNzIENvbXBvc2l0ZURpc3Bvc2FibGUgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XHJcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlcyA9IG5ldyBTZXQ8SURpc3Bvc2FibGVPclN1YnNjcmlwdGlvbj4oKTtcclxuICAgIHByaXZhdGUgX2lzRGlzcG9zZWQgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvciguLi5kaXNwb3NhYmxlczogSURpc3Bvc2FibGVPclN1YnNjcmlwdGlvbltdKSB7XHJcbiAgICAgICAgZGlzcG9zYWJsZXMuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB0aGlzLl9kaXNwb3NhYmxlcy5hZGQoaXRlbSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgaXNEaXNwb3NlZCgpIHsgcmV0dXJuIHRoaXMuX2lzRGlzcG9zZWQ7IH1cclxuXHJcbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLl9pc0Rpc3Bvc2VkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5fZGlzcG9zYWJsZXMuc2l6ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlcy5mb3JFYWNoKGRpc3Bvc2FibGUgPT4gRGlzcG9zYWJsZS5vZihkaXNwb3NhYmxlKS5kaXNwb3NlKCkpO1xyXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlcy5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkKC4uLmRpc3Bvc2FibGVzOiBJRGlzcG9zYWJsZU9yU3Vic2NyaXB0aW9uW10pIHtcclxuICAgICAgICBpZiAodGhpcy5pc0Rpc3Bvc2VkKSB7XHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGVzLmZvckVhY2goKGl0ZW06IGFueSkgPT4gRGlzcG9zYWJsZS5vZihpdGVtKS5kaXNwb3NlKCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRpc3Bvc2FibGVzLmZvckVhY2goKGl0ZW06IGFueSkgPT4gdGhpcy5fZGlzcG9zYWJsZXMuYWRkKGl0ZW0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlbW92ZShkaXNwb3NhYmxlOiBJRGlzcG9zYWJsZU9yU3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGVzLmRlbGV0ZShkaXNwb3NhYmxlKTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
