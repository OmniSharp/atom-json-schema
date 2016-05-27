"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _disposables = require("./disposables");

var _omni = require("./omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JsonSchema = function () {
    function JsonSchema() {
        _classCallCheck(this, JsonSchema);

        this.disposable = new _disposables.CompositeDisposable();
    }

    _createClass(JsonSchema, [{
        key: "activate",
        value: function activate(state) {
            _omni.omni.activate();
            this.disposable.add(_omni.omni);

            var _require = require('./schema-selector');

            var schemaSelector = _require.schemaSelector;

            this.disposable.add(schemaSelector);
            schemaSelector.activate();
            schemaSelector.attach();
        }
    }, {
        key: "deactivate",
        value: function deactivate() {
            this.disposable.dispose();
        }
    }, {
        key: "consumeStatusBar",
        value: function consumeStatusBar(statusBar) {
            var _require2 = require('./schema-selector');

            var schemaSelector = _require2.schemaSelector;

            schemaSelector.setup(statusBar);
        }
    }, {
        key: "consumeProvider",
        value: function consumeProvider(providers) {
            if (!providers) return;
            if (!_lodash2.default.isArray(providers)) providers = [providers];
            var cd = new _disposables.CompositeDisposable();

            var _require3 = require("./schema-autocomplete");

            var CompletionProvider = _require3.CompletionProvider;

            _lodash2.default.each(providers, CompletionProvider.registerProvider);
            return cd;
        }
    }, {
        key: "provideAutocomplete",
        value: function provideAutocomplete() {
            var _require4 = require("./schema-autocomplete");

            var CompletionProvider = _require4.CompletionProvider;

            return CompletionProvider;
        }
    }, {
        key: "provideLinter",
        value: function provideLinter(linter) {
            var LinterProvider = require("./schema-linter");
            return LinterProvider.provider;
        }
    }]);

    return JsonSchema;
}();

module.exports = new JsonSchema();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzb24tc2NoZW1hLmpzIiwianNvbi1zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7OztJQ0dBLFU7QUFBQSwwQkFBQTtBQUFBOztBQUNZLGFBQUEsVUFBQSxHQUFhLHNDQUFiO0FBOENYOzs7O2lDQTFDbUIsSyxFQUFVO0FBQ3RCLHVCQUFLLFFBQUw7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCOztBQUZzQiwyQkFJQyxRQUFRLG1CQUFSLENBSkQ7O0FBQUEsZ0JBSWpCLGNBSmlCLFlBSWpCLGNBSmlCOztBQUt0QixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLGNBQXBCO0FBS0EsMkJBQWUsUUFBZjtBQUNBLDJCQUFlLE1BQWY7QUFDSDs7O3FDQUVnQjtBQUNiLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7O3lDQUV1QixTLEVBQWM7QUFBQSw0QkFDWCxRQUFRLG1CQUFSLENBRFc7O0FBQUEsZ0JBQzdCLGNBRDZCLGFBQzdCLGNBRDZCOztBQUVsQywyQkFBZSxLQUFmLENBQXFCLFNBQXJCO0FBQ0g7Ozt3Q0FFc0IsUyxFQUFjO0FBQ2pDLGdCQUFJLENBQUMsU0FBTCxFQUFnQjtBQUNoQixnQkFBSSxDQUFDLGlCQUFFLE9BQUYsQ0FBVSxTQUFWLENBQUwsRUFBMkIsWUFBWSxDQUFDLFNBQUQsQ0FBWjtBQUMzQixnQkFBSSxLQUFLLHNDQUFUOztBQUhpQyw0QkFJTixRQUFRLHVCQUFSLENBSk07O0FBQUEsZ0JBSTVCLGtCQUo0QixhQUk1QixrQkFKNEI7O0FBS2pDLDZCQUFFLElBQUYsQ0FBTyxTQUFQLEVBQWtCLG1CQUFtQixnQkFBckM7QUFDQSxtQkFBTyxFQUFQO0FBQ0g7Ozs4Q0FFeUI7QUFBQSw0QkFDSyxRQUFRLHVCQUFSLENBREw7O0FBQUEsZ0JBQ2pCLGtCQURpQixhQUNqQixrQkFEaUI7O0FBR3RCLG1CQUFPLGtCQUFQO0FBQ0g7OztzQ0FFb0IsTSxFQUFXO0FBQzVCLGdCQUFJLGlCQUFpQixRQUFRLGlCQUFSLENBQXJCO0FBQ0EsbUJBQU8sZUFBZSxRQUF0QjtBQUNIOzs7Ozs7QUFHTCxPQUFPLE9BQVAsR0FBaUIsSUFBSSxVQUFKLEVBQWpCIiwiZmlsZSI6Impzb24tc2NoZW1hLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwiLi9kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgb21uaSB9IGZyb20gXCIuL29tbmlcIjtcbmNsYXNzIEpzb25TY2hlbWEge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBhY3RpdmF0ZShzdGF0ZSkge1xuICAgICAgICBvbW5pLmFjdGl2YXRlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQob21uaSk7XG4gICAgICAgIHZhciB7IHNjaGVtYVNlbGVjdG9yIH0gPSByZXF1aXJlKCcuL3NjaGVtYS1zZWxlY3RvcicpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNjaGVtYVNlbGVjdG9yKTtcbiAgICAgICAgc2NoZW1hU2VsZWN0b3IuYWN0aXZhdGUoKTtcbiAgICAgICAgc2NoZW1hU2VsZWN0b3IuYXR0YWNoKCk7XG4gICAgfVxuICAgIGRlYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyKSB7XG4gICAgICAgIHZhciB7IHNjaGVtYVNlbGVjdG9yIH0gPSByZXF1aXJlKCcuL3NjaGVtYS1zZWxlY3RvcicpO1xuICAgICAgICBzY2hlbWFTZWxlY3Rvci5zZXR1cChzdGF0dXNCYXIpO1xuICAgIH1cbiAgICBjb25zdW1lUHJvdmlkZXIocHJvdmlkZXJzKSB7XG4gICAgICAgIGlmICghcHJvdmlkZXJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIV8uaXNBcnJheShwcm92aWRlcnMpKVxuICAgICAgICAgICAgcHJvdmlkZXJzID0gW3Byb3ZpZGVyc107XG4gICAgICAgIHZhciBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHZhciB7IENvbXBsZXRpb25Qcm92aWRlciB9ID0gcmVxdWlyZShcIi4vc2NoZW1hLWF1dG9jb21wbGV0ZVwiKTtcbiAgICAgICAgXy5lYWNoKHByb3ZpZGVycywgQ29tcGxldGlvblByb3ZpZGVyLnJlZ2lzdGVyUHJvdmlkZXIpO1xuICAgICAgICByZXR1cm4gY2Q7XG4gICAgfVxuICAgIHByb3ZpZGVBdXRvY29tcGxldGUoKSB7XG4gICAgICAgIHZhciB7IENvbXBsZXRpb25Qcm92aWRlciB9ID0gcmVxdWlyZShcIi4vc2NoZW1hLWF1dG9jb21wbGV0ZVwiKTtcbiAgICAgICAgcmV0dXJuIENvbXBsZXRpb25Qcm92aWRlcjtcbiAgICB9XG4gICAgcHJvdmlkZUxpbnRlcihsaW50ZXIpIHtcbiAgICAgICAgdmFyIExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2NoZW1hLWxpbnRlclwiKTtcbiAgICAgICAgcmV0dXJuIExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gbmV3IEpzb25TY2hlbWE7XG4iLCJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3R9IGZyb20gXCJyeGpzXCI7XHJcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIi4vZGlzcG9zYWJsZXNcIjtcclxuaW1wb3J0IHtvbW5pfSBmcm9tIFwiLi9vbW5pXCI7XHJcblxyXG5jbGFzcyBKc29uU2NoZW1hIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgcHVibGljIGVkaXRvcjogT2JzZXJ2YWJsZTxBdG9tLlRleHRFZGl0b3I+O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZShzdGF0ZTogYW55KSB7XHJcbiAgICAgICAgb21uaS5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQob21uaSk7XHJcblxyXG4gICAgICAgIHZhciB7c2NoZW1hU2VsZWN0b3J9ID0gcmVxdWlyZSgnLi9zY2hlbWEtc2VsZWN0b3InKTtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNjaGVtYVNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgLy92YXIge3NjaGVtYVByU2VsZWN0b3J9ID0gcmVxdWlyZSgnLi9zY2hlbWEtc2VsZWN0b3InKTtcclxuICAgICAgICAvL3RoaXMuZGlzcG9zYWJsZS5hZGQoc2NoZW1hU2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBzY2hlbWFTZWxlY3Rvci5hY3RpdmF0ZSgpO1xyXG4gICAgICAgIHNjaGVtYVNlbGVjdG9yLmF0dGFjaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWFjdGl2YXRlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyOiBhbnkpIHtcclxuICAgICAgICB2YXIge3NjaGVtYVNlbGVjdG9yfSA9IHJlcXVpcmUoJy4vc2NoZW1hLXNlbGVjdG9yJyk7XHJcbiAgICAgICAgc2NoZW1hU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyczogYW55KSB7XHJcbiAgICAgICAgaWYgKCFwcm92aWRlcnMpIHJldHVybjtcclxuICAgICAgICBpZiAoIV8uaXNBcnJheShwcm92aWRlcnMpKSBwcm92aWRlcnMgPSBbcHJvdmlkZXJzXTtcclxuICAgICAgICB2YXIgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgIHZhciB7Q29tcGxldGlvblByb3ZpZGVyfSA9IHJlcXVpcmUoXCIuL3NjaGVtYS1hdXRvY29tcGxldGVcIik7XHJcbiAgICAgICAgXy5lYWNoKHByb3ZpZGVycywgQ29tcGxldGlvblByb3ZpZGVyLnJlZ2lzdGVyUHJvdmlkZXIpO1xyXG4gICAgICAgIHJldHVybiBjZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcclxuICAgICAgICB2YXIge0NvbXBsZXRpb25Qcm92aWRlcn0gPSByZXF1aXJlKFwiLi9zY2hlbWEtYXV0b2NvbXBsZXRlXCIpO1xyXG4gICAgICAgIC8vdGhpcy5kaXNwb3NhYmxlLmFkZChDb21wbGV0aW9uUHJvdmlkZXIpO1xyXG4gICAgICAgIHJldHVybiBDb21wbGV0aW9uUHJvdmlkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHByb3ZpZGVMaW50ZXIobGludGVyOiBhbnkpIHtcclxuICAgICAgICB2YXIgTGludGVyUHJvdmlkZXIgPSByZXF1aXJlKFwiLi9zY2hlbWEtbGludGVyXCIpO1xyXG4gICAgICAgIHJldHVybiBMaW50ZXJQcm92aWRlci5wcm92aWRlcjtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgSnNvblNjaGVtYTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
