import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestEvent } from '$app/server';
import { db } from './db';
import { PRIVATE_BETTER_AUTH_SECRET } from '$env/static/private';
import { PUBLIC_API_URL } from '$env/static/public';

export const auth = betterAuth({
	secret: PRIVATE_BETTER_AUTH_SECRET,
	baseURL: PUBLIC_API_URL,
	database: drizzleAdapter(db, {
		provider: 'sqlite'
	}),
	plugins: [
		passkey(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (type === 'sign-in') {
					console.log('>>>OTP', email, otp);
				}
			}
		}),
		sveltekitCookies(getRequestEvent)
	]
});
