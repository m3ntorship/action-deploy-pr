import 'reflect-metadata';

import {getInput, error, info} from '@actions/core';
import {PR} from './entity/PR';
import {connectToDB} from './db';
import {Connection} from 'typeorm';

const run = async (): Promise<void> => {
	const connection: Connection | undefined = await connectToDB();
	const pr_number = getInput('pr_number');
	if (!pr_number) {
		throw new Error('no PR number provided!');
	}

	try {
		info('creatiing new PR object!');
		const pr = new PR();
		pr.number = pr_number;
		info('about to save the PR object!');
		await pr.save();
		info('saved PR object');
		if (connection) {
			info('about to close the connection!');
			connection.close();
			info('closed the connection');
		}
	} catch (e) {
		error(e);
	}
};

run();
