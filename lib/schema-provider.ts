import * as _ from "lodash";
var fetch: (url: string) => Promise<IResult> = require('node-fetch');
import {Observable} from "rxjs";

interface IResult {
    json<T>(): T;
    text(): string;
}

interface SchemaCatalog {
    schemas: ISchemaHeader[];
}

interface ISchemaHeader {
    name: string;
    description: string;
    fileMatch?: string[];
    url: string;
}

export interface ISchema {
    name: string;
    description: string;
    fileMatch?: string[];
    url: string;
    content: Observable<ISchemaInstance>;
}

export interface ISchemaInstance {
    $ref: string;
    enum: string[];
    properties: { [key: string]: ISchemaInstance };
    default: string;
    additionalProperties: ISchemaInstance;
    definitions: { [key: string]: ISchemaInstance };
    description: string;
    type: string | string[];
}

class Schema implements ISchema {
    public name: string;
    public description: string;
    public fileMatch: string[];
    public url: string;

    constructor(header: ISchemaHeader) {
        this.name = header.name;
        this.description = header.description;
        this.fileMatch = header.fileMatch || [];
        this.url = header.url;
    }

    private _content: Observable<ISchemaInstance>;
    public get content() {
        if (!this._content)
            this._content = Observable.fromPromise<ISchemaInstance>(fetch(this.url).then(res => res.json<ISchemaInstance>())).cache(1);
        return this._content;
    }
}

class SchemaProvider {
    private _schemas = new Map<string, ISchema>();
    private _schemasObservable: Observable<ISchema[]>;

    public constructor() {
        this._schemas.set('JSON', {
            name: 'none',
            description: 'none',
            fileMatch: [],
            url: 'none',
            content: Observable.of<ISchemaInstance>(<any>{})
        });
    }

    public get schemas() {
        if (!this._schemasObservable) {
            this._schemasObservable = this.getSchemas().cache(1);
        }
        return this._schemasObservable;
    }

    private getSchemas() {
        //http://schemastore.org/api/json/catalog.json
        return Observable.fromPromise<SchemaCatalog>(fetch('http://schemastore.org/api/json/catalog.json')
            .then(res => res.json<SchemaCatalog>()))
            .map(({ schemas }) => {
                _.each(schemas, schema => {
                    this.addSchema(schema);
                });

                var iterator = this._schemas.values();
                var result = iterator.next();
                var items: ISchema[] = [];
                while (!result.done) {
                    items.push(result.value);
                    result = iterator.next();
                }
                return items;
            });
    }

    private addSchema(header: ISchemaHeader) {
        this._schemas.set(header.name, new Schema(header));
    }

    public getSchemaForEditor(editor: Atom.TextEditor) {
        if (!editor) return Observable.of<ISchema>(<any>{ content: {} });

        if (_.has(editor, '__json__schema__')) {
            if (editor['__json__schema__']) {
                return Observable.of<ISchema>(editor['__json__schema__']);
            } else {
                return Observable.empty<ISchema>();
            }
        }

        var fileName = editor.getBuffer().getBaseName();
        return this.schemas
            .flatMap(schemas => Observable.from(schemas))
            .first(schema => _.some(schema.fileMatch, match => fileName === match), null)
            .do(schema => editor['__json__schema__'] = schema)
            .filter(z => !!z);
    }
}

export var schemaProvider = new SchemaProvider();
