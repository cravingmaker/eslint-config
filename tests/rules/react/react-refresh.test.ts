/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError, expectNoLintError } from '../../utilities.js';

// react-refresh/only-export-components only applies to JSX file extensions
const tsxOptions = { filePath: 'test.tsx' } as const;

// A file that exports only a React component — never a violation in any variant.
const onlyComponentCode = 'export function MyComponent() { return null; }';

// A file mixing a component with a non-component utility — violation in ALL variants.
const mixedHelperCode = [
	'export function helper() { return 1; }',
	'export function MyComponent() { return null; }',
].join('\n');

// A file mixing a component with a constant — violation in generic, allowed in vite.
const constantExportCode = ["export const VERSION = '1.0';", 'export function MyComponent() { return null; }'].join(
	'\n',
);

// A file mixing a component with a Next.js-specific export — violation in generic, allowed in next.
const nextSpecificExportCode = [
	'export function generateStaticParams() { return []; }',
	'export function MyComponent() { return null; }',
].join('\n');

const rule = 'react-refresh/only-export-components';

describe('react-refresh/only-export-components', () => {
	describe('generic variant (default / strictest)', () => {
		const genericOptions = { ...tsxOptions, reactRefreshVariant: 'generic' as const };

		it('does not report a file that only exports components', async () => {
			await expectNoLintError(onlyComponentCode, rule, genericOptions);
		});

		it('reports a non-component utility export alongside a component', async () => {
			await expectLintError(mixedHelperCode, rule, genericOptions);
		});

		it('reports a constant export alongside a component (allowConstantExport: false)', async () => {
			await expectLintError(constantExportCode, rule, genericOptions);
		});

		it('reports a Next.js-specific export alongside a component (no allowExportNames)', async () => {
			await expectLintError(nextSpecificExportCode, rule, genericOptions);
		});
	});

	describe('vite variant (allowConstantExport: true)', () => {
		const viteOptions = { ...tsxOptions, reactRefreshVariant: 'vite' as const };

		it('does not report a file that only exports components', async () => {
			await expectNoLintError(onlyComponentCode, rule, viteOptions);
		});

		it('reports a non-component utility export alongside a component', async () => {
			await expectLintError(mixedHelperCode, rule, viteOptions);
		});

		it('does not report a constant export alongside a component', async () => {
			await expectNoLintError(constantExportCode, rule, viteOptions);
		});
	});

	describe('next variant (allowExportNames includes Next.js page exports)', () => {
		const nextOptions = { ...tsxOptions, reactRefreshVariant: 'next' as const };

		it('does not report a file that only exports components', async () => {
			await expectNoLintError(onlyComponentCode, rule, nextOptions);
		});

		it('reports a non-component utility export alongside a component', async () => {
			await expectLintError(mixedHelperCode, rule, nextOptions);
		});

		it('does not report generateStaticParams alongside a component', async () => {
			await expectNoLintError(nextSpecificExportCode, rule, nextOptions);
		});

		it('does not report metadata export alongside a component', async () => {
			const code = ['export const metadata = { title: "App" };', 'export function MyComponent() { return null; }'].join(
				'\n',
			);
			await expectNoLintError(code, rule, nextOptions);
		});
	});
});
