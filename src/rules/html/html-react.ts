import type { Linter } from 'eslint';

import eslintPluginHtmlReact from '@html-eslint/eslint-plugin-react';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = (eslintPluginHtmlReact.rules ?? {}) as Record<string, unknown>;

	return Object.fromEntries(
		Object.keys(rules).map((key) => [`@html-eslint/react/${key}`, 'error']),
	) as Linter.RulesRecord;
}

const classNameOptions = { callees: ['classnames', 'clsx', 'cn', 'cva', 'tw', 'twMerge'] } as const;

const htmlReactEslintRules: Linter.RulesRecord = {
	...getRules(),

	'@html-eslint/react/classname-spacing': ['error', { ...classNameOptions }],
	'@html-eslint/react/no-duplicate-classname': ['error', { ...classNameOptions }],
} as const;

export { htmlReactEslintRules };
