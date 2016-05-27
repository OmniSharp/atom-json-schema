'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.schemaSelector = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _disposables = require('./disposables');

var _schemaSelectorView = require('./schema-selector-view');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _omni = require('./omni');

var _schemaProvider = require('./schema-provider');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SchemaSelector = function () {
    function SchemaSelector() {
        _classCallCheck(this, SchemaSelector);

        this._active = false;
    }

    _createClass(SchemaSelector, [{
        key: 'activate',
        value: function activate() {
            this.disposable = new _disposables.CompositeDisposable();
        }
    }, {
        key: 'setup',
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: 'attach',
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: '_attach',
        value: function _attach() {
            var _this = this;

            this.view = document.createElement("span");
            this.view.classList.add('inline-block');
            this.view.classList.add('schema-selector');
            this.view.style.display = 'none';
            var alignLeft = !atom.config.get('grammar-selector.showOnRightSideOfStatusBar');
            if (!alignLeft) {
                var tile = this.statusBar.addRightTile({
                    item: this.view,
                    priority: 9
                });
            } else {
                var tile = this.statusBar.addLeftTile({
                    item: this.view,
                    priority: 11
                });
            }
            this._component = _react2.default.render(_react2.default.createElement(_schemaSelectorView.SelectorComponent, { alignLeft: alignLeft }), this.view);
            this.disposable.add(_disposables.Disposable.create(function () {
                _react2.default.unmountComponentAtNode(_this.view);
                tile.destroy();
                _this.view.remove();
            }));
            this.disposable.add(_omni.omni.activeEditor.filter(function (z) {
                return !z;
            }).subscribe(function () {
                return _this.view.style.display = 'none';
            }));
            this.disposable.add(_omni.omni.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(function () {
                return _this.view.style.display = '';
            }));
            this.disposable.add(_omni.omni.activeEditor.switchMap(function (editor) {
                return _schemaProvider.schemaProvider.getSchemaForEditor(editor);
            }).defaultIfEmpty({}).subscribe(function (activeSchema) {
                _omni.omni.activeSchema = activeSchema;
                _this._component.setState({ activeSchema: activeSchema });
            }));
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: 'setActiveSchema',
        value: function setActiveSchema(activeSchema) {
            _omni.omni.activeSchema = activeSchema;
            this._component.setState({ activeSchema: activeSchema });
        }
    }]);

    return SchemaSelector;
}();

var schemaSelector = exports.schemaSelector = new SchemaSelector();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1zZWxlY3Rvci5qcyIsInNjaGVtYS1zZWxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7SUNJQSxjO0FBQUEsOEJBQUE7QUFBQTs7QUFLWSxhQUFBLE9BQUEsR0FBVSxLQUFWO0FBc0VYOzs7O21DQW5Fa0I7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLHNDQUFsQjtBQUNIOzs7OEJBRVksUyxFQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFFQSxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMO0FBQ0g7QUFDSjs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBSyxTQUFULEVBQW9CO0FBQUUscUJBQUssT0FBTDtBQUFpQjtBQUN2QyxpQkFBSyxPQUFMLEdBQWUsSUFBZjtBQUNIOzs7a0NBRWM7QUFBQTs7QUFDWCxpQkFBSyxJQUFMLEdBQVksU0FBUyxhQUFULENBQXVCLE1BQXZCLENBQVo7QUFDQSxpQkFBSyxJQUFMLENBQVUsU0FBVixDQUFvQixHQUFwQixDQUF3QixjQUF4QjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLGlCQUF4QjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLE1BQTFCO0FBQ0EsZ0JBQUksWUFBWSxDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBeUIsNkNBQXpCLENBQWpCO0FBQ0EsZ0JBQUksQ0FBQyxTQUFMLEVBQWdCO0FBQ1osb0JBQUksT0FBTyxLQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCO0FBQ25DLDBCQUFNLEtBQUssSUFEd0I7QUFFbkMsOEJBQVU7QUFGeUIsaUJBQTVCLENBQVg7QUFJSCxhQUxELE1BS087QUFDSCxvQkFBSSxPQUFPLEtBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkI7QUFDbEMsMEJBQU0sS0FBSyxJQUR1QjtBQUVsQyw4QkFBVTtBQUZ3QixpQkFBM0IsQ0FBWDtBQUlIO0FBRUQsaUJBQUssVUFBTCxHQUF1QixnQkFBTSxNQUFOLENBQWEsZ0JBQU0sYUFBTix3Q0FBdUMsRUFBRSxXQUFXLFNBQWIsRUFBdkMsQ0FBYixFQUErRSxLQUFLLElBQXBGLENBQXZCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQix3QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbEMsZ0NBQU0sc0JBQU4sQ0FBNkIsTUFBSyxJQUFsQztBQUNBLHFCQUFLLE9BQUw7QUFDQSxzQkFBSyxJQUFMLENBQVUsTUFBVjtBQUNILGFBSm1CLENBQXBCO0FBTUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFlBQUwsQ0FDZixNQURlLENBQ1I7QUFBQSx1QkFBSyxDQUFDLENBQU47QUFBQSxhQURRLEVBRWYsU0FGZSxDQUVMO0FBQUEsdUJBQU0sTUFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixNQUFoQztBQUFBLGFBRkssQ0FBcEI7QUFHQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssWUFBTCxDQUNmLE1BRGUsQ0FDUjtBQUFBLHVCQUFLLENBQUMsQ0FBQyxDQUFQO0FBQUEsYUFEUSxFQUVmLFNBRmUsQ0FFTDtBQUFBLHVCQUFNLE1BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsRUFBaEM7QUFBQSxhQUZLLENBQXBCO0FBSUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFlBQUwsQ0FDZixTQURlLENBQ0w7QUFBQSx1QkFBVSwrQkFBZSxrQkFBZixDQUFrQyxNQUFsQyxDQUFWO0FBQUEsYUFESyxFQUVmLGNBRmUsQ0FFSyxFQUZMLEVBR2YsU0FIZSxDQUdMLHdCQUFZO0FBQ25CLDJCQUFLLFlBQUwsR0FBb0IsWUFBcEI7QUFDQSxzQkFBSyxVQUFMLENBQWdCLFFBQWhCLENBQXlCLEVBQUUsMEJBQUYsRUFBekI7QUFDSCxhQU5lLENBQXBCO0FBT0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7O3dDQUVzQixZLEVBQXFCO0FBQ3hDLHVCQUFLLFlBQUwsR0FBb0IsWUFBcEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLFFBQWhCLENBQXlCLEVBQUUsMEJBQUYsRUFBekI7QUFDSDs7Ozs7O0FBR0UsSUFBSSwwQ0FBaUIsSUFBSSxjQUFKLEVBQXJCIiwiZmlsZSI6InNjaGVtYS1zZWxlY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwiLi9kaXNwb3NhYmxlc1wiO1xuaW1wb3J0IHsgU2VsZWN0b3JDb21wb25lbnQgfSBmcm9tICcuL3NjaGVtYS1zZWxlY3Rvci12aWV3JztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBvbW5pIH0gZnJvbSBcIi4vb21uaVwiO1xuaW1wb3J0IHsgc2NoZW1hUHJvdmlkZXIgfSBmcm9tIFwiLi9zY2hlbWEtcHJvdmlkZXJcIjtcbmNsYXNzIFNjaGVtYVNlbGVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpO1xuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZCgnc2NoZW1hLXNlbGVjdG9yJyk7XG4gICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB2YXIgYWxpZ25MZWZ0ID0gIWF0b20uY29uZmlnLmdldCgnZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhcicpO1xuICAgICAgICBpZiAoIWFsaWduTGVmdCkge1xuICAgICAgICAgICAgdmFyIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb21wb25lbnQgPSBSZWFjdC5yZW5kZXIoUmVhY3QuY3JlYXRlRWxlbWVudChTZWxlY3RvckNvbXBvbmVudCwgeyBhbGlnbkxlZnQ6IGFsaWduTGVmdCB9KSwgdGhpcy52aWV3KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMudmlldyk7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG9tbmkuYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQob21uaS5hY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gJycpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChvbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gc2NoZW1hUHJvdmlkZXIuZ2V0U2NoZW1hRm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAuZGVmYXVsdElmRW1wdHkoe30pXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGFjdGl2ZVNjaGVtYSA9PiB7XG4gICAgICAgICAgICBvbW5pLmFjdGl2ZVNjaGVtYSA9IGFjdGl2ZVNjaGVtYTtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5zZXRTdGF0ZSh7IGFjdGl2ZVNjaGVtYSB9KTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzZXRBY3RpdmVTY2hlbWEoYWN0aXZlU2NoZW1hKSB7XG4gICAgICAgIG9tbmkuYWN0aXZlU2NoZW1hID0gYWN0aXZlU2NoZW1hO1xuICAgICAgICB0aGlzLl9jb21wb25lbnQuc2V0U3RhdGUoeyBhY3RpdmVTY2hlbWEgfSk7XG4gICAgfVxufVxuZXhwb3J0IHZhciBzY2hlbWFTZWxlY3RvciA9IG5ldyBTY2hlbWFTZWxlY3RvcjtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwiLi9kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQge1NlbGVjdG9yQ29tcG9uZW50fSBmcm9tICcuL3NjaGVtYS1zZWxlY3Rvci12aWV3JztcclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHtvbW5pfSBmcm9tIFwiLi9vbW5pXCI7XHJcbmltcG9ydCB7c2NoZW1hUHJvdmlkZXIsIElTY2hlbWF9IGZyb20gXCIuL3NjaGVtYS1wcm92aWRlclwiO1xyXG5pbXBvcnQge2lzRW1wdHl9IGZyb20gXCJsb2Rhc2hcIjtcclxuXHJcbmNsYXNzIFNjaGVtYVNlbGVjdG9yIHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICAgIHByaXZhdGUgdmlldzogSFRNTFNwYW5FbGVtZW50O1xyXG4gICAgcHJpdmF0ZSB0aWxlOiBhbnk7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogYW55O1xyXG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9jb21wb25lbnQ6IFNlbGVjdG9yQ29tcG9uZW50O1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXR1cChzdGF0dXNCYXI6IGFueSkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXR0YWNoKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0JhcikgeyB0aGlzLl9hdHRhY2goKTsgfVxyXG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xyXG4gICAgICAgIHRoaXMudmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKCdpbmxpbmUtYmxvY2snKTtcclxuICAgICAgICB0aGlzLnZpZXcuY2xhc3NMaXN0LmFkZCgnc2NoZW1hLXNlbGVjdG9yJyk7XHJcbiAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgdmFyIGFsaWduTGVmdCA9ICFhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oJ2dyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXInKTtcclxuICAgICAgICBpZiAoIWFsaWduTGVmdCkge1xyXG4gICAgICAgICAgICB2YXIgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XHJcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXHJcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcclxuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcclxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiAxMVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IDxhbnk+UmVhY3QucmVuZGVyKFJlYWN0LmNyZWF0ZUVsZW1lbnQoU2VsZWN0b3JDb21wb25lbnQsIHsgYWxpZ25MZWZ0OiBhbGlnbkxlZnQgfSksIHRoaXMudmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMudmlldyk7XHJcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKG9tbmkuYWN0aXZlRWRpdG9yXHJcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9ICdub25lJykpO1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQob21uaS5hY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9ICcnKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQob21uaS5hY3RpdmVFZGl0b3JcclxuICAgICAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gc2NoZW1hUHJvdmlkZXIuZ2V0U2NoZW1hRm9yRWRpdG9yKGVkaXRvcikpXHJcbiAgICAgICAgICAgIC5kZWZhdWx0SWZFbXB0eSg8YW55Pnt9KVxyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGFjdGl2ZVNjaGVtYSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvbW5pLmFjdGl2ZVNjaGVtYSA9IGFjdGl2ZVNjaGVtYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5zZXRTdGF0ZSh7IGFjdGl2ZVNjaGVtYSB9KTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEFjdGl2ZVNjaGVtYShhY3RpdmVTY2hlbWE6IElTY2hlbWEpIHtcclxuICAgICAgICBvbW5pLmFjdGl2ZVNjaGVtYSA9IGFjdGl2ZVNjaGVtYTtcclxuICAgICAgICB0aGlzLl9jb21wb25lbnQuc2V0U3RhdGUoeyBhY3RpdmVTY2hlbWEgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgc2NoZW1hU2VsZWN0b3IgPSBuZXcgU2NoZW1hU2VsZWN0b3I7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
