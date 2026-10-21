import type { Linter } from "eslint";
import type { Options } from "../../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../dist/index.mjs";

const ruleId = "@typescript-eslint/promise-function-async";
// This existing file belongs to the repository's TypeScript project.
const filePath = "tests/utilities.ts";
const createEngine = async (options: Options = {}) => {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
};

const eslint = await createEngine();
const lint = async (engine: ESLint, code: string) => {
  expect(await engine.isPathIgnored(filePath)).toBe(false);
  const [result] = await engine.lintText(code, { filePath });
  expect(result.fatalErrorCount, JSON.stringify(result.messages)).toBe(0);
  return result.messages;
};

const asyncReports = (messages: readonly Linter.LintMessage[]) => {
  return messages.filter((message) => {
    return message.ruleId === ruleId;
  });
};

describe("opaque return async review", () => {
  it.each([
    "export const parse = (raw: string): unknown => { return JSON.parse(raw); };",
    "export const parse = (raw: string) => { return JSON.parse(raw); };",
    "export const parse = (raw: string): any => { return JSON.parse(raw); };",
    "export function parse(raw: string): unknown { return JSON.parse(raw); }",
    "export const parse = function parse(raw: string): unknown { return JSON.parse(raw); };",
    "export class Parser { parse(raw: string): unknown { return JSON.parse(raw); } }",
    "export const parser = { parse(raw: string): unknown { return JSON.parse(raw); } };",
    "export const load = (): unknown => { return Promise.resolve(1); };",
    "export const load = (): any => { return Promise.resolve(1); };",
  ])("retains an unfixed review signal for %s", async (code) => {
    const reports = asyncReports(await lint(eslint, code));
    expect(reports).toEqual([expect.objectContaining({ ruleId, severity: 2 })]);
    expect(reports[0]?.fix).toBeUndefined();
    expect(reports[0]?.suggestions).toBeUndefined();
  });

  it.each([
    "export const load = (): Promise<number> => { return Promise.resolve(1); };",
    "export function load(): Promise<number> { return Promise.resolve(1); }",
    "export const load = function load(): Promise<number> { return Promise.resolve(1); };",
    "export class Loader { load(): Promise<number> { return Promise.resolve(1); } }",
  ])(
    "retains the async requirement for explicit Promise contracts: %s",
    async (code) => {
      const reports = asyncReports(await lint(eslint, code));
      expect(reports).toEqual([
        expect.objectContaining({ ruleId, severity: 2 }),
      ]);
      expect(reports[0]?.fix).toBeDefined();
    },
  );

  it.each([
    "export const parse = (raw: string): string => { return raw; };",
    "export const load = async (): Promise<number> => { return 1; };",
    "export class Parser { get value(): unknown { return JSON.parse('1'); } }",
  ])(
    "preserves synchronous concrete contracts and semantic exceptions: %s",
    async (code) => {
      expect(asyncReports(await lint(eslint, code))).toEqual([]);
    },
  );

  it("retains independent unsafe-return and explicit-any diagnostics", async () => {
    const messages = await lint(
      eslint,
      "export const parse = (raw: string) => { return JSON.parse(raw); };\nexport const read = (raw: string): any => { return JSON.parse(raw); };",
    );
    expect(
      messages.map((message) => {
        return message.ruleId;
      }),
    ).toEqual(
      expect.arrayContaining([
        ruleId,
        "@typescript-eslint/no-explicit-any",
        "@typescript-eslint/no-unsafe-return",
      ]),
    );
  });

  it.each([
    { typescript: { typeChecked: false } },
    { typescript: { filesTypeAware: ["src/**"] } },
    { typescript: { ignoresTypeAware: ["tests/**"] } },
    { typescript: { files: ["src/**"] } },
    { typescript: { ignores: ["tests/**"] } },
    { typescript: false },
  ] satisfies readonly Options[])(
    "keeps review inside the existing typed scope: %j",
    async (options) => {
      const engine = await createEngine(options);
      // No type syntax: the ordinary parser remains usable when the feature excludes this file.
      expect(
        asyncReports(
          await lint(
            engine,
            "export const parse = (raw) => { return JSON.parse(raw); };",
          ),
        ),
      ).toEqual([]);
    },
  );

  it("allows an explicit uncertainty-policy override without changing unsafe-type checks", async () => {
    const engine = await createEngine({
      typescript: { overrides: { [ruleId]: ["error", { allowAny: true }] } },
    });
    const messages = await lint(
      engine,
      "export const parse = (raw: string) => { return JSON.parse(raw); };\nexport const read = (raw: string): any => { return JSON.parse(raw); };",
    );
    expect(asyncReports(messages)).toEqual([]);
    expect(
      messages.map((message) => {
        return message.ruleId;
      }),
    ).toEqual(
      expect.arrayContaining([
        "@typescript-eslint/no-explicit-any",
        "@typescript-eslint/no-unsafe-return",
      ]),
    );
  });
});
