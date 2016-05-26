export interface IDisposable {
    dispose(): void;
}
export interface ISubscription {
    unsubscribe(): void;
}
export declare type IDisposableOrSubscription = IDisposable | ISubscription | (() => void);
export declare class Disposable implements IDisposable {
    static empty: Disposable;
    static of(value: any): IDisposable;
    static create(action: () => void): Disposable;
    private _action;
    private _isDisposed;
    constructor(value: IDisposableOrSubscription);
    isDisposed: boolean;
    dispose(): void;
}
