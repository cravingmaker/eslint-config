import type { Linter } from 'eslint';

import eslintPluginComments from '@eslint-community/eslint-plugin-eslint-comments';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = eslintPluginComments.rules as Record<string, unknown>;

	return Object.fromEntries(
		Object.keys(rules).map((key) => [`@eslint-community/eslint-comments/${key}`, 'error']),
	) as Linter.RulesRecord;
}

const eslintCommentsRules: Linter.RulesRecord = {
	...getRules(),

	'@eslint-community/eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
	'@eslint-community/eslint-comments/no-use': [
		'error',
		{ allow: ['eslint-disable', 'eslint-enable', 'eslint-disable-next-line'] },
	],

	'@eslint-community/eslint-comments/no-restricted-disable': 'off', // Project specific
} as const;

export { eslintCommentsRules };
