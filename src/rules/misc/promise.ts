import type { Linter } from 'eslint';

import eslintPluginPromise from 'eslint-plugin-promise';

import { getPluginRules } from '../../utilities/plugin-rules.js';

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
