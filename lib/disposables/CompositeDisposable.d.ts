import { IDisposable, IDisposableOrSubscription } from "./Disposable";
export declare class CompositeDisposable implements IDisposable {
    private _disposables;
    private _isDisposed;
    constructor(...disposables: IDisposableOrSubscription[]);
    isDisposed: boolean;
    dispose(): void;
    add(...disposables: IDisposableOrSubscription[]): void;
    remove(disposable: IDisposableOrSubscription): boolean;
}
