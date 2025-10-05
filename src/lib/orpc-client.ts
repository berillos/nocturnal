import { PUBLIC_API_URL, PUBLIC_RUNNER_URL } from '$env/static/public';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { router as apiRouter } from './server/routers';
import type { router as runnerRouter } from './server/runner/router';

export const apiLink = new RPCLink({
	url: PUBLIC_API_URL + '/rpc'
});

export const runnerLink = new RPCLink({
	url: PUBLIC_RUNNER_URL + '/rpc'
});

export const apiOrpc: RouterClient<typeof apiRouter> = createORPCClient(apiLink);

export const runnerOrpc: RouterClient<typeof runnerRouter> = createORPCClient(runnerLink);
