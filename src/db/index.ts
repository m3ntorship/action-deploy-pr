import {Connection, createConnection} from 'typeorm';
import {PR} from '../entity/PR';
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
	const type = 'mongodb';

	const pr_number = getInput('pr_number');
	if (!pr_number) {
		throw new Error('no PR number provided!');
	}

	try {
		info('starting db connection');
		return createConnection({
			url,
			type,
			synchronize: true,
			logging: false,
			useUnifiedTopology: true,
			entities: [PR]
		});
	} catch (e) {
		error(e);
	}
};
