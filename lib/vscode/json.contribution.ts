/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

//import ConfigurationRegistry from 'vs/platform/configuration/common/configurationRegistry';
//import Platform from 'vs/platform/platform';
//import {ModesRegistry} from 'vs/editor/common/modes/modesRegistry';

/*
ModesRegistry.registerCompatMode({
    id: 'json',
    extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json'],
    moduleId: '../json',
    ctorName: 'JSONMode'
});

var configurationRegistry = <ConfigurationRegistry.IConfigurationRegistry>Platform.Registry.as(ConfigurationRegistry.Extensions.Configuration);
configurationRegistry.registerConfiguration({
    'id': 'json',
    'order': 20,
    'type': 'object',
    'title': "JSON configuration",
    'properties' : {
        'json.schemas' : {
            'type': 'array',
            'description': "Associate schemas to JSON files in the current project",
            'items': {
                'type': 'object',
                'defaultSnippets': [{ body: { fileMatch: [ '{{/myfile}}' ], url: '{{schemaURL}}' } }],
                'properties': {
                    'url': {
                        'type': 'string',
                        'default': '/user.schema.json',
                        'description': "A URL to a schema or a relative path to a schema in the current directory",
                    },
                    'fileMatch': {
                        'type': 'array',
                        'items': {
                            'type': 'string',
                            'default': 'MyFile.json',
                            'description': "A file pattern that can contain '*' to match against when resolving JSON files to schemas.",
                        },
                        'minItems': 1,
                        'description': "An array of file patterns to match against when resolving JSON files to schemas.",
                    },
                    'schema': {
                        'type': 'object',
                        'description': "The schema definition for the given URL. The schema only needs to be provided to avoid accesses to the schema URL.",
                    },
                }
            }
        }
    }
});
*/
