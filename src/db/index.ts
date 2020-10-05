import {Connection, createConnection} from 'typeorm';
import {PR} from '../entity';
import {getInput, error, info} from '@actions/core';

export const connectToDB = async (): Promise<Connection | undefined> => {
	const url = getInput('connection_string');
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
			synchronize: false,
			logging: true,
			useUnifiedTopology: true,
			useNewUrlParser: true,
			entities: [PR]
		});
	} catch (e) {
		error(e);
	}
};
