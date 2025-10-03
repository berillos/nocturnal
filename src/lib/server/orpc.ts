import { os } from '@orpc/server';
import type { db } from './db';
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
		db: typeof db;
		user?: User | undefined;
		session?: Session | undefined;
	}>();
