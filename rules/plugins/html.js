const htmlEslintBestPracticeRules = {
	'@html-eslint/css-no-empty-blocks': 'error',
	'@html-eslint/head-order': ['error', { ignores: [] }],
	'@html-eslint/no-duplicate-attrs': 'error',
	'@html-eslint/no-duplicate-class': 'error',
	'@html-eslint/no-duplicate-id': 'error',
	'@html-eslint/no-duplicate-in-head': 'error',
	'@html-eslint/no-ineffective-attrs': 'error',
	'@html-eslint/no-inline-styles': 'error',
	'@html-eslint/no-invalid-attr-value': ['error', { allow: [] }],
	'@html-eslint/no-invalid-entity': 'error',
	'@html-eslint/no-nested-interactive': 'error',
	'@html-eslint/no-obsolete-attrs': 'error',
	'@html-eslint/no-obsolete-tags': 'error',
	'@html-eslint/no-script-style-type': 'error',
	'@html-eslint/no-target-blank': 'error',
	'@html-eslint/no-whitespace-only-children': 'error',
	'@html-eslint/prefer-https': 'error',
	'@html-eslint/require-button-type': 'error',
	'@html-eslint/require-details-summary': 'error',
	'@html-eslint/require-doctype': 'error',
	'@html-eslint/require-explicit-size': [
		'error',
		{
			allowClass: [],
			allowId: [],
		},
	],
	'@html-eslint/require-li-container': 'error',
	'@html-eslint/require-meta-charset': 'error',
	'@html-eslint/svg-require-viewbox': 'error',
	'@html-eslint/use-baseline': ['error', { available: 'widely' }],

	// Rules with overridden options
	'@html-eslint/max-element-depth': ['error', { max: 10 }],
	'@html-eslint/no-restricted-attr-values': [
		'error',
		{
			attrPatterns: ['href', 'src', 'action', 'formaction'],
			attrValuePatterns: ['^javascript:'],
			message: 'JavaScript protocol in URL attributes is a security risk. Use addEventListener() instead.',
		},
	],
	'@html-eslint/no-restricted-attrs': [
		'error',
		{
			tagPatterns: ['.*'],
			attrPatterns: ['^on[a-z]+$'],
			message: 'Inline event handlers are prohibited. Use addEventListener() instead.',
		},
	],
	'@html-eslint/no-restricted-tags': [
		'error',
		{
			tagPatterns: ['^(b|i|s|u)$'],
			message: 'Use semantic alternatives: <strong>, <em>, <del>, <ins>.',
		},
	],
	'@html-eslint/require-attrs': [
		'error',
		{ tag: 'img', attr: 'alt' }, // WCAG 2.1 SC 1.1.1 — alternative text
		{ tag: 'img', attr: 'width' }, // Prevents Cumulative Layout Shift (CLS)
		{ tag: 'img', attr: 'height' }, // Prevents Cumulative Layout Shift (CLS)
		{ tag: 'iframe', attr: 'title' }, // Screen reader context for embedded content
		{ tag: 'input', attr: 'type' }, // Explicit, predictable form field behavior
		{ tag: 'svg', attr: 'viewBox' }, // Required for correct SVG scaling
	],
	'@html-eslint/require-closing-tags': [
		'error',
		{
			selfClosing: 'always', // enforce <img /> <br /> <input /> etc.
			selfClosingCustomPatterns: ['-'], // self-close empty web components (e.g. <my-el />)
		},
	],
};

const htmlEslintAccessibilityRules = {
	'@html-eslint/no-abstract-roles': 'error',
	'@html-eslint/no-accesskey-attrs': 'error',
	'@html-eslint/no-aria-hidden-body': 'error',
	'@html-eslint/no-aria-hidden-on-focusable': 'error',
	'@html-eslint/no-empty-headings': 'error',
	'@html-eslint/no-heading-inside-button': 'error',
	'@html-eslint/no-invalid-role': 'error',
	'@html-eslint/no-non-scalable-viewport': 'error',
	'@html-eslint/no-positive-tabindex': 'error',
	'@html-eslint/no-redundant-role': 'error',
	'@html-eslint/no-skip-heading-levels': 'error',
	'@html-eslint/require-content': 'error',
	'@html-eslint/require-form-method': 'error',
	'@html-eslint/require-frame-title': 'error',
	'@html-eslint/require-img-alt': ['error', { substitute: [] }],
	'@html-eslint/require-input-label': 'error',
	'@html-eslint/require-meta-viewport': 'error',
};

const htmlEslintStyleRules = {
	'@html-eslint/class-spacing': 'error',
	'@html-eslint/lowercase': 'error',
	'@html-eslint/no-trailing-spaces': 'error',

	// Rules with overridden options
	'@html-eslint/attrs-newline': [
		'error',
		{
			closeStyle: 'newline',
			ifAttrsMoreThan: 2,
			inline: ['$inline'],
			skip: [],
		},
	],
	'@html-eslint/element-newline': [
		'error',
		{
			skip: ['pre', 'code', 'textarea'],
			inline: ['$inline'],
		},
	],
	'@html-eslint/id-naming-convention': ['error', 'kebab-case'],
	'@html-eslint/indent': [
		'error',
		2,
		{
			Attribute: 1,
			ignoreComment: false,
			tagChildrenIndent: {},
			templateIndentBase: 'templateTag',
		},
	],
	'@html-eslint/no-extra-spacing-attrs': [
		'error',
		{
			enforceBeforeSelfClose: true,
			disallowInAssignment: true,
			disallowMissing: true,
			disallowTabs: true,
		},
	],
	'@html-eslint/no-extra-spacing-text': ['error', { skip: ['pre', 'code', 'textarea', 'script'] }],
	'@html-eslint/no-multiple-empty-lines': ['error', { max: 1 }],
	'@html-eslint/quotes': ['error', 'double', { enforceTemplatedAttrValue: true }],
	'@html-eslint/sort-attrs': [
		'error',
		{
			priority: [
				'id',
				'name',
				'type',
				'for',
				'href',
				'src',
				'alt',
				{ pattern: 'aria-.*' },
				'class',
				{ pattern: 'data-.*' },
				'style',
			],
		},
	],
};

const htmlEslintSeoRules = {
	'@html-eslint/no-multiple-h1': 'error',
	'@html-eslint/require-lang': 'error',
	'@html-eslint/require-meta-description': 'error',
	'@html-eslint/require-title': 'error',

	// Rules with overridden options
	'@html-eslint/require-open-graph-protocol': [
		'error',
		['og:title', 'og:type', 'og:url', 'og:image', 'og:description'],
	],
};

const htmlEslintRules = {
	...htmlEslintBestPracticeRules,
	...htmlEslintAccessibilityRules,
	...htmlEslintStyleRules,
	...htmlEslintSeoRules,
};

export { htmlEslintRules };
