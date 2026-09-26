import type { Linter } from 'eslint';

import pluginMarkdown from '@eslint/markdown';

import { getPluginRules } from '../../utilities/plugin-rules.js';

const markdownEslintRules: Linter.RulesRecord = {
	...getPluginRules('markdown', pluginMarkdown.rules),

	'markdown/fenced-code-meta': 'off',
	'markdown/no-duplicate-headings': 'off',
} as const;

export { markdownEslintRules };
