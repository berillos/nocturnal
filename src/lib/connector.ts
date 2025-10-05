import { os } from '@orpc/server';

const base = os.$context<{}>();

export const router = {
	mina_accounts: base.handler(() => ['xd'])
};
