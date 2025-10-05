<script lang="ts">
	import WalletHeader from '$lib/components/wallet-header.svelte';
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-zod';
	import { theme } from 'mode-watcher';
	import { z } from 'zod';
	import { fly } from 'svelte/transition';

	const SendSchema = z.object({
		to: z.string(),
		sendMode: z.enum(['token', 'nft']).default('token'),
		token: z.string().nullable(),
		amount: z.coerce.number().min(0)
	});

	const { form, data, setData } = createForm<z.infer<typeof SendSchema>>({
		extend: validator({ schema: SendSchema }),
		initialValues: {
			sendMode: 'token',
			amount: 0
		},
		async onSubmit(values) {
			console.log(values);
		}
	});
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
		{#if $data.to && !$data.token}
			<div class="tabs-lift tabs w-full" in:fly out:fly={{ duration: 0 }}>
				<label class="tab font-semibold">
					<input type="radio" name="sendMode" value="token" />
					Tokens
				</label>
				<div class="tab-content border-base-300 bg-base-100 p-4">
					<div class="flex flex-col">
						<button
							class="btn justify-start gap-2 bg-base-100 p-2"
							onclick={() => setData({ ...$data, token: 'mina' })}
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
		{#if $data.to && $data.token}
			<label
				class="validator input input-lg w-full border-base-300 px-4 focus-within:outline-none"
				transition:fly
			>
				<button class="btn btn-sm" onclick={() => setData({ ...$data, token: null })}>Mina</button>
				<input class="text-center text-3xl font-semibold" type="number" placeholder="0.00" />
				<button class="btn btn-sm">Max</button>
			</label>
			<button class="btn btn-lg btn-primary">Next</button>
		{/if}
	</form>
</div>
