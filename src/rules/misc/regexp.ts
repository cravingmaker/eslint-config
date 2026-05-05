import type { Linter } from 'eslint';

import { rules } from 'eslint-plugin-regexp';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	return Object.fromEntries(Object.keys(rules).map((key) => [`regexp/${key}`, 'error'])) as Linter.RulesRecord;
}

const regexpEslintRules: Linter.RulesRecord = {
	...getRules(),

	'regexp/hexadecimal-escape': ['error', 'never'],
	'regexp/prefer-character-class': ['error', { minAlternatives: 2 }],
	'regexp/unicode-property': [
		'error',
		{
			generalCategory: 'never',
			key: 'long',
			property: 'long',
		},
	],

	'regexp/prefer-escape-replacement-dollar-char': 'off', // Prefer WYSIWYG style
	'regexp/require-unicode-regexp': 'off', // Prefer freedom with unicode regexes
	'regexp/require-unicode-sets-regexp': 'off', // Prefer freedom with unicode sets regexes
} as const;

export { regexpEslintRules };
