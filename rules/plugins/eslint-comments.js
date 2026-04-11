const bestPracticeEslintCommentsRules = {
	'@eslint-community/eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
	'@eslint-community/eslint-comments/no-aggregating-enable': 'error',
	'@eslint-community/eslint-comments/no-duplicate-disable': 'error',
	'@eslint-community/eslint-comments/no-unlimited-disable': 'error',
	'@eslint-community/eslint-comments/no-unused-disable': 'error',
	'@eslint-community/eslint-comments/no-unused-enable': 'error',
};

const stylisticEslintCommentsRules = {
	'@eslint-community/eslint-comments/require-description': ['error', { ignore: ['eslint-enable'] }],

	// Turned off rules
	'@eslint-community/eslint-comments/no-restricted-disable': 'off',
	'@eslint-community/eslint-comments/no-use': 'off',
};

const eslintCommentsRules = {
	...bestPracticeEslintCommentsRules,
	...stylisticEslintCommentsRules,
};

export { eslintCommentsRules };
