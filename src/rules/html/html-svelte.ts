import type { Linter } from 'eslint';

import eslintPluginHtmlSvelte from '@html-eslint/eslint-plugin-svelte';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = (eslintPluginHtmlSvelte.rules ?? {}) as Record<string, unknown>;

	return Object.fromEntries(
		Object.keys(rules).map((key) => [`@html-eslint/svelte/${key}`, 'error']),
	) as Linter.RulesRecord;
}

const htmlSvelteEslintRules: Linter.RulesRecord = {
	...getRules(),
} as const;

export { htmlSvelteEslintRules };
