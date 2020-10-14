import { DeploymentVariables } from './types';

export const deploymentVariables = (
	PR: {
		number: number;
		repository: { full_name: string };
	} = { number: 0, repository: { full_name: '' } }
): DeploymentVariables => {
	// foo: { [bar: string]: string };
	return Object.entries(process.env)
		.filter(([key]) => key.startsWith('M3_'))
		.reduce(
			(acc: DeploymentVariables, current: (string | undefined)[]) => {
				// not sure how to avoid this [key = '', value = '']
				const [key = '', value = '']: (string | undefined)[] = current;
				return { ...acc, [key]: value };
			},
			{
				prnumber: PR.number || '',
				prrepo: PR.repository.full_name
			} as DeploymentVariables
		);
};
