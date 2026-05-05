import type { Linter } from 'eslint';

import process from 'node:process';

import pluginEslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import enforcePackageType from 'eslint-enforce-package-type';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import pluginFunctional from 'eslint-plugin-functional';
import pluginImportX, { createNodeResolver } from 'eslint-plugin-import-x';
import pluginN from 'eslint-plugin-n';
import packageJson from 'eslint-plugin-package-json';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginPromise from 'eslint-plugin-promise';
import pluginRegexp from 'eslint-plugin-regexp';
import pluginSecurity from 'eslint-plugin-security';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginJson from '@eslint/json';
import globals from 'globals';
import pluginHtml from '@html-eslint/eslint-plugin';
import pluginHtmlReact from '@html-eslint/eslint-plugin-react';
import pluginHtmlSvelte from '@html-eslint/eslint-plugin-svelte';
import htmlParser from '@html-eslint/parser';
import * as jsoncParser from 'jsonc-eslint-parser';
import svelteParser from 'svelte-eslint-parser';
import { parser as tseslintParser, plugin as tseslintPlugin } from 'typescript-eslint';

import { htmlReactEslintRules } from './rules/html/html-react.js';
import { htmlSvelteEslintRules } from './rules/html/html-svelte.js';
import { htmlEslintRules } from './rules/html/html.js';
import { possibleProblemRules } from './rules/js/possible-problems.js';
import { suggestionRules } from './rules/js/suggestions.js';
import { enforcePackageTypeEslintRules } from './rules/json/enforce-package-type.js';
import { jsonEslintRules } from './rules/json/json.js';
import { packageJsonEslintRules } from './rules/json/package-json.js';
import { eslintCommentsRules } from './rules/misc/eslint-comments.js';
import { functionalEslintRules, functionalTypeCheckedEslintRules } from './rules/misc/functional.js';
import { importxEslintRules } from './rules/misc/import-x.js';
import { perfectionistEslintRules } from './rules/misc/perfectionist.js';
import { promiseEslintRules } from './rules/misc/promise.js';
import { regexpEslintRules } from './rules/misc/regexp.js';
import { unicornEslintRules } from './rules/misc/unicorn.js';
import { unusedImportsEslintRules } from './rules/misc/unused-imports.js';
import { nEslintRules } from './rules/node/n.js';
import { securityEslintRules } from './rules/node/security.js';
import { tsEslintRules, tsEslintTypeCheckedRules } from './rules/ts/typescript-eslint.js';

type CreateConfigOptions = {
	readonly ignores?: readonly string[];
	readonly oop?: boolean;
	readonly plugins?: Linter.Config['plugins'];
	readonly rules?: RulesOptions;
	readonly tsconfigRootDir?: string;
	readonly tsTypeChecked?: boolean;
	readonly useThrow?: boolean;
};
type RulesOptions = {
	readonly html?: Linter.RulesRecord;
	readonly js?: Linter.RulesRecord;
	readonly json?: Linter.RulesRecord;
	readonly json5?: Linter.RulesRecord;
	readonly jsonc?: Linter.RulesRecord;
	readonly packageJson?: Linter.RulesRecord;
	readonly react?: Linter.RulesRecord;
	readonly svelte?: Linter.RulesRecord;
	readonly ts?: Linter.RulesRecord;
};

export function createConfig({
	ignores = [],
	plugins = {},
	rules = {},
	tsconfigRootDir = process.cwd(),
	tsTypeChecked = true,
}: CreateConfigOptions = {}) {
	const {
		html: htmlRuleOverrides = {},
		js: jsRuleOverrides = {},
		json: jsonRuleOverrides = {},
		json5: json5RuleOverrides = {},
		jsonc: jsoncRuleOverrides = {},
		packageJson: packageJsonRuleOverrides = {},
		react: reactRuleOverrides = {},
		svelte: svelteRuleOverrides = {},
		ts: tsRuleOverrides = {},
	} = rules;

	return defineConfig([
		globalIgnores(['node_modules/', 'dist/', 'build/', 'coverage/', ...ignores]),

		{
			plugins: {
				'@eslint-community/eslint-comments': pluginEslintComments,
				functional: pluginFunctional,
				'import-x': pluginImportX,
				n: pluginN,
				'package-json': packageJson,
				perfectionist: pluginPerfectionist,
				regexp: pluginRegexp,
				unicorn: eslintPluginUnicorn,
				'unused-imports': pluginUnusedImports,

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types
				promise: pluginPromise,

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-security does not have types
				security: pluginSecurity,

				...plugins,
			},
		},

		{
			files: ['**/*.{js,mjs,jsx,mjsx}'],
			languageOptions: {
				ecmaVersion: 'latest',
				globals: globals.builtin,
				sourceType: 'module',
			},
			rules: {
				...possibleProblemRules,
				...suggestionRules,
				...unicornEslintRules,
				...functionalEslintRules,
				...promiseEslintRules,
				...regexpEslintRules,
				...nEslintRules,
				...securityEslintRules,
				...unusedImportsEslintRules,
				...importxEslintRules,
				...perfectionistEslintRules,
				...eslintCommentsRules,
				...jsRuleOverrides,
			},
		},

		{
			files: ['**/*.{ts,mts,tsx,mtsx}'],
			languageOptions: {
				globals: globals.builtin,
				parser: tseslintParser,
				parserOptions: tsTypeChecked
					? {
							projectService: true,
							sourceType: 'module',
							tsconfigRootDir,
						}
					: { sourceType: 'module' },
			},
			plugins: { '@typescript-eslint': tseslintPlugin },
			rules: {
				...possibleProblemRules,
				...suggestionRules,
				...(tsTypeChecked ? tsEslintTypeCheckedRules : tsEslintRules),
				...unicornEslintRules,
				...functionalTypeCheckedEslintRules,
				...promiseEslintRules,
				...regexpEslintRules,
				...nEslintRules,
				...securityEslintRules,
				...unusedImportsEslintRules,
				...importxEslintRules,
				...perfectionistEslintRules,
				...eslintCommentsRules,
				...tsRuleOverrides,
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
		},

		{
			files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
			languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
			plugins: { '@html-eslint/react': pluginHtmlReact },
			rules: {
				...htmlReactEslintRules,
				...reactRuleOverrides,
			},
		},

		{
			files: ['**/*.{svelte,svelte.js,svelte.mjs,svelte.ts, svelte.mts}'],
			languageOptions: { parser: svelteParser },
			plugins: { '@html-eslint/svelte': pluginHtmlSvelte },
			rules: {
				...htmlSvelteEslintRules,
				...svelteRuleOverrides,
			},
		},

		{
			files: ['**/*.html'],
			languageOptions: { parser: htmlParser },
			plugins: { '@html-eslint': pluginHtml },
			rules: {
				...htmlEslintRules,
				...htmlRuleOverrides,
			},
		},

		{
			files: ['package.json'],
			languageOptions: {
				parser: jsoncParser,
			},
			plugins: {
				'enforce-package-type': enforcePackageType,
				'package-json': packageJson,
			},
			rules: {
				...enforcePackageTypeEslintRules,
				...packageJsonEslintRules,
				...packageJsonRuleOverrides,
			},
		},

		{
			files: ['**/*.json'],
			ignores: ['**/package.json', '**/package-lock.json', '**/yarn.lock'],
			language: 'json/json',
			plugins: { json: pluginJson },
			rules: {
				...jsonEslintRules,
				...jsonRuleOverrides,
			},
		},
		{
			files: ['**/*.jsonc', '**/tsconfig*.json', '**/.vscode/*.json', '**/.devcontainer/*.json'],
			language: 'json/jsonc',
			plugins: { json: pluginJson },
			rules: {
				...jsonEslintRules,
				...jsoncRuleOverrides,
			},
		},
		{
			files: ['**/*.json5'],
			language: 'json/json5',
			plugins: { json: pluginJson },
			rules: {
				...jsonEslintRules,
				...json5RuleOverrides,
			},
		},
	]);
}

export type { CreateConfigOptions, RulesOptions };
