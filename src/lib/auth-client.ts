import { createAuthClient } from 'better-auth/svelte';
import { passkeyClient, emailOTPClient } from 'better-auth/client/plugins';
import { match } from 'ts-pattern';

export const authClient = createAuthClient({
	plugins: [passkeyClient(), emailOTPClient()]
});

// User signed in, has passkey, has wallet -> redirect to dashboard
// User signed in, has passkey, no wallet -> deploy wallet
// User signed in, no passkey -> register passkey
// User not signed in -> login page
export function getOnboardingStep(state: {
	signedIn: boolean;
	hasPasskey: boolean;
	hasWallet: boolean;
}) {
	return match(state)
		.with({ signedIn: true, hasPasskey: true, hasWallet: true }, () => '/dashboard')
		.with({ signedIn: true, hasPasskey: true, hasWallet: false }, () => '/deploy')
		.with({ signedIn: true, hasPasskey: false, hasWallet: false }, () => '/deploy')
		.otherwise(() => '/login');
}
