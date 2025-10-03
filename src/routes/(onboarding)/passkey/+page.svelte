<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { ArrowLeftIcon, FingerprintIcon } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let waitingForPasskey = $state<boolean>(false);

	async function registerPasskey() {
		waitingForPasskey = true;
		try {
			const result = await authClient.passkey.addPasskey({
				authenticatorAttachment: 'cross-platform'
			});
			if (result?.error) {
				return toast.error(result.error.message ?? 'Passkey Error');
			}
			waitingForPasskey = false;
			return goto('/deploy');
		} catch (error) {
			waitingForPasskey = false;
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('An unknown error occurred');
			}
		}
	}

	async function startOver() {
		await authClient.signOut();
		await goto('/login');
	}
</script>

{#if waitingForPasskey}
	<progress class="progress w-full progress-primary"></progress>
{:else}
	<progress class="progress w-full progress-primary" value="40" max="100"></progress>
{/if}

<h2 class="card-title">Register Passkey</h2>

<p>
	Your wallet will not rely on private keys. Instead, we use passkeys to securely authenticate
	users.
</p>

<p>
	Need help? <a href="https://google.com" target="_blank" rel="noopener noreferrer" class="link"
		>Read our Passkey guide</a
	>.
</p>

<button class="btn btn-lg btn-primary" onclick={registerPasskey} disabled={waitingForPasskey}>
	{#if waitingForPasskey}
		<span class="loading loading-lg loading-dots"></span>
		<span>Registering Passkey...</span>
	{:else}
		<FingerprintIcon size={20} />
		<span>Register Passkey</span>
	{/if}
</button>

<button class="btn btn-ghost btn-lg" onclick={startOver}>
	<ArrowLeftIcon size={20} />
	<span>Start Over</span>
</button>
