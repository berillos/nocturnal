<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { ArrowLeftIcon, FingerprintIcon } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import * as Ox from 'ox';
	import { exportFromCose } from '$lib/crypto';
	import { runnerOrpc } from '$lib/orpc-client';

	let { data }: PageProps = $props();

	type ViewState = 'idle' | 'waitingForPasskey' | 'waitingForDeployment';

	let viewState = $state<ViewState>(data.passkeys.length === 0 ? 'idle' : 'waitingForDeployment');

	async function registerPasskey() {
		viewState = 'waitingForPasskey';
		try {
			const result = await authClient.passkey.addPasskey({
				authenticatorAttachment: 'cross-platform'
			});
			if (result?.error) {
				return toast.error(result.error.message ?? 'Passkey Error');
			}
			return goto('/deploy');
		} catch (error) {
			viewState = 'idle';
			if (error instanceof Error) {
				return toast.error(error.message);
			}
			toast.error('An unknown error occurred');
		}
	}

	async function deployWallet() {
		viewState = 'waitingForDeployment';
		const passkey = data.passkeys[0];
		if (!passkey) {
			return toast.error('Passkey not found');
		}
		const publicKeyRaw = await exportFromCose(Ox.Base64.toBytes(passkey.publicKey));
		const publicKey = Ox.PublicKey.from(publicKeyRaw);
		const publicKeyHex = Ox.PublicKey.toHex(publicKey);
		const asyncResult = await runnerOrpc.wallet.deploy({
			passkeyId: passkey.id,
			publicKey: publicKeyHex
		});
		for await (const status of asyncResult) {
			console.log('>>>P', status);
		}
	}

	async function startOver() {
		await authClient.signOut();
		await goto('/login');
	}

	onMount(() => {
		console.log(data.existingWallet);
		if (viewState === 'waitingForDeployment' && !data.existingWallet) {
			deployWallet();
		}
	});
</script>

{#if ['waitingForPasskey', 'waitingForDeployment'].includes(viewState)}
	<progress class="progress w-full progress-primary"></progress>
{:else}
	<progress class="progress w-full progress-primary" value="40" max="100"></progress>
{/if}

{#if viewState === 'idle'}
	<h2 class="card-title">Register Passkey</h2>
{:else if viewState === 'waitingForPasskey'}
	<h2 class="card-title">Waiting for Passkey</h2>
{:else if viewState === 'waitingForDeployment'}
	<h2 class="card-title">Waiting for Deployment</h2>
{/if}

<p>
	Your wallet will not rely on private keys. Instead, we use passkeys to securely authenticate
	users.
</p>

<p>
	Need help? <a href="https://google.com" target="_blank" rel="noopener noreferrer" class="link"
		>Read our Passkey guide</a
	>.
</p>

<button class="btn btn-lg btn-primary" onclick={registerPasskey} disabled={viewState !== 'idle'}>
	{#if viewState === 'waitingForPasskey'}
		<span class="loading loading-lg loading-dots"></span>
		<span>Registering Passkey...</span>
	{:else if viewState === 'waitingForDeployment'}
		<span class="loading loading-lg loading-dots"></span>
		<span>Deploying Wallet...</span>
	{:else}
		<FingerprintIcon size={20} />
		<span>Register Passkey</span>
	{/if}
</button>

<button
	class="btn btn-ghost btn-lg"
	onclick={startOver}
	disabled={viewState === 'waitingForDeployment'}
>
	<ArrowLeftIcon size={20} />
	<span>Start Over</span>
</button>
