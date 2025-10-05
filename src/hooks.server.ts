import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { db } from '$lib/server/db';

export async function handle({ event, resolve }) {
	event.locals.db = db;
	const session = await auth.api.getSession({
		headers: event.request.headers
	});
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
}
