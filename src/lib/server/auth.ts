import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestEvent } from '$app/server';
import { db } from './db';

export const auth = betterAuth({
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
