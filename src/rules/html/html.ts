import type { Linter } from 'eslint';

import eslintPluginHtml from '@html-eslint/eslint-plugin';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = eslintPluginHtml.rules as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`@html-eslint/${key}`, 'error'])) as Linter.RulesRecord;
}

const newLineOptions = {
	inline: ['$inline'],
	skip: ['pre', 'code', 'textarea'],
} as const;

const htmlEslintRules: Linter.RulesRecord = {
	...getRules(),

	'@html-eslint/attrs-newline': ['error', { ...newLineOptions }],
	'@html-eslint/element-newline': ['error', { ...newLineOptions }],
	'@html-eslint/id-naming-convention': ['error', 'kebab-case'],
	'@html-eslint/indent': ['error', 2],
	'@html-eslint/max-element-depth': ['error', { max: 6 }],
	'@html-eslint/no-extra-spacing-attrs': [
		'error',
		{
			disallowInAssignment: true,
			disallowMissing: true,
			disallowTabs: true,
			enforceBeforeSelfClose: true,
		},
	],
	'@html-eslint/no-extra-spacing-text': ['error', { skip: ['pre', 'code', 'textarea'] }],
	'@html-eslint/no-inline-styles': ['warn', { message: 'Use external CSS classes instead.' }],
	'@html-eslint/no-multiple-empty-lines': ['error', { max: 1 }],
	'@html-eslint/no-restricted-attr-values': [
		'error',
		{
			attrPatterns: ['href', 'src', 'action', 'formaction'],
			attrValuePatterns: [String.raw`^\s*javascript:`, String.raw`^\s*vbscript:`, String.raw`^\s*data:text/html`],
			message:
				'Inline scripts and data URIs in navigation attributes pose a severe security risk. Use addEventListener() and strict CSP.',
		},
	],
	'@html-eslint/no-restricted-attrs': [
		'warn',
		{
			attrPatterns: ['^on[a-z]+$'],
			message: 'Use addEventListener() instead.',
			tagPatterns: ['.*'],
		},
	],
	'@html-eslint/no-restricted-tags': [
		'warn',
		{
			message: 'Use semantic alternatives or CSS instead.',
			tagPatterns: ['^(b|i|s|u)$'],
		},
	],
	'@html-eslint/quotes': ['error', 'double', { enforceTemplatedAttrValue: true }],
	'@html-eslint/require-attrs': [
		'error',
		{
			attr: 'alt',
			message: 'Add an alt attribute to images to support screen readers and ensure accessibility.',
			tag: 'img',
		},
		{
			attr: 'width',
			message:
				'Set the width attribute on images to reserve space and prevent page layout shifting as the image loads.',
			tag: 'img',
		},
		{
			attr: 'height',
			message:
				'Set the height attribute on images to reserve space and prevent page layout shifting as the image loads.',
			tag: 'img',
		},
		{
			attr: 'loading',
			message: 'Include the loading attribute to control image load priority and improve initial page performance.',
			tag: 'img',
		},
		{
			attr: 'decoding',
			message: 'Include the decoding attribute to optimize how the browser renders the image.',
			tag: 'img',
		},
		{
			attr: 'title',
			message: 'Add a title attribute to iframes to describe the nested content for screen readers.',
			tag: 'iframe',
		},
		{
			attr: 'type',
			message:
				'Set the type attribute on input fields to ensure predictable user input handling and mobile keyboard behavior.',
			tag: 'input',
		},
	],
	'@html-eslint/require-closing-tags': [
		'warn',
		{
			message: 'Suitable only for web framework project. This rule can be safely ignored in plain HTML project.',
			selfClosing: 'always',
			selfClosingCustomPatterns: ['-'],
		},
	],
	'@html-eslint/require-open-graph-protocol': [
		'error',
		['og:title', 'og:type', 'og:url', 'og:image', 'og:description'],
	],
	'@html-eslint/sort-attrs': [
		'error',
		{
			priority: [
				// Astro
				{ pattern: 'client:.*' },
				{ pattern: '(is|set):.*' },

				// Svelte
				{ pattern: 'bind:.*' },
				{ pattern: 'on:.*' },
				{ pattern: 'use:.*' },
				{ pattern: '(transition|in|out|animate):.*' },
				{ pattern: '(class|style):.*' },

				// Vue
				{ pattern: 'v-.*' },

				// Alpine
				{ pattern: 'x-.*' },

				// HTMX
				{ pattern: 'hx-.*' },

				// HTML
				'id',
				'class',
				'name',
				'type',
				'for',
				'href',
				'src',
				'value',
				'alt',
				'title',
				'role',
				{ pattern: 'aria-.*' },
				'disabled',
				'readonly',
				'required',
				{ pattern: 'data-.*' },
				{ pattern: 'on.*' },
				'style',
			],
		},
	],
} as const;

export { htmlEslintRules };
