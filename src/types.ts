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
	[x: string]: string;
}
