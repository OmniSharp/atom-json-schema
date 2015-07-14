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

        //var {schemaPrSelector} = require('./schema-selector');
        //this.disposable.add(schemaSelector);

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

    public consumeProvider(providers) {
        if (!providers) return;
        if (!_.isArray(providers)) providers = [providers];
        var cd = new CompositeDisposable();
        var {CompletionProvider} = require("./schema-autocomplete");
        _.each(providers, CompletionProvider.registerProvider);
        return cd;
    }

    public provideAutocomplete() {
        var {CompletionProvider} = require("./schema-autocomplete");
        //this.disposable.add(CompletionProvider);
        return CompletionProvider;
    }

    public provideLinter(linter) {
        var LinterProvider = require("./schema-linter");
        return LinterProvider.provider;
    }
}

var instance = new JsonSchema;
export = instance;
