import pluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginImportX from 'eslint-plugin-import-x';
import { possibleProblemRules } from './rules/js/possible-problems.js';
import { suggestionRules } from './rules/js/suggestions.js';
import { importXRules } from './rules/plugins/import-x.js';
import { unusedImportsRules } from './rules/plugins/unused-imports.js';

export default [
	{
		ignores: ['node_modules/', 'dist/', 'build/', 'coverage/'],
	},
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
		},
		plugins: {
			'unused-imports': pluginUnusedImports,
			'import-x': pluginImportX,
		},
		rules: {
			...possibleProblemRules,
			...suggestionRules,
			...unusedImportsRules,
			...importXRules,
		},
	},
];
