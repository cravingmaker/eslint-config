import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import { getPluginRules } from '../../utilities/plugin-rules.js';
import pluginMarkdown from '@eslint/markdown';

const markdownEslintRules: Linter.RulesRecord = {
	...getPluginRules('markdown', pluginMarkdown.rules),

	'markdown/fenced-code-meta': 'off',
	'markdown/no-duplicate-headings': 'off',
} as const;

export { markdownEslintRules };
