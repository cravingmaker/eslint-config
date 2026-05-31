import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import-x/no-default-export -- vitest requires a default export
export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		testTimeout: 30_000,
	},
});
