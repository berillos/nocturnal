import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getOnboardingStep } from '$lib/auth-client';
import { auth } from '$lib/server/auth';
import { ResultAsync } from 'neverthrow';

export const load: LayoutServerLoad = async ({ locals, request, url }) => {
	const passkeysResult = await ResultAsync.fromPromise(
		auth.api.listPasskeys({
			headers: request.headers
		}),
		(error) => error
	);
	const onboardingStep = getOnboardingStep({
		signedIn: !!locals.user,
		hasPasskey: passkeysResult.unwrapOr([]).length > 0,
		hasWallet: false
	});
	if (url.pathname !== onboardingStep) {
		throw redirect(302, onboardingStep);
	}
};
