/// <reference path="typings/bluebird/bluebird.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/lodash/lodash.d.ts" />
/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/semver/semver.d.ts" />
/// <reference path="typings/react/react.d.ts" />
/// <reference path="typingsTemp/atom/atom.d.ts" />
/// <reference path="typingsTemp/atom-keymap/atom-keymap.d.ts" />
/// <reference path="typingsTemp/atom-space-pen-views/atom-space-pen-views.d.ts" />
/// <reference path="typingsTemp/event-kit/event-kit.d.ts" />
/// <reference path="typingsTemp/first-mate/first-mate.d.ts" />
/// <reference path="typingsTemp/linter/linter.d.ts" />
/// <reference path="typingsTemp/pathwatcher/pathwatcher.d.ts" />
/// <reference path="typingsTemp/property-accessors/property-accessors.d.ts" />
/// <reference path="typingsTemp/scandal/scandal.d.ts" />
/// <reference path="typingsTemp/scoped-property-store/scoped-property-store.d.ts" />
/// <reference path="typingsTemp/serializable/serializable.d.ts" />
/// <reference path="typingsTemp/space-pen/space-pen.d.ts" />
/// <reference path="typingsTemp/status-bar/status-bar.d.ts" />
/// <reference path="typingsTemp/text-buffer/text-buffer.d.ts" />
/// <reference path="node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="es6.d.ts" />

interface IAutocompleteProviderOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
    path: string;
    replacementPrefix: string;
}

interface IAutocompleteProvider {
    fileMatchs: string[];
    pathMatch: (path: string) => boolean;
    getSuggestions: (options: IAutocompleteProviderOptions) => Rx.IPromise<Suggestion[]>;
    dispose(): void;
}


interface Suggestion {
    //Either text or snippet is required
    text?: string;
    snippet?: string;
    displayText?: string;
    replacementPrefix?: string;
    type: string;
    leftLabel?: string;
    leftLabelHTML?: string;
    rightLabel?: string;
    rightLabelHTML?: string;
    iconHTML?: string;
    description?: string;
    descriptionMoreURL?: string;
    className?: string;
}
