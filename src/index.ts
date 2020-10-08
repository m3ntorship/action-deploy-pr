import {safeLoadAll} from 'js-yaml';
import {readFileSync, writeFileSync, accessSync, mkdirSync} from 'fs';
import {getInput, warning} from '@actions/core';
import {join, basename} from 'path';
import {sync} from 'glob';

import {compile} from 'handlebars';
import {Connection} from 'typeorm';
import {connectToDB} from './db';
import {FileMetaAndContentCompiled, FileMetaAndContentSrc, K8sResourceMetadata, Vars} from './types';
import {PR} from './entity';
import {uniqWith, isEqual, flow} from 'lodash/fp';
import {configureKubectl} from './configureKubectl';

const DEPLOYMENT_PATH = getInput('deployment_path');
const TEMP_RESOURCES_DIR = getInput('temp_resources_dir');
const PR_NUMBER = getInput('pr_number');
const PR_REPOSITORY = getInput('pr_repository');
const PR_VARS: Vars = {
	name: 'ahmed',
	project: 'nile',
	component: 'frontend',
	environment: 'dev',
	version: '6666'
};

const deploymentFilesPattern = join(DEPLOYMENT_PATH, '**');
const deploymentFiles = sync(deploymentFilesPattern, {nodir: true}).map(path => basename(path));

const ensureDistDirExists = (): void => {
	try {
		accessSync(TEMP_RESOURCES_DIR);
		warning(
			'temp resources destination directory already exists, this is a rare case, however you may need to check it. the action will proceed and overwrite any existing files with the same name'
		);
	} catch (e) {
		mkdirSync(TEMP_RESOURCES_DIR, {recursive: true});
	}
};
const getFileMetaAndContent = (fileName: string, templatesDir: string): FileMetaAndContentSrc => {
	const content = readFileSync(join(templatesDir, fileName), {encoding: 'utf-8'});

	return {
		fileName,

		srcContent: content
	};
};

const writeSingleFile = (fileMetaAndContent: FileMetaAndContentCompiled, tempResourcesDir: string): void => {
	const {fileName, compiledContent} = fileMetaAndContent;
	const fileAbsPath = join(tempResourcesDir, fileName);
	writeFileSync(fileAbsPath, compiledContent, {encoding: 'utf-8'});
};

const transformSingleFile = (vars: Vars) => (
	fileMetadataAndContent: FileMetaAndContentSrc
): FileMetaAndContentCompiled => {
	const {srcContent} = fileMetadataAndContent;
	const compiledContent = compile(srcContent, {strict: true})(vars);
	return {
		...fileMetadataAndContent,
		compiledContent
	};
};

const getResourcesMetadata = (fileMetadataAndContentCompiled: FileMetaAndContentCompiled): K8sResourceMetadata[] => {
	const {compiledContent} = fileMetadataAndContentCompiled;
	const result = safeLoadAll(compiledContent).map(({kind, metadata}): K8sResourceMetadata => ({kind, metadata}));
	return result;
};

const transformTemplatesToYamlString = (files: string[], vars: Vars): FileMetaAndContentCompiled[] => {
	const compiler = transformSingleFile(vars);
	return files.map(file => getFileMetaAndContent(file, DEPLOYMENT_PATH)).map(compiler);
};

const run = async (): Promise<void> => {
	const connection: Connection | undefined = await connectToDB();
	const resourcesMetadataAndContent = transformTemplatesToYamlString(deploymentFiles, PR_VARS);

	// ensure temp dist folder exists
	ensureDistDirExists();

	// write them to temp folder
	for (const fileMetaAndContentCompiled of resourcesMetadataAndContent) {
		writeSingleFile(fileMetaAndContentCompiled, TEMP_RESOURCES_DIR);
	}

	// get object's namespace, kind, and name to store them in cicd db

	const involvedResources = resourcesMetadataAndContent.reduce(
		(acc: K8sResourceMetadata[], fileMetaAndContentCompiled: FileMetaAndContentCompiled) => {
			return [...acc, ...getResourcesMetadata(fileMetaAndContentCompiled)];
		},
		[] as K8sResourceMetadata[]
	);

	let currentPR = await PR.findOne({number: PR_NUMBER, repository: PR_REPOSITORY});

	if (currentPR) {
		// ensure we merge and remove duplicates
		currentPR.resources = flow(uniqWith(isEqual))([...currentPR.resources, ...involvedResources]);
	} else {
		currentPR = new PR();
		currentPR.repository = PR_REPOSITORY;
		currentPR.deploymentVars = PR_VARS;
		currentPR.number = PR_NUMBER;
		currentPR.resources = involvedResources;
	}

	await currentPR.save();
	connection?.close();

	// deploy
	configureKubectl();
};
run();
