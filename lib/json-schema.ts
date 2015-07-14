import _ = require('lodash');
import {CompositeDisposable, ReplaySubject} from "rx";
import {omni} from "./omni";

class JsonSchema {
    private disposable = new CompositeDisposable();

    public editor: Rx.Observable<Atom.TextEditor>;

    public activate(state) {
        omni.activate();
        this.disposable.add(omni);

        var {schemaSelector} = require('./schema-selector');
        this.disposable.add(schemaSelector);

        schemaSelector.activate();
        schemaSelector.attach();
    }

    public deactivate() {
        this.disposable.dispose();
    }

    public consumeStatusBar(statusBar) {
        var {schemaSelector} = require('./schema-selector');
        schemaSelector.setup(statusBar);
    }
    /*
        public provideAutocomplete() {
            var {CompletionProvider} = require("./features/lib/completion-provider");
            this.disposable.add(CompletionProvider);
            return CompletionProvider;
        }*/

        public provideLinter(linter) {
            var LinterProvider = require("./schema-linter");
            return LinterProvider.provider;
        }
}

var instance = new JsonSchema;
export = instance;
