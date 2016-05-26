import { IDisposable } from "./Disposable";
export declare class SerialDisposable implements IDisposable {
    private _currentDisposable;
    private _isDisposed;
    isDisposed: boolean;
    disposable: IDisposable;
    dispose(): void;
}
