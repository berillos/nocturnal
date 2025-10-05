<script>
	import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Dashboard - Berillos</title>
</svelte:head>

<header class="border-b border-base-300 p-2">
	<h2 class="text-lg font-semibold">Dashboard</h2>
</header>

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
				<button class="btn flex-1 btn-primary">
					<ArrowDownLeftIcon size={20} />
					<span>Deposit</span>
				</button>
				<button class="btn flex-1 bg-base-100">
					<ArrowUpRightIcon size={20} />
					<span>Send</span>
				</button>
			</div>
		</div>
	</div>
</div>
