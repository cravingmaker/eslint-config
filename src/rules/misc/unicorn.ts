import type { Linter } from 'eslint';

import eslintPluginUnicorn from 'eslint-plugin-unicorn';

import { getPluginRules } from '../../utilities/plugin-rules.js';

const unicornEslintRules: Linter.RulesRecord = {
	...getPluginRules('unicorn', eslintPluginUnicorn.rules ?? {}),

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

} as const;

export { unicornEslintRules };
