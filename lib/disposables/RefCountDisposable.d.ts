import { IDisposable, IDisposableOrSubscription, Disposable } from "./Disposable";
export declare class RefCountDisposable implements IDisposable {
    private _underlyingDisposable;
    private _isDisposed;
    private _isPrimaryDisposed;
    private _count;
    constructor(underlyingDisposable: IDisposableOrSubscription);
    isDisposed: boolean;
    dispose(): void;
    getDisposable(): Disposable;
}
