<script lang="ts">
	import WalletHeader from '$lib/components/wallet-header.svelte';
	import WalletReceiveDialog from '$lib/components/wallet-receive-dialog.svelte';
	import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Dashboard - Berillos</title>
</svelte:head>

<WalletHeader title="Dashboard" />

<WalletReceiveDialog />

<div class="grid grid-cols-2 gap-4 p-4">
	<div class="card bg-base-200 shadow-sm">
		<div class="card-body gap-4">
			<div class="flex flex-col">
				<p class="text-xs font-semibold text-base-content/60 uppercase">Wallet Balance</p>
				<p class="text-2xl font-semibold">345.87 MINA</p>
			</div>
			<div class="flex flex-col">
				<p class="text-xs font-semibold text-base-content/60 uppercase">Estimated Value</p>
				<p class="text-2xl font-semibold">345.87 USD</p>
			</div>
			<div class="flex items-center gap-2">
				<button class="btn flex-1 btn-primary" onclick={() => window.depositModal.showModal()}>
					<ArrowDownLeftIcon size={20} />
					<span>Deposit</span>
				</button>
				<a href="/send" class="btn flex-1 bg-base-100">
					<ArrowUpRightIcon size={20} />
					<span>Send</span>
				</a>
			</div>
		</div>
	</div>
</div>
