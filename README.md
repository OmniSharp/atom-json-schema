# Json Schema

Adds support for [JSON Schema](http://json-schema.org/) in [Atom](http://atom.io).

![](https://raw.githubusercontent.com/OmniSharp/atom-json-schema/master/schema.gif)


![](https://raw.githubusercontent.com/OmniSharp/atom-json-schema/master/schema2.gif)

## Whats it do
Using is-my-json-valid for schema validation, Json Schema warns the user if their json file doesn't match the commonly defined schema.  Also using the defined Json Schema we can offer auto completion results for enum values.

## Extentions
Json Schema was built for use with [OmniSharp](http://www.omnisharp.net/).  There is an extension point that lets you plug in custom intellisense providers.  This is to help with tools like Npm or NuGet, where package.json and project.json
both have their package references.  This this extension point you can plug in calls off to the associated webservice / localcache / whatever you want.

## Npm support
As stated above, NPM support is added out of the box.  Search is limited to `starts with` (if anyone knows how to fuzzy search against skimdb log an issue!).  We can add the package for you, as well as the latest version as values.

## Bower support
Bower support is planned, I still have to figure out the best way to find version numbers (or if its even possible since bower uses git...).


# Make your own schema provider
The schema interface is declared in typescript as follows:

```
interface IAutocompleteProvider {
    fileMatchs: string[];
    pathMatch: (path: string) => boolean;
    getSuggestions: (options: IAutocompleteProviderOptions) => Promise<Suggestion[]>;
    dispose(): void;
}

interface IAutocompleteProviderOptions {
    editor: Atom.TextEditor;
    bufferPosition: TextBuffer.Point; // the position of the cursor
    prefix: string;
    scopeDescriptor: { scopes: string[] };
    activatedManually: boolean;
    path: string;
}
```

* fileMatchs
  are the files that the provider applies to
* pathMatch
  is a callback method that lets you determine.  The path that is give is based on where the user has their cursor in the file.
* getSuggestions
  identical to autocomplete+ with a few extra options.
  * path
    is the path part of the file such as `dependencies` or `dependencies.lodash`

Then in your `package.json` add...

```
"jsonschema.provider": {
  "versions": {
    "0.1.0": "consumeProvider"
  }
}
```


# TODO
* Bower support?
* JSPM support?
* Allow for custom $schema's
