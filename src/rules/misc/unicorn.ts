import type { Linter } from 'eslint';

import eslintPluginUnicorn from 'eslint-plugin-unicorn';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = (eslintPluginUnicorn.rules ?? {}) as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`unicorn/${key}`, 'error'])) as Linter.RulesRecord;
}

const unicornEslintRules: Linter.RulesRecord = {
	...getRules(),

	'unicorn/filename-case': [
		'error',
		{
			cases: {
				kebabCase: true,
				pascalCase: true,
			},
			ignore: [/^\d+_/v], // Migration files like 001_init.js
		},
	],
	'unicorn/prevent-abbreviations': [
		'error',
		{
			allowList: {
				// Common framework/library identifiers that are intentional abbreviations
				i18n: true,
				i18nKey: true,

				// TypeScript
				tsconfigRootDir: true,
			},
			ignore: [
				// Allow spec/test file patterns
				String.raw`\.spec$`,
				String.raw`\.test$`,

				// Allow e2e test file suffixes
				String.raw`\.e2e$`,
			],
			replacements: {
				// Near universal convention
				e: {
					error: true,
					event: false,
				},
				fn: { function: false },

				// First-class React concept
				ref: false,

				// Framework standard and APIs (Express, Hono, etc.)
				ctx: false,
				req: false,
				res: false,
			},
		},
	],
	'unicorn/string-content': [
		'error',
		{
			patterns: {
				/*eslint-disable unicorn/string-content -- Disable to allow defining the search patterns themselves*/
				'\\.\\.\\.': '…', // Ellipsis: prefer the real Unicode character
				'<-': '←', // Left arrow: prefer Unicode
				'->': '→', // Right arrow: prefer Unicode
				/*eslint-enable unicorn/string-content -- Disable to allow defining the search patterns themselves*/
			},
		},
	],

	'unicorn/better-regex': 'off', // Prefer freedom with regexes
	'unicorn/consistent-destructuring': 'off', // Prefer freedom with variable accessing patterns
	'unicorn/no-keyword-prefix': 'off', // Prefer freedom with keywords / names
	'unicorn/no-unused-properties': 'off', // Prefer freedom with properties
	'unicorn/prefer-json-parse-buffer': 'off', // Prefer TypeScript, it's not compatible with TypeScript
	'unicorn/require-post-message-target-origin': 'off', // It can't distinguish between window.postMessage() and other calls like Worker#postMessage(), MessagePort#postMessage(), Client#postMessage(), and BroadcastChannel#postMessage()

	'unicorn/no-array-push-push': 'off', // Deprecated in favor of `unicorn/prefer-single-call` rule
	'unicorn/no-instanceof-array': 'off', // Deprecated in favor of `unicorn/no-instanceof-builtins` rule
	'unicorn/no-length-as-slice-end': 'off', // Deprecated in favor of `unicorn/no-unnecessary-slice-end` rule
	'unicorn/refer-dom-node-dataset': 'off', // Deprecated in favor of `unicorn/dom-node-dataset` rule
} as const;

export { unicornEslintRules };
