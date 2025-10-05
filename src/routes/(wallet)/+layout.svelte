<script lang="ts">
	import WalletSidebar from '$lib/components/wallet-sidebar.svelte';
	import { type Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex flex-1">
	<WalletSidebar />
	<div class="flex flex-[4] flex-col bg-base-100">
		{@render children?.()}
	</div>
</div>
