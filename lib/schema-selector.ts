import {CompositeDisposable, Observable, Disposable} from "rx";
import {SelectorComponent} from './schema-selector-view';
import React = require('react');
import {omni} from "./omni";
import {schemaProvider, ISchema} from "./schema-provider";
import {isEmpty} from "lodash";

class SchemaSelector {
    private disposable: Rx.CompositeDisposable;
    private view: HTMLSpanElement;
    private tile: any;
    private statusBar: any;
    private _active = false;
    private _component: SelectorComponent;

    public activate() {
        this.disposable = new CompositeDisposable();
    }

    public setup(statusBar) {
        this.statusBar = statusBar;

        if (this._active) {
            this._attach();
        }
    }

    public attach() {
        if (this.statusBar) { this._attach(); }
        this._active = true;
    }

    private _attach() {
        this.view = document.createElement("span");
        this.view.classList.add('inline-block');
        this.view.classList.add('schema-selector');
        this.view.style.display = 'none';
        var alignLeft = !atom.config.get<boolean>('grammar-selector.showOnRightSideOfStatusBar');
        if (!alignLeft) {
            var tile = this.statusBar.addRightTile({
                item: this.view,
                priority: 9
            });
        } else {
            var tile = this.statusBar.addLeftTile({
                item: this.view,
                priority: 11
            });
        }

        this._component = <any>React.render(React.createElement(SelectorComponent, { alignLeft: alignLeft }), this.view);

        this.disposable.add(Disposable.create(() => {
            React.unmountComponentAtNode(this.view);
            tile.destroy();
            this.view.remove();
        }));

        this.disposable.add(omni.activeEditor
            .where(z => !z)
            .subscribe(() => this.view.style.display = 'none'));
        this.disposable.add(omni.activeEditor
            .where(z => !!z)
            .subscribe(() => this.view.style.display = ''));

        this.disposable.add(omni.activeEditor
            .flatMapLatest(editor => schemaProvider.getSchemaForEditor(editor))
            .defaultIfEmpty(<any>{})
            .subscribe(activeSchema => {
                omni.activeSchema = activeSchema;
                this._component.setState({ activeSchema });
            }));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public setActiveSchema(activeSchema: ISchema) {
        omni.activeSchema = activeSchema;
        this._component.setState({ activeSchema });
    }
}

export var schemaSelector = new SchemaSelector;
