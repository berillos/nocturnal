import { os } from '@orpc/server';
import type { Database } from './db';
import type { Session, User } from 'better-auth';

export const base = os
	.errors({
		BAD_REQUEST: {},
		UNAUTHORIZED: {},
		NOT_FOUND: {},
		INTERNAL_SERVER_ERROR: {},
		FORBIDDEN: {}
	})
	.$context<{
		db: Database;
		user?: User | undefined;
		session?: Session | undefined;
	}>();
