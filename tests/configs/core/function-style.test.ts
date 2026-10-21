import type { Linter } from "eslint";
import type { Options } from "../../../src/types.js";

import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../dist/index.mjs";

const arrowRule = "@cravingmaker/prefer-arrow-functions";
const owners = new Set([
  arrowRule,
  "func-style",
  "no-restricted-syntax",
  "prefer-arrow-callback",
]);
// eslint-disable-next-line @typescript-eslint/strict-void-return -- promisify takes execFile's callback form, which also returns its child process.
const execute = promisify(execFile);
const lint = async (
  code: string,
  filePath = "src/example.js",
): Promise<readonly Linter.LintMessage[]> => {
  const eslint = new ESLint({
    overrideConfig: await createConfig({
      react: false,
      svelte: false,
      typescript: { typeChecked: false },
    }),
    overrideConfigFile: true,
  });
  const [result] = await eslint.lintText(code, { filePath });
  expect(result.fatalErrorCount).toBe(0);
  return result.messages.filter(({ ruleId }) => {
    return typeof ruleId === "string" && owners.has(ruleId);
  });
};

describe("D3 arrow function policy", () => {
  it.each([
    "let Factory; Factory = function Factory() {}; new Factory();",
    "function Factory() {} const Alias = Factory; new Alias();",
    "function Factory() {} let Alias; Alias = Factory; new Alias();",
    "function Factory() {} let First = Factory; let Second = First; First = Second; new Second();",
  ])(
    "preserves assigned and locally aliased constructors: %s",
    async (code) => {
      expect(await lint(code)).toEqual([]);
    },
  );
  it.each([
    { javascript: { files: ["lib/**"] } },
    { javascript: { ignores: ["src/**"] } },
    {
      javascript: {
        overrides: { "@cravingmaker/prefer-arrow-functions": "off" },
      },
    },
  ] satisfies readonly Options[])(
    "honors the JavaScript scope and overrides: %j",
    async (options) => {
      const scoped = new ESLint({
        overrideConfig: await createConfig({
          ...options,
          react: false,
          svelte: false,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const [result] = await scoped.lintText(
        "export const ordinary = function ordinary(value) { return value; };",
        { filePath: "src/example.js" },
      );
      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.filter(({ ruleId }) => {
          return typeof ruleId === "string" && owners.has(ruleId);
        }),
      ).toEqual([]);
    },
  );

  it("honors a following consumer override", async () => {
    const overridden = new ESLint({
      overrideConfig: await createConfig(
        { typescript: { typeChecked: false } },
        { rules: { [arrowRule]: "off" } },
      ),
      overrideConfigFile: true,
    });
    const [result] = await overridden.lintText(
      "function ordinary() { return 1; }",
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.filter(({ ruleId }) => {
        return typeof ruleId === "string" && owners.has(ruleId);
      }),
    ).toEqual([]);
  });

  it("retains receiver, arguments, new.target and named-recursion behavior after fixes", async () => {
    const source = [
      'import process from "node:process";',
      "function receiver() { return this.value; }",
      "function count() { return arguments.length; }",
      "const Factory = function Factory() { this.created = new.target === Factory; };",
      "const factorial = function recurse(value) { return value > 1 ? value * recurse(value - 1) : 1; };",
      "process.stdout.write(JSON.stringify([receiver.call({ value: 3 }), count(1, 2), new Factory().created, factorial(3)]));",
    ].join("\n");
    const fixer = new ESLint({
      fix: (message) => {
        return message.ruleId === arrowRule;
      },
      overrideConfig: await createConfig({
        react: false,
        svelte: false,
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });
    const [result] = await fixer.lintText(source, {
      filePath: "src/example.js",
    });
    expect(result.fatalErrorCount).toBe(0);
    expect(result.output).toBeUndefined();
    expect(
      result.messages.filter(({ ruleId }) => {
        return ruleId === arrowRule;
      }),
    ).toEqual([]);
    const outputs = await Promise.all(
      [source, result.output ?? source].map(async (code) => {
        const { stdout } = await execute(process.execPath, [
          "--input-type=module",
          "--eval",
          code,
        ]);
        return stdout;
      }),
    );
    expect(outputs).toEqual(["[3,2,true,6]", "[3,2,true,6]"]);
  });
  it.each(["src/example.js", "src/example.ts"])(
    "has one diagnostic owner in %s",
    async (filePath) => {
      await Promise.all(
        [
          "function declared() { return 1; }",
          "function create(Factory) { return new Factory(); }",
          "const create = function named(Factory) { return new Factory(); };",
          "consume(function callback(Factory) { return new Factory(); });",
          "export default function create(Factory) { return new Factory(); }",
          "export function declared() { return 1; }",
          "export default function declared() { return 1; }",
          "export default function () { return 1; }",
          "const value = function named() { return 1; };",
          "value = function named() { return 1; };",
          "const factory = () => { return function named() { return 1; }; };",
          "consume(function callback() { return 1; });",
          "consume(function () { return 1; });",
          "const value = async function named() { return 1; };",
          "const object = { value: function named() { return 1; } };",
          "const value = enabled ? function named() { return 1; } : fallback;",
          "class Example { value = function named() { return 1; }; }",
          "(function named() { return 1; })();",
          "function outer() { return function inner() { return this.value; }; }",
          "function outer() { class Inner { field = this; } return Inner; }",
        ].map(async (code) => {
          const reports = await lint(code, filePath);
          expect(reports, code).toEqual([
            expect.objectContaining({ ruleId: arrowRule, severity: 2 }),
          ]);
          expect(reports[0].fix).toBeUndefined();
          expect(reports[0].suggestions).toBeUndefined();
        }),
      );
    },
  );

  it.each(["src/example.js", "src/example.ts"])(
    "preserves semantic exceptions in %s",
    async (filePath) => {
      await Promise.all(
        [
          "const value = () => { return 1; };",
          "const value = async () => { return 1; };",
          "const object = { method() { return 1; }, get value() { return 1; }, set value(value) { this.current = value; } };",
          "class Example { constructor() {} method() { return 1; } get value() { return 1; } }",
          "function* values() { yield 1; }",
          "const values = function* values() { yield 1; };",
          "async function* values() { yield 1; }",
          "function receiver() { return this.value; }",
          "const receiver = function receiver() { return this.value; };",
          "consume(function receiver() { return this.value; });",
          "function receiver() { return () => { return this.value; }; }",
          "function receiver() { return class { [this.value] = 1; }; }",
          "function rest() { return arguments.length; }",
          "const rest = function rest() { return () => { return arguments.length; }; };",
          "function Factory() { return new.target; }",
          "const value = function named() { return new.target; };",
          "function Factory() {} new Factory();",
          "const Factory = function Factory() {}; new Factory();",
          "new (function Factory() {})();",
          "function Factory() {} class Example extends Factory {}",
          "function Factory() {} Factory.prototype.value = 1;",
          "function Factory() {} Reflect.construct(Factory, []);",
          "const recurse = function inner(value) { return value > 0 ? inner(value - 1) : 0; };",
        ].map(async (code) => {
          expect(await lint(code, filePath), code).toEqual([]);
        }),
      );
    },
  );

  it.each([
    "const value = (function named() { return 1; }) as () => number;",
    "const value = (function named() { return 1; }) satisfies () => number;",
    "const value = (function named() { return 1; })!;",
    "const value: () => number = function named() { return 1; };",
    "export default (function named() { return 1; }) as () => number;",
  ])(
    "reports traditional functions through TypeScript wrappers: %s",
    async (code) => {
      expect(await lint(code, "src/example.ts")).toEqual([
        expect.objectContaining({ ruleId: arrowRule }),
      ]);
    },
  );

  it.each([
    "function receiver(this: { value: number }) { return this.value; }",
    "function receiver(this: { value: number }) { return 1; }",
    "function select(value: string): string; function select(value: number): number; function select(value: string | number) { return value; }",
    "export function select(value: string): string; export function select(value: number): number; export function select(value: string | number) { return value; }",
    "declare function select(value: string): string;",
    "declare namespace API { function select(value: string): string; }",
  ])("preserves TypeScript signatures: %s", async (code) => {
    expect(await lint(code, "src/example.ts")).toEqual([]);
  });

  it("proves native expression mode cannot represent the semantic exceptions", async () => {
    const eslint = new ESLint({
      overrideConfig: [{ rules: { "func-style": ["error", "expression"] } }],
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      "function receiver() { return this.value; } function* values() { yield 1; }",
    );
    expect(
      result.messages.map(({ ruleId }) => {
        return ruleId;
      }),
    ).toEqual(["func-style", "func-style"]);
  });

  it("proves the audit selector misses return values and rejects dynamic receivers", async () => {
    const eslint = new ESLint({
      overrideConfig: [
        {
          rules: {
            "no-restricted-syntax": [
              "error",
              "VariableDeclarator > FunctionExpression.init[generator=false]",
            ],
          },
        },
      ],
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      "const receiver = function receiver() { return this.value; }; const factory = () => { return function ordinary() { return 1; }; };",
    );
    expect(result.messages).toEqual([
      expect.objectContaining({ column: 18, ruleId: "no-restricted-syntax" }),
    ]);
  });
});
