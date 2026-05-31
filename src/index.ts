import type { Linter } from 'eslint';
import type eslintPluginExpressSecurity from 'eslint-plugin-express-security';
import type pluginReactHooks from 'eslint-plugin-react-hooks';
import type { reactRefresh as ReactRefreshPlugin } from 'eslint-plugin-react-refresh';
import type eslintPluginHtmlReact from '@html-eslint/eslint-plugin-react';
import type { parser as tseslintParser, plugin as tseslintPlugin } from 'typescript-eslint';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
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
import pluginMarkdown from '@eslint/markdown';
import globals from 'globals';
import pluginHtml from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import * as jsoncParser from 'jsonc-eslint-parser';

import { htmlEslintRules } from './rules/html/html.js';
import { possibleProblemRules } from './rules/js/possible-problems.js';
import { suggestionRules } from './rules/js/suggestions.js';
import { enforcePackageTypeEslintRules } from './rules/json/enforce-package-type.js';
import { jsonEslintRules } from './rules/json/json.js';
import { packageJsonEslintRules } from './rules/json/package-json.js';
import { markdownEslintRules } from './rules/markdown/markdown.js';
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
	readonly reactRefreshVariant?: 'generic' | 'next' | 'vite';
	readonly rules?: RulesOptions;
	readonly tsconfigRootDir?: string;
	readonly tsTypeChecked?: boolean;
	readonly useThrow?: boolean;
};
type ResolvedRules = {
	readonly express: Linter.RulesRecord;
	readonly html: Linter.RulesRecord;
	readonly js: Linter.RulesRecord;
	readonly json: Linter.RulesRecord;
	readonly json5: Linter.RulesRecord;
	readonly jsonc: Linter.RulesRecord;
	readonly packageJson: Linter.RulesRecord;
	readonly react: Linter.RulesRecord;
	readonly svelte: Linter.RulesRecord;
	readonly ts: Linter.RulesRecord;
};
type RulesOptions = {
	readonly express?: Linter.RulesRecord;
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
type TsConfigOptions = {
	readonly functionalRules: Readonly<Record<string, Linter.RuleEntry | undefined>>;
	readonly resolverProject: Readonly<Record<string, unknown>>;
	readonly ruleOverrides: Readonly<Linter.RulesRecord>;
	readonly tsParserOptions: Readonly<Record<string, unknown>>;
	readonly tsRules: Readonly<Linter.RulesRecord>;
};

// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
async function buildExpressConfig(ruleOverrides: Readonly<Linter.RulesRecord>): Promise<Linter.Config | undefined> {
	const plugin = await tryImport<{ default: typeof eslintPluginExpressSecurity }>('eslint-plugin-express-security');
	if (plugin === undefined) return undefined;
	const { expressSecurityEslintRules } = await import('./rules/node/express-security.js');
	return {
		files: ['**/*.{js,mjs,ts,mts}'],
		plugins: { 'express-security': plugin.default },
		rules: { ...expressSecurityEslintRules, ...ruleOverrides },
	};
}
async function buildReactConfig(
	variant: 'generic' | 'next' | 'vite',
	// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
	ruleOverrides: Readonly<Linter.RulesRecord>,
): Promise<readonly Linter.Config[]> {
	const [htmlReactPlugin, hooksPlugin, refreshModule] = await Promise.all([
		tryImport<{ default: typeof eslintPluginHtmlReact }>('@html-eslint/eslint-plugin-react'),
		tryImport<{ default: typeof pluginReactHooks }>('eslint-plugin-react-hooks'),
		tryImport<{ reactRefresh: typeof ReactRefreshPlugin }>('eslint-plugin-react-refresh'),
	]);

	const [htmlReactRulesModule, hooksRulesModule, refreshRulesModule] = await Promise.all([
		htmlReactPlugin === undefined ? undefined : import('./rules/html/html-react.js'),
		hooksPlugin === undefined ? undefined : import('./rules/react/react-hooks.js'),
		refreshModule === undefined ? undefined : import('./rules/react/react-refresh.js'),
	]);

	const reactConfigs: Array<Linter.Config | undefined> = [
		htmlReactPlugin === undefined || htmlReactRulesModule === undefined
			? undefined
			: {
					files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
					languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
					plugins: { '@html-eslint/react': htmlReactPlugin.default },
					rules: { ...htmlReactRulesModule.htmlReactEslintRules, ...ruleOverrides },
				},
		hooksPlugin === undefined || hooksRulesModule === undefined
			? undefined
			: {
					files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
					// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- eslint-plugin-react-hooks configs.flat shape is not assignable to Linter.Plugin without assertion
					plugins: { 'react-hooks': hooksPlugin.default as unknown as NonNullable<Linter.Config['plugins']>[string] },
					rules: { ...hooksRulesModule.reactHooksEslintRules, ...ruleOverrides },
				},
		refreshModule === undefined || refreshRulesModule === undefined
			? undefined
			: {
					files: ['**/*.{jsx,mjsx,tsx,mtsx}'],
					plugins: { 'react-refresh': refreshModule.reactRefresh.plugin },
					rules: { ...refreshRulesModule.getReactRefreshEslintRules(variant), ...ruleOverrides },
				},
	];
	return reactConfigs.filter((c): c is Linter.Config => c !== undefined);
}
// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
async function buildSvelteConfig(ruleOverrides: Readonly<Linter.RulesRecord>): Promise<Linter.Config | undefined> {
	const [plugin, svelteParserModule] = await Promise.all([
		tryImport<{ default: Record<string, unknown> }>('@html-eslint/eslint-plugin-svelte'),
		tryImport<{ default: Linter.Parser }>('svelte-eslint-parser'),
	]);
	if (plugin === undefined || svelteParserModule === undefined) return undefined;
	const { htmlSvelteEslintRules } = await import('./rules/html/html-svelte.js');
	return {
		files: ['**/*.{svelte,svelte.js,svelte.mjs,svelte.ts,svelte.mts}'],
		languageOptions: { parser: svelteParserModule.default },
		plugins: { '@html-eslint/svelte': plugin.default },
		rules: { ...htmlSvelteEslintRules, ...ruleOverrides },
	};
}
// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
async function buildTsConfig({
	functionalRules,
	resolverProject,
	ruleOverrides,
	tsParserOptions,
	tsRules,
}: TsConfigOptions): Promise<Linter.Config | undefined> {
	const tseslint = await tryImport<{ parser: typeof tseslintParser; plugin: typeof tseslintPlugin }>(
		'typescript-eslint',
	);
	if (tseslint === undefined) return undefined;
	return {
		files: ['**/*.{ts,mts,tsx,mtsx}'],
		languageOptions: {
			globals: globals.builtin,
			parser: tseslint.parser,
			parserOptions: tsParserOptions,
		},
		plugins: { '@typescript-eslint': tseslint.plugin },
		rules: {
			...possibleProblemRules,
			...suggestionRules,
			...tsRules,
			...unicornEslintRules,
			...functionalRules,
			...promiseEslintRules,
			...regexpEslintRules,
			...nEslintRules,
			...securityEslintRules,
			...unusedImportsEslintRules,
			...importxEslintRules,
			...perfectionistEslintRules,
			...eslintCommentsRules,
			...ruleOverrides,
		},
		settings: {
			'import-x/resolver-next': [
				createTypeScriptImportResolver({
					alwaysTryTypes: true,
					...resolverProject,
				}),
				createNodeResolver(),
			],
		},
	};
}
// eslint-disable-next-line functional/functional-parameters -- Zero-parameter async function; detecting variant requires no inputs
async function detectReactRefreshVariant(): Promise<'generic' | 'next' | 'vite'> {
	try {
		// eslint-disable-next-line security/detect-non-literal-fs-filename -- path.join with process.cwd() is a safe, well-known base path
		const raw = await readFile(path.join(process.cwd(), 'package.json'), 'utf8');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns `any`; immediately cast to a safe Record shape
		const packageManifest = JSON.parse(raw) as Record<string, Record<string, unknown> | undefined>;
		const deps: Record<string, unknown> = {
			...packageManifest.dependencies,
			...packageManifest.devDependencies,
			...packageManifest.peerDependencies,
		};
		if ('next' in deps) return 'next';
		if ('vite' in deps) return 'vite';
		return 'generic';
	} catch {
		return 'generic';
	}
}
// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
function resolveRules(rules: RulesOptions): ResolvedRules {
	return {
		express: rules.express ?? {},
		html: rules.html ?? {},
		js: rules.js ?? {},
		json: rules.json ?? {},
		json5: rules.json5 ?? {},
		jsonc: rules.jsonc ?? {},
		packageJson: rules.packageJson ?? {},
		react: rules.react ?? {},
		svelte: rules.svelte ?? {},
		ts: rules.ts ?? {},
	};
}
async function tryImport<T>(specifier: string): Promise<T | undefined> {
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- dynamic import cannot be statically typed
		return (await import(specifier)) as T;
	} catch {
		return undefined;
	}
}

export async function createConfig({
	ignores = [],
	plugins = {},
	reactRefreshVariant,
	rules = {},
	tsconfigRootDir = process.cwd(),
	tsTypeChecked,
}: CreateConfigOptions = {}) {
	const {
		express: expressRuleOverrides,
		html: htmlRuleOverrides,
		js: jsRuleOverrides,
		json: jsonRuleOverrides,
		json5: json5RuleOverrides,
		jsonc: jsoncRuleOverrides,
		packageJson: packageJsonRuleOverrides,
		react: reactRuleOverrides,
		svelte: svelteRuleOverrides,
		ts: tsRuleOverrides,
	} = resolveRules(rules);

	const isTypeScript = tsTypeChecked ?? (await tryImport('typescript-eslint')) !== undefined;
	const tsRules = isTypeScript ? tsEslintTypeCheckedRules : tsEslintRules;
	const functionalRules = isTypeScript ? functionalTypeCheckedEslintRules : functionalEslintRules;
	const tsParserOptions = isTypeScript
		? { projectService: true, sourceType: 'module' as const, tsconfigRootDir }
		: { sourceType: 'module' as const };
	const resolverProject = tsconfigRootDir ? { project: tsconfigRootDir } : {};

	const resolvedVariant = reactRefreshVariant ?? (await detectReactRefreshVariant());

	const [reactConfigs, svelteConfig, expressConfig, tsConfig] = await Promise.all([
		buildReactConfig(resolvedVariant, reactRuleOverrides),
		buildSvelteConfig(svelteRuleOverrides),
		buildExpressConfig(expressRuleOverrides),
		buildTsConfig({ functionalRules, resolverProject, ruleOverrides: tsRuleOverrides, tsParserOptions, tsRules }),
	]);
	const optionalConfigs = [
		...reactConfigs,
		...[svelteConfig, expressConfig, tsConfig].filter((c): c is Linter.Config => c !== undefined),
	];

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

				security: pluginSecurity,

				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @eslint/markdown Plugin type is not assignable to Linter.Plugin without assertion
				markdown: pluginMarkdown as unknown as NonNullable<Linter.Config['plugins']>[string],

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

		{
			files: ['**/*.md'],
			language: 'markdown/gfm',
			languageOptions: {
				frontmatter: 'yaml',
				math: true,
			},
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @eslint/markdown Plugin type is not assignable to Linter.Plugin without assertion
			plugins: { markdown: pluginMarkdown as unknown as NonNullable<Linter.Config['plugins']>[string] },
			rules: {
				...markdownEslintRules,
			},
		},

		...optionalConfigs,
	]);
}

export type { CreateConfigOptions, RulesOptions };
