'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _encode(ch) {
    return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
}
function encodeURIComponent2(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, _encode);
}
function encodeNoop(str) {
    return str;
}

var URI = function () {
    function URI() {
        _classCallCheck(this, URI);

        this._scheme = URI._empty;
        this._authority = URI._empty;
        this._path = URI._empty;
        this._query = URI._empty;
        this._fragment = URI._empty;
        this._formatted = null;
        this._fsPath = null;
    }

    _createClass(URI, [{
        key: 'with',
        value: function _with(scheme, authority, path, query, fragment) {
            var ret = new URI();
            ret._scheme = scheme || this.scheme;
            ret._authority = authority || this.authority;
            ret._path = path || this.path;
            ret._query = query || this.query;
            ret._fragment = fragment || this.fragment;
            URI._validate(ret);
            return ret;
        }
    }, {
        key: 'withScheme',
        value: function withScheme(value) {
            return this.with(value, undefined, undefined, undefined, undefined);
        }
    }, {
        key: 'withAuthority',
        value: function withAuthority(value) {
            return this.with(undefined, value, undefined, undefined, undefined);
        }
    }, {
        key: 'withPath',
        value: function withPath(value) {
            return this.with(undefined, undefined, value, undefined, undefined);
        }
    }, {
        key: 'withQuery',
        value: function withQuery(value) {
            return this.with(undefined, undefined, undefined, value, undefined);
        }
    }, {
        key: 'withFragment',
        value: function withFragment(value) {
            return this.with(undefined, undefined, undefined, undefined, value);
        }
    }, {
        key: 'toString',
        value: function toString() {
            var skipEncoding = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (!skipEncoding) {
                if (!this._formatted) {
                    this._formatted = URI._asFormatted(this, false);
                }
                return this._formatted;
            } else {
                return URI._asFormatted(this, true);
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return {
                scheme: this.scheme,
                authority: this.authority,
                path: this.path,
                fsPath: this.fsPath,
                query: this.query,
                fragment: this.fragment.replace(/URL_MARSHAL_REMOVE.*$/, ''),
                external: this.toString().replace(/#?URL_MARSHAL_REMOVE.*$/, ''),
                $mid: 1
            };
        }
    }, {
        key: 'scheme',
        get: function get() {
            return this._scheme;
        }
    }, {
        key: 'authority',
        get: function get() {
            return this._authority;
        }
    }, {
        key: 'path',
        get: function get() {
            return this._path;
        }
    }, {
        key: 'query',
        get: function get() {
            return this._query;
        }
    }, {
        key: 'fragment',
        get: function get() {
            return this._fragment;
        }
    }, {
        key: 'fsPath',
        get: function get() {
            if (!this._fsPath) {
                var value;
                if (this._authority && this.scheme === 'file') {
                    value = '//' + this._authority + this._path;
                } else if (URI._driveLetterPath.test(this._path)) {
                    value = this._path[1].toLowerCase() + this._path.substr(2);
                } else {
                    value = this._path;
                }
                if (process.env === "win32") {
                    value = value.replace(/\//g, '\\');
                }
                this._fsPath = value;
            }
            return this._fsPath;
        }
    }], [{
        key: 'parse',
        value: function parse(value) {
            var ret = new URI();
            var data = URI._parseComponents(value);
            ret._scheme = data.scheme;
            ret._authority = decodeURIComponent(data.authority);
            ret._path = decodeURIComponent(data.path);
            ret._query = decodeURIComponent(data.query);
            ret._fragment = decodeURIComponent(data.fragment);
            URI._validate(ret);
            return ret;
        }
    }, {
        key: 'file',
        value: function file(path) {
            var ret = new URI();
            ret._scheme = 'file';
            path = path.replace(/\\/g, URI._slash);
            if (path[0] === URI._slash && path[0] === path[1]) {
                var idx = path.indexOf(URI._slash, 2);
                if (idx === -1) {
                    ret._authority = path.substring(2);
                } else {
                    ret._authority = path.substring(2, idx);
                    ret._path = path.substring(idx);
                }
            } else {
                ret._path = path;
            }
            if (ret._path[0] !== URI._slash) {
                ret._path = URI._slash + ret._path;
            }
            URI._validate(ret);
            return ret;
        }
    }, {
        key: '_parseComponents',
        value: function _parseComponents(value) {
            var ret = {
                scheme: URI._empty,
                authority: URI._empty,
                path: URI._empty,
                query: URI._empty,
                fragment: URI._empty
            };
            var match = URI._regexp.exec(value);
            if (match) {
                ret.scheme = match[2] || ret.scheme;
                ret.authority = match[4] || ret.authority;
                ret.path = match[5] || ret.path;
                ret.query = match[7] || ret.query;
                ret.fragment = match[9] || ret.fragment;
            }
            return ret;
        }
    }, {
        key: 'create',
        value: function create(scheme, authority, path, query, fragment) {
            return new URI().with(scheme, authority, path, query, fragment);
        }
    }, {
        key: '_validate',
        value: function _validate(ret) {
            if (ret.authority && ret.path && ret.path[0] !== '/') {
                throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
            }
            if (!ret.authority && ret.path.indexOf('//') === 0) {
                throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
            }
        }
    }, {
        key: '_asFormatted',
        value: function _asFormatted(uri, skipEncoding) {
            var encoder = !skipEncoding ? encodeURIComponent2 : encodeNoop;
            var parts = [];
            var scheme = uri.scheme;
            var authority = uri.authority;
            var path = uri.path;
            var query = uri.query;
            var fragment = uri.fragment;

            if (scheme) {
                parts.push(scheme, ':');
            }
            if (authority || scheme === 'file') {
                parts.push('//');
            }
            if (authority) {
                authority = authority.toLowerCase();
                var idx = authority.indexOf(':');
                if (idx === -1) {
                    parts.push(encoder(authority));
                } else {
                    parts.push(encoder(authority.substr(0, idx)), authority.substr(idx));
                }
            }
            if (path) {
                var m = URI._upperCaseDrive.exec(path);
                if (m) {
                    path = m[1] + m[2].toLowerCase() + path.substr(m[1].length + m[2].length);
                }
                var lastIdx = 0;
                while (true) {
                    var _idx = path.indexOf(URI._slash, lastIdx);
                    if (_idx === -1) {
                        parts.push(encoder(path.substring(lastIdx)).replace(/[#?]/, _encode));
                        break;
                    }
                    parts.push(encoder(path.substring(lastIdx, _idx)).replace(/[#?]/, _encode), URI._slash);
                    lastIdx = _idx + 1;
                }
                ;
            }
            if (query) {
                parts.push('?', encoder(query));
            }
            if (fragment) {
                parts.push('#', encoder(fragment));
            }
            return parts.join(URI._empty);
        }
    }, {
        key: 'revive',
        value: function revive(data) {
            var result = new URI();
            result._scheme = data.scheme;
            result._authority = data.authority;
            result._path = data.path;
            result._query = data.query;
            result._fragment = data.fragment;
            result._fsPath = data.fsPath;
            result._formatted = data.external;
            URI._validate(result);
            return result;
        }
    }]);

    return URI;
}();

exports.default = URI;

URI._empty = '';
URI._slash = '/';
URI._regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
URI._driveLetterPath = /^\/[a-zA-z]:/;
URI._upperCaseDrive = /^(\/)?([A-Z]:)/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9jb21tb24vdXJpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7O0FBRUEsU0FBQSxPQUFBLENBQWlCLEVBQWpCLEVBQTJCO0FBQ3ZCLFdBQU8sTUFBTSxHQUFHLFVBQUgsQ0FBYyxDQUFkLEVBQWlCLFFBQWpCLENBQTBCLEVBQTFCLEVBQThCLFdBQTlCLEVBQWI7QUFDSDtBQUdELFNBQUEsbUJBQUEsQ0FBNkIsR0FBN0IsRUFBd0M7QUFDcEMsV0FBTyxtQkFBbUIsR0FBbkIsRUFBd0IsT0FBeEIsQ0FBZ0MsVUFBaEMsRUFBNEMsT0FBNUMsQ0FBUDtBQUNIO0FBRUQsU0FBQSxVQUFBLENBQW9CLEdBQXBCLEVBQStCO0FBQzNCLFdBQU8sR0FBUDtBQUNIOztJQW1CRCxHO0FBZ0JJLG1CQUFBO0FBQUE7O0FBQ0ksYUFBSyxPQUFMLEdBQWUsSUFBSSxNQUFuQjtBQUNBLGFBQUssVUFBTCxHQUFrQixJQUFJLE1BQXRCO0FBQ0EsYUFBSyxLQUFMLEdBQWEsSUFBSSxNQUFqQjtBQUNBLGFBQUssTUFBTCxHQUFjLElBQUksTUFBbEI7QUFDQSxhQUFLLFNBQUwsR0FBaUIsSUFBSSxNQUFyQjtBQUVBLGFBQUssVUFBTCxHQUFrQixJQUFsQjtBQUNBLGFBQUssT0FBTCxHQUFlLElBQWY7QUFDSDs7Ozs4QkFzRVcsTSxFQUFnQixTLEVBQW1CLEksRUFBYyxLLEVBQWUsUSxFQUFnQjtBQUN4RixnQkFBSSxNQUFNLElBQUksR0FBSixFQUFWO0FBQ0EsZ0JBQUksT0FBSixHQUFjLFVBQVUsS0FBSyxNQUE3QjtBQUNBLGdCQUFJLFVBQUosR0FBaUIsYUFBYSxLQUFLLFNBQW5DO0FBQ0EsZ0JBQUksS0FBSixHQUFZLFFBQVEsS0FBSyxJQUF6QjtBQUNBLGdCQUFJLE1BQUosR0FBYSxTQUFTLEtBQUssS0FBM0I7QUFDQSxnQkFBSSxTQUFKLEdBQWdCLFlBQVksS0FBSyxRQUFqQztBQUNBLGdCQUFJLFNBQUosQ0FBYyxHQUFkO0FBQ0EsbUJB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bUJBQU8sU0FBUCxHQUErQixLQUFNLFFBQXJDO0FBQ0EsbUJBQU8sT0FBUCxHQUE2QixLQUFNLE1BQW5DO0FBQ0EsbUJBQU8sVUFBUCxHQUErQixLQUFNLFFBQXJDO0FBQ0EsZ0JBQUksU0FBSixDQUFjLE1BQWQ7QUFDQSxtQkFBTyxNQUFQO0FBQ0g7Ozs7OztrQkF4VEwsRzs7QUFFbUIsSUFBQSxNQUFBLEdBQVMsRUFBVDtBQUNBLElBQUEsTUFBQSxHQUFTLEdBQVQ7QUFDQSxJQUFBLE9BQUEsR0FBVSw4REFBVjtBQUNBLElBQUEsZ0JBQUEsR0FBbUIsY0FBbkI7QUFDQSxJQUFBLGVBQUEsR0FBa0IsZ0JBQWxCIiwiZmlsZSI6InZzY29kZS9jb21tb24vdXJpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIF9lbmNvZGUoY2g6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gJyUnICsgY2guY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcclxufVxyXG5cclxuLy8gc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL2VuY29kZVVSSUNvbXBvbmVudFxyXG5mdW5jdGlvbiBlbmNvZGVVUklDb21wb25lbnQyKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC9bIScoKSpdL2csIF9lbmNvZGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbmNvZGVOb29wKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBzdHI7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogVW5pZm9ybSBSZXNvdXJjZSBJZGVudGlmaWVyIChVUkkpIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM5ODYuXHJcbiAqIFRoaXMgY2xhc3MgaXMgYSBzaW1wbGUgcGFyc2VyIHdoaWNoIGNyZWF0ZXMgdGhlIGJhc2ljIGNvbXBvbmVudCBwYXRoc1xyXG4gKiAoaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzk4NiNzZWN0aW9uLTMpIHdpdGggbWluaW1hbCB2YWxpZGF0aW9uXHJcbiAqIGFuZCBlbmNvZGluZy5cclxuICpcclxuICogICAgICAgZm9vOi8vZXhhbXBsZS5jb206ODA0Mi9vdmVyL3RoZXJlP25hbWU9ZmVycmV0I25vc2VcclxuICogICAgICAgXFxfLyAgIFxcX19fX19fX19fX19fX18vXFxfX19fX19fX18vIFxcX19fX19fX19fLyBcXF9fL1xyXG4gKiAgICAgICAgfCAgICAgICAgICAgfCAgICAgICAgICAgIHwgICAgICAgICAgICB8ICAgICAgICB8XHJcbiAqICAgICBzY2hlbWUgICAgIGF1dGhvcml0eSAgICAgICBwYXRoICAgICAgICBxdWVyeSAgIGZyYWdtZW50XHJcbiAqICAgICAgICB8ICAgX19fX19fX19fX19fX19fX19fX19ffF9fXHJcbiAqICAgICAgIC8gXFwgLyAgICAgICAgICAgICAgICAgICAgICAgIFxcXHJcbiAqICAgICAgIHVybjpleGFtcGxlOmFuaW1hbDpmZXJyZXQ6bm9zZVxyXG4gKlxyXG4gKlxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVVJJIHtcclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBfZW1wdHkgPSAnJztcclxuICAgIHByaXZhdGUgc3RhdGljIF9zbGFzaCA9ICcvJztcclxuICAgIHByaXZhdGUgc3RhdGljIF9yZWdleHAgPSAvXigoW146Lz8jXSs/KTopPyhcXC9cXC8oW14vPyNdKikpPyhbXj8jXSopKFxcPyhbXiNdKikpPygjKC4qKSk/LztcclxuICAgIHByaXZhdGUgc3RhdGljIF9kcml2ZUxldHRlclBhdGggPSAvXlxcL1thLXpBLXpdOi87XHJcbiAgICBwcml2YXRlIHN0YXRpYyBfdXBwZXJDYXNlRHJpdmUgPSAvXihcXC8pPyhbQS1aXTopLztcclxuXHJcbiAgICBwcml2YXRlIF9zY2hlbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgX2F1dGhvcml0eTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBfcXVlcnk6IHN0cmluZztcclxuICAgIHByaXZhdGUgX2ZyYWdtZW50OiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIF9mb3JtYXR0ZWQ6IHN0cmluZztcclxuICAgIHByaXZhdGUgX2ZzUGF0aDogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX3NjaGVtZSA9IFVSSS5fZW1wdHk7XHJcbiAgICAgICAgdGhpcy5fYXV0aG9yaXR5ID0gVVJJLl9lbXB0eTtcclxuICAgICAgICB0aGlzLl9wYXRoID0gVVJJLl9lbXB0eTtcclxuICAgICAgICB0aGlzLl9xdWVyeSA9IFVSSS5fZW1wdHk7XHJcbiAgICAgICAgdGhpcy5fZnJhZ21lbnQgPSBVUkkuX2VtcHR5O1xyXG5cclxuICAgICAgICB0aGlzLl9mb3JtYXR0ZWQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2ZzUGF0aCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzY2hlbWUgaXMgdGhlICdodHRwJyBwYXJ0IG9mICdodHRwOi8vd3d3Lm1zZnQuY29tL3NvbWUvcGF0aD9xdWVyeSNmcmFnbWVudCcuXHJcbiAgICAgKiBUaGUgcGFydCBiZWZvcmUgdGhlIGZpcnN0IGNvbG9uLlxyXG4gICAgICovXHJcbiAgICBnZXQgc2NoZW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9zY2hlbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhdXRob3JpdHkgaXMgdGhlICd3d3cubXNmdC5jb20nIHBhcnQgb2YgJ2h0dHA6Ly93d3cubXNmdC5jb20vc29tZS9wYXRoP3F1ZXJ5I2ZyYWdtZW50Jy5cclxuICAgICAqIFRoZSBwYXJ0IGJldHdlZW4gdGhlIGZpcnN0IGRvdWJsZSBzbGFzaGVzIGFuZCB0aGUgbmV4dCBzbGFzaC5cclxuICAgICAqL1xyXG4gICAgZ2V0IGF1dGhvcml0eSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYXV0aG9yaXR5O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcGF0aCBpcyB0aGUgJy9zb21lL3BhdGgnIHBhcnQgb2YgJ2h0dHA6Ly93d3cubXNmdC5jb20vc29tZS9wYXRoP3F1ZXJ5I2ZyYWdtZW50Jy5cclxuICAgICAqL1xyXG4gICAgZ2V0IHBhdGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBxdWVyeSBpcyB0aGUgJ3F1ZXJ5JyBwYXJ0IG9mICdodHRwOi8vd3d3Lm1zZnQuY29tL3NvbWUvcGF0aD9xdWVyeSNmcmFnbWVudCcuXHJcbiAgICAgKi9cclxuICAgIGdldCBxdWVyeSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcXVlcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmcmFnbWVudCBpcyB0aGUgJ2ZyYWdtZW50JyBwYXJ0IG9mICdodHRwOi8vd3d3Lm1zZnQuY29tL3NvbWUvcGF0aD9xdWVyeSNmcmFnbWVudCcuXHJcbiAgICAgKi9cclxuICAgIGdldCBmcmFnbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZnJhZ21lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLSBmaWxlc3lzdGVtIHBhdGggLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjb3JyZXNwb25kaW5nIGZpbGUgc3lzdGVtIHBhdGggb2YgdGhpcyBVUkkuXHJcbiAgICAgKiBXaWxsIGhhbmRsZSBVTkMgcGF0aHMgYW5kIG5vcm1hbGl6ZSB3aW5kb3dzIGRyaXZlIGxldHRlcnMgdG8gbG93ZXItY2FzZS4gQWxzb1xyXG4gICAgICogdXNlcyB0aGUgcGxhdGZvcm0gc3BlY2lmaWMgcGF0aCBzZXBhcmF0b3IuIFdpbGwgKm5vdCogdmFsaWRhdGUgdGhlIHBhdGggZm9yXHJcbiAgICAgKiBpbnZhbGlkIGNoYXJhY3RlcnMgYW5kIHNlbWFudGljcy4gV2lsbCAqbm90KiBsb29rIGF0IHRoZSBzY2hlbWUgb2YgdGhpcyBVUkkuXHJcbiAgICAgKi9cclxuICAgIGdldCBmc1BhdGgoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9mc1BhdGgpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlOiBzdHJpbmc7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9hdXRob3JpdHkgJiYgdGhpcy5zY2hlbWUgPT09ICdmaWxlJykge1xyXG4gICAgICAgICAgICAgICAgLy8gdW5jIHBhdGg6IGZpbGU6Ly9zaGFyZXMvYyQvZmFyL2Jvb1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBgLy8ke3RoaXMuX2F1dGhvcml0eX0ke3RoaXMuX3BhdGh9YDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChVUkkuX2RyaXZlTGV0dGVyUGF0aC50ZXN0KHRoaXMuX3BhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB3aW5kb3dzIGRyaXZlIGxldHRlcjogZmlsZTovLy9jOi9mYXIvYm9vXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMuX3BhdGhbMV0udG9Mb3dlckNhc2UoKSArIHRoaXMuX3BhdGguc3Vic3RyKDIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gb3RoZXIgcGF0aFxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLl9wYXRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudiA9PT0gXCJ3aW4zMlwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1xcLy9nLCAnXFxcXCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2ZzUGF0aCA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fZnNQYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0gbW9kaWZ5IHRvIG5ldyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gICAgcHVibGljIHdpdGgoc2NoZW1lOiBzdHJpbmcsIGF1dGhvcml0eTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcsIGZyYWdtZW50OiBzdHJpbmcpOiBVUkkge1xyXG4gICAgICAgIHZhciByZXQgPSBuZXcgVVJJKCk7XHJcbiAgICAgICAgcmV0Ll9zY2hlbWUgPSBzY2hlbWUgfHwgdGhpcy5zY2hlbWU7XHJcbiAgICAgICAgcmV0Ll9hdXRob3JpdHkgPSBhdXRob3JpdHkgfHwgdGhpcy5hdXRob3JpdHk7XHJcbiAgICAgICAgcmV0Ll9wYXRoID0gcGF0aCB8fCB0aGlzLnBhdGg7XHJcbiAgICAgICAgcmV0Ll9xdWVyeSA9IHF1ZXJ5IHx8IHRoaXMucXVlcnk7XHJcbiAgICAgICAgcmV0Ll9mcmFnbWVudCA9IGZyYWdtZW50IHx8IHRoaXMuZnJhZ21lbnQ7XHJcbiAgICAgICAgVVJJLl92YWxpZGF0ZShyZXQpO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdpdGhTY2hlbWUodmFsdWU6IHN0cmluZyk6IFVSSSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMud2l0aCh2YWx1ZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd2l0aEF1dGhvcml0eSh2YWx1ZTogc3RyaW5nKTogVVJJIHtcclxuICAgICAgICByZXR1cm4gdGhpcy53aXRoKHVuZGVmaW5lZCwgdmFsdWUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3aXRoUGF0aCh2YWx1ZTogc3RyaW5nKTogVVJJIHtcclxuICAgICAgICByZXR1cm4gdGhpcy53aXRoKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB2YWx1ZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3aXRoUXVlcnkodmFsdWU6IHN0cmluZyk6IFVSSSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMud2l0aCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB2YWx1ZSwgdW5kZWZpbmVkKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd2l0aEZyYWdtZW50KHZhbHVlOiBzdHJpbmcpOiBVUkkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLndpdGgodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLSBwYXJzZSAmIHZhbGlkYXRlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcGFyc2UodmFsdWU6IHN0cmluZyk6IFVSSSB7XHJcbiAgICAgICAgY29uc3QgcmV0ID0gbmV3IFVSSSgpO1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBVUkkuX3BhcnNlQ29tcG9uZW50cyh2YWx1ZSk7XHJcbiAgICAgICAgcmV0Ll9zY2hlbWUgPSBkYXRhLnNjaGVtZTtcclxuICAgICAgICByZXQuX2F1dGhvcml0eSA9IGRlY29kZVVSSUNvbXBvbmVudChkYXRhLmF1dGhvcml0eSk7XHJcbiAgICAgICAgcmV0Ll9wYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGRhdGEucGF0aCk7XHJcbiAgICAgICAgcmV0Ll9xdWVyeSA9IGRlY29kZVVSSUNvbXBvbmVudChkYXRhLnF1ZXJ5KTtcclxuICAgICAgICByZXQuX2ZyYWdtZW50ID0gZGVjb2RlVVJJQ29tcG9uZW50KGRhdGEuZnJhZ21lbnQpO1xyXG4gICAgICAgIFVSSS5fdmFsaWRhdGUocmV0KTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZmlsZShwYXRoOiBzdHJpbmcpOiBVUkkge1xyXG5cclxuICAgICAgICBjb25zdCByZXQgPSBuZXcgVVJJKCk7XHJcbiAgICAgICAgcmV0Ll9zY2hlbWUgPSAnZmlsZSc7XHJcblxyXG4gICAgICAgIC8vIG5vcm1hbGl6ZSB0byBmd2Qtc2xhc2hlc1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcXFwvZywgVVJJLl9zbGFzaCk7XHJcblxyXG4gICAgICAgIC8vIGNoZWNrIGZvciBhdXRob3JpdHkgYXMgdXNlZCBpbiBVTkMgc2hhcmVzXHJcbiAgICAgICAgLy8gb3IgdXNlIHRoZSBwYXRoIGFzIGdpdmVuXHJcbiAgICAgICAgaWYgKHBhdGhbMF0gPT09IFVSSS5fc2xhc2ggJiYgcGF0aFswXSA9PT0gcGF0aFsxXSkge1xyXG4gICAgICAgICAgICBsZXQgaWR4ID0gcGF0aC5pbmRleE9mKFVSSS5fc2xhc2gsIDIpO1xyXG4gICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0Ll9hdXRob3JpdHkgPSBwYXRoLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldC5fYXV0aG9yaXR5ID0gcGF0aC5zdWJzdHJpbmcoMiwgaWR4KTtcclxuICAgICAgICAgICAgICAgIHJldC5fcGF0aCA9IHBhdGguc3Vic3RyaW5nKGlkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXQuX3BhdGggPSBwYXRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgcGF0aCBzdGFydHMgd2l0aCBhIHNsYXNoXHJcbiAgICAgICAgLy8gb3IgdGhhdCBpdCBpcyBhdCBsZWFzdCBhIHNsYXNoXHJcbiAgICAgICAgaWYgKHJldC5fcGF0aFswXSAhPT0gVVJJLl9zbGFzaCkge1xyXG4gICAgICAgICAgICByZXQuX3BhdGggPSBVUkkuX3NsYXNoICsgcmV0Ll9wYXRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgVVJJLl92YWxpZGF0ZShyZXQpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIF9wYXJzZUNvbXBvbmVudHModmFsdWU6IHN0cmluZyk6IFVyaUNvbXBvbmVudHMge1xyXG5cclxuICAgICAgICBjb25zdCByZXQ6IFVyaUNvbXBvbmVudHMgPSB7XHJcbiAgICAgICAgICAgIHNjaGVtZTogVVJJLl9lbXB0eSxcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBVUkkuX2VtcHR5LFxyXG4gICAgICAgICAgICBwYXRoOiBVUkkuX2VtcHR5LFxyXG4gICAgICAgICAgICBxdWVyeTogVVJJLl9lbXB0eSxcclxuICAgICAgICAgICAgZnJhZ21lbnQ6IFVSSS5fZW1wdHksXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSBVUkkuX3JlZ2V4cC5leGVjKHZhbHVlKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0LnNjaGVtZSA9IG1hdGNoWzJdIHx8IHJldC5zY2hlbWU7XHJcbiAgICAgICAgICAgIHJldC5hdXRob3JpdHkgPSBtYXRjaFs0XSB8fCByZXQuYXV0aG9yaXR5O1xyXG4gICAgICAgICAgICByZXQucGF0aCA9IG1hdGNoWzVdIHx8IHJldC5wYXRoO1xyXG4gICAgICAgICAgICByZXQucXVlcnkgPSBtYXRjaFs3XSB8fCByZXQucXVlcnk7XHJcbiAgICAgICAgICAgIHJldC5mcmFnbWVudCA9IG1hdGNoWzldIHx8IHJldC5mcmFnbWVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZShzY2hlbWU/OiBzdHJpbmcsIGF1dGhvcml0eT86IHN0cmluZywgcGF0aD86IHN0cmluZywgcXVlcnk/OiBzdHJpbmcsIGZyYWdtZW50Pzogc3RyaW5nKTogVVJJIHtcclxuICAgICAgICByZXR1cm4gbmV3IFVSSSgpLndpdGgoc2NoZW1lLCBhdXRob3JpdHksIHBhdGgsIHF1ZXJ5LCBmcmFnbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX3ZhbGlkYXRlKHJldDogVVJJKTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIHZhbGlkYXRpb25cclxuICAgICAgICAvLyBwYXRoLCBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzOTg2I3NlY3Rpb24tMy4zXHJcbiAgICAgICAgLy8gSWYgYSBVUkkgY29udGFpbnMgYW4gYXV0aG9yaXR5IGNvbXBvbmVudCwgdGhlbiB0aGUgcGF0aCBjb21wb25lbnRcclxuICAgICAgICAvLyBtdXN0IGVpdGhlciBiZSBlbXB0eSBvciBiZWdpbiB3aXRoIGEgc2xhc2ggKFwiL1wiKSBjaGFyYWN0ZXIuICBJZiBhIFVSSVxyXG4gICAgICAgIC8vIGRvZXMgbm90IGNvbnRhaW4gYW4gYXV0aG9yaXR5IGNvbXBvbmVudCwgdGhlbiB0aGUgcGF0aCBjYW5ub3QgYmVnaW5cclxuICAgICAgICAvLyB3aXRoIHR3byBzbGFzaCBjaGFyYWN0ZXJzIChcIi8vXCIpLlxyXG4gICAgICAgIGlmIChyZXQuYXV0aG9yaXR5ICYmIHJldC5wYXRoICYmIHJldC5wYXRoWzBdICE9PSAnLycpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbVXJpRXJyb3JdOiBJZiBhIFVSSSBjb250YWlucyBhbiBhdXRob3JpdHkgY29tcG9uZW50LCB0aGVuIHRoZSBwYXRoIGNvbXBvbmVudCBtdXN0IGVpdGhlciBiZSBlbXB0eSBvciBiZWdpbiB3aXRoIGEgc2xhc2ggKFwiL1wiKSBjaGFyYWN0ZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFyZXQuYXV0aG9yaXR5ICYmIHJldC5wYXRoLmluZGV4T2YoJy8vJykgPT09IDApIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbVXJpRXJyb3JdOiBJZiBhIFVSSSBkb2VzIG5vdCBjb250YWluIGFuIGF1dGhvcml0eSBjb21wb25lbnQsIHRoZW4gdGhlIHBhdGggY2Fubm90IGJlZ2luIHdpdGggdHdvIHNsYXNoIGNoYXJhY3RlcnMgKFwiLy9cIiknKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLSBwcmludGluZy9leHRlcm5hbGl6ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gc2tpcEVuY29kaW5nIERvIG5vdCBlbmNvZGUgdGhlIHJlc3VsdCwgZGVmYXVsdCBpcyBgZmFsc2VgXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0b1N0cmluZyhza2lwRW5jb2Rpbmc6IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZyB7XHJcbiAgICAgICAgaWYgKCFza2lwRW5jb2RpbmcpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9mb3JtYXR0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2Zvcm1hdHRlZCA9IFVSSS5fYXNGb3JtYXR0ZWQodGhpcywgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9mb3JtYXR0ZWQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gd2UgZG9uJ3QgY2FjaGUgdGhhdFxyXG4gICAgICAgICAgICByZXR1cm4gVVJJLl9hc0Zvcm1hdHRlZCh0aGlzLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2FzRm9ybWF0dGVkKHVyaTogVVJJLCBza2lwRW5jb2Rpbmc6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG5cclxuICAgICAgICBjb25zdCBlbmNvZGVyID0gIXNraXBFbmNvZGluZ1xyXG4gICAgICAgICAgICA/IGVuY29kZVVSSUNvbXBvbmVudDJcclxuICAgICAgICAgICAgOiBlbmNvZGVOb29wO1xyXG5cclxuICAgICAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IHtzY2hlbWUsIGF1dGhvcml0eSwgcGF0aCwgcXVlcnksIGZyYWdtZW50fSA9IHVyaTtcclxuICAgICAgICBpZiAoc2NoZW1lKSB7XHJcbiAgICAgICAgICAgIHBhcnRzLnB1c2goc2NoZW1lLCAnOicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYXV0aG9yaXR5IHx8IHNjaGVtZSA9PT0gJ2ZpbGUnKSB7XHJcbiAgICAgICAgICAgIHBhcnRzLnB1c2goJy8vJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChhdXRob3JpdHkpIHtcclxuICAgICAgICAgICAgYXV0aG9yaXR5ID0gYXV0aG9yaXR5LnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGxldCBpZHggPSBhdXRob3JpdHkuaW5kZXhPZignOicpO1xyXG4gICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgcGFydHMucHVzaChlbmNvZGVyKGF1dGhvcml0eSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGFydHMucHVzaChlbmNvZGVyKGF1dGhvcml0eS5zdWJzdHIoMCwgaWR4KSksIGF1dGhvcml0eS5zdWJzdHIoaWR4KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHBhdGgpIHtcclxuICAgICAgICAgICAgLy8gbG93ZXItY2FzZSB3aW5kb3duIGRyaXZlIGxldHRlcnMgaW4gL0M6L2ZmZlxyXG4gICAgICAgICAgICBjb25zdCBtID0gVVJJLl91cHBlckNhc2VEcml2ZS5leGVjKHBhdGgpO1xyXG4gICAgICAgICAgICBpZiAobSkge1xyXG4gICAgICAgICAgICAgICAgcGF0aCA9IG1bMV0gKyBtWzJdLnRvTG93ZXJDYXNlKCkgKyBwYXRoLnN1YnN0cihtWzFdLmxlbmd0aCArIG1bMl0ubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZW5jb2RlIGV2ZXJ5IHNlZ2VtZW50IGJ1dCBub3Qgc2xhc2hlc1xyXG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCAjIGFuZCA/IGFyZSBhbHdheXMgZW5jb2RlZFxyXG4gICAgICAgICAgICAvLyB3aGVuIG9jY3VycmluZyBpbiBwYXRocyAtIG90aGVyd2lzZSB0aGUgcmVzdWx0XHJcbiAgICAgICAgICAgIC8vIGNhbm5vdCBiZSBwYXJzZWQgYmFjayBhZ2FpblxyXG4gICAgICAgICAgICBsZXQgbGFzdElkeCA9IDA7XHJcbiAgICAgICAgICAgIHdoaWxlKHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZHggPSBwYXRoLmluZGV4T2YoVVJJLl9zbGFzaCwgbGFzdElkeCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZW5jb2RlcihwYXRoLnN1YnN0cmluZyhsYXN0SWR4KSkucmVwbGFjZSgvWyM/XS8sIF9lbmNvZGUpKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZW5jb2RlcihwYXRoLnN1YnN0cmluZyhsYXN0SWR4LCBpZHgpKS5yZXBsYWNlKC9bIz9dLywgX2VuY29kZSksIFVSSS5fc2xhc2gpO1xyXG4gICAgICAgICAgICAgICAgbGFzdElkeCA9IGlkeCArIDE7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChxdWVyeSkge1xyXG4gICAgICAgICAgICBwYXJ0cy5wdXNoKCc/JywgZW5jb2RlcihxdWVyeSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcGFydHMucHVzaCgnIycsIGVuY29kZXIoZnJhZ21lbnQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFVSSS5fZW1wdHkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b0pTT04oKTogYW55IHtcclxuICAgICAgICByZXR1cm4gPFVyaVN0YXRlPiB7XHJcbiAgICAgICAgICAgIHNjaGVtZTogdGhpcy5zY2hlbWUsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogdGhpcy5hdXRob3JpdHksXHJcbiAgICAgICAgICAgIHBhdGg6IHRoaXMucGF0aCxcclxuICAgICAgICAgICAgZnNQYXRoOiB0aGlzLmZzUGF0aCxcclxuICAgICAgICAgICAgcXVlcnk6IHRoaXMucXVlcnksXHJcbiAgICAgICAgICAgIGZyYWdtZW50OiB0aGlzLmZyYWdtZW50LnJlcGxhY2UoL1VSTF9NQVJTSEFMX1JFTU9WRS4qJC8sICcnKSwgLy8gVE9ET0BBbGV4OiBpbXBsZW1lbnQgZGVyaXZlZCByZXNvdXJjZXMgKGVtYmVkZGVkIG1pcnJvciBtb2RlbHMpIGJldHRlclxyXG4gICAgICAgICAgICBleHRlcm5hbDogdGhpcy50b1N0cmluZygpLnJlcGxhY2UoLyM/VVJMX01BUlNIQUxfUkVNT1ZFLiokLywgJycpLCAvLyBUT0RPQEFsZXg6IGltcGxlbWVudCBkZXJpdmVkIHJlc291cmNlcyAoZW1iZWRkZWQgbWlycm9yIG1vZGVscykgYmV0dGVyXHJcbiAgICAgICAgICAgICRtaWQ6IDFcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZXZpdmUoZGF0YTogYW55KTogVVJJIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IFVSSSgpO1xyXG4gICAgICAgIHJlc3VsdC5fc2NoZW1lID0gKDxVcmlTdGF0ZT4gZGF0YSkuc2NoZW1lO1xyXG4gICAgICAgIHJlc3VsdC5fYXV0aG9yaXR5ID0gKDxVcmlTdGF0ZT4gZGF0YSkuYXV0aG9yaXR5O1xyXG4gICAgICAgIHJlc3VsdC5fcGF0aCA9ICg8VXJpU3RhdGU+IGRhdGEpLnBhdGg7XHJcbiAgICAgICAgcmVzdWx0Ll9xdWVyeSA9ICg8VXJpU3RhdGU+IGRhdGEpLnF1ZXJ5O1xyXG4gICAgICAgIHJlc3VsdC5fZnJhZ21lbnQgPSAoPFVyaVN0YXRlPiBkYXRhKS5mcmFnbWVudDtcclxuICAgICAgICByZXN1bHQuX2ZzUGF0aCA9ICg8VXJpU3RhdGU+IGRhdGEpLmZzUGF0aDtcclxuICAgICAgICByZXN1bHQuX2Zvcm1hdHRlZCA9ICg8VXJpU3RhdGU+ZGF0YSkuZXh0ZXJuYWw7XHJcbiAgICAgICAgVVJJLl92YWxpZGF0ZShyZXN1bHQpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBVcmlDb21wb25lbnRzIHtcclxuICAgIHNjaGVtZTogc3RyaW5nO1xyXG4gICAgYXV0aG9yaXR5OiBzdHJpbmc7XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbiAgICBxdWVyeTogc3RyaW5nO1xyXG4gICAgZnJhZ21lbnQ6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFVyaVN0YXRlIGV4dGVuZHMgVXJpQ29tcG9uZW50cyB7XHJcbiAgICAkbWlkOiBudW1iZXI7XHJcbiAgICBmc1BhdGg6IHN0cmluZztcclxuICAgIGV4dGVybmFsOiBzdHJpbmc7XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
