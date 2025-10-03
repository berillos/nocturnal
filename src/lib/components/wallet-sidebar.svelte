<script lang="ts">
	import { page } from '$app/state';
	import { truncateWithin } from '$lib/string';
	import { setTheme, theme } from 'mode-watcher';
	import clsx from 'clsx';
	import {
		AppWindowIcon,
		ArrowRightLeftIcon,
		ChevronDownIcon,
		CoinsIcon,
		HouseIcon,
		MoonIcon,
		MoreVerticalIcon,
		SunIcon
	} from 'lucide-svelte';

	function toggleTheme() {
		setTheme(theme.current === 'light' ? 'dark' : 'light');
	}

	const WALLET_ADDRESS = 'B62qnVUL6A53E4ZaGd3qbTr6RCtEZYTu3kTijVrrquNpPo4d3MuJ3nc';
	const AVATAR_URL = `https://meshy.studio/api/mesh/{WALLET_ADDRESS}?noise=8&sharpen=1&negate=false&gammaIn=2.2&gammaOut=2.2&brightness=100&saturation=100&hue=0&lightness=0&blur=0&text=`;

	const SIDEBAR_ELEMENTS = [
		{
			label: 'Dashboard',
			href: '/dashboard',
			icon: HouseIcon
		},
		{
			label: 'Transactions',
			href: '/transactions',
			icon: ArrowRightLeftIcon
		},
		{
			label: 'Staking',
			href: '/staking',
			icon: CoinsIcon
		},
		{
			label: 'zkApp Store',
			href: '/zkapps',
			icon: AppWindowIcon
		}
	];

	const walletAddressShort = truncateWithin({
		text: WALLET_ADDRESS,
		startLength: 8,
		endLength: 8
	});
</script>

<div class="flex flex-1 flex-col border-r border-base-300 bg-base-200">
	<div class="flex flex-1 flex-col gap-4 p-4">
		<div class="flex items-center justify-between">
			<a href="/dashboard" class="btn p-1 btn-ghost">
				{#if theme.current === 'light'}
					<img src="/berillos-logo-text.svg" class="w-32" />
				{:else}
					<img src="/berillos-logo-text-dark.svg" class="w-32" />
				{/if}
			</a>
			<button class="btn btn-square btn-ghost btn-sm">
				<MoreVerticalIcon size={20} />
			</button>
		</div>

		<button class="flex cursor-pointer items-center gap-2 rounded bg-base-100 p-2 shadow">
			<img src={AVATAR_URL} class="h-8 w-8 rounded-full" />
			<div class="flex min-w-0 flex-1 flex-col items-start justify-start font-semibold">
				<span class="text-base-content">Gaming</span>
				<span class="truncate text-sm text-base-content/60">{walletAddressShort}</span>
			</div>
			<ChevronDownIcon size={16} />
		</button>
		<span class="text-xs font-semibold text-base-content/60">WALLET</span>
		<div class="flex flex-1 flex-col">
			{#each SIDEBAR_ELEMENTS as sidebarElement}
				{@const active = sidebarElement.href === page.url.pathname}
				<a
					href={sidebarElement.href}
					class={clsx('btn justify-start', active ? 'btn-neutral' : 'btn-ghost')}
				>
					<sidebarElement.icon size={20} />
					<span>{sidebarElement.label}</span>
				</a>
			{/each}
		</div>
		<div class="flex justify-end">
			<button class="btn btn-square btn-ghost btn-sm" onclick={toggleTheme}>
				{#if theme.current === 'light'}
					<MoonIcon size={20} />
				{:else}
					<SunIcon size={20} />
				{/if}
			</button>
		</div>
	</div>
</div>
