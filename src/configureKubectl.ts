import { getInput, info } from '@actions/core';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import {
	DeployArguments,
	DeploymentVariables,
	K8sResourceMetadata
} from './types';
import { PR } from './entity';
import { uniqWith, isEqual, flow } from 'lodash/fp';
import { Connection } from 'typeorm';
import { connectToDB } from './db';

const TEMP_RESOURCES_DIR = getInput('temp_resources_dir');
const tempDir = join(TEMP_RESOURCES_DIR);
export const configureKubectl = (): void => {
	const HOME_DIR = process.env.HOME || `/home/${process.env.USER}`;
	const kubeConfigEncoded = getInput('kube_config');
	const kubeConfig = Buffer.from(kubeConfigEncoded, 'base64').toString('utf-8');
	const KUBECONFIG_PATH = join(HOME_DIR, '.kube');
	mkdirSync(KUBECONFIG_PATH, { recursive: true });
	writeFileSync(join(KUBECONFIG_PATH, 'config'), kubeConfig);
};

const getResourcesIdentifiers = (
	resources: K8sResourceMetadata[]
): string[] => {
	return resources.map((resource: K8sResourceMetadata) => {
		return `${resource.kind}/${resource.metadata.name}`;
	});
};

export const deployPR = async (deployArgs: DeployArguments): Promise<void> => {
	const {
		resourcesMetadata,
		deploymentVars,
		deploymentVars: { prnumber, prrepo }
	} = deployArgs;
	const connection: Connection | undefined = await connectToDB();
	let currentPR = await PR.findOne({
		where: {
			'deploymentVars.prrepo': prrepo,
			'deploymentVars.prnumber': prnumber
		}
	});

	if (currentPR) {
		// ensure we merge and remove duplicates
		currentPR.resources = flow(uniqWith(isEqual))([
			...currentPR.resources,
			...resourcesMetadata
		]);
		currentPR.updated_at = new Date();
	} else {
		currentPR = new PR();
		currentPR.created_at = new Date();
		currentPR.deploymentVars = deploymentVars;
		currentPR.resources = resourcesMetadata;
	}

	const k8sProcess: ChildProcessWithoutNullStreams = spawn('kubectl', [
		'apply',
		'-f',
		tempDir
	]);
	k8sProcess.stdout.pipe(process.stdout);
	k8sProcess.stderr.pipe(process.stderr);

	k8sProcess.on('exit', async () => {
		await currentPR?.save();
		await connection?.close();
	});
};

export const undeployPR = async (
	deploymentVars: DeploymentVariables
): Promise<void> => {
	const connection: Connection | undefined = await connectToDB();

	const currentPR = await PR.findOne({
		where: {
			'deploymentVars.prrepo': deploymentVars.prrepo,
			'deploymentVars.prnumber': deploymentVars.prnumber,
			undeployed: false
		}
	});

	if (currentPR) {
		const resourcesToBeDeleted = getResourcesIdentifiers(currentPR.resources);
		currentPR.updated_at = new Date();
		currentPR.undeployed = true;
		const k8sProcess: ChildProcessWithoutNullStreams = spawn('kubectl', [
			'delete',
			...resourcesToBeDeleted,
			'--ignore-not-found'
		]);
		k8sProcess.stdout.pipe(process.stdout);
		k8sProcess.stderr.pipe(process.stderr);

		k8sProcess.on('exit', async () => {
			await currentPR?.save();
			await connection?.close();
		});
	} else {
		info('this PR is not stored in the db, so no further action');
	}
};
