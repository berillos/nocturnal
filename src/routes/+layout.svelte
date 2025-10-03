<script lang="ts">
	import '@fontsource-variable/geist';
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<title>Berillos</title>
	<link rel="icon" href="/berillos-favicon.svg" />
</svelte:head>

<ModeWatcher />

<Toaster />

<main class="flex min-h-screen w-full flex-col">
	{@render children?.()}
</main>
