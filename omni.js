"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.omni = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _disposables = require("./disposables");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Omni = function () {
    function Omni() {
        _classCallCheck(this, Omni);

        this.disposable = new _disposables.CompositeDisposable();
        this._editor = new _rxjs.ReplaySubject(1);
        this._editorObservable = this._editor.asObservable();
    }

    _createClass(Omni, [{
        key: "activate",
        value: function activate() {
            this.setupEditorObservable();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "setupEditorObservable",
        value: function setupEditorObservable() {
            var _this = this;

            this.disposable.add(atom.workspace.observeActivePaneItem(function (pane) {
                if (pane && pane.getGrammar) {
                    var grammar = pane.getGrammar();
                    if (grammar) {
                        var grammarName = grammar.name;
                        if (grammarName === 'JSON') {
                            _this._editor.next(pane);
                            return;
                        }
                    }
                }
                _this._editor.next(null);
            }));
        }
    }, {
        key: "activeEditor",
        get: function get() {
            return this._editorObservable;
        }
    }, {
        key: "activeSchema",
        get: function get() {
            return this._schema;
        },
        set: function set(value) {
            this._schema = value;
            this._editorObservable.take(1).filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                return editor['__json__schema__'] = value;
            });
        }
    }]);

    return Omni;
}();

var omni = exports.omni = new Omni();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9tbmkuanMiLCJvbW5pLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDS0EsSTtBQUFBLG9CQUFBO0FBQUE7O0FBQ1ksYUFBQSxVQUFBLEdBQWEsc0NBQWI7QUFDQSxhQUFBLE9BQUEsR0FBVSx3QkFBbUMsQ0FBbkMsQ0FBVjtBQUNBLGFBQUEsaUJBQUEsR0FBb0IsS0FBSyxPQUFMLENBQWEsWUFBYixFQUFwQjtBQW9DWDs7OzttQ0FsQ2tCO0FBQ1gsaUJBQUsscUJBQUw7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7Z0RBSTRCO0FBQUE7O0FBQ3pCLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxTQUFMLENBQWUscUJBQWYsQ0FBcUMsVUFBQyxJQUFELEVBQVU7QUFDL0Qsb0JBQUksUUFBUSxLQUFLLFVBQWpCLEVBQTZCO0FBQ3pCLHdCQUFJLFVBQVUsS0FBSyxVQUFMLEVBQWQ7QUFDQSx3QkFBSSxPQUFKLEVBQWE7QUFDVCw0QkFBSSxjQUFjLFFBQVEsSUFBMUI7QUFDQSw0QkFBSSxnQkFBZ0IsTUFBcEIsRUFBNEI7QUFDeEIsa0NBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEI7QUFDQTtBQUNIO0FBQ0o7QUFDSjtBQUdELHNCQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLElBQWxCO0FBQ0gsYUFkbUIsQ0FBcEI7QUFlSDs7OzRCQWxCc0I7QUFBSyxtQkFBTyxLQUFLLGlCQUFaO0FBQWdDOzs7NEJBcUJyQztBQUFLLG1CQUFPLEtBQUssT0FBWjtBQUFxQixTOzBCQUN6QixLLEVBQUs7QUFDekIsaUJBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxpQkFBSyxpQkFBTCxDQUF1QixJQUF2QixDQUE0QixDQUE1QixFQUErQixNQUEvQixDQUFzQztBQUFBLHVCQUFLLENBQUMsQ0FBQyxDQUFQO0FBQUEsYUFBdEMsRUFBZ0QsU0FBaEQsQ0FBMEQ7QUFBQSx1QkFBVSxPQUFPLGtCQUFQLElBQTZCLEtBQXZDO0FBQUEsYUFBMUQ7QUFDSDs7Ozs7O0FBR0UsSUFBSSxzQkFBTyxJQUFJLElBQUosRUFBWCIsImZpbGUiOiJvbW5pLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwbGF5U3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIi4vZGlzcG9zYWJsZXNcIjtcbmNsYXNzIE9tbmkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBuZXcgUmVwbGF5U3ViamVjdCgxKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yT2JzZXJ2YWJsZSA9IHRoaXMuX2VkaXRvci5hc09ic2VydmFibGUoKTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuc2V0dXBFZGl0b3JPYnNlcnZhYmxlKCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGdldCBhY3RpdmVFZGl0b3IoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JPYnNlcnZhYmxlOyB9XG4gICAgc2V0dXBFZGl0b3JPYnNlcnZhYmxlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHBhbmUgJiYgcGFuZS5nZXRHcmFtbWFyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdyYW1tYXIgPSBwYW5lLmdldEdyYW1tYXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JhbW1hcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JhbW1hck5hbWUgPSBncmFtbWFyLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChncmFtbWFyTmFtZSA9PT0gJ0pTT04nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9lZGl0b3IubmV4dChwYW5lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5uZXh0KG51bGwpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGdldCBhY3RpdmVTY2hlbWEoKSB7IHJldHVybiB0aGlzLl9zY2hlbWE7IH1cbiAgICBzZXQgYWN0aXZlU2NoZW1hKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3NjaGVtYSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9lZGl0b3JPYnNlcnZhYmxlLnRha2UoMSkuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IGVkaXRvclsnX19qc29uX19zY2hlbWFfXyddID0gdmFsdWUpO1xuICAgIH1cbn1cbmV4cG9ydCB2YXIgb21uaSA9IG5ldyBPbW5pO1xuIiwiLy9vbW5pcHJlc2VudFxyXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQge1JlcGxheVN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7SVNjaGVtYX0gZnJvbSBcIi4vc2NoZW1hLXByb3ZpZGVyXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCIuL2Rpc3Bvc2FibGVzXCI7XHJcblxyXG5jbGFzcyBPbW5pIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xyXG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgIHByaXZhdGUgX2VkaXRvciA9IG5ldyBSZXBsYXlTdWJqZWN0PEF0b20uVGV4dEVkaXRvcj4oMSk7XHJcbiAgICBwcml2YXRlIF9lZGl0b3JPYnNlcnZhYmxlID0gdGhpcy5fZWRpdG9yLmFzT2JzZXJ2YWJsZSgpO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLnNldHVwRWRpdG9yT2JzZXJ2YWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBhY3RpdmVFZGl0b3IoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JPYnNlcnZhYmxlOyB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cEVkaXRvck9ic2VydmFibGUoKSB7XHJcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmU6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocGFuZSAmJiBwYW5lLmdldEdyYW1tYXIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBncmFtbWFyID0gcGFuZS5nZXRHcmFtbWFyKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ3JhbW1hcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBncmFtbWFyTmFtZSA9IGdyYW1tYXIubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JhbW1hck5hbWUgPT09ICdKU09OJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9lZGl0b3IubmV4dChwYW5lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVGhpcyB3aWxsIHRlbGwgdXMgd2hlbiB0aGUgZWRpdG9yIGlzIG5vIGxvbmdlciBhbiBhcHByb3ByaWF0ZSBlZGl0b3JcclxuICAgICAgICAgICAgdGhpcy5fZWRpdG9yLm5leHQobnVsbCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX3NjaGVtYTogSVNjaGVtYTtcclxuICAgIHB1YmxpYyBnZXQgYWN0aXZlU2NoZW1hKCkgeyByZXR1cm4gdGhpcy5fc2NoZW1hIH1cclxuICAgIHB1YmxpYyBzZXQgYWN0aXZlU2NoZW1hKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fc2NoZW1hID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5fZWRpdG9yT2JzZXJ2YWJsZS50YWtlKDEpLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiBlZGl0b3JbJ19fanNvbl9fc2NoZW1hX18nXSA9IHZhbHVlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBvbW5pID0gbmV3IE9tbmk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
