import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { ResultAsync } from 'neverthrow';

export const load: LayoutServerLoad = async ({ request }) => {
	const passkeysResult = await ResultAsync.fromPromise(
		auth.api.listPasskeys({
			headers: request.headers
		}),
		(error) => error
	);
	return {
		passkeys: passkeysResult.unwrapOr([])
	};
};
