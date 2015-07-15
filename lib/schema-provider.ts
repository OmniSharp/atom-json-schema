import * as _ from "lodash";
var fetch: (url: string) => Rx.IPromise<IResult> = require('node-fetch');
import {Observable} from "rx";

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
    content: Rx.Observable<ISchemaInstance>;
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

    private _content: Rx.Observable<ISchemaInstance>;
    public get content() {
        if (!this._content)
            this._content = Observable.fromPromise<ISchemaInstance>(fetch(this.url).then(res => res.json<ISchemaInstance>())).shareReplay(1);
        return this._content;
    }
}

class SchemaProvider {
    private _schemas = new Map<string, ISchema>();
    private _schemasObservable: Rx.Observable<ISchema[]>;

    public constructor() {
        this._schemas.set('JSON', {
            name: 'none',
            description: 'none',
            fileMatch: [],
            url: 'none',
            content: Observable.just<ISchemaInstance>(<any>{})
        });
    }

    public get schemas() {
        if (!this._schemasObservable) {
            this._schemasObservable = this.getSchemas().shareReplay(1);
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
        if (!editor) return Observable.just<ISchema>(<any>{ content: {} });

        if (editor['__json__schema__']) return Observable.just<ISchema>(editor['__json__schema__']);

        var fileName = editor.getBuffer().getBaseName();
        return this.schemas
            .flatMap(schemas => Observable.from(schemas))
            .firstOrDefault(schema => _.any(schema.fileMatch, match => fileName === match), <any>{ content: {} })
            .tapOnNext(schema => editor['__json__schema__'] = schema);
    }
}

export var schemaProvider = new SchemaProvider();

/*
pos = locations[0]
        scopes = view.scope_name(pos).split()
        if "source.json" not in scopes:
            return []
        else:
            doc = view.substr(sublime.Region(0,view.size()))

            whitespaces = 0;
            for index, char in enumerate(doc[0:pos]):
                if char == '\n' or char == '\r' or char == ' ' or char == '\t':
                    whitespaces += 1

            doc = doc.replace('\n', '').replace('\r','').replace(' ', '').replace('\t', '')
            pos = pos - whitespaces

            depth = -1
            tokens = []
            token_regex = re.compile(r'"([-a-zA-Z0-9+]+)":{')

            for index, char in enumerate(doc):
                if char == '{':
                    depth += 1
                    token_regex = r'"([-a-zA-Z0-9+]+)":{$'
                    match = re.search(token_regex, doc[0:index+1])
                    try:
                        tokens.append(match.group(1))
                    except AttributeError as e:
                        pass
                if char == '}':
                    depth -= 1
                    try:
                        tokens.pop()
                    except IndexError as e:
                        pass
                if index==pos:
                    if (depth == 1 and tokens[0] == 'dependencies'):
                        # Version number
                        version_regex = r'(?:,|{|\[])"([-a-zA-Z0-9.*]+)":"[-a-zA-Z0-9.*]*$'
                        try:
                            package_name = re.search(version_regex, doc[0:index]).group(1)
                            return (self.result[package_name], AC_OPTS)
                        except AttributeError as e:
                            pass
                        except KeyError as e:
                            # TODO: Not in cache. Make HTTP request to feth completions on that package
                            return AC_OPTS
                        # Package name
                        return (self.cache, AC_OPTS)
                    elif depth == 0:
                        # In future, get completions dynamically from http://schemastore.org/schemas/json/project
                        # Replace word completions with snippets
                        return ([('version', 'version" : "$1"'),
                                    ('dependencies', 'dependencies" : {\n\t"$1": "$2"\n}'),
                                    ('commands', 'commands" : {\n\t"$1": "$2"\n}'),
                                    ('configurations', 'configurations" : {\n\t"$1": {}\n}'),
                                    ('compilationOptions', 'compilationOptions'),
                                    ('frameworks', 'frameworks" : {\n\t"$1": "$2"\n}'),
                                    ('description', 'description" : "$1"'),
                                    ('authors', 'authors" : [\n\t"$1"\n]'),
                                    ('code', 'code" : {\n\t"$1": "$2"\n}'),
                                    ('shared', 'shared" : {\n\t"$1": "$2"\n}'),
                                    ('exclude', 'exclude" : {\n\t"$1": "$2"\n}'),
                                    ('preprocess', 'preprocess" : {\n\t"$1": "$2"\n}'),
                                    ('resources', 'resources')
                                ], AC_OPTS)
                    else:
                        break

            return AC_OPTS
*/
