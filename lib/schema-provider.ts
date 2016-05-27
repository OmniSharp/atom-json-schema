import * as _ from "lodash";
import {Observable} from "rxjs";
import {IJSONSchema} from './vscode/plugin/jsonSchema';
import {JSONSchemaService, ISchemaAssociations} from './vscode/plugin/jsonSchemaService';
import {parse as parseJSON, ObjectASTNode, JSONDocument} from './vscode/plugin/jsonParser';

