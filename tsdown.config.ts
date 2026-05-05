import { defineConfig } from 'tsdown';

// eslint-disable-next-line import-x/no-default-export -- tsdown requires a default export
export default defineConfig({
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	format: ['esm'],
	outDir: 'dist',
});
