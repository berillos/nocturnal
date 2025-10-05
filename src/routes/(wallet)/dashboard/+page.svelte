<script lang="ts">
	import WalletHeader from '$lib/components/wallet-header.svelte';
	import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Dashboard - Berillos</title>
</svelte:head>

<WalletHeader title="Dashboard" />

<dialog id="depositModal" class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Hello!</h3>
		<p class="py-4">Press ESC key or click outside to close</p>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

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
