import type { Linter } from 'eslint';

import eslintPluginPromise from 'eslint-plugin-promise';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-type-assertion -- The plugin does not provide types for its rules
	const rules = (eslintPluginPromise.rules ?? {}) as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`promise/${key}`, 'error'])) as Linter.RulesRecord;
}

const promiseEslintRules: Linter.RulesRecord = {
	...getRules(),

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
