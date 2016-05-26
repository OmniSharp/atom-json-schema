import {IDisposable} from "./Disposable";

export class SerialDisposable implements IDisposable {
    private _currentDisposable: IDisposable;
    private _isDisposed = false;

    public get isDisposed() { return this._isDisposed; }

    public get disposable() { return this._currentDisposable; }
    public set disposable(value) {
        const shouldDispose = this.isDisposed;
        if (!shouldDispose) {
            this._currentDisposable = value;
        }
        if (!this.isDisposed) this._currentDisposable = value;
        if (this.isDisposed && value) value.dispose();
    }

    public dispose() {
        if (!this.isDisposed) {
            this._isDisposed = true;
            const old = this._currentDisposable;
            this._currentDisposable = null;
            if (old) old.dispose();
        }
    }
}
