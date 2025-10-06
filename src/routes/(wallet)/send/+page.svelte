<script lang="ts">
	import WalletHeader from '$lib/components/wallet-header.svelte';
	import * as Ox from 'ox';
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-zod';
	import { theme } from 'mode-watcher';
	import { z } from 'zod';
	import { fly } from 'svelte/transition';
	import { apiOrpc } from '$lib/orpc-client';
	import { exportFromCose, toPlainP256 } from '$lib/crypto';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const SendSchema = z.object({
		to: z.string(),
		sendMode: z.enum(['token', 'nft']).default('token'),
		token: z.string().nullable(),
		amount: z.coerce.number().min(0)
	});

	const {
		form,
		data: formData,
		setData
	} = createForm<z.infer<typeof SendSchema>>({
		extend: validator({ schema: SendSchema }),
		initialValues: {
			sendMode: 'token',
			amount: 0
		},
		async onSubmit(values) {
			console.log(values);
		}
	});

	async function buildTestPayload() {
		// TODO: Change it to current wallet passkey mapping.
		const currentPasskey = data.passkeys[0];
		const publicKeyRaw = await exportFromCose(Ox.Base64.toBytes(currentPasskey.publicKey));
		const publicKey = Ox.PublicKey.from(publicKeyRaw);
		console.log('>>>PUBKEY', publicKey, Ox.PublicKey.toHex(publicKey));
		const challenge = await apiOrpc.wallet.buildPayload({ nonce: 0, expirySlot: 20 });
		console.log('>>>CHALLENGE', challenge);
		const signature = await Ox.WebAuthnP256.sign({
			challenge
		});
		const plainP256 = toPlainP256({
			challenge,
			signature: signature.signature,
			metadata: signature.metadata
		});
		console.log('>>>PAYLOAD', plainP256!.payload, Ox.Hex.fromBytes(plainP256!.payload));
		console.log('>>>SIGNATURE', plainP256!.signature, Ox.Signature.toHex(plainP256!.signature));
	}
</script>

<svelte:head>
	<title>Send - Berillos</title>
</svelte:head>

<WalletHeader title="Send" />

<div class="mt-16 flex flex-col items-center">
	<form use:form class="flex w-120 flex-col gap-8">
		<label
			class="validator input input-lg w-full border-base-300 font-semibold focus-within:outline-none"
		>
			<span class="font-semibold">To</span>
			<input type="text" name="to" placeholder="Recipient Address" />
			<button class="btn btn-sm btn-primary">Paste</button>
		</label>
		{#if $formData.to && !$formData.token}
			<div class="tabs-lift tabs w-full" in:fly out:fly={{ duration: 0 }}>
				<label class="tab font-semibold">
					<input type="radio" name="sendMode" value="token" />
					Tokens
				</label>
				<div class="tab-content border-base-300 bg-base-100 p-4">
					<div class="flex flex-col">
						<button
							class="btn justify-start gap-2 bg-base-100 p-2"
							onclick={() => setData({ ...$formData, token: 'mina' })}
						>
							{#if theme.current === 'dark'}
								<img src="/mina-icon.svg" class="h-8 w-8 invert" />
							{:else}
								<img src="/mina-icon.svg" class="h-8 w-8" />
							{/if}
							<span class="flex-1 text-left">Mina</span>
							<span>432.56</span>
						</button>
					</div>
				</div>
				<label class="tab font-semibold">
					<input type="radio" name="sendMode" value="nft" />
					Collectibles
				</label>
				<div class="tab-content border-base-300 bg-base-100 p-4">No collectibles found.</div>
			</div>
		{/if}
		{#if $formData.to && $formData.token}
			<label
				class="validator input input-lg w-full border-base-300 px-4 focus-within:outline-none"
				transition:fly
			>
				<button class="btn btn-sm" onclick={() => setData({ ...$formData, token: null })}
					>Mina</button
				>
				<input class="text-center text-3xl font-semibold" type="number" placeholder="0.00" />
				<button class="btn btn-sm">Max</button>
			</label>
			<button class="btn btn-lg btn-primary">Next</button>
		{/if}
	</form>
	<button class="btn" onclick={buildTestPayload}>TODO: Remove it</button>
</div>
