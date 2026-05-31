import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { ESLint } from 'eslint';
import { expect } from 'vitest';

import { createConfig } from '../dist/index.mjs';

type LintOptions = {
	/** The virtual file path used to select the correct config block (e.g. 'test.ts', 'test.js'). */
	readonly filePath: string;

	/** Override the react-refresh variant (auto-detected from package.json if omitted). */
	readonly reactRefreshVariant?: 'generic' | 'next' | 'vite';
	/** Whether to enable type-checked rules. Defaults to false for speed in most fixture tests. */
	readonly tsTypeChecked?: boolean;
};

/**
 * Lints `code` against the full `createConfig` output and asserts that at least one
 * reported message matches the given `ruleId`.
 *
 * @example
 * await expectLintError('const a = 1;\n', 'no-unused-vars', { filePath: 'test.js' });
 */
async function expectLintError(code: string, ruleId: string, options: LintOptions): Promise<void> {
	const { filePath, reactRefreshVariant, tsTypeChecked = false } = options;

	const config = await createConfig({ reactRefreshVariant, tsconfigRootDir: process.cwd(), tsTypeChecked });

	const eslint = new ESLint({
		overrideConfig: config,
		// true = disable automatic config-file discovery; we supply config entirely via overrideConfig
		overrideConfigFile: true,
	});

	const results = await eslint.lintText(code, { filePath });
	const messages = results.flatMap((r) => r.messages);

	const matchingRuleIds = messages.map((m) => m.ruleId);

	expect(
		matchingRuleIds,
		`Expected rule "${ruleId}" to fire.\nReported rules: [${matchingRuleIds.join(', ')}]`,
	).toContain(ruleId);
}
/**
 * Writes `code` to a real temp file (needed for language plugins like @eslint/markdown
 * that don't support lintText with a virtual filePath), lints it, and asserts the rule fires.
 */
async function expectLintErrorInFile(code: string, ruleId: string, options: LintOptions): Promise<void> {
	const { filePath, reactRefreshVariant, tsTypeChecked = false } = options;
	const extension = filePath.slice(filePath.lastIndexOf('.'));
	const directory = path.join(process.cwd(), `.tmp-lint-${Date.now()}`);
	const file = path.join(directory, `test${extension}`);
	try {
		// eslint-disable-next-line functional/no-expression-statements, security/detect-non-literal-fs-filename -- Test utilities use dynamic temp file paths
		await mkdir(directory);
		// eslint-disable-next-line functional/no-expression-statements, security/detect-non-literal-fs-filename -- Test utilities need side effects for file operations
		await writeFile(file, code);
		const config = await createConfig({ reactRefreshVariant, tsconfigRootDir: process.cwd(), tsTypeChecked });
		const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });
		const results = await eslint.lintFiles([file]);
		const matchingRuleIds = results.flatMap((r) => r.messages).map((m) => m.ruleId);
		expect(
			matchingRuleIds,
			`Expected rule "${ruleId}" to fire.\nReported rules: [${matchingRuleIds.join(', ')}]`,
		).toContain(ruleId);
	} finally {
		// eslint-disable-next-line functional/no-expression-statements -- Test utilities need side effects for cleanup
		await rm(directory, { recursive: true });
	}
}
async function expectNoLintError(code: string, ruleId: string, options: LintOptions): Promise<void> {
	const { filePath, reactRefreshVariant, tsTypeChecked = false } = options;

	const config = await createConfig({ reactRefreshVariant, tsconfigRootDir: process.cwd(), tsTypeChecked });

	const eslint = new ESLint({
		overrideConfig: config,
		// true = disable automatic config-file discovery; we supply config entirely via overrideConfig
		overrideConfigFile: true,
	});

	const results = await eslint.lintText(code, { filePath });
	const messages = results.flatMap((r) => r.messages);

	const matchingRuleIds = messages.map((m) => m.ruleId);

	expect(
		matchingRuleIds,
		`Expected rule "${ruleId}" not to fire.\nReported rules: [${matchingRuleIds.join(', ')}]`,
	).not.toContain(ruleId);
}
async function expectNoLintErrorInFile(code: string, ruleId: string, options: LintOptions): Promise<void> {
	const { filePath, reactRefreshVariant, tsTypeChecked = false } = options;
	const extension = filePath.slice(filePath.lastIndexOf('.'));
	const directory = path.join(process.cwd(), `.tmp-lint-${Date.now()}`);
	const file = path.join(directory, `test${extension}`);
	try {
		// eslint-disable-next-line functional/no-expression-statements, security/detect-non-literal-fs-filename -- Test utilities use dynamic temp file paths
		await mkdir(directory);
		// eslint-disable-next-line functional/no-expression-statements, security/detect-non-literal-fs-filename -- Test utilities need side effects for file operations
		await writeFile(file, code);
		const config = await createConfig({ reactRefreshVariant, tsconfigRootDir: process.cwd(), tsTypeChecked });
		const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });
		const results = await eslint.lintFiles([file]);
		const matchingRuleIds = results.flatMap((r) => r.messages).map((m) => m.ruleId);
		expect(
			matchingRuleIds,
			`Expected rule "${ruleId}" not to fire.\nReported rules: [${matchingRuleIds.join(', ')}]`,
		).not.toContain(ruleId);
	} finally {
		// eslint-disable-next-line functional/no-expression-statements -- Test utilities need side effects for cleanup
		await rm(directory, { recursive: true });
	}
}

export { expectLintError, expectLintErrorInFile, expectNoLintError, expectNoLintErrorInFile };
