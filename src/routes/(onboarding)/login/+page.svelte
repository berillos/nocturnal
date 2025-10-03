<script lang="ts">
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-zod';
	import { z } from 'zod';
	import { MailIcon, RectangleEllipsisIcon } from 'lucide-svelte';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { match } from 'ts-pattern';

	type FormMode = 'login' | 'verify';

	const LoginSchema = z.object({
		email: z.email()
	});
	const VerifySchema = LoginSchema.extend({
		otp: z.string().min(6).max(6)
	});

	let formMode = $state<FormMode>('login');
	const FormSchema = $derived(formMode === 'login' ? LoginSchema : VerifySchema);

	function setFormMode(mode: FormMode) {
		formMode = mode;
	}

	const { form } = $derived(
		createForm({
			extend: validator({ schema: FormSchema }),
			async onSubmit(values) {
				return match({ formMode, values })
					.with(
						{ formMode: 'login' },
						async ({ values }: { values: z.infer<typeof LoginSchema> }) => {
							const { error } = await authClient.emailOtp.sendVerificationOtp({
								email: values.email,
								type: 'sign-in'
							});
							if (error) {
								return toast.error(error?.message ?? 'Authentication Error');
							}
							return setFormMode('verify');
						}
					)
					.with(
						{ formMode: 'verify' },
						async ({ values }: { values: z.infer<typeof VerifySchema> }) => {
							const { data, error } = await authClient.signIn.emailOtp({
								email: values.email,
								otp: values.otp
							});
							if (error) {
								return toast.error(error?.message ?? 'Authentication Error');
							}
							return goto('/passkey');
						}
					)
					.exhaustive();
			}
		})
	);
</script>

<progress class="progress w-full progress-primary" value="0" max="100"></progress>

<h2 class="card-title">Sign in with your email</h2>

<p>Fill in your email and a one time password will be sent to your address.</p>

<form use:form class="flex flex-col gap-4">
	<label class="validator input input-lg w-full">
		<MailIcon size={20} />
		<input name="email" type="email" required placeholder="Email Address" />
	</label>

	{#if formMode === 'verify'}
		<label class="validator input input-lg w-full">
			<RectangleEllipsisIcon size={20} />
			<input name="otp" required placeholder="123456" />
		</label>
	{/if}

	<button class="btn w-full btn-lg btn-primary" type="submit"
		>{formMode === 'login' ? 'Sign In' : 'Verify OTP'}</button
	>

	<p class="text-sm text-base-content/50">
		By clicking sign in you agree to the Privacy Policy and Terms of Service.
	</p>
</form>
