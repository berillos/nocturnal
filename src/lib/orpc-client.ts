import { PUBLIC_API_URL } from '$env/static/public';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { router } from './server/routers';

export const link = new RPCLink({
	url: PUBLIC_API_URL
});

export const orpc: RouterClient<typeof router> = createORPCClient(link);
