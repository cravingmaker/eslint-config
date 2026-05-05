import type { Linter } from 'eslint';

import eslintPluginJson from '@eslint/json';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = eslintPluginJson.rules as Record<string, unknown>;

	return Object.fromEntries(
		Object.keys(rules).map((key) => [`json/${key}`, 'error']),
	) as Linter.RulesRecord;
}

const jsonEslintRules: Linter.RulesRecord = {
	...getRules(),

	'json/sort-keys': [
		'error',
		'asc',
		{
			allowLineSeparatedGroups: true,
			caseSensitive: false,
			natural: true,
		},
	],
} as const;

export { jsonEslintRules };
