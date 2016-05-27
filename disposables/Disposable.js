"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var empty = void 0;

var Disposable = exports.Disposable = function () {
    function Disposable(value) {
        _classCallCheck(this, Disposable);

        this._isDisposed = false;
        if (!value) return empty;
        if (typeof value === "function") {
            this._action = value;
        } else if (value.unsubscribe) {
            this._action = function () {
                return value.unsubscribe();
            };
        } else if (value.dispose) {
            this._action = function () {
                return value.dispose();
            };
        }
    }

    _createClass(Disposable, [{
        key: "dispose",
        value: function dispose() {
            if (!this.isDisposed) {
                this._isDisposed = true;
                this._action();
            }
        }
    }, {
        key: "isDisposed",
        get: function get() {
            return this._isDisposed;
        }
    }], [{
        key: "of",
        value: function of(value) {
            if (!value) return empty;
            if (value.dispose) {
                return value;
            }
            return new Disposable(value);
        }
    }, {
        key: "create",
        value: function create(action) {
            return new Disposable(action);
        }
    }, {
        key: "empty",
        get: function get() {
            return empty;
        }
    }]);

    return Disposable;
}();

empty = new Disposable(function noop() {});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRpc3Bvc2FibGVzL0Rpc3Bvc2FibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVNBLElBQUksY0FBSjs7SUFFQSxVLFdBQUEsVTtBQW9CSSx3QkFBWSxLQUFaLEVBQXNCO0FBQUE7O0FBSGQsYUFBQSxXQUFBLEdBQWMsS0FBZDtBQUlKLFlBQUksQ0FBQyxLQUFMLEVBQVksT0FBTyxLQUFQO0FBRVosWUFBSSxPQUFPLEtBQVAsS0FBaUIsVUFBckIsRUFBaUM7QUFDN0IsaUJBQUssT0FBTCxHQUFlLEtBQWY7QUFDSCxTQUZELE1BRU8sSUFBSSxNQUFNLFdBQVYsRUFBdUI7QUFDMUIsaUJBQUssT0FBTCxHQUFlO0FBQUEsdUJBQXNCLE1BQU8sV0FBUCxFQUF0QjtBQUFBLGFBQWY7QUFDSCxTQUZNLE1BRUEsSUFBSSxNQUFNLE9BQVYsRUFBbUI7QUFDdEIsaUJBQUssT0FBTCxHQUFlO0FBQUEsdUJBQW9CLE1BQU8sT0FBUCxFQUFwQjtBQUFBLGFBQWY7QUFDSDtBQUNKOzs7O2tDQUlhO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLFVBQVYsRUFBc0I7QUFDbEIscUJBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLHFCQUFLLE9BQUw7QUFDSDtBQUNKOzs7NEJBUG9CO0FBQUssbUJBQU8sS0FBSyxXQUFaO0FBQTBCOzs7MkJBN0JuQyxLLEVBQVU7QUFDdkIsZ0JBQUksQ0FBQyxLQUFMLEVBQVksT0FBTyxLQUFQO0FBRVosZ0JBQUksTUFBTSxPQUFWLEVBQW1CO0FBQ2YsdUJBQW9CLEtBQXBCO0FBQ0g7QUFDRCxtQkFBTyxJQUFJLFVBQUosQ0FBZSxLQUFmLENBQVA7QUFDSDs7OytCQUVvQixNLEVBQWtCO0FBQ25DLG1CQUFPLElBQUksVUFBSixDQUFlLE1BQWYsQ0FBUDtBQUNIOzs7NEJBYnNCO0FBQUssbUJBQU8sS0FBUDtBQUFlOzs7Ozs7QUF5Qy9DLFFBQVEsSUFBSSxVQUFKLENBQWUsU0FBQSxJQUFBLEdBQUEsQ0FBeUIsQ0FBeEMsQ0FBUiIsImZpbGUiOiJkaXNwb3NhYmxlcy9EaXNwb3NhYmxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGludGVyZmFjZSBJRGlzcG9zYWJsZSB7XHJcbiAgICBkaXNwb3NlKCk6IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVN1YnNjcmlwdGlvbiB7XHJcbiAgICB1bnN1YnNjcmliZSgpOiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBJRGlzcG9zYWJsZU9yU3Vic2NyaXB0aW9uID0gSURpc3Bvc2FibGUgfCBJU3Vic2NyaXB0aW9uIHwgKCgpID0+IHZvaWQpO1xyXG5sZXQgZW1wdHk6IERpc3Bvc2FibGU7XHJcblxyXG5leHBvcnQgY2xhc3MgRGlzcG9zYWJsZSBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IGVtcHR5KCkgeyByZXR1cm4gZW1wdHk7IH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIG9mKHZhbHVlOiBhbnkpIHtcclxuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm4gZW1wdHk7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZS5kaXNwb3NlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiA8SURpc3Bvc2FibGU+dmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGUoYWN0aW9uOiAoKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKGFjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYWN0aW9uOiAoKSA9PiB2b2lkO1xyXG4gICAgcHJpdmF0ZSBfaXNEaXNwb3NlZCA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBJRGlzcG9zYWJsZU9yU3Vic2NyaXB0aW9uKTtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnkpIHtcclxuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm4gZW1wdHk7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB0aGlzLl9hY3Rpb24gPSB2YWx1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLnVuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGlvbiA9ICgpID0+ICg8SVN1YnNjcmlwdGlvbj52YWx1ZSkudW5zdWJzY3JpYmUoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlLmRpc3Bvc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5fYWN0aW9uID0gKCkgPT4gKDxJRGlzcG9zYWJsZT52YWx1ZSkuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IGlzRGlzcG9zZWQoKSB7IHJldHVybiB0aGlzLl9pc0Rpc3Bvc2VkOyB9XHJcblxyXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRGlzcG9zZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5faXNEaXNwb3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGlvbigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZW1wdHkgPSBuZXcgRGlzcG9zYWJsZShmdW5jdGlvbiBub29wKCkgeyAvKiAqLyB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
