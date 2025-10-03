import type { RequestHandler } from '@sveltejs/kit';
import { RPCHandler } from '@orpc/server/fetch';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { router } from '$lib/server/routers';

const handler = new RPCHandler(router);

const handle: RequestHandler = async ({ request }) => {
	const authSession = await auth.api.getSession({ headers: request.headers });
	const { response } = await handler.handle(request, {
		prefix: '/rpc',
		context: { db, user: authSession?.user, session: authSession?.session }
	});

	return response ?? new Response('Not Found', { status: 404 });
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
