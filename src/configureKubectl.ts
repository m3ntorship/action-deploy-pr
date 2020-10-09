import { getInput } from '@actions/core';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { DeployArguments } from './types';
import { PR } from './entity';
import { uniqWith, isEqual, flow } from 'lodash/fp';

export const configureKubectl = (): void => {
	const HOME_DIR = process.env.HOME || `/home/${process.env.USER}`;
	const kubeConfigEncoded = getInput('kube_config');
	const kubeConfig = Buffer.from(kubeConfigEncoded, 'base64').toString('utf-8');
	const KUBECONFIG_PATH = join(HOME_DIR, '.kube');
	mkdirSync(KUBECONFIG_PATH, { recursive: true });
	writeFileSync(join(KUBECONFIG_PATH, 'config'), kubeConfig);
};

export const deployPR = async (deployArgs: DeployArguments): Promise<void> => {
	const {
		resourcesMetadata,
		variables,
		variables: { prnumber, prrepo }
	} = deployArgs;

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
		currentPR.deploymentVars = variables;
		currentPR.resources = resourcesMetadata;
	}

	await currentPR.save();

	const k8sProcess: ChildProcessWithoutNullStreams = spawn('kubectl', [
		'get',
		'pods'
	]);
	k8sProcess.stdout.pipe(process.stdout);
	k8sProcess.stderr.pipe(process.stderr);
};
