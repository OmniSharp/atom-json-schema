'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getErrorStatusDescription = getErrorStatusDescription;
function getErrorStatusDescription(status) {
    if (status < 400) {
        return void 0;
    }
    switch (status) {
        case 400:
            return 'Bad request. The request cannot be fulfilled due to bad syntax.';
        case 401:
            return 'Unauthorized. The server is refusing to respond.';
        case 403:
            return 'Forbidden. The server is refusing to respond.';
        case 404:
            return 'Not Found. The requested location could not be found.';
        case 405:
            return 'Method not allowed. A request was made using a request method not supported by that location.';
        case 406:
            return 'Not Acceptable. The server can only generate a response that is not accepted by the client.';
        case 407:
            return 'Proxy Authentication Required. The client must first authenticate itself with the proxy.';
        case 408:
            return 'Request Timeout. The server timed out waiting for the request.';
        case 409:
            return 'Conflict. The request could not be completed because of a conflict in the request.';
        case 410:
            return 'Gone. The requested page is no longer available.';
        case 411:
            return 'Length Required. The "Content-Length" is not defined.';
        case 412:
            return 'Precondition Failed. The precondition given in the request evaluated to false by the server.';
        case 413:
            return 'Request Entity Too Large. The server will not accept the request, because the request entity is too large.';
        case 414:
            return 'Request-URI Too Long. The server will not accept the request, because the URL is too long.';
        case 415:
            return 'Unsupported Media Type. The server will not accept the request, because the media type is not supported.';
        case 500:
            return 'Internal Server Error.';
        case 501:
            return 'Not Implemented. The server either does not recognize the request method, or it lacks the ability to fulfill the request.';
        case 503:
            return 'Service Unavailable. The server is currently unavailable (overloaded or down.';
        default:
            return 'HTTP status code ' + status;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZzY29kZS9jb21tb24vaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQTs7Ozs7UUFzQkEseUIsR0FBQSx5QjtBQUFBLFNBQUEseUJBQUEsQ0FBMEMsTUFBMUMsRUFBd0Q7QUFDcEQsUUFBSSxTQUFTLEdBQWIsRUFBa0I7QUFDZCxlQUFPLEtBQUssQ0FBWjtBQUNIO0FBQ0QsWUFBUSxNQUFSO0FBQ0ksYUFBSyxHQUFMO0FBQVUsbUJBQU8saUVBQVA7QUFDVixhQUFLLEdBQUw7QUFBVSxtQkFBTyxrREFBUDtBQUNWLGFBQUssR0FBTDtBQUFVLG1CQUFPLCtDQUFQO0FBQ1YsYUFBSyxHQUFMO0FBQVUsbUJBQU8sdURBQVA7QUFDVixhQUFLLEdBQUw7QUFBVSxtQkFBTywrRkFBUDtBQUNWLGFBQUssR0FBTDtBQUFVLG1CQUFPLDZGQUFQO0FBQ1YsYUFBSyxHQUFMO0FBQVUsbUJBQU8sMEZBQVA7QUFDVixhQUFLLEdBQUw7QUFBVSxtQkFBTyxnRUFBUDtBQUNWLGFBQUssR0FBTDtBQUFVLG1CQUFPLG9GQUFQO0FBQ1YsYUFBSyxHQUFMO0FBQVUsbUJBQU8sa0RBQVA7QUFDVixhQUFLLEdBQUw7QUFBVSxtQkFBTyx1REFBUDtBQUNWLGFBQUssR0FBTDtBQUFVLG1CQUFPLDhGQUFQO0FBQ1YsYUFBSyxHQUFMO0FBQVUsbUJBQU8sNEdBQVA7QUFDVixhQUFLLEdBQUw7QUFBVSxtQkFBTyw0RkFBUDtBQUNWLGFBQUssR0FBTDtBQUFVLG1CQUFPLDBHQUFQO0FBQ1YsYUFBSyxHQUFMO0FBQVUsbUJBQU8sd0JBQVA7QUFDVixhQUFLLEdBQUw7QUFBVSxtQkFBTywySEFBUDtBQUNWLGFBQUssR0FBTDtBQUFVLG1CQUFPLCtFQUFQO0FBQ1Y7QUFBUyx5Q0FBMkIsTUFBM0I7QUFuQmI7QUFxQkgiLCJmaWxlIjoidnNjb2RlL2NvbW1vbi9odHRwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVhIUk9wdGlvbnMge1xyXG4gICAgdHlwZT86c3RyaW5nO1xyXG4gICAgdXJsPzpzdHJpbmc7XHJcbiAgICB1c2VyPzpzdHJpbmc7XHJcbiAgICBwYXNzd29yZD86c3RyaW5nO1xyXG4gICAgcmVzcG9uc2VUeXBlPzpzdHJpbmc7XHJcbiAgICBoZWFkZXJzPzphbnk7XHJcbiAgICB0aW1lb3V0PzogbnVtYmVyO1xyXG4gICAgZm9sbG93UmVkaXJlY3RzPzogbnVtYmVyO1xyXG4gICAgZGF0YT86YW55O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElYSFJSZXNwb25zZSB7XHJcbiAgICByZXNwb25zZVRleHQ6IHN0cmluZztcclxuICAgIHN0YXR1czogbnVtYmVyO1xyXG5cclxuICAgIHJlYWR5U3RhdGUgOiBudW1iZXI7XHJcbiAgICBnZXRSZXNwb25zZUhlYWRlcjogKGhlYWRlcjpzdHJpbmcpID0+IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yU3RhdHVzRGVzY3JpcHRpb24oc3RhdHVzOiBudW1iZXIpIDogc3RyaW5nIHtcclxuICAgIGlmIChzdGF0dXMgPCA0MDApIHtcclxuICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoIChzdGF0dXMpIHtcclxuICAgICAgICBjYXNlIDQwMDogcmV0dXJuICdCYWQgcmVxdWVzdC4gVGhlIHJlcXVlc3QgY2Fubm90IGJlIGZ1bGZpbGxlZCBkdWUgdG8gYmFkIHN5bnRheC4nO1xyXG4gICAgICAgIGNhc2UgNDAxOiByZXR1cm4gJ1VuYXV0aG9yaXplZC4gVGhlIHNlcnZlciBpcyByZWZ1c2luZyB0byByZXNwb25kLic7XHJcbiAgICAgICAgY2FzZSA0MDM6IHJldHVybiAnRm9yYmlkZGVuLiBUaGUgc2VydmVyIGlzIHJlZnVzaW5nIHRvIHJlc3BvbmQuJztcclxuICAgICAgICBjYXNlIDQwNDogcmV0dXJuICdOb3QgRm91bmQuIFRoZSByZXF1ZXN0ZWQgbG9jYXRpb24gY291bGQgbm90IGJlIGZvdW5kLic7XHJcbiAgICAgICAgY2FzZSA0MDU6IHJldHVybiAnTWV0aG9kIG5vdCBhbGxvd2VkLiBBIHJlcXVlc3Qgd2FzIG1hZGUgdXNpbmcgYSByZXF1ZXN0IG1ldGhvZCBub3Qgc3VwcG9ydGVkIGJ5IHRoYXQgbG9jYXRpb24uJztcclxuICAgICAgICBjYXNlIDQwNjogcmV0dXJuICdOb3QgQWNjZXB0YWJsZS4gVGhlIHNlcnZlciBjYW4gb25seSBnZW5lcmF0ZSBhIHJlc3BvbnNlIHRoYXQgaXMgbm90IGFjY2VwdGVkIGJ5IHRoZSBjbGllbnQuJztcclxuICAgICAgICBjYXNlIDQwNzogcmV0dXJuICdQcm94eSBBdXRoZW50aWNhdGlvbiBSZXF1aXJlZC4gVGhlIGNsaWVudCBtdXN0IGZpcnN0IGF1dGhlbnRpY2F0ZSBpdHNlbGYgd2l0aCB0aGUgcHJveHkuJztcclxuICAgICAgICBjYXNlIDQwODogcmV0dXJuICdSZXF1ZXN0IFRpbWVvdXQuIFRoZSBzZXJ2ZXIgdGltZWQgb3V0IHdhaXRpbmcgZm9yIHRoZSByZXF1ZXN0Lic7XHJcbiAgICAgICAgY2FzZSA0MDk6IHJldHVybiAnQ29uZmxpY3QuIFRoZSByZXF1ZXN0IGNvdWxkIG5vdCBiZSBjb21wbGV0ZWQgYmVjYXVzZSBvZiBhIGNvbmZsaWN0IGluIHRoZSByZXF1ZXN0Lic7XHJcbiAgICAgICAgY2FzZSA0MTA6IHJldHVybiAnR29uZS4gVGhlIHJlcXVlc3RlZCBwYWdlIGlzIG5vIGxvbmdlciBhdmFpbGFibGUuJztcclxuICAgICAgICBjYXNlIDQxMTogcmV0dXJuICdMZW5ndGggUmVxdWlyZWQuIFRoZSBcIkNvbnRlbnQtTGVuZ3RoXCIgaXMgbm90IGRlZmluZWQuJztcclxuICAgICAgICBjYXNlIDQxMjogcmV0dXJuICdQcmVjb25kaXRpb24gRmFpbGVkLiBUaGUgcHJlY29uZGl0aW9uIGdpdmVuIGluIHRoZSByZXF1ZXN0IGV2YWx1YXRlZCB0byBmYWxzZSBieSB0aGUgc2VydmVyLic7XHJcbiAgICAgICAgY2FzZSA0MTM6IHJldHVybiAnUmVxdWVzdCBFbnRpdHkgVG9vIExhcmdlLiBUaGUgc2VydmVyIHdpbGwgbm90IGFjY2VwdCB0aGUgcmVxdWVzdCwgYmVjYXVzZSB0aGUgcmVxdWVzdCBlbnRpdHkgaXMgdG9vIGxhcmdlLic7XHJcbiAgICAgICAgY2FzZSA0MTQ6IHJldHVybiAnUmVxdWVzdC1VUkkgVG9vIExvbmcuIFRoZSBzZXJ2ZXIgd2lsbCBub3QgYWNjZXB0IHRoZSByZXF1ZXN0LCBiZWNhdXNlIHRoZSBVUkwgaXMgdG9vIGxvbmcuJztcclxuICAgICAgICBjYXNlIDQxNTogcmV0dXJuICdVbnN1cHBvcnRlZCBNZWRpYSBUeXBlLiBUaGUgc2VydmVyIHdpbGwgbm90IGFjY2VwdCB0aGUgcmVxdWVzdCwgYmVjYXVzZSB0aGUgbWVkaWEgdHlwZSBpcyBub3Qgc3VwcG9ydGVkLic7XHJcbiAgICAgICAgY2FzZSA1MDA6IHJldHVybiAnSW50ZXJuYWwgU2VydmVyIEVycm9yLic7XHJcbiAgICAgICAgY2FzZSA1MDE6IHJldHVybiAnTm90IEltcGxlbWVudGVkLiBUaGUgc2VydmVyIGVpdGhlciBkb2VzIG5vdCByZWNvZ25pemUgdGhlIHJlcXVlc3QgbWV0aG9kLCBvciBpdCBsYWNrcyB0aGUgYWJpbGl0eSB0byBmdWxmaWxsIHRoZSByZXF1ZXN0Lic7XHJcbiAgICAgICAgY2FzZSA1MDM6IHJldHVybiAnU2VydmljZSBVbmF2YWlsYWJsZS4gVGhlIHNlcnZlciBpcyBjdXJyZW50bHkgdW5hdmFpbGFibGUgKG92ZXJsb2FkZWQgb3IgZG93bi4nO1xyXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBgSFRUUCBzdGF0dXMgY29kZSAke3N0YXR1c31gO1xyXG4gICAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
