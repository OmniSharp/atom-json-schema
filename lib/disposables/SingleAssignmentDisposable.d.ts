import { IDisposable } from "./Disposable";
export declare class SingleAssignmentDisposable implements IDisposable {
    private _currentDisposable;
    private _isDisposed;
    isDisposed: boolean;
    disposable: IDisposable;
    dispose(): void;
}
