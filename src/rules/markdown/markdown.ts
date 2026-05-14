import type { Linter } from 'eslint';

import pluginMarkdown from '@eslint/markdown';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = pluginMarkdown.rules as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`markdown/${key}`, 'error'])) as Linter.RulesRecord;
}

const markdownEslintRules: Linter.RulesRecord = {
	...getRules(),

	'markdown/fenced-code-meta': 'off',
	'markdown/no-duplicate-headings': 'off',
} as const;

export { markdownEslintRules };
