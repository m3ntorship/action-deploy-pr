import {Connection, ConnectionOptions, createConnection, getConnectionOptions} from 'typeorm';

import {getInput, error, info} from '@actions/core';

export const connectToDB = async (): Promise<Connection | undefined> => {
	const port = getInput('port') ? `:${getInput('port')}` : '';
	const schema = getInput('srv') ? 'mongodb+srv' : 'mongodb';
	const host = getInput('host');
	const db = getInput('database');
	const username = getInput('username');
	const password = getInput('password');
	const options = '?retryWrites=true&w=majority';
	const url = `${schema}://${username}:${password}@${host}${port}/${db}${options}`;
	const type = getInput('type');

	const DYNAMIC_OPTIONS = {
		type,
		url
	};

	const pr_number = getInput('pr_number');
	if (!pr_number) {
		throw new Error('no PR number provided!');
	}

	try {
		info('starting db connection');
		const connectionOptions: ConnectionOptions = await getConnectionOptions();
		return createConnection(Object.assign(connectionOptions, DYNAMIC_OPTIONS));
	} catch (e) {
		error(e);
	}
};
