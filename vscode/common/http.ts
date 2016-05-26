/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

export interface IXHROptions {
    type?:string;
    url?:string;
    user?:string;
    password?:string;
    responseType?:string;
    headers?:any;
    timeout?: number;
    followRedirects?: number;
    data?:any;
}

export interface IXHRResponse {
    responseText: string;
    status: number;

    readyState : number;
    getResponseHeader: (header:string) => string;
}

export function getErrorStatusDescription(status: number) : string {
    if (status < 400) {
        return void 0;
    }
    switch (status) {
        case 400: return 'Bad request. The request cannot be fulfilled due to bad syntax.');
        case 401: return 'Unauthorized. The server is refusing to respond.';
        case 403: return 'Forbidden. The server is refusing to respond.';
        case 404: return 'Not Found. The requested location could not be found.';
        case 405: return 'Method not allowed. A request was made using a request method not supported by that location.';
        case 406: return 'Not Acceptable. The server can only generate a response that is not accepted by the client.';
        case 407: return 'Proxy Authentication Required. The client must first authenticate itself with the proxy.';
        case 408: return 'Request Timeout. The server timed out waiting for the request.';
        case 409: return 'Conflict. The request could not be completed because of a conflict in the request.';
        case 410: return 'Gone. The requested page is no longer available.';
        case 411: return 'Length Required. The "Content-Length" is not defined.';
        case 412: return 'Precondition Failed. The precondition given in the request evaluated to false by the server.';
        case 413: return 'Request Entity Too Large. The server will not accept the request, because the request entity is too large.';
        case 414: return 'Request-URI Too Long. The server will not accept the request, because the URL is too long.';
        case 415: return 'Unsupported Media Type. The server will not accept the request, because the media type is not supported.';
        case 500: return 'Internal Server Error.';
        case 501: return 'Not Implemented. The server either does not recognize the request method, or it lacks the ability to fulfill the request.';
        case 503: return 'Service Unavailable. The server is currently unavailable (overloaded or down.');
        default: return `HTTP status code ${status}`;
    }
}
