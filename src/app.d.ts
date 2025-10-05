import type { Database } from '$lib/server/db';
import type { Session, User } from 'better-auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: Database;
			user?: User | undefined;
			session?: Session | undefined;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
