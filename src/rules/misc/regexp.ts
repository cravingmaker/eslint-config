import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import { rules } from 'eslint-plugin-regexp';

const regexpEslintRules: Linter.RulesRecord = {
	...getPluginRules('regexp', rules),

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
