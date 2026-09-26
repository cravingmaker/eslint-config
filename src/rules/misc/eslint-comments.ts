import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import eslintPluginComments from '@eslint-community/eslint-plugin-eslint-comments';

const eslintCommentsRules: Linter.RulesRecord = {
	...getPluginRules('@eslint-community/eslint-comments', eslintPluginComments.rules),

	'@eslint-community/eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
	'@eslint-community/eslint-comments/no-use': [
		'error',
		{ allow: ['eslint-disable', 'eslint-enable', 'eslint-disable-next-line'] },
	],

	'@eslint-community/eslint-comments/no-restricted-disable': 'off', // Project specific
} as const;

export { eslintCommentsRules };
