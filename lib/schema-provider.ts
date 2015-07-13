import * as _ from "lodash";
var fetch: (url: string) => Promise<IResult> = require('node-fetch');


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

class Schema implements ISchemaHeader {
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

    private _content: Promise<any>;
    public get content() {
        if (this._content)
            return this._content;

        this._content = fetch(this.url).then(res => res.json<any>());
    }
}

class SchemaProvider {
    private _schemas: { [key: string]: Schema } = {};

    constructor() {
        this.getSchemas();
    }

    private getSchemas() {
        //http://schemastore.org/api/json/catalog.json
        return fetch('http://schemastore.org/api/json/catalog.json')
            .then(res => res.json<SchemaCatalog>())
            .then(({ schemas }) => {
                _.each(schemas, schema => {
                    this.addSchema(schema);
                });

                return this._schemas;
            });
    }

    private addSchema(header: ISchemaHeader) {
        this._schemas[header.name] = new Schema(header);
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
