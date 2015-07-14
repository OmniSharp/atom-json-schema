//omnipresent
import _ = require('lodash');
import {CompositeDisposable, ReplaySubject} from "rx";
import {ISchema} from "./schema-provider";

class Omni implements Rx.IDisposable {
    private disposable = new CompositeDisposable();
    private _editor = new ReplaySubject<Atom.TextEditor>(1);
    private _editorObservable = this._editor.asObservable();

    public activate() {
        this.setupEditorObservable();
    }

    public dispose() {
        this.disposable.dispose();
    }

    public get activeEditor() { return this._editorObservable; }

    private setupEditorObservable() {
        this.disposable.add(atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                var grammar = pane.getGrammar();
                if (grammar) {
                    var grammarName = grammar.name;
                    if (grammarName === 'JSON') {
                        this._editor.onNext(pane);
                        return;
                    }
                }
            }

            // This will tell us when the editor is no longer an appropriate editor
            this._editor.onNext(null);
        }));
    }

    private _schema: ISchema;
    public get activeSchema() { return this._schema }
    public set activeSchema(value) {
        this._schema = value;
        this._editorObservable.take(1).where(z => !!z).subscribe(editor => editor['__json__schema__'] = value);
    }
}

export var omni = new Omni;
