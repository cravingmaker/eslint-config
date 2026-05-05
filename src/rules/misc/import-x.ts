import type { Linter } from 'eslint';

import eslintPluginImportX from 'eslint-plugin-import-x';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = eslintPluginImportX.rules as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`import-x/${key}`, 'error'])) as Linter.RulesRecord;
}

const importxEslintRules: Linter.RulesRecord = {
	...getRules(),

	'import-x/extensions': [
		'error',
		'ignorePackages',
		{
			js: 'always',
			jsx: 'always',
			mjs: 'always',

			// TypeScript (NodeNext): .ts/.tsx/.mts files are imported with their compiled
			// output extension (.js/.jsx/.mjs), never require the source extension.
			mts: 'never',
			ts: 'never',
			tsx: 'never',
		},
	],
	'import-x/newline-after-import': [
		'error',
		{
			considerComments: true,
			exactCount: true,
		},
	],
	'import-x/no-commonjs': [
		'error',
		{
			allowConditionalRequire: false,
			allowPrimitiveModules: false,
			allowRequire: false,
		},
	],
	'import-x/no-namespace': [
		'error',
		{
			ignore: [
				'node:assert',
				'node:assert/strict',
				'node:async_hooks',
				'node:buffer',
				'node:child_process',
				'node:cluster',
				'node:console',
				'node:constants',
				'node:crypto',
				'node:dgram',
				'node:diagnostics_channel',
				'node:dns',
				'node:dns/promises',
				'node:domain',
				'node:events',
				'node:fs',
				'node:fs/promises',
				'node:http',
				'node:http2',
				'node:https',
				'node:inspector',
				'node:inspector/promises',
				'node:module',
				'node:net',
				'node:os',
				'node:path',
				'node:path/posix',
				'node:path/win32',
				'node:perf_hooks',
				'node:process',
				'node:querystring',
				'node:readline',
				'node:readline/promises',
				'node:repl',
				'node:sea',
				'node:sqlite',
				'node:stream',
				'node:stream/consumers',
				'node:stream/promises',
				'node:stream/web',
				'node:string_decoder',
				'node:sys',
				'node:test',
				'node:test/reporters',
				'node:timers',
				'node:timers/promises',
				'node:tls',
				'node:trace_events',
				'node:tty',
				'node:url',
				'node:util',
				'node:util/types',
				'node:v8',
				'node:vm',
				'node:wasi',
				'node:worker_threads',
				'node:zlib',

				'react',
				'react-dom',

				'jsonc-eslint-parser',
			],
		},
	],

	'import-x/max-dependencies': 'off', // Prefer no dependency count limit
	'import-x/no-cycle': 'off', // Prefer lightweight workflow, it's computationally expensive
	'import-x/no-named-export': 'off', // Prefer named export
	'import-x/no-nodejs-modules': 'off', // Prefer built-in Node.js modules
	'import-x/no-unused-modules': 'off', // Prefer flat config, it's only compatible with legacy configs
	'import-x/prefer-default-export': 'off', // Prefer named export
	'import-x/prefer-namespace-import': 'off', // Prefer named import, with default import as fallback

	'import-x/no-internal-modules': 'off', // Project specific
	'import-x/no-relative-parent-imports': 'off', // Project specific
	'import-x/no-restricted-paths': 'off', // Project specific

	'import-x/dynamic-import-chunkname': 'off', // Project specific, only target Webpack
	'import-x/no-webpack-loader-syntax': 'off', // Project specific, only target Webpack

	'import-x/first': 'off', // Covered by `perfectionist/sort-imports` rule
	'import-x/order': 'off', // Covered by `perfectionist/sort-imports` rule

	'import-x/imports-first': 'off', // Deprecated in favor of `import-x/first`
} as const;

export { importxEslintRules };
