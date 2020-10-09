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

export enum PR_ACTIONS {
	DEPLOY = 'DEPLOY',
	UNDEPLOY = 'UNDEPLOY'
}

export interface DeployArguments {
	resourcesMetadata: K8sResourceMetadata[];
	variables: Vars;
}
