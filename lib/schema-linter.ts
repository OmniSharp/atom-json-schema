var Range = require('atom').Range;
import _ from 'lodash';
import {omni} from "./omni";
import {Observable} from "rxjs";
import {CompositeDisposable} from "./disposables";

import {JSONSchemaService, ISchemaAssociations} from './vscode/plugin/jsonSchemaService';
import {parse as parseJSON, ObjectASTNode, JSONDocument} from './vscode/plugin/jsonParser';

const jsonSchemaService = new JSONSchemaService();

interface LinterError {
    type: string; // 'error' | 'warning'
    text?: string;
    html?: string;
    filePath?: string;
    range?: Range;
    line?: number;
    col?: number;
}

export var provider = [
    {
        grammarScopes: ['source.json'],
        scope: 'file',
        lintOnFly: true,
        lint: (editor: Atom.TextEditor) => {
            if (editor.getText().length === 0) {
                // ignore empty documents
                return Promise.resolve<LinterError[]>([]);
            }

            let jsonDocument = parseJSON(editor.getText());
            return jsonSchemaService.getSchemaForResource(editor.getURI(), jsonDocument).then(schema => {
                if (schema) {
                    if (schema.errors.length && jsonDocument.root) {
                        let astRoot = jsonDocument.root;
                        let property = astRoot.type === 'object' ? (<ObjectASTNode>astRoot).getFirstProperty('$schema') : null;
                        if (property) {
                            let node = property.value || property;
                            jsonDocument.warnings.push({ location: { start: node.start, end: node.end }, message: schema.errors[0] });
                        } else {
                            jsonDocument.warnings.push({ location: { start: astRoot.start, end: astRoot.start + 1 }, message: schema.errors[0] });
                        }
                    } else {
                        jsonDocument.validate(schema.schema);
                    }
                }

                let diagnostics: LinterError[] = [];
                jsonDocument.errors.concat(jsonDocument.warnings).forEach((error, idx) => {
                    // remove duplicated messages
                    let signature = error.location.start + ' ' + error.location.end + ' ' + error.message;
                    const location = editor.getBuffer().positionForCharacterIndex(error.location.start);

                    diagnostics.push({
                        type: idx >= jsonDocument.errors.length ? "warning" : "error",
                        text: signature,
                        filePath: editor.getPath(),
                        line: location.row + 1,
                        col: location.column + 1,
                        range: new Range(error.location.start, error.location.end)
                    });
                });
                // Send the computed diagnostics to VSCode.
                return diagnostics;
            });
        }
    }
];
