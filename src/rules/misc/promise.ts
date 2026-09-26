import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import eslintPluginPromise from 'eslint-plugin-promise';

const promiseEslintRules: Linter.RulesRecord = {
	...getPluginRules('promise', eslintPluginPromise.rules ?? {}),

	'promise/catch-or-return': [
		'error',
		{
			allowFinally: true,
			terminationMethod: 'catch',
		},
	],

	'promise/no-native': 'off', // Prefer built-in Promise
} as const;

export { promiseEslintRules };
