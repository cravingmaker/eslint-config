import process from 'node:process';

import { ESLint } from 'eslint';
import { expect } from 'vitest';

import { createConfig } from '../dist/index.mjs';

type LintOptions = {
	/** The virtual file path used to select the correct config block (e.g. 'test.ts', 'test.js'). */
	readonly filePath: string;

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
	const { filePath, tsTypeChecked = false } = options;

	const config = createConfig({ tsconfigRootDir: process.cwd(), tsTypeChecked });

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
async function expectNoLintError(code: string, ruleId: string, options: LintOptions): Promise<void> {
	const { filePath, tsTypeChecked = false } = options;

	const config = createConfig({ tsconfigRootDir: process.cwd(), tsTypeChecked });

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

export { expectLintError, expectNoLintError };
