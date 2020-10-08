import {getInput, error as logError} from '@actions/core';
import {writeFileSync, mkdirSync} from 'fs';
import {join} from 'path';
import {ChildProcessWithoutNullStreams, spawn} from 'child_process';

export const configureKubectl = (): void => {
	const HOME_DIR = process.env.HOME || `/home/${process.env.USER}`;
	const kubeConfigEncoded = getInput('kube_config');
	const kubeConfig = Buffer.from(kubeConfigEncoded, 'base64').toString('utf-8');
	const KUBECONFIG_PATH = join(HOME_DIR, '.kube');
	mkdirSync(KUBECONFIG_PATH, {recursive: true});
	writeFileSync(join(KUBECONFIG_PATH, 'config'), kubeConfig);

	let k8sProcess: ChildProcessWithoutNullStreams;

	try {
		k8sProcess = spawn('kubectl', ['get', 'pods']);
		k8sProcess.stdout.pipe(process.stdout);
		k8sProcess.stderr.pipe(process.stderr);
	} catch (error) {
		logError(error);
	}
};
