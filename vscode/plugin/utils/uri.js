'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

var URI = function () {
    function URI() {
        _classCallCheck(this, URI);

        this._scheme = URI._empty;
        this._authority = URI._empty;
        this._path = URI._empty;
        this._query = URI._empty;
        this._fragment = URI._empty;
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
            if (!this._formatted) {
                var parts = [];
                if (this._scheme) {
                    parts.push(this._scheme);
                    parts.push(':');
                }
                if (this._authority || this._scheme === 'file') {
                    parts.push('//');
                }
                if (this._authority) {
                    var authority = this._authority,
                        idx;
                    authority = authority.toLowerCase();
                    idx = authority.indexOf(':');
                    if (idx === -1) {
                        parts.push(fixedEncodeURIComponent(authority));
                    } else {
                        parts.push(fixedEncodeURIComponent(authority.substr(0, idx)));
                        parts.push(authority.substr(idx));
                    }
                }
                if (this._path) {
                    var path = this._path,
                        segments;
                    if (URI._driveLetterPath.test(path)) {
                        path = '/' + path[1].toLowerCase() + path.substr(2);
                    } else if (URI._driveLetter.test(path)) {
                        path = path[0].toLowerCase() + path.substr(1);
                    }
                    segments = path.split('/');
                    for (var i = 0, len = segments.length; i < len; i++) {
                        segments[i] = fixedEncodeURIComponent(segments[i]);
                    }
                    parts.push(segments.join('/'));
                }
                if (this._query) {
                    var encoder = /https?/i.test(this.scheme) ? encodeURI : fixedEncodeURIComponent;
                    parts.push('?');
                    parts.push(encoder(this._query));
                }
                if (this._fragment) {
                    parts.push('#');
                    parts.push(fixedEncodeURIComponent(this._fragment));
                }
                this._formatted = parts.join('');
            }
            return this._formatted;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.toString();
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
                if (process.platform === 'win32') {
                    value = value.replace(/\//g, '\\');
                }
                this._fsPath = value;
            }
            return this._fsPath;
        }
    }], [{
        key: 'parse',
        value: function parse(value) {
            var ret = URI._parse(value);
            ret = ret.with(undefined, decodeURIComponent(ret.authority), decodeURIComponent(ret.path), decodeURIComponent(ret.query), decodeURIComponent(ret.fragment));
            return ret;
        }
    }, {
        key: 'file',
        value: function file(path) {
            path = path.replace(/\\/g, '/');
            path = path.replace(/%/g, '%25');
            path = path.replace(/#/g, '%23');
            path = path.replace(/\?/g, '%3F');
            path = URI._driveLetter.test(path) ? '/' + path : path;
            var ret = URI._parse(path);
            if (ret.scheme || ret.fragment || ret.query) {
                throw new Error('Path contains a scheme, fragment or a query. Can not convert it to a file uri.');
            }
            ret = ret.with('file', undefined, decodeURIComponent(ret.path), undefined, undefined);
            return ret;
        }
    }, {
        key: '_parse',
        value: function _parse(value) {
            var ret = new URI();
            var match = URI._regexp.exec(value);
            if (match) {
                ret._scheme = match[2] || ret._scheme;
                ret._authority = match[4] || ret._authority;
                ret._path = match[5] || ret._path;
                ret._query = match[7] || ret._query;
                ret._fragment = match[9] || ret._fragment;
            }
            URI._validate(ret);
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
        key: 'isURI',
        value: function isURI(thing) {
            if (thing instanceof URI) {
                return true;
            }
            if (!thing) {
                return false;
            }
            if (typeof thing.scheme !== 'string') {
                return false;
            }
            if (typeof thing.authority !== 'string') {
                return false;
            }
            if (typeof thing.fsPath !== 'string') {
                return false;
            }
            if (typeof thing.query !== 'string') {
                return false;
            }
            if (typeof thing.fragment !== 'string') {
                return false;
            }
            if (typeof thing.with !== 'function') {
                return false;
            }
            if (typeof thing.withScheme !== 'function') {
                return false;
            }
            if (typeof thing.withAuthority !== 'function') {
                return false;
            }
            if (typeof thing.withPath !== 'function') {
                return false;
            }
            if (typeof thing.withQuery !== 'function') {
                return false;
            }
            if (typeof thing.withFragment !== 'function') {
                return false;
            }
            if (typeof thing.toString !== 'function') {
                return false;
            }
            if (typeof thing.toJSON !== 'function') {
                return false;
            }
            return true;
        }
    }]);

    return URI;
}();

exports.default = URI;

URI._empty = '';
URI._regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
URI._driveLetterPath = /^\/[a-zA-z]:/;
URI._driveLetter = /^[a-zA-z]:/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9wbHVnaW4vdXRpbHMvdXJpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBOzs7Ozs7Ozs7O0FBR0EsU0FBQSx1QkFBQSxDQUFpQyxHQUFqQyxFQUE0QztBQUMzQyxXQUFPLG1CQUFtQixHQUFuQixFQUF3QixPQUF4QixDQUFnQyxVQUFoQyxFQUE0QztBQUFBLGVBQUssTUFBTSxFQUFFLFVBQUYsQ0FBYSxDQUFiLEVBQWdCLFFBQWhCLENBQXlCLEVBQXpCLEVBQTZCLFdBQTdCLEVBQVg7QUFBQSxLQUE1QyxDQUFQO0FBQ0E7O0lBa0JELEc7QUFhQyxtQkFBQTtBQUFBOztBQUNDLGFBQUssT0FBTCxHQUFlLElBQUksTUFBbkI7QUFDQSxhQUFLLFVBQUwsR0FBa0IsSUFBSSxNQUF0QjtBQUNBLGFBQUssS0FBTCxHQUFhLElBQUksTUFBakI7QUFDQSxhQUFLLE1BQUwsR0FBYyxJQUFJLE1BQWxCO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLElBQUksTUFBckI7QUFDQTs7Ozs4QkF3RVcsTSxFQUFnQixTLEVBQW1CLEksRUFBYyxLLEVBQWUsUSxFQUFnQjtBQUMzRixnQkFBSSxNQUFNLElBQUksR0FBSixFQUFWO0FBQ0EsZ0JBQUksT0FBSixHQUFjLFVBQVUsS0FBSyxNQUE3QjtBQUNBLGdCQUFJLFVBQUosR0FBaUIsYUFBYSxLQUFLLFNBQW5DO0FBQ0EsZ0JBQUksS0FBSixHQUFZLFFBQVEsS0FBSyxJQUF6QjtBQUNBLGdCQUFJLE1BQUosR0FBYSxTQUFTLEtBQUssS0FBM0I7QUFDQSxnQkFBSSxTQUFKLEdBQWdCLFlBQVksS0FBSyxRQUFqQztBQUNBLGdCQUFJLFNBQUosQ0FBYyxHQUFkO0FBQ0EsbUJBQU8sR0FBUDtBQUNBOzs7bUNBRWlCLEssRUFBYTtBQUM5QixtQkFBTyxLQUFLLElBQUwsQ0FBVSxLQUFWLEVBQWlCLFNBQWpCLEVBQTRCLFNBQTVCLEVBQXVDLFNBQXZDLEVBQWtELFNBQWxELENBQVA7QUFDQTs7O3NDQUVvQixLLEVBQWE7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LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9lbmNvZGVVUklDb21wb25lbnRcclxuZnVuY3Rpb24gZml4ZWRFbmNvZGVVUklDb21wb25lbnQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xyXG5cdHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyKS5yZXBsYWNlKC9bIScoKSpdL2csIGMgPT4gJyUnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVuaWZvcm0gUmVzb3VyY2UgSWRlbnRpZmllciAoVVJJKSBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzOTg2LlxyXG4gKiBUaGlzIGNsYXNzIGlzIGEgc2ltcGxlIHBhcnNlciB3aGljaCBjcmVhdGVzIHRoZSBiYXNpYyBjb21wb25lbnQgcGF0aHNcclxuICogKGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM5ODYjc2VjdGlvbi0zKSB3aXRoIG1pbmltYWwgdmFsaWRhdGlvblxyXG4gKiBhbmQgZW5jb2RpbmcuXHJcbiAqXHJcbiAqICAgICAgIGZvbzovL2V4YW1wbGUuY29tOjgwNDIvb3Zlci90aGVyZT9uYW1lPWZlcnJldCNub3NlXHJcbiAqICAgICAgIFxcXy8gICBcXF9fX19fX19fX19fX19fL1xcX19fX19fX19fLyBcXF9fX19fX19fXy8gXFxfXy9cclxuICogICAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICB8ICAgICAgICAgICAgfCAgICAgICAgfFxyXG4gKiAgICAgc2NoZW1lICAgICBhdXRob3JpdHkgICAgICAgcGF0aCAgICAgICAgcXVlcnkgICBmcmFnbWVudFxyXG4gKiAgICAgICAgfCAgIF9fX19fX19fX19fX19fX19fX19fX3xfX1xyXG4gKiAgICAgICAvIFxcIC8gICAgICAgICAgICAgICAgICAgICAgICBcXFxyXG4gKiAgICAgICB1cm46ZXhhbXBsZTphbmltYWw6ZmVycmV0Om5vc2VcclxuICpcclxuICpcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVSSSB7XHJcblxyXG5cdHByaXZhdGUgc3RhdGljIF9lbXB0eSA9ICcnO1xyXG5cdHByaXZhdGUgc3RhdGljIF9yZWdleHAgPSAvXigoW146Lz8jXSs/KTopPyhcXC9cXC8oW14vPyNdKikpPyhbXj8jXSopKFxcPyhbXiNdKikpPygjKC4qKSk/LztcclxuXHRwcml2YXRlIHN0YXRpYyBfZHJpdmVMZXR0ZXJQYXRoID0gL15cXC9bYS16QS16XTovO1xyXG5cdHByaXZhdGUgc3RhdGljIF9kcml2ZUxldHRlciA9IC9eW2EtekEtel06LztcclxuXHJcblx0cHJpdmF0ZSBfc2NoZW1lOiBzdHJpbmc7XHJcblx0cHJpdmF0ZSBfYXV0aG9yaXR5OiBzdHJpbmc7XHJcblx0cHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xyXG5cdHByaXZhdGUgX3F1ZXJ5OiBzdHJpbmc7XHJcblx0cHJpdmF0ZSBfZnJhZ21lbnQ6IHN0cmluZztcclxuXHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHR0aGlzLl9zY2hlbWUgPSBVUkkuX2VtcHR5O1xyXG5cdFx0dGhpcy5fYXV0aG9yaXR5ID0gVVJJLl9lbXB0eTtcclxuXHRcdHRoaXMuX3BhdGggPSBVUkkuX2VtcHR5O1xyXG5cdFx0dGhpcy5fcXVlcnkgPSBVUkkuX2VtcHR5O1xyXG5cdFx0dGhpcy5fZnJhZ21lbnQgPSBVUkkuX2VtcHR5O1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogc2NoZW1lIGlzIHRoZSAnaHR0cCcgcGFydCBvZiAnaHR0cDovL3d3dy5tc2Z0LmNvbS9zb21lL3BhdGg/cXVlcnkjZnJhZ21lbnQnLlxyXG5cdCAqIFRoZSBwYXJ0IGJlZm9yZSB0aGUgZmlyc3QgY29sb24uXHJcblx0ICovXHJcblx0Z2V0IHNjaGVtZSgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zY2hlbWU7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBhdXRob3JpdHkgaXMgdGhlICd3d3cubXNmdC5jb20nIHBhcnQgb2YgJ2h0dHA6Ly93d3cubXNmdC5jb20vc29tZS9wYXRoP3F1ZXJ5I2ZyYWdtZW50Jy5cclxuXHQgKiBUaGUgcGFydCBiZXR3ZWVuIHRoZSBmaXJzdCBkb3VibGUgc2xhc2hlcyBhbmQgdGhlIG5leHQgc2xhc2guXHJcblx0ICovXHJcblx0Z2V0IGF1dGhvcml0eSgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9hdXRob3JpdHk7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBwYXRoIGlzIHRoZSAnL3NvbWUvcGF0aCcgcGFydCBvZiAnaHR0cDovL3d3dy5tc2Z0LmNvbS9zb21lL3BhdGg/cXVlcnkjZnJhZ21lbnQnLlxyXG5cdCAqL1xyXG5cdGdldCBwYXRoKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3BhdGg7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBxdWVyeSBpcyB0aGUgJ3F1ZXJ5JyBwYXJ0IG9mICdodHRwOi8vd3d3Lm1zZnQuY29tL3NvbWUvcGF0aD9xdWVyeSNmcmFnbWVudCcuXHJcblx0ICovXHJcblx0Z2V0IHF1ZXJ5KCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3F1ZXJ5O1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogZnJhZ21lbnQgaXMgdGhlICdmcmFnbWVudCcgcGFydCBvZiAnaHR0cDovL3d3dy5tc2Z0LmNvbS9zb21lL3BhdGg/cXVlcnkjZnJhZ21lbnQnLlxyXG5cdCAqL1xyXG5cdGdldCBmcmFnbWVudCgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9mcmFnbWVudDtcclxuXHR9XHJcblxyXG5cdC8vIC0tLS0gZmlsZXN5c3RlbSBwYXRoIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHByaXZhdGUgX2ZzUGF0aDogc3RyaW5nO1xyXG5cclxuXHQvKipcclxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY29ycmVzcG9uZGluZyBmaWxlIHN5c3RlbSBwYXRoIG9mIHRoaXMgVVJJLlxyXG5cdCAqIFdpbGwgaGFuZGxlIFVOQyBwYXRocyBhbmQgbm9ybWFsaXplIHdpbmRvd3MgZHJpdmUgbGV0dGVycyB0byBsb3dlci1jYXNlLiBBbHNvXHJcblx0ICogdXNlcyB0aGUgcGxhdGZvcm0gc3BlY2lmaWMgcGF0aCBzZXBhcmF0b3IuIFdpbGwgKm5vdCogdmFsaWRhdGUgdGhlIHBhdGggZm9yXHJcblx0ICogaW52YWxpZCBjaGFyYWN0ZXJzIGFuZCBzZW1hbnRpY3MuIFdpbGwgKm5vdCogbG9vayBhdCB0aGUgc2NoZW1lIG9mIHRoaXMgVVJJLlxyXG5cdCAqL1xyXG5cdGdldCBmc1BhdGgoKSB7XHJcblx0XHRpZiAoIXRoaXMuX2ZzUGF0aCkge1xyXG5cdFx0XHR2YXIgdmFsdWU6IHN0cmluZztcclxuXHRcdFx0aWYgKHRoaXMuX2F1dGhvcml0eSAmJiB0aGlzLnNjaGVtZSA9PT0gJ2ZpbGUnKSB7XHJcblx0XHRcdFx0Ly8gdW5jIHBhdGg6IGZpbGU6Ly9zaGFyZXMvYyQvZmFyL2Jvb1xyXG5cdFx0XHRcdHZhbHVlID0gYC8vJHt0aGlzLl9hdXRob3JpdHl9JHt0aGlzLl9wYXRofWA7XHJcblx0XHRcdH0gZWxzZSBpZiAoVVJJLl9kcml2ZUxldHRlclBhdGgudGVzdCh0aGlzLl9wYXRoKSkge1xyXG5cdFx0XHRcdC8vIHdpbmRvd3MgZHJpdmUgbGV0dGVyOiBmaWxlOi8vL2M6L2Zhci9ib29cclxuXHRcdFx0XHR2YWx1ZSA9IHRoaXMuX3BhdGhbMV0udG9Mb3dlckNhc2UoKSArIHRoaXMuX3BhdGguc3Vic3RyKDIpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIG90aGVyIHBhdGhcclxuXHRcdFx0XHR2YWx1ZSA9IHRoaXMuX3BhdGg7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcclxuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1xcLy9nLCAnXFxcXCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuX2ZzUGF0aCA9IHZhbHVlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuX2ZzUGF0aDtcclxuXHR9XHJcblxyXG5cdC8vIC0tLS0gbW9kaWZ5IHRvIG5ldyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHB1YmxpYyB3aXRoKHNjaGVtZTogc3RyaW5nLCBhdXRob3JpdHk6IHN0cmluZywgcGF0aDogc3RyaW5nLCBxdWVyeTogc3RyaW5nLCBmcmFnbWVudDogc3RyaW5nKTogVVJJIHtcclxuXHRcdHZhciByZXQgPSBuZXcgVVJJKCk7XHJcblx0XHRyZXQuX3NjaGVtZSA9IHNjaGVtZSB8fCB0aGlzLnNjaGVtZTtcclxuXHRcdHJldC5fYXV0aG9yaXR5ID0gYXV0aG9yaXR5IHx8IHRoaXMuYXV0aG9yaXR5O1xyXG5cdFx0cmV0Ll9wYXRoID0gcGF0aCB8fCB0aGlzLnBhdGg7XHJcblx0XHRyZXQuX3F1ZXJ5ID0gcXVlcnkgfHwgdGhpcy5xdWVyeTtcclxuXHRcdHJldC5fZnJhZ21lbnQgPSBmcmFnbWVudCB8fCB0aGlzLmZyYWdtZW50O1xyXG5cdFx0VVJJLl92YWxpZGF0ZShyZXQpO1xyXG5cdFx0cmV0dXJuIHJldDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB3aXRoU2NoZW1lKHZhbHVlOiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0cmV0dXJuIHRoaXMud2l0aCh2YWx1ZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB3aXRoQXV0aG9yaXR5KHZhbHVlOiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0cmV0dXJuIHRoaXMud2l0aCh1bmRlZmluZWQsIHZhbHVlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB3aXRoUGF0aCh2YWx1ZTogc3RyaW5nKTogVVJJIHtcclxuXHRcdHJldHVybiB0aGlzLndpdGgodW5kZWZpbmVkLCB1bmRlZmluZWQsIHZhbHVlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgd2l0aFF1ZXJ5KHZhbHVlOiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0cmV0dXJuIHRoaXMud2l0aCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB2YWx1ZSwgdW5kZWZpbmVkKTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB3aXRoRnJhZ21lbnQodmFsdWU6IHN0cmluZyk6IFVSSSB7XHJcblx0XHRyZXR1cm4gdGhpcy53aXRoKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdmFsdWUpO1xyXG5cdH1cclxuXHJcblx0Ly8gLS0tLSBwYXJzZSAmIHZhbGlkYXRlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHRwdWJsaWMgc3RhdGljIHBhcnNlKHZhbHVlOiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0dmFyIHJldCA9IFVSSS5fcGFyc2UodmFsdWUpO1xyXG5cdFx0cmV0ID0gcmV0LndpdGgodW5kZWZpbmVkLFxyXG5cdFx0XHRkZWNvZGVVUklDb21wb25lbnQocmV0LmF1dGhvcml0eSksXHJcblx0XHRcdGRlY29kZVVSSUNvbXBvbmVudChyZXQucGF0aCksXHJcblx0XHRcdGRlY29kZVVSSUNvbXBvbmVudChyZXQucXVlcnkpLFxyXG5cdFx0XHRkZWNvZGVVUklDb21wb25lbnQocmV0LmZyYWdtZW50KSk7XHJcblxyXG5cdFx0cmV0dXJuIHJldDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBzdGF0aWMgZmlsZShwYXRoOiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xyXG5cdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvJS9nLCAnJTI1Jyk7XHJcblx0XHRwYXRoID0gcGF0aC5yZXBsYWNlKC8jL2csICclMjMnKTtcclxuXHRcdHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcPy9nLCAnJTNGJyk7XHJcblx0XHRwYXRoID0gVVJJLl9kcml2ZUxldHRlci50ZXN0KHBhdGgpXHJcblx0XHRcdD8gJy8nICsgcGF0aFxyXG5cdFx0XHQ6IHBhdGg7XHJcblxyXG5cdFx0dmFyIHJldCA9IFVSSS5fcGFyc2UocGF0aCk7XHJcblx0XHRpZiAocmV0LnNjaGVtZSB8fCByZXQuZnJhZ21lbnQgfHwgcmV0LnF1ZXJ5KSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignUGF0aCBjb250YWlucyBhIHNjaGVtZSwgZnJhZ21lbnQgb3IgYSBxdWVyeS4gQ2FuIG5vdCBjb252ZXJ0IGl0IHRvIGEgZmlsZSB1cmkuJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0ID0gcmV0LndpdGgoJ2ZpbGUnLCB1bmRlZmluZWQsXHJcblx0XHRcdGRlY29kZVVSSUNvbXBvbmVudChyZXQucGF0aCksXHJcblx0XHRcdHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcclxuXHJcblx0XHRyZXR1cm4gcmV0O1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBzdGF0aWMgX3BhcnNlKHZhbHVlOiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0dmFyIHJldCA9IG5ldyBVUkkoKTtcclxuXHRcdHZhciBtYXRjaCA9IFVSSS5fcmVnZXhwLmV4ZWModmFsdWUpO1xyXG5cdFx0aWYgKG1hdGNoKSB7XHJcblx0XHRcdHJldC5fc2NoZW1lID0gbWF0Y2hbMl0gfHwgcmV0Ll9zY2hlbWU7XHJcblx0XHRcdHJldC5fYXV0aG9yaXR5ID0gbWF0Y2hbNF0gfHwgcmV0Ll9hdXRob3JpdHk7XHJcblx0XHRcdHJldC5fcGF0aCA9IG1hdGNoWzVdIHx8IHJldC5fcGF0aDtcclxuXHRcdFx0cmV0Ll9xdWVyeSA9IG1hdGNoWzddIHx8IHJldC5fcXVlcnk7XHJcblx0XHRcdHJldC5fZnJhZ21lbnQgPSBtYXRjaFs5XSB8fCByZXQuX2ZyYWdtZW50O1xyXG5cdFx0fVxyXG5cdFx0VVJJLl92YWxpZGF0ZShyZXQpO1xyXG5cdFx0cmV0dXJuIHJldDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBzdGF0aWMgY3JlYXRlKHNjaGVtZT86IHN0cmluZywgYXV0aG9yaXR5Pzogc3RyaW5nLCBwYXRoPzogc3RyaW5nLCBxdWVyeT86IHN0cmluZywgZnJhZ21lbnQ/OiBzdHJpbmcpOiBVUkkge1xyXG5cdFx0cmV0dXJuIG5ldyBVUkkoKS53aXRoKHNjaGVtZSwgYXV0aG9yaXR5LCBwYXRoLCBxdWVyeSwgZnJhZ21lbnQpO1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBzdGF0aWMgX3ZhbGlkYXRlKHJldDogVVJJKTogdm9pZCB7XHJcblxyXG5cdFx0Ly8gdmFsaWRhdGlvblxyXG5cdFx0Ly8gcGF0aCwgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzk4NiNzZWN0aW9uLTMuM1xyXG5cdFx0Ly8gSWYgYSBVUkkgY29udGFpbnMgYW4gYXV0aG9yaXR5IGNvbXBvbmVudCwgdGhlbiB0aGUgcGF0aCBjb21wb25lbnRcclxuXHRcdC8vIG11c3QgZWl0aGVyIGJlIGVtcHR5IG9yIGJlZ2luIHdpdGggYSBzbGFzaCAoXCIvXCIpIGNoYXJhY3Rlci4gIElmIGEgVVJJXHJcblx0XHQvLyBkb2VzIG5vdCBjb250YWluIGFuIGF1dGhvcml0eSBjb21wb25lbnQsIHRoZW4gdGhlIHBhdGggY2Fubm90IGJlZ2luXHJcblx0XHQvLyB3aXRoIHR3byBzbGFzaCBjaGFyYWN0ZXJzIChcIi8vXCIpLlxyXG5cdFx0aWYgKHJldC5hdXRob3JpdHkgJiYgcmV0LnBhdGggJiYgcmV0LnBhdGhbMF0gIT09ICcvJykge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1tVcmlFcnJvcl06IElmIGEgVVJJIGNvbnRhaW5zIGFuIGF1dGhvcml0eSBjb21wb25lbnQsIHRoZW4gdGhlIHBhdGggY29tcG9uZW50IG11c3QgZWl0aGVyIGJlIGVtcHR5IG9yIGJlZ2luIHdpdGggYSBzbGFzaCAoXCIvXCIpIGNoYXJhY3RlcicpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCFyZXQuYXV0aG9yaXR5ICYmIHJldC5wYXRoLmluZGV4T2YoJy8vJykgPT09IDApIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdbVXJpRXJyb3JdOiBJZiBhIFVSSSBkb2VzIG5vdCBjb250YWluIGFuIGF1dGhvcml0eSBjb21wb25lbnQsIHRoZW4gdGhlIHBhdGggY2Fubm90IGJlZ2luIHdpdGggdHdvIHNsYXNoIGNoYXJhY3RlcnMgKFwiLy9cIiknKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIC0tLS0gcHJpbnRpbmcvZXh0ZXJuYWxpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHByaXZhdGUgX2Zvcm1hdHRlZDogc3RyaW5nO1xyXG5cclxuXHRwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuXHRcdGlmICghdGhpcy5fZm9ybWF0dGVkKSB7XHJcblx0XHRcdHZhciBwYXJ0czogc3RyaW5nW10gPSBbXTtcclxuXHJcblx0XHRcdGlmICh0aGlzLl9zY2hlbWUpIHtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKHRoaXMuX3NjaGVtZSk7XHJcblx0XHRcdFx0cGFydHMucHVzaCgnOicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0aGlzLl9hdXRob3JpdHkgfHwgdGhpcy5fc2NoZW1lID09PSAnZmlsZScpIHtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKCcvLycpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0aGlzLl9hdXRob3JpdHkpIHtcclxuXHRcdFx0XHR2YXIgYXV0aG9yaXR5ID0gdGhpcy5fYXV0aG9yaXR5LFxyXG5cdFx0XHRcdFx0aWR4OiBudW1iZXI7XHJcblxyXG5cdFx0XHRcdGF1dGhvcml0eSA9IGF1dGhvcml0eS50b0xvd2VyQ2FzZSgpO1xyXG5cdFx0XHRcdGlkeCA9IGF1dGhvcml0eS5pbmRleE9mKCc6Jyk7XHJcblx0XHRcdFx0aWYgKGlkeCA9PT0gLTEpIHtcclxuXHRcdFx0XHRcdHBhcnRzLnB1c2goZml4ZWRFbmNvZGVVUklDb21wb25lbnQoYXV0aG9yaXR5KSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHBhcnRzLnB1c2goZml4ZWRFbmNvZGVVUklDb21wb25lbnQoYXV0aG9yaXR5LnN1YnN0cigwLCBpZHgpKSk7XHJcblx0XHRcdFx0XHRwYXJ0cy5wdXNoKGF1dGhvcml0eS5zdWJzdHIoaWR4KSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0aGlzLl9wYXRoKSB7XHJcblx0XHRcdFx0Ly8gZW5jb2RlIGV2ZXJ5IHNlZ21lbnQgb2YgdGhlIHBhdGhcclxuXHRcdFx0XHR2YXIgcGF0aCA9IHRoaXMuX3BhdGgsXHJcblx0XHRcdFx0XHRzZWdtZW50czogc3RyaW5nW107XHJcblxyXG5cdFx0XHRcdC8vIGxvd2VyLWNhc2Ugd2luIGRyaXZlIGxldHRlcnMgaW4gL0M6L2ZmZlxyXG5cdFx0XHRcdGlmIChVUkkuX2RyaXZlTGV0dGVyUGF0aC50ZXN0KHBhdGgpKSB7XHJcblx0XHRcdFx0XHRwYXRoID0gJy8nICsgcGF0aFsxXS50b0xvd2VyQ2FzZSgpICsgcGF0aC5zdWJzdHIoMik7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChVUkkuX2RyaXZlTGV0dGVyLnRlc3QocGF0aCkpIHtcclxuXHRcdFx0XHRcdHBhdGggPSBwYXRoWzBdLnRvTG93ZXJDYXNlKCkgKyBwYXRoLnN1YnN0cigxKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0c2VnbWVudHMgPSBwYXRoLnNwbGl0KCcvJyk7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHNlZ21lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRzZWdtZW50c1tpXSA9IGZpeGVkRW5jb2RlVVJJQ29tcG9uZW50KHNlZ21lbnRzW2ldKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cGFydHMucHVzaChzZWdtZW50cy5qb2luKCcvJykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0aGlzLl9xdWVyeSkge1xyXG5cdFx0XHRcdC8vIGluIGh0dHAocykgcXVlcnlzIG9mdGVuIHVzZSAna2V5PXZhbHVlJy1wYWlycyBhbmRcclxuXHRcdFx0XHQvLyBhbXBlcnNhbmQgY2hhcmFjdGVycyBmb3IgbXVsdGlwbGUgcGFpcnNcclxuXHRcdFx0XHR2YXIgZW5jb2RlciA9IC9odHRwcz8vaS50ZXN0KHRoaXMuc2NoZW1lKVxyXG5cdFx0XHRcdFx0PyBlbmNvZGVVUklcclxuXHRcdFx0XHRcdDogZml4ZWRFbmNvZGVVUklDb21wb25lbnQ7XHJcblxyXG5cdFx0XHRcdHBhcnRzLnB1c2goJz8nKTtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKGVuY29kZXIodGhpcy5fcXVlcnkpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodGhpcy5fZnJhZ21lbnQpIHtcclxuXHRcdFx0XHRwYXJ0cy5wdXNoKCcjJyk7XHJcblx0XHRcdFx0cGFydHMucHVzaChmaXhlZEVuY29kZVVSSUNvbXBvbmVudCh0aGlzLl9mcmFnbWVudCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuX2Zvcm1hdHRlZCA9IHBhcnRzLmpvaW4oJycpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuX2Zvcm1hdHRlZDtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyB0b0pTT04oKTogYW55IHtcclxuXHRcdHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgc3RhdGljIGlzVVJJKHRoaW5nOiBhbnkpOiB0aGluZyBpcyBVUkkge1xyXG5cdFx0aWYgKHRoaW5nIGluc3RhbmNlb2YgVVJJKSB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cdFx0aWYoIXRoaW5nKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgKDxVUkk+dGhpbmcpLnNjaGVtZSAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiAoPFVSST50aGluZykuYXV0aG9yaXR5ICE9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mICg8VVJJPnRoaW5nKS5mc1BhdGggIT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgKDxVUkk+dGhpbmcpLnF1ZXJ5ICE9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mICg8VVJJPnRoaW5nKS5mcmFnbWVudCAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiAoPFVSST50aGluZykud2l0aCAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mICg8VVJJPnRoaW5nKS53aXRoU2NoZW1lICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgKDxVUkk+dGhpbmcpLndpdGhBdXRob3JpdHkgIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiAoPFVSST50aGluZykud2l0aFBhdGggIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiAoPFVSST50aGluZykud2l0aFF1ZXJ5ICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgKDxVUkk+dGhpbmcpLndpdGhGcmFnbWVudCAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mICg8VVJJPnRoaW5nKS50b1N0cmluZyAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mICg8VVJJPnRoaW5nKS50b0pTT04gIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
