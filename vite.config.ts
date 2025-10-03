import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import oxlintPlugin from 'vite-plugin-oxlint';

export default defineConfig({
	build: {
		target: 'esnext'
	},
	optimizeDeps: { esbuildOptions: { target: 'esnext' } },
	plugins: [tailwindcss(), sveltekit(), oxlintPlugin()]
});
