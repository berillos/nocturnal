import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	outDir: 'build',
	format: 'esm',
	target: 'node22',
	bundle: true,
	dts: true
});
