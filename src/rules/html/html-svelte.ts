import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import eslintPluginHtmlSvelte from '@html-eslint/eslint-plugin-svelte';

const htmlSvelteEslintRules: Linter.RulesRecord = {
	...getPluginRules('@html-eslint/svelte', eslintPluginHtmlSvelte.rules ?? {}),
} as const;

export { htmlSvelteEslintRules };
