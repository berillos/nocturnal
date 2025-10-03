<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { ArrowLeftIcon, SignatureIcon } from 'lucide-svelte';

	let deployingWallet = $state<boolean>(false);

	async function deployWallet() {
		// TODO: Implement wallet deployment logic
		deployingWallet = true;
		await new Promise((resolve) => setTimeout(resolve, 2000));
		deployingWallet = false;
		// return goto('/dashboard');
	}

	async function startOver() {
		await authClient.signOut();
		await goto('/login');
	}
</script>

{#if deployingWallet}
	<progress class="progress w-full progress-primary"></progress>
{:else}
	<progress class="progress w-full progress-primary" value="80" max="100"></progress>
{/if}

<h2 class="card-title">Deploy your wallet</h2>

<p>
	This is the last step before you can start using your wallet. We need you to sign the deployment
	intent and wait a minute for your wallet to be ready to use.
</p>

<button class="btn btn-lg btn-primary" onclick={deployWallet} disabled={deployingWallet}>
	{#if deployingWallet}
		<span class="loading loading-lg loading-dots"></span>
		<span>Deploying...</span>
	{:else}
		<SignatureIcon size={20} />
		<span>Deploy Wallet</span>
	{/if}
</button>

<button class="btn btn-ghost btn-lg" onclick={startOver}>
	<ArrowLeftIcon size={20} />
	<span>Start Over</span>
</button>
