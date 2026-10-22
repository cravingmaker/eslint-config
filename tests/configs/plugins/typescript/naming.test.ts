/* eslint-disable security/detect-non-literal-fs-filename -- Naming regressions use a real temporary TypeScript project. */

import type { Linter } from "eslint";
import type { Options, Rules } from "../../../../src/types.js";

import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";

const namingRule = "@typescript-eslint/naming-convention";
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-tsx-names-"),
);
const directory = await realpath(temporaryDirectory);
const component =
  "export const Greeting = (name: string) => { return <div>{name}</div>; };";
const functionValue =
  "export const Greeting = (name: string) => { return name; };";
await writeFile(
  path.join(directory, "package.json"),
  JSON.stringify({ type: "module" }),
);
await writeFile(
  path.join(directory, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: { jsx: "preserve", strict: true },
    include: ["*.ts", "*.mts", "*.tsx"],
  }),
);
await Promise.all(
  ["example.tsx", "ordinary.ts", "module.mts"].map(async (fileName) => {
    await writeFile(path.join(directory, fileName), "export {};\n");
  }),
);

afterAll(async () => {
  await rm(directory, { force: true, recursive: true });
});

const lint = async (
  code: string,
  fileName = "example.tsx",
  options: Options = {},
  userConfigs: readonly Linter.Config[] = [],
): Promise<readonly Linter.LintMessage[]> => {
  const eslint = new ESLint({
    cwd: directory,
    overrideConfig: await createConfig(
      {
        projectRootDirectory: directory,
        react: false,
        svelte: false,
        ...options,
      },
      ...userConfigs,
    ),
    overrideConfigFile: true,
  });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(directory, fileName),
  });
  expect(result.fatalErrorCount, JSON.stringify(result.messages)).toBe(0);
  return result.messages;
};

const namingReports = (
  messages: readonly Linter.LintMessage[],
): readonly Linter.LintMessage[] => {
  return messages.filter(({ ruleId }) => {
    return ruleId === namingRule;
  });
};

describe("typed TSX names", () => {
  it.each([
    component,
    functionValue,
    "export const Greeting: (name: string) => string = (name) => { return name; };",
    "export function Greeting(name: string): string { return name; }",
    "export function* Greeting(name: string) { yield name; }",
    "export const greeting = (name: string) => { return name; };",
    "export const GREETING = (name: string) => { return name; };",
    "export const _Greeting_ = (name: string) => { return name; };",
  ])(
    "accepts function names while retaining existing formats: %s",
    async (code) => {
      expect(namingReports(await lint(code))).toEqual([]);
    },
  );

  it.each([
    "export const RetryCount = 3;",
    "export const Greeting = { name: 'Ada' };",
    "export let Greeting = (name: string) => { return name; };",
    "export const greeting_name = (name: string) => { return name; };",
    "export const data = { Property: true, ImportAttribute: true };",
  ])("preserves ordinary binding and property checks: %s", async (code) => {
    expect(namingReports(await lint(code)).length).toBeGreaterThan(0);
  });

  it.each(["ordinary.ts", "module.mts"])(
    "preserves naming outside TSX in %s",
    async (fileName) => {
      expect(namingReports(await lint(functionValue, fileName))).toHaveLength(
        1,
      );
    },
  );

  it("retains arrow enforcement and typed promise diagnostics", async () => {
    const messages = await lint(
      "export function Greeting(name: string): string { Promise.resolve(name); return name; }",
    );
    expect(namingReports(messages)).toEqual([]);
    expect(messages).toContainEqual(
      expect.objectContaining({
        ruleId: "@cravingmaker/prefer-arrow-functions",
      }),
    );
    expect(messages).toContainEqual(
      expect.objectContaining({
        ruleId: "@typescript-eslint/no-floating-promises",
      }),
    );
  });

  it.each([
    { typescript: false },
    { typescript: { files: ["other/**"] } },
    { typescript: { ignores: ["**/*.tsx"] } },
    { typescript: { typeChecked: false } },
    { typescript: { filesTypeAware: ["other/**"] } },
    { typescript: { ignoresTypeAware: ["**/*.tsx"] } },
    { typescript: { overrides: { [namingRule]: "off" } } },
    { typescript: { overridesTypeAware: { [namingRule]: "off" } } },
  ] satisfies readonly Options[])(
    "honors typed scope and naming overrides: %j",
    async (options) => {
      expect(
        namingReports(
          await lint("export const RetryCount = 3;", "example.tsx", options),
        ),
      ).toEqual([]);
    },
  );

  it("keeps feature and consumer naming overrides after the TSX default", async () => {
    const rule: NonNullable<Rules[typeof namingRule]> = [
      "error",
      { format: ["camelCase"], selector: "variable" },
    ];
    expect(
      namingReports(
        await lint(functionValue, "example.tsx", {
          typescript: { overrides: { [namingRule]: rule } },
        }),
      ),
    ).toHaveLength(1);
    expect(
      namingReports(
        await lint(functionValue, "example.tsx", {
          typescript: { overridesTypeAware: { [namingRule]: rule } },
        }),
      ),
    ).toHaveLength(1);
    expect(
      namingReports(
        await lint("export const RetryCount = 3;", "example.tsx", {}, [
          { rules: { [namingRule]: "off" } },
        ]),
      ),
    ).toEqual([]);
  });
});
