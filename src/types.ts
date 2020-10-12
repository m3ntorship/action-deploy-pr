export interface FileMetaAndContentSrc {
	fileName: string;
	srcContent: string;
}

export interface FileMetaAndContentCompiled extends FileMetaAndContentSrc {
	compiledContent: string;
}

export interface K8sResourceMetadata {
	kind: string;
	metadata: {
		name: string;
		labels: {
			[label: string]: string;
		};
	};
}

export interface Vars {
	project: string;
	component: string;
	environment: string;
	version: string;
	prnumber: string;
	prrepo: string;
}

export interface DeploymentVariables {
	prnumber: number;
	prrepo: string;
}

export enum DEPLOY_PR_TYPES {
	open,
	reopened,
	synchronize
}
export enum UNDEPLOY_PR_TYPES {
	closed
}

export interface DeployArguments {
	resourcesMetadata: K8sResourceMetadata[];
	deploymentVars: DeploymentVariables;
}
