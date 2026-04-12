const recommendedJsonRules = {
	'json/no-duplicate-keys': 'error',
	'json/no-empty-keys': 'error',
	'json/no-unnormalized-keys': ['error', { form: 'NFC' }],
	'json/no-unsafe-values': 'error',
};

const jsonEslintRules = {
	...recommendedJsonRules,

	'json/sort-keys': [
		'warn', // Warn only, never block compilation
		'asc',
		{
			caseSensitive: false,
			natural: true,
			minKeys: 2,
		},
	],
	'json/top-level-interop': 'error',
};

const jsoncEslintRules = {
	...recommendedJsonRules,

	'json/sort-keys': [
		'warn', // Warn only, never block compilation
		'asc',
		{
			caseSensitive: false,
			natural: true,
			minKeys: 2,
		},
	],
	'json/top-level-interop': 'error',
};

const json5EslintRules = {
	...recommendedJsonRules,

	'json/sort-keys': [
		'warn', // Warn only, never block compilation
		'asc',
		{
			caseSensitive: false,
			natural: true,
			minKeys: 2,
		},
	],
	'json/top-level-interop': 'error',
};

export { jsonEslintRules, jsoncEslintRules, json5EslintRules };
