const htmlReactEslintRules = {
	'@html-eslint/react/no-ineffective-attrs': 'error',
	'@html-eslint/react/no-invalid-attr-value': ['error', { allow: [] }],
	'@html-eslint/react/no-obsolete-attrs': 'error',
	'@html-eslint/react/no-obsolete-tags': 'error',
	'@html-eslint/react/use-baseline': ['error', { available: 'widely' }],
	'@html-eslint/react/classname-spacing': ['error', { callees: ['clsx', 'cn', 'classnames', 'cva', 'twMerge', 'tw'] }],
	'@html-eslint/react/no-duplicate-classname': [
		'error',
		{ callees: ['clsx', 'cn', 'classnames', 'cva', 'twMerge', 'tw'] },
	],
};

export { htmlReactEslintRules };
