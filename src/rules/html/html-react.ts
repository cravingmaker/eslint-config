import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import eslintPluginHtmlReact from '@html-eslint/eslint-plugin-react';

const classNameOptions = { callees: ['classnames', 'clsx', 'cn', 'cva', 'tw', 'twMerge'] } as const;

const htmlReactEslintRules: Linter.RulesRecord = {
	...getPluginRules('@html-eslint/react', eslintPluginHtmlReact.rules ?? {}),

	'@html-eslint/react/classname-spacing': ['error', { ...classNameOptions }],
	'@html-eslint/react/no-duplicate-classname': ['error', { ...classNameOptions }],
} as const;

export { htmlReactEslintRules };
