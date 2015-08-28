import {SelectListView, $$} from 'atom-space-pen-views';

import {CompositeDisposable, Disposable, Scheduler, Observable} from "rx";
import _ = require('lodash');
import React = require('react');
import {omni} from "./omni";
import {schemaProvider, ISchema} from "./schema-provider";
import $ = require('jquery');

interface SelectorState {
    schemas?: ISchema[];
    activeSchema: ISchema;
    alignLeft?: boolean;
}

export class SelectorComponent extends React.Component<{ alignLeft: boolean }, SelectorState> {
    private disposable = new CompositeDisposable();

    constructor(props?: { alignLeft: boolean }, context?: any) {
        super(props, context);
        this.state = { schemas: [], activeSchema: <any>{} };
    }

    public componentWillMount() {
        this.disposable = new CompositeDisposable();
    }

    public componentDidMount() {
        this.disposable.add(schemaProvider.schemas.subscribe(s => this.setState({ schemas: s, activeSchema: s[0] })));
    }

    public componentWillUnmount() {
        this.disposable.dispose();
    }

    public render() {
        return React.DOM.a({
            href: '#',
            onClick: (e) => {
                if (e.target !== e.currentTarget) return;
                var view = new FrameworkSelectorSelectListView(atom.workspace.getActiveTextEditor(), {
                    attachTo: '.schema-selector',
                    alignLeft: this.props.alignLeft,
                    items: this.state.schemas,
                    save: (framework: any) => {
                        omni.activeSchema = framework;
                        view.hide();
                    }
                });
                view.appendTo(<any>atom.views.getView(atom.workspace));
                view.setItems();
                view.show();
            },
        }, this.state.activeSchema.name);
    }
}

class FrameworkSelectorSelectListView extends SelectListView {
    private panel: Atom.Panel;

    constructor(public editor: Atom.TextEditor, private options: { alignLeft: boolean; attachTo: string; items: any[]; save(item: any): void }) {
        super();
        this.$.addClass('code-actions-overlay');
        (<any>this).filterEditorView.model.placeholderText = 'Filter list';
    }

    get $(): JQuery {
        return <any>this;
    }

    public setItems() {
        SelectListView.prototype.setItems.call(this, this.options.items)
    }

    public confirmed(item) {
        this.cancel(); //will close the view

        this.options.save(item);
        return null;
    }

    show() {
        this.storeFocusedElement();
        setTimeout(() => this.focusFilterEditor(), 100);
        var width = 320;
        var node = this[0];
        var attachTo = $(document.querySelectorAll(this.options.attachTo));
        var offset = attachTo.offset();
        if (offset) {
            if (this.options.alignLeft) {
                $(node).css({
                    position: 'fixed',
                    top: offset.top - node.clientHeight - 18,
                    left: offset.left,
                    width: width
                });
            } else {
                $(node).css({
                    position: 'fixed',
                    top: offset.top - node.clientHeight - 18,
                    left: offset.left - width + attachTo[0].clientWidth,
                    width: width
                });
            }
        }
    }

    hide() {
        this.restoreFocus();
        this.remove();
    }

    cancelled() {
        this.hide();
    }

    public getFilterKey() { return 'Name'; }

    public viewForItem(item: ISchema) {
        if (!item) {

        }
        return $$(function() {
            return this.li({
                "class": 'event',
                'data-event-name': item.name
            }, () => {
                return this.span(_.trunc(`${item.name} - ${item.description}`, 50), {
                    title: `${item.name} - ${item.description}`
                });
            });
        });
    }
}
