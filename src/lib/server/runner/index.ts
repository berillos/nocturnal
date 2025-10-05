import { RPCHandler } from '@orpc/server/fetch';
import { router } from './router';
import { queue, worker } from './worker';
import { db } from '../db';
import { z } from 'zod';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const env = z
	.object({
		PRIVATE_FEEPAYER_PRIVATE_KEY: z.string()
	})
	.parse(process.env);

const handler = new RPCHandler(router);

export async function fetch(request: Request) {
	if (request.method === 'OPTIONS') {
		const res = new Response('Departed', { headers: CORS_HEADERS });
		return res;
	}

	const { matched, response } = await handler.handle(request, {
		prefix: '/rpc',
		context: { db, queue, worker, env }
	});

	if (matched) {
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		return response;
	}

	return new Response('Not found', {
		status: 404,
		headers: CORS_HEADERS
	});
}
