import pluginEslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import pluginImportX, { createNodeResolver } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginJson from '@eslint/json';
import { eslintCommentsRules } from './rules/plugins/eslint-comments.js';
import { importXRules } from './rules/plugins/import-x.js';
import { possibleProblemRules } from './rules/js/possible-problems.js';
import { suggestionRules } from './rules/js/suggestions.js';
import { unusedImportsRules } from './rules/plugins/unused-imports.js';
import { tsEslintRules, tsEslintTypeCheckedRules } from './rules/ts/typescript-eslint.js';
import { json5EslintRules, jsoncEslintRules, jsonEslintRules } from './rules/plugins/json.js';

/**
 * @param {Object} [options]
 * @param {string[]} [options.ignores]
 * @param {import('eslint').Linter.RulesRecord} [options.jsRules]
 * @param {import('eslint').Linter.RulesRecord} [options.tsRules]
 * @param {boolean} [options.ts]
 * @param {boolean} [options.tsTypeChecked]
 * @param {string}  [options.tsconfigRootDir]
 */
export function createConfig({
	ignores = [],
	jsRules = {},
	tsRules = {},
	jsonRules = {},
	jsoncRules = {},
	json5Rules = {},
	ts = true,
	tsTypeChecked = true,
	tsconfigRootDir = process.cwd(),
} = {}) {
	return defineConfig([
		globalIgnores(['node_modules/', 'dist/', 'build/', 'coverage/', ...ignores]),

		{
			plugins: {
				'unused-imports': pluginUnusedImports,
				'import-x': pluginImportX,
				'@eslint-community/eslint-comments': pluginEslintComments,
			},
		},

		{
			files: ['**/*.{js,mjs,jsx,mjsx}'],
			languageOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
			rules: {
				...possibleProblemRules,
				...suggestionRules,
				...unusedImportsRules,
				...importXRules,
				...eslintCommentsRules,
				...jsRules,
			},
		},

		...(ts
			? [
					{
						files: ['**/*.{ts,mts,tsx,mtsx}'],
						languageOptions: {
							parser: tseslint.parser,
							parserOptions: tsTypeChecked
								? {
										sourceType: 'module',
										projectService: true,
										tsconfigRootDir,
									}
								: { sourceType: 'module' },
						},
						plugins: {
							'@typescript-eslint': tseslint.plugin,
						},
						settings: {
							'import-x/resolver-next': [
								createTypeScriptImportResolver({
									alwaysTryTypes: true,
									...(tsconfigRootDir ? { project: tsconfigRootDir } : {}),
								}),
								createNodeResolver(),
							],
						},
						rules: {
							...possibleProblemRules,
							...suggestionRules,
							...(tsTypeChecked ? tsEslintTypeCheckedRules : tsEslintRules),
							...unusedImportsRules,
							...importXRules,
							...eslintCommentsRules,
							...tsRules,
						},
					},
				]
			: []),

		{
			files: ['**/*.json'],
			ignores: ['**/package-lock.json', '**/yarn.lock'],
			plugins: { pluginJson },
			language: 'json/json',
			rules: {
				...jsonEslintRules,
				...jsonRules,
			},
		},

		{
			files: ['**/*.jsonc', '**/tsconfig*.json', '**/.vscode/*.json', '**/.devcontainer/*.json'],
			plugins: { pluginJson },
			language: 'json/jsonc',
			rules: {
				...jsoncEslintRules,
				...jsoncRules,
			},
		},

		{
			files: ['**/*.json5'],
			plugins: { pluginJson },
			language: 'json/json5',
			rules: {
				...json5EslintRules,
				...json5Rules,
			},
		},
	]);
}
