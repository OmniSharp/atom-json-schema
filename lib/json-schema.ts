import _ = require('lodash');
import {CompositeDisposable, ReplaySubject} from "rx";

class JsonSchema {
    private disposable = new CompositeDisposable();

    public editor: Rx.Observable<Atom.TextEditor>;

    public activate(state) {
        this.editor = this.setupEditorObservable();

        // Once a json editor is loaded init the schema provider
        this.editor.where(z => !!z).take(1).subscribe(() => require('./schema-provider'));
    }

    public deactivate() {
        this.disposable.dispose();
    }

    private setupEditorObservable() {
        var subject = new ReplaySubject<Atom.TextEditor>(1);
        this.disposable.add(subject);

        this.disposable.add(atom.workspace.observeActivePaneItem((pane: any) => {
            if (pane && pane.getGrammar) {
                var grammar = pane.getGrammar();
                if (grammar) {
                    var grammarName = grammar.name;
                    if (grammarName === 'JSON') {
                        subject.onNext(pane);
                        return;
                    }
                }
            }

            // This will tell us when the editor is no longer an appropriate editor
            subject.onNext(null);
        }));

        return subject;
    }
}

var instance = new JsonSchema;
export = instance;
