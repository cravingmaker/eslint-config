import process from "node:process";

import { ESLint } from "eslint";
import { expect } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type LintOptions = {
  // The virtual file path used to select the correct config block (e.g. 'test.ts', 'test.js').
  readonly filePath: string;

  // Override the react-refresh variant (generic if omitted).
  readonly refresh?: "generic" | "next" | "vite";
  // Whether to enable type-checked rules. Defaults to false for speed in most fixture tests.
  readonly typeChecked?: boolean;
};
/**
 * Lints `code` as `filePath` against the full `createConfig` output and returns the ID of the rule
 * behind each message. The helpers turn every framework on, so that the result does not depend on
 * the frameworks that this repository's manifest declares. A file that ESLint ignores, or code that
 * it cannot parse, fails the assertion: no rule reports such a file, so a negative assertion would
 * pass without linting anything, and a positive one would fail for the wrong reason.
 */
const lintRuleIds = async (
  code: string,
  { filePath, refresh = "generic", typeChecked = false }: LintOptions,
): Promise<ReadonlyArray<string | null>> => {
  const eslint = new ESLint({
    overrideConfig: await createConfig({
      express: true,
      react: { refresh },
      svelte: true,
      typescript: {
        tsconfigRootDir: process.cwd(),
        typeChecked,
      },
    }),
    // True = disable automatic config-file discovery; we supply config entirely via overrideConfig.
    overrideConfigFile: true,
  });
  expect(
    await eslint.isPathIgnored(filePath),
    `Expected ESLint to lint ${filePath}, but it ignores the file.`,
  ).toBe(false);
  const results = await eslint.lintText(code, { filePath });
  const messages = results.flatMap((result) => {
    return result.messages;
  });
  const fatalMessages = messages
    .filter((message) => {
      return message.fatal === true;
    })
    .map(({ column, line, message }) => {
      return `${String(line)}:${String(column)} ${message}`;
    });
  expect(fatalMessages, `Expected ${filePath} to parse.`).toEqual([]);
  return messages.map((message) => {
    return message.ruleId;
  });
};

/**
 * Asserts that linting `code` reports `ruleId`.
 *
 * @example
 * await expectLintError('const a = 1;\n', 'unused-imports/no-unused-vars', { filePath: 'test.js' });
 */
const expectLintError = async (
  code: string,
  ruleId: string,
  options: LintOptions,
): Promise<void> => {
  const ruleIds = await lintRuleIds(code, options);
  expect(
    ruleIds,
    `Expected rule "${ruleId}" to fire.\nReported rules: [${ruleIds.join(", ")}]`,
  ).toContain(ruleId);
};

/**
 * Asserts that linting `code` does not report `ruleId`. It still fails when ESLint ignores the
 * file or cannot parse the code.
 */
const expectNoLintError = async (
  code: string,
  ruleId: string,
  options: LintOptions,
): Promise<void> => {
  const ruleIds = await lintRuleIds(code, options);
  expect(
    ruleIds,
    `Expected rule "${ruleId}" not to fire.\nReported rules: [${ruleIds.join(", ")}]`,
  ).not.toContain(ruleId);
};

export { expectLintError, expectNoLintError };
