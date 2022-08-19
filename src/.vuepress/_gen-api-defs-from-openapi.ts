import * as fs from 'fs';
import { App, createPage, Page } from '@vuepress/core';
import glob from 'glob';
import JSON5 from 'json5';
const merge = require('deepmerge')
var getDirName = require('path').dirname;

const combineMerge = (target, source, options) => {
	const destination = target.slice()

	source.forEach((item, index) => {
		if (typeof destination[index] === 'undefined') {
			destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
		} else if (options.isMergeableObject(item)) {
			destination[index] = merge(target[index], item, options)
		} else if (target.indexOf(item) === -1) {
			destination.push(item)
		}
	})
	return destination
}

const openApiDefinition = JSON.parse(fs.readFileSync(__dirname + '/api.json', 'utf8'));
const endpointPaths = Object.keys(openApiDefinition.paths);
const endpointTags = Array.from(new Set(Object.values(openApiDefinition.paths).flatMap(x => x.post.tags ?? [])));

function writeFile(path, contents, cb) {
  fs.mkdir(getDirName(path), { recursive: true}, function (err) {
    fs.writeFileSync(path, contents);
  });
}

export async function generateEndpointPages(app: App) {
	for (const endpointPath of endpointPaths) {
		const name = endpointPath.substring(1);
		const def = openApiDefinition.paths[endpointPath]['post'];
		const requireCredential = def.security?.length > 0;
		const data = {
			summary: '',
			description: '',
			tags: def.tags,
			requireCredential,
			req: def.requestBody.content['application/json']?.schema ?? {},
			res: def.responses['200']?.content['application/json'].schema ?? {},
		};

		writeFile(__dirname + `/_api_/${name}.json5`, JSON5.stringify(data, null, '\t'), 'utf8');
	}
}
