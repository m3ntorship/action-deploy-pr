import 'reflect-metadata';

import {getInput, error} from '@actions/core';
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
		const pr = new PR();
		pr.number = parseInt(pr_number);
		await pr.save();
		if (connection) {
			connection.close();
		}
	} catch (e) {
		error(e);
	}
};

run();
