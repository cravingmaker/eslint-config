import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

const eslint = new ESLint({
  overrideConfig: await createConfig(),
  overrideConfigFile: true,
});
const limits = [
  {
    filePath: "example.js",
    id: "complexity",
    options: [{ max: 10, variant: "classic" }],
  },
  {
    filePath: "example.js",
    id: "max-params",
    options: [{ countThis: "never", max: 4 }],
  },
  {
    filePath: "tests/utilities.ts",
    id: "@typescript-eslint/max-params",
    options: [{ countVoidThis: false, max: 4 }],
  },
  {
    filePath: "example.js",
    id: "unicorn/max-nested-calls",
    options: [{ max: 3 }],
  },
  {
    filePath: "index.html",
    id: "@html-eslint/max-element-depth",
    options: [{ max: 6 }],
  },
  { filePath: "example.js", id: "max-depth", options: [{ max: 3 }] },
  {
    filePath: "example.js",
    id: "max-lines",
    options: [{ max: 600, skipBlankLines: true, skipComments: true }],
  },
  {
    filePath: "example.js",
    id: "max-lines-per-function",
    options: [
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- This is the installed core rule option name.
        IIFEs: true,
        max: 60,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
  },
  {
    filePath: "example.js",
    id: "max-nested-callbacks",
    options: [{ checkConstructorCallCallbacks: true, max: 3 }],
  },
  { filePath: "example.js", id: "sonarjs/cognitive-complexity", options: [15] },
  {
    filePath: "example.js",
    id: "sonarjs/expression-complexity",
    options: [{ max: 3 }],
  },
  {
    filePath: "tests/utilities.ts",
    id: "sonarjs/regex-complexity",
    options: [{ threshold: 20 }],
  },
];
const samples = [
  {
    at: `export const read = (value) => { ${"if (value) { consume(); } ".repeat(9)} return value; };`,
    filePath: "example.js",
    id: "complexity",
    over: `export const read = (value) => { ${"if (value) { consume(); } ".repeat(10)} return value; };`,
  },
  {
    at: "export const sum = (a, b, c, d) => { return a + b + c + d; };",
    filePath: "example.js",
    id: "max-params",
    over: "export const sum = (a, b, c, d, e) => { return a + b + c + d + e; };",
  },
  {
    at: "export const sum = (a: number, b: number, c: number, d: number) => { return a + b + c + d; };",
    filePath: "tests/support/lint.ts",
    id: "@typescript-eslint/max-params",
    over: "export const sum = (a: number, b: number, c: number, d: number, e: number) => { return a + b + c + d + e; };",
  },
  {
    at: "consume(read(load()));",
    filePath: "example.js",
    id: "unicorn/max-nested-calls",
    over: "consume(read(load(source())));",
  },
  {
    at: `${"<div>".repeat(6)}content${"</div>".repeat(6)}`,
    filePath: "index.html",
    id: "@html-eslint/max-element-depth",
    over: `${"<div>".repeat(7)}content${"</div>".repeat(7)}`,
  },
];
const reports = async (code: string, filePath: string, id: string) => {
  const [result] = await eslint.lintText(code, { filePath });
  expect(result.fatalErrorCount).toBe(0);
  return result.messages.filter(({ ruleId }) => {
    return ruleId === id;
  });
};

describe("quantitative maintainability limits", () => {
  it.each(limits)(
    "warns with the existing options for $id",
    async ({ filePath, id, options }) => {
      await expect(
        eslint.calculateConfigForFile(filePath),
      ).resolves.toHaveProperty(["rules", id], [1, ...options]);
    },
  );

  it.each(samples)(
    "reports above the unchanged $id boundary and accepts its limit",
    async ({ at, filePath, id, over }) => {
      expect(await reports(at, filePath, id)).toEqual([]);
      expect(await reports(over, filePath, id)).toEqual([
        expect.objectContaining({ ruleId: id, severity: 1 }),
      ]);
    },
  );

  it.each([false, true])(
    "keeps the TypeScript parameter owner with typed linting %s",
    async (typeChecked) => {
      const engine = new ESLint({
        overrideConfig: await createConfig({ typescript: { typeChecked } }),
        overrideConfigFile: true,
      });
      await expect(
        engine.calculateConfigForFile("tests/utilities.ts"),
      ).resolves.toHaveProperty(["rules", "max-params", 0], 0);
      const [result] = await engine.lintText(samples[2].over, {
        filePath: "tests/support/lint.ts",
      });
      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.filter(({ ruleId }) => {
          return ruleId === "@typescript-eslint/max-params";
        }),
      ).toEqual([expect.objectContaining({ severity: 1 })]);
    },
  );

  it.each([
    {
      count: 0,
      text: "export type Read = (this: void, a: number, b: number, c: number, d: number) => number;",
    },
    {
      count: 1,
      text: "export type Read = (this: void, a: number, b: number, c: number, d: number, e: number) => number;",
    },
    {
      count: 0,
      text: "export const read = function(this: object, a: number, b: number, c: number) { return a + b + c; };",
    },
    {
      count: 1,
      text: "export const read = function(this: object, a: number, b: number, c: number, d: number) { return a + b + c + d; };",
    },
  ])(
    "preserves TypeScript this-parameter counting: $text",
    async ({ count, text }) => {
      const messages = await reports(
        text,
        "tests/support/lint.ts",
        "@typescript-eslint/max-params",
      );
      expect(messages).toHaveLength(count);
      expect(
        messages.every(({ severity }) => {
          return severity === 1;
        }),
      ).toBe(true);
    },
  );

  it("preserves feature scopes and explicit consumer severity overrides", async () => {
    const config = await createConfig({
      html: { files: ["pages/**"], ignores: ["**/generated.html"] },
      javascript: {
        overrides: { complexity: ["error", { max: 10, variant: "classic" }] },
      },
      unicorn: false,
    });
    const engine = new ESLint({
      overrideConfig: config,
      overrideConfigFile: true,
    });
    await expect(
      engine.calculateConfigForFile("example.js"),
    ).resolves.toHaveProperty(["rules", "complexity", 0], 2);
    await expect(
      engine.calculateConfigForFile("example.js"),
    ).resolves.not.toHaveProperty(["rules", "unicorn/max-nested-calls"]);
    await expect(
      engine.calculateConfigForFile("pages/index.html"),
    ).resolves.toHaveProperty(
      ["rules", "@html-eslint/max-element-depth", 0],
      1,
    );
    await expect(
      engine.calculateConfigForFile("pages/generated.html"),
    ).resolves.toBeUndefined();
    await expect(
      engine.calculateConfigForFile("outside.html"),
    ).resolves.toBeUndefined();
  });
});

const directory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-warning-budget-"),
);
const configPath = path.join(directory, "eslint.config.mjs");
const entryUrl = pathToFileURL(path.resolve("dist/index.mjs")).href;
// eslint-disable-next-line security/detect-non-literal-fs-filename -- The CLI config is inside this suite's newly created temporary directory.
await writeFile(
  configPath,
  `import { createConfig } from ${JSON.stringify(entryUrl)};\nconst configs = await createConfig();\nconst owner = configs.find(({ name }) => name.endsWith('/javascript/rules'));\nexport default [{ rules: { 'max-params': owner.rules['max-params'] } }];\n`,
);
afterAll(async () => {
  await rm(directory, { force: true, recursive: true });
});

it.each([
  { args: [], count: 1, status: 0 },
  { args: ["--max-warnings", "0"], count: 1, status: 1 },
  { args: ["--quiet"], count: 0, status: 0 },
  { args: ["--quiet", "--max-warnings", "0"], count: 0, status: 1 },
])(
  "respects the CLI warning budget and quiet mode: $args",
  ({ args, count, status }) => {
    // eslint-disable-next-line n/no-sync -- Each assertion needs the completed ESLint CLI exit status and output.
    const result = spawnSync(
      process.execPath,
      [
        path.resolve("node_modules/eslint/bin/eslint.js"),
        "--config",
        configPath,
        "--format",
        "json",
        "--stdin",
        "--stdin-filename",
        "example.js",
        ...args,
      ],
      { cwd: directory, encoding: "utf8", input: samples[1].over },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(status);
    const output: unknown = JSON.parse(result.stdout);
    expect(output).toEqual(
      count === 0
        ? []
        : [
            expect.objectContaining({
              errorCount: 0,
              messages: [
                expect.objectContaining({ ruleId: "max-params", severity: 1 }),
              ],
              warningCount: 1,
            }),
          ],
    );
  },
);
