<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex flex-1 flex-col items-center justify-center bg-base-200">
	<div class="card w-full max-w-[36rem] bg-base-100 shadow card-lg">
		<div class="card-body gap-4">
			{@render children?.()}
		</div>
	</div>
</div>
