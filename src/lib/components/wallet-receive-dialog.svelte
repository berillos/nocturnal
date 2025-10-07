<script lang="ts">
	import colors from 'tailwindcss/colors';
	import QR from '@svelte-put/qr/svg/QR.svelte';
	import { CheckIcon, CopyIcon } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const PUBLIC_KEY = 'B62qnVUL6A53E4ZaGd3qbTr6RCtEZYTu3kTijVrrquNpPo4d3MuJ3nc';

	let addressCopied = $state<boolean>(false);

	async function copyAddress() {
		await navigator.clipboard.writeText(PUBLIC_KEY);
		addressCopied = true;
		return toast.success('Address copied to clipboard');
	}
</script>

<dialog id="depositModal" class="modal">
	<div
		class="modal-box flex max-w-120 flex-col items-center justify-center gap-8 overflow-hidden bg-transparent p-0 shadow-none"
	>
		<QR
			data={PUBLIC_KEY}
			shape="circle"
			moduleFill={colors.teal[300]}
			anchorOuterFill={colors.teal[300]}
			anchorInnerFill={colors.teal[300]}
			class="mx-16"
		/>
		<h2 class="text-xs font-semibold text-neutral-200">{PUBLIC_KEY}</h2>
		<div class="flex w-full items-center gap-2 px-18">
			<button class="btn flex-1 btn-primary" onclick={copyAddress}>
				{#if addressCopied}
					<CheckIcon size={16} />
					<span>Copied</span>
				{:else}
					<CopyIcon size={16} />
					<span>Copy Address</span>
				{/if}
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop bg-neutral-950/80">
		<button>close</button>
	</form>
</dialog>
