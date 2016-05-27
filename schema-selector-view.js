'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SelectorComponent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require('atom-space-pen-views');

var _disposables = require('./disposables');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _omni = require('./omni');

var _schemaProvider = require('./schema-provider');

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SelectorComponent = exports.SelectorComponent = function (_React$Component) {
    _inherits(SelectorComponent, _React$Component);

    function SelectorComponent(props, context) {
        _classCallCheck(this, SelectorComponent);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SelectorComponent).call(this, props, context));

        _this.disposable = new _disposables.CompositeDisposable();
        _this.state = { schemas: [], activeSchema: {} };
        return _this;
    }

    _createClass(SelectorComponent, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
            this.disposable = new _disposables.CompositeDisposable();
        }
    }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
            var _this2 = this;

            this.disposable.add(_schemaProvider.schemaProvider.schemas.subscribe(function (s) {
                return _this2.setState({ schemas: s, activeSchema: s[0] });
            }));
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            this.disposable.dispose();
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            return _react2.default.DOM.a({
                href: '#',
                onClick: function onClick(e) {
                    if (e.target !== e.currentTarget) return;
                    var view = new FrameworkSelectorSelectListView(atom.workspace.getActiveTextEditor(), {
                        attachTo: '.schema-selector',
                        alignLeft: _this3.props.alignLeft,
                        items: _this3.state.schemas,
                        save: function save(framework) {
                            _omni.omni.activeSchema = framework;
                            view.hide();
                        }
                    });
                    view.appendTo(atom.views.getView(atom.workspace));
                    view.setItems();
                    view.show();
                }
            }, this.state.activeSchema.name);
        }
    }]);

    return SelectorComponent;
}(_react2.default.Component);

var FrameworkSelectorSelectListView = function (_SelectListView) {
    _inherits(FrameworkSelectorSelectListView, _SelectListView);

    function FrameworkSelectorSelectListView(editor, options) {
        _classCallCheck(this, FrameworkSelectorSelectListView);

        var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(FrameworkSelectorSelectListView).call(this));

        _this4.editor = editor;
        _this4.options = options;
        _this4.$.addClass('code-actions-overlay');
        _this4.filterEditorView.model.placeholderText = 'Filter list';
        return _this4;
    }

    _createClass(FrameworkSelectorSelectListView, [{
        key: 'setItems',
        value: function setItems() {
            _atomSpacePenViews.SelectListView.prototype.setItems.call(this, this.options.items);
        }
    }, {
        key: 'confirmed',
        value: function confirmed(item) {
            this.cancel();
            this.options.save(item);
            return null;
        }
    }, {
        key: 'show',
        value: function show() {
            var _this5 = this;

            this.storeFocusedElement();
            setTimeout(function () {
                return _this5.focusFilterEditor();
            }, 100);
            var width = 320;
            var node = this[0];
            var attachTo = (0, _jquery2.default)(document.querySelectorAll(this.options.attachTo));
            var offset = attachTo.offset();
            if (offset) {
                if (this.options.alignLeft) {
                    (0, _jquery2.default)(node).css({
                        position: 'fixed',
                        top: offset.top - node.clientHeight - 18,
                        left: offset.left,
                        width: width
                    });
                } else {
                    (0, _jquery2.default)(node).css({
                        position: 'fixed',
                        top: offset.top - node.clientHeight - 18,
                        left: offset.left - width + attachTo[0].clientWidth,
                        width: width
                    });
                }
            }
        }
    }, {
        key: 'hide',
        value: function hide() {
            this.restoreFocus();
            this.remove();
        }
    }, {
        key: 'cancelled',
        value: function cancelled() {
            this.hide();
        }
    }, {
        key: 'getFilterKey',
        value: function getFilterKey() {
            return 'Name';
        }
    }, {
        key: 'viewForItem',
        value: function viewForItem(item) {
            if (!item) {}
            return (0, _atomSpacePenViews.$$)(function () {
                var _this6 = this;

                return this.li({
                    "class": 'event',
                    'data-event-name': item.name
                }, function () {
                    return _this6.span(_lodash2.default.trunc(item.name + ' - ' + item.description, 50), {
                        title: item.name + ' - ' + item.description
                    });
                });
            });
        }
    }, {
        key: '$',
        get: function get() {
            return this;
        }
    }]);

    return FrameworkSelectorSelectListView;
}(_atomSpacePenViews.SelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1zZWxlY3Rvci12aWV3LmpzIiwic2NoZW1hLXNlbGVjdG9yLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7SUNVQSxpQixXQUFBLGlCOzs7QUFHSSwrQkFBWSxLQUFaLEVBQTRDLE9BQTVDLEVBQXlEO0FBQUE7O0FBQUEseUdBQy9DLEtBRCtDLEVBQ3hDLE9BRHdDOztBQUZqRCxjQUFBLFVBQUEsR0FBYSxzQ0FBYjtBQUlKLGNBQUssS0FBTCxHQUFhLEVBQUUsU0FBUyxFQUFYLEVBQWUsY0FBbUIsRUFBbEMsRUFBYjtBQUZxRDtBQUd4RDs7Ozs2Q0FFd0I7QUFDckIsaUJBQUssVUFBTCxHQUFrQixzQ0FBbEI7QUFDSDs7OzRDQUV1QjtBQUFBOztBQUNwQixpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLCtCQUFlLE9BQWYsQ0FBdUIsU0FBdkIsQ0FBaUM7QUFBQSx1QkFBSyxPQUFLLFFBQUwsQ0FBYyxFQUFFLFNBQVMsQ0FBWCxFQUFjLGNBQWMsRUFBRSxDQUFGLENBQTVCLEVBQWQsQ0FBTDtBQUFBLGFBQWpDLENBQXBCO0FBQ0g7OzsrQ0FFMEI7QUFDdkIsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7aUNBRVk7QUFBQTs7QUFDVCxtQkFBTyxnQkFBTSxHQUFOLENBQVUsQ0FBVixDQUFZO0FBQ2Ysc0JBQU0sR0FEUztBQUVmLHlCQUFTLGlCQUFDLENBQUQsRUFBRTtBQUNQLHdCQUFJLEVBQUUsTUFBRixLQUFhLEVBQUUsYUFBbkIsRUFBa0M7QUFDbEMsd0JBQUksT0FBTyxJQUFJLCtCQUFKLENBQW9DLEtBQUssU0FBTCxDQUFlLG1CQUFmLEVBQXBDLEVBQTBFO0FBQ2pGLGtDQUFVLGtCQUR1RTtBQUVqRixtQ0FBVyxPQUFLLEtBQUwsQ0FBVyxTQUYyRDtBQUdqRiwrQkFBTyxPQUFLLEtBQUwsQ0FBVyxP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Q0giLCJmaWxlIjoic2NoZW1hLXNlbGVjdG9yLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZWxlY3RMaXN0VmlldywgJCQgfSBmcm9tICdhdG9tLXNwYWNlLXBlbi12aWV3cyc7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIi4vZGlzcG9zYWJsZXNcIjtcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgb21uaSB9IGZyb20gXCIuL29tbmlcIjtcbmltcG9ydCB7IHNjaGVtYVByb3ZpZGVyIH0gZnJvbSBcIi4vc2NoZW1hLXByb3ZpZGVyXCI7XG5pbXBvcnQgJCBmcm9tICdqcXVlcnknO1xuZXhwb3J0IGNsYXNzIFNlbGVjdG9yQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcywgY29udGV4dCkge1xuICAgICAgICBzdXBlcihwcm9wcywgY29udGV4dCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7IHNjaGVtYXM6IFtdLCBhY3RpdmVTY2hlbWE6IHt9IH07XG4gICAgfVxuICAgIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB9XG4gICAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2NoZW1hUHJvdmlkZXIuc2NoZW1hcy5zdWJzY3JpYmUocyA9PiB0aGlzLnNldFN0YXRlKHsgc2NoZW1hczogcywgYWN0aXZlU2NoZW1hOiBzWzBdIH0pKSk7XG4gICAgfVxuICAgIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBSZWFjdC5ET00uYSh7XG4gICAgICAgICAgICBocmVmOiAnIycsXG4gICAgICAgICAgICBvbkNsaWNrOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3JTZWxlY3RMaXN0VmlldyhhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCksIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0YWNoVG86ICcuc2NoZW1hLXNlbGVjdG9yJyxcbiAgICAgICAgICAgICAgICAgICAgYWxpZ25MZWZ0OiB0aGlzLnByb3BzLmFsaWduTGVmdCxcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuc3RhdGUuc2NoZW1hcyxcbiAgICAgICAgICAgICAgICAgICAgc2F2ZTogKGZyYW1ld29yaykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb21uaS5hY3RpdmVTY2hlbWEgPSBmcmFtZXdvcms7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZpZXcuYXBwZW5kVG8oYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSk7XG4gICAgICAgICAgICAgICAgdmlldy5zZXRJdGVtcygpO1xuICAgICAgICAgICAgICAgIHZpZXcuc2hvdygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgdGhpcy5zdGF0ZS5hY3RpdmVTY2hlbWEubmFtZSk7XG4gICAgfVxufVxuY2xhc3MgRnJhbWV3b3JrU2VsZWN0b3JTZWxlY3RMaXN0VmlldyBleHRlbmRzIFNlbGVjdExpc3RWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuJC5hZGRDbGFzcygnY29kZS1hY3Rpb25zLW92ZXJsYXknKTtcbiAgICAgICAgdGhpcy5maWx0ZXJFZGl0b3JWaWV3Lm1vZGVsLnBsYWNlaG9sZGVyVGV4dCA9ICdGaWx0ZXIgbGlzdCc7XG4gICAgfVxuICAgIGdldCAkKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgc2V0SXRlbXMoKSB7XG4gICAgICAgIFNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5zZXRJdGVtcy5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucy5pdGVtcyk7XG4gICAgfVxuICAgIGNvbmZpcm1lZChpdGVtKSB7XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgICAgIHRoaXMub3B0aW9ucy5zYXZlKGl0ZW0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpLCAxMDApO1xuICAgICAgICB2YXIgd2lkdGggPSAzMjA7XG4gICAgICAgIHZhciBub2RlID0gdGhpc1swXTtcbiAgICAgICAgdmFyIGF0dGFjaFRvID0gJChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMub3B0aW9ucy5hdHRhY2hUbykpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gYXR0YWNoVG8ub2Zmc2V0KCk7XG4gICAgICAgIGlmIChvZmZzZXQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25MZWZ0KSB7XG4gICAgICAgICAgICAgICAgJChub2RlKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gbm9kZS5jbGllbnRIZWlnaHQgLSAxOCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgJChub2RlKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gbm9kZS5jbGllbnRIZWlnaHQgLSAxOCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgLSB3aWR0aCArIGF0dGFjaFRvWzBdLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGhcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWRlKCkge1xuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xuICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgIH1cbiAgICBjYW5jZWxsZWQoKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgICBnZXRGaWx0ZXJLZXkoKSB7IHJldHVybiAnTmFtZSc7IH1cbiAgICB2aWV3Rm9ySXRlbShpdGVtKSB7XG4gICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkJChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiAnZXZlbnQnLFxuICAgICAgICAgICAgICAgICdkYXRhLWV2ZW50LW5hbWUnOiBpdGVtLm5hbWVcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKF8udHJ1bmMoYCR7aXRlbS5uYW1lfSAtICR7aXRlbS5kZXNjcmlwdGlvbn1gLCA1MCksIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGAke2l0ZW0ubmFtZX0gLSAke2l0ZW0uZGVzY3JpcHRpb259YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7U2VsZWN0TGlzdFZpZXcsICQkfSBmcm9tICdhdG9tLXNwYWNlLXBlbi12aWV3cyc7XHJcblxyXG5pbXBvcnQge1NjaGVkdWxlciwgT2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcclxuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwiLi9kaXNwb3NhYmxlc1wiO1xyXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQge29tbml9IGZyb20gXCIuL29tbmlcIjtcclxuaW1wb3J0IHtzY2hlbWFQcm92aWRlciwgSVNjaGVtYX0gZnJvbSBcIi4vc2NoZW1hLXByb3ZpZGVyXCI7XHJcbmltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XHJcblxyXG5pbnRlcmZhY2UgU2VsZWN0b3JTdGF0ZSB7XHJcbiAgICBzY2hlbWFzPzogSVNjaGVtYVtdO1xyXG4gICAgYWN0aXZlU2NoZW1hOiBJU2NoZW1hO1xyXG4gICAgYWxpZ25MZWZ0PzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdG9yQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PHsgYWxpZ25MZWZ0OiBib29sZWFuIH0sIFNlbGVjdG9yU3RhdGU+IHtcclxuICAgIHByaXZhdGUgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiB7IGFsaWduTGVmdDogYm9vbGVhbiB9LCBjb250ZXh0PzogYW55KSB7XHJcbiAgICAgICAgc3VwZXIocHJvcHMsIGNvbnRleHQpO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7IHNjaGVtYXM6IFtdLCBhY3RpdmVTY2hlbWE6IDxhbnk+e30gfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcG9uZW50V2lsbE1vdW50KCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2NoZW1hUHJvdmlkZXIuc2NoZW1hcy5zdWJzY3JpYmUocyA9PiB0aGlzLnNldFN0YXRlKHsgc2NoZW1hczogcywgYWN0aXZlU2NoZW1hOiBzWzBdIH0pKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xyXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gUmVhY3QuRE9NLmEoe1xyXG4gICAgICAgICAgICBocmVmOiAnIycsXHJcbiAgICAgICAgICAgIG9uQ2xpY2s6IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXQgIT09IGUuY3VycmVudFRhcmdldCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3JTZWxlY3RMaXN0VmlldyhhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCksIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRhY2hUbzogJy5zY2hlbWEtc2VsZWN0b3InLFxyXG4gICAgICAgICAgICAgICAgICAgIGFsaWduTGVmdDogdGhpcy5wcm9wcy5hbGlnbkxlZnQsXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHRoaXMuc3RhdGUuc2NoZW1hcyxcclxuICAgICAgICAgICAgICAgICAgICBzYXZlOiAoZnJhbWV3b3JrOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb21uaS5hY3RpdmVTY2hlbWEgPSBmcmFtZXdvcms7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdmlldy5hcHBlbmRUbyg8YW55PmF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpO1xyXG4gICAgICAgICAgICAgICAgdmlldy5zZXRJdGVtcygpO1xyXG4gICAgICAgICAgICAgICAgdmlldy5zaG93KCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgdGhpcy5zdGF0ZS5hY3RpdmVTY2hlbWEubmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEZyYW1ld29ya1NlbGVjdG9yU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBTZWxlY3RMaXN0VmlldyB7XHJcbiAgICBwcml2YXRlIHBhbmVsOiBBdG9tLlBhbmVsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgcHJpdmF0ZSBvcHRpb25zOiB7IGFsaWduTGVmdDogYm9vbGVhbjsgYXR0YWNoVG86IHN0cmluZzsgaXRlbXM6IGFueVtdOyBzYXZlKGl0ZW06IGFueSk6IHZvaWQgfSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy4kLmFkZENsYXNzKCdjb2RlLWFjdGlvbnMtb3ZlcmxheScpO1xyXG4gICAgICAgICg8YW55PnRoaXMpLmZpbHRlckVkaXRvclZpZXcubW9kZWwucGxhY2Vob2xkZXJUZXh0ID0gJ0ZpbHRlciBsaXN0JztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgJCgpOiBKUXVlcnkge1xyXG4gICAgICAgIHJldHVybiA8YW55PnRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEl0ZW1zKCkge1xyXG4gICAgICAgIFNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5zZXRJdGVtcy5jYWxsKHRoaXMsIHRoaXMub3B0aW9ucy5pdGVtcylcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW0pIHtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpOyAvL3dpbGwgY2xvc2UgdGhlIHZpZXdcclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnNhdmUoaXRlbSk7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvdygpIHtcclxuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKSwgMTAwKTtcclxuICAgICAgICB2YXIgd2lkdGggPSAzMjA7XHJcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzWzBdO1xyXG4gICAgICAgIHZhciBhdHRhY2hUbyA9ICQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuYXR0YWNoVG8pKTtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gYXR0YWNoVG8ub2Zmc2V0KCk7XHJcbiAgICAgICAgaWYgKG9mZnNldCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWduTGVmdCkge1xyXG4gICAgICAgICAgICAgICAgJChub2RlKS5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCAtIG5vZGUuY2xpZW50SGVpZ2h0IC0gMTgsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQobm9kZSkuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBub2RlLmNsaWVudEhlaWdodCAtIDE4LFxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gd2lkdGggKyBhdHRhY2hUb1swXS5jbGllbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGhcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGhpZGUoKSB7XHJcbiAgICAgICAgdGhpcy5yZXN0b3JlRm9jdXMoKTtcclxuICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbmNlbGxlZCgpIHtcclxuICAgICAgICB0aGlzLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0RmlsdGVyS2V5KCkgeyByZXR1cm4gJ05hbWUnOyB9XHJcblxyXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IElTY2hlbWEpIHtcclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAkJChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGkoe1xyXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiAnZXZlbnQnLFxyXG4gICAgICAgICAgICAgICAgJ2RhdGEtZXZlbnQtbmFtZSc6IGl0ZW0ubmFtZVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKF8udHJ1bmMoYCR7aXRlbS5uYW1lfSAtICR7aXRlbS5kZXNjcmlwdGlvbn1gLCA1MCksIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogYCR7aXRlbS5uYW1lfSAtICR7aXRlbS5kZXNjcmlwdGlvbn1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
