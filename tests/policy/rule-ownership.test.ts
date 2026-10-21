/* eslint-disable security/detect-non-literal-fs-filename -- The suite owns its temporary consumer project. */

import type { Linter } from "eslint";
import type { Options } from "../../src/types.js";

import { execFile } from "node:child_process";
import { mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

// eslint-disable-next-line @typescript-eslint/strict-void-return -- execFile also returns its child process.
const execute = promisify(execFile);
const temporaryPrefix = path.join(os.tmpdir(), "eslint-config-ownership-");
const temporaryDirectory = await mkdtemp(temporaryPrefix);
const directory = await realpath(temporaryDirectory);
afterAll(async () => {
  await rm(directory, { force: true, recursive: true });
});
await writeFile(
  path.join(directory, "package.json"),
  JSON.stringify({ engines: { node: ">=24.15.0" }, type: "module" }),
);
await writeFile(
  path.join(directory, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      allowUnreachableCode: false,
      jsx: "react-jsx",
      module: "nodenext",
      noEmit: true,
      noImplicitReturns: true,
      skipLibCheck: true,
      strict: true,
      target: "esnext",
      types: ["node"],
    },
    include: ["*.ts", "*.tsx"],
  }),
);
await symlink(
  path.join(process.cwd(), "node_modules"),
  path.join(directory, "node_modules"),
  "junction",
);
await Promise.all(
  ["typed.ts", "component.tsx"].map(async (fileName) => {
    await writeFile(path.join(directory, fileName), "export {};\n");
  }),
);

const createEngine = async (options: Options = {}, shouldFix = false) => {
  return new ESLint({
    cwd: directory,
    fix: shouldFix,
    overrideConfig: await createConfig({
      projectRootDirectory: directory,
      react: false,
      svelte: true,
      typescript: { tsconfigRootDir: directory },
      ...options,
    }),
    overrideConfigFile: true,
  });
};

const typed = await createEngine();
const untyped = await createEngine({ typescript: { typeChecked: false } });
const lint = async (engine: ESLint, text: string, fileName: string) => {
  const results = await engine.lintText(text, {
    filePath: path.join(directory, fileName),
  });
  expect(results).toHaveLength(1);
  const [result] = results;
  expect(
    result.messages.filter(({ fatal, ruleId }) => {
      return fatal === true || typeof ruleId !== "string";
    }),
  ).toEqual([]);
  return result;
};

const select = (
  messages: readonly Linter.LintMessage[],
  rules: readonly string[],
) => {
  return messages.filter(({ ruleId }) => {
    return typeof ruleId === "string" && rules.includes(ruleId);
  });
};

const compareRuleIds = (left: string, right: string) => {
  return left.localeCompare(right);
};

const groups = {
  await: ["promise/prefer-await-to-then", "unicorn/prefer-await"],
  buffer: [
    "no-restricted-syntax",
    "security/detect-new-buffer",
    "unicorn/no-new-buffer",
  ],
  control: ["no-control-regex", "regexp/no-control-character"],
  equality: ["eqeqeq", "no-eq-null"],
  escapes: ["no-useless-escape", "regexp/no-useless-escape"],
  eval: ["no-eval", "security/detect-eval-with-expression"],
  exec: [
    "@typescript-eslint/prefer-regexp-exec",
    "regexp/prefer-regexp-exec",
    "sonarjs/prefer-regexp-exec",
  ],
  redos: [
    "regexp/no-super-linear-backtracking",
    "regexp/no-super-linear-move",
    "security/detect-unsafe-regex",
  ],
  sort: [
    "@typescript-eslint/require-array-sort-compare",
    "unicorn/require-array-sort-compare",
  ],
  switch: ["default-case", "@typescript-eslint/switch-exhaustiveness-check"],
  ternary: ["no-nested-ternary", "unicorn/no-unnecessary-nested-ternary"],
  unicode: ["require-unicode-regexp", "sonarjs/unicode-aware-regex"],
} as const;
type Sample = {
  readonly expected: readonly string[];
  readonly group: keyof typeof groups;
  readonly name: string;
  readonly text: string;

  readonly typedExpected?: readonly string[];
  readonly typedText?: string;
};
const samples: readonly Sample[] = [
  {
    expected: ["eqeqeq"],
    group: "equality",
    name: "D8.1 loose null",
    text: "value == null;",
  },
  {
    expected: ["eqeqeq"],
    group: "equality",
    name: "D8.1 loose null inequality",
    text: "value != null;",
  },
  {
    expected: ["eqeqeq"],
    group: "equality",
    name: "D8.1 loose non-null",
    text: 'value != "ready";',
  },
  {
    expected: [],
    group: "equality",
    name: "D8.1 strict null",
    text: "value !== null;",
  },
  {
    expected: [],
    group: "equality",
    name: "D8.1 strict non-null",
    text: 'value === "ready";',
  },
  ...[
    "eval(input);",
    'eval("1 + 1");',
    "eval?.(input);",
    "(0, eval)(input);",
  ].map((text): Sample => {
    return { expected: ["no-eval"], group: "eval", name: `D8.2 ${text}`, text };
  }),
  {
    expected: [],
    group: "eval",
    name: "D8.2 JSON parsing",
    text: "JSON.parse(input);",
  },
  {
    expected: ["no-nested-ternary"],
    group: "ternary",
    name: "D8.3 reducible result branch",
    text: 'enabled ? (ready ? "yes" : "no") : "no";',
  },
  {
    expected: ["no-nested-ternary"],
    group: "ternary",
    name: "D8.3 distinct result branches",
    text: 'enabled ? (ready ? "yes" : "wait") : "no";',
  },
  {
    expected: [],
    group: "ternary",
    name: "D8.3 condition-position boundary",
    text: '(enabled ? ready : fallback) ? "yes" : "no";',
  },
  {
    expected: [],
    group: "ternary",
    name: "D8.3 flat replacement",
    text: 'enabled && ready ? "yes" : "no";',
  },
  {
    expected: ["no-useless-escape"],
    group: "escapes",
    name: "D8.4 ordinary string",
    text: String.raw`const text = "\a";`,
  },
  {
    expected: ["regexp/no-useless-escape"],
    group: "escapes",
    name: "D8.4 constructor",
    text: String.raw`const pattern = new RegExp("[\\[]", "u");`,
  },
  {
    expected: ["no-useless-escape", "regexp/no-useless-escape"],
    group: "escapes",
    name: "D8.4 shared literal",
    text: String.raw`const pattern = /\a/;`,
  },
  {
    expected: ["no-useless-escape"],
    group: "escapes",
    name: "D8.4 core-only regex literal",
    text: String.raw`const pattern = /[a\-]/u;`,
  },
  {
    expected: [],
    group: "escapes",
    name: "D8.4 plain string",
    text: 'const text = "plain";',
  },
  {
    expected: ["regexp/no-control-character"],
    group: "control",
    name: "D8.5 direct control escape",
    text: String.raw`const pattern = /\x1F/u;`,
  },
  {
    expected: ["regexp/no-control-character"],
    group: "control",
    name: "D8.5 constant constructor pattern",
    text: String.raw`const source = "\\x1F"; const pattern = new RegExp(source, "u");`,
  },
  {
    expected: [],
    group: "control",
    name: "D8.5 intentional constructor tab",
    text: String.raw`const pattern = new RegExp("\t", "u");`,
  },
  {
    expected: [],
    group: "control",
    name: "D8.5 intentional constructor newline",
    text: String.raw`const pattern = new RegExp("\n", "u");`,
  },
  {
    expected: [],
    group: "control",
    name: "D8.5 explicit regex tab",
    text: String.raw`const pattern = new RegExp("\\t", "u");`,
  },
  {
    expected: [...groups.redos, "regexp/no-super-linear-move"],
    group: "redos",
    name: "D8.6 shared nested repetition",
    text: "const pattern = /(a+)+$/u;",
  },
  {
    expected: [
      "regexp/no-super-linear-backtracking",
      "regexp/no-super-linear-move",
      "regexp/no-super-linear-move",
    ],
    group: "redos",
    name: "D8.6 adjacent quantifiers",
    text: "const pattern = /a+a+$/u;",
  },
  {
    expected: ["regexp/no-super-linear-move"],
    group: "redos",
    name: "D8.6 movement only",
    text: "const pattern = /a+b/u;",
  },
  {
    expected: ["security/detect-unsafe-regex"],
    group: "redos",
    name: "D8.6 bounded heuristic",
    text: "const pattern = /^(a{1,3}){1,3}$/u;",
  },
  {
    expected: [],
    group: "redos",
    name: "D8.6 linear control",
    text: "const pattern = /^abc$/u;",
  },
  ...[
    "new Buffer(10);",
    "new Buffer(size);",
    'const { Buffer } = await import("node:buffer"); new Buffer(10);',
    'const { Buffer } = await import("node:buffer"); new Buffer(size);',
    "class Buffer {} new Buffer(10);",
  ].map((text): Sample => {
    return {
      expected: ["no-restricted-syntax"],
      group: "buffer",
      name: `D8.7 ${text}`,
      text,
    };
  }),
  {
    expected: [],
    group: "buffer",
    name: "D8.7 Uint8Array",
    text: "new Uint8Array(10);",
  },
  {
    expected: [],
    group: "buffer",
    name: "D8.7 alias boundary",
    text: 'const { Buffer: NodeBuffer } = await import("node:buffer"); new NodeBuffer(size);',
  },
  {
    expected: [],
    group: "buffer",
    name: "D8.7 global-property selector boundary",
    text: "new globalThis.Buffer(size);",
  },
  {
    expected: groups.await,
    group: "await",
    name: "D8.8 returned chain",
    text: "const load = (task) => { return task.then(consume); };",
    typedText:
      "const load = (task: Promise<string>) => { return task.then(consume); };",
  },
  {
    expected: ["unicorn/prefer-await"],
    group: "await",
    name: "D8.8 awaited chain",
    text: "const load = async (task) => { await task.then(consume); };",
    typedText:
      "const load = async (task: Promise<string>) => { await task.then(consume); };",
  },
  {
    expected: ["promise/prefer-await-to-then"],
    group: "await",
    name: "D8.8 discarded chain inside a function",
    text: "const start = (task) => { void task.catch(handleError); };",
    typedText:
      "const start = (task: Promise<string>) => { void task.catch(handleError); };",
  },
  {
    expected: ["unicorn/prefer-await"],
    group: "await",
    name: "D8.8 top-level chain",
    text: "Promise.resolve(1).then(consume);",
  },
  {
    expected: [],
    group: "await",
    name: "D8.8 top-level void boundary",
    text: "void Promise.resolve(1).catch(handleError);",
  },
  {
    expected: ["unicorn/prefer-await"],
    group: "await",
    name: "D8.8 computed method",
    text: 'const load = (task) => { return task["then"](consume); };',
    typedText:
      'const load = (task: Promise<string>) => { return task["then"](consume); };',
  },
  {
    expected: ["unicorn/prefer-await"],
    group: "await",
    name: "D8.8 yielded chain",
    text: "function* load() { yield Promise.resolve(1).then(consume); }",
  },
  {
    expected: ["unicorn/prefer-await"],
    group: "await",
    name: "D8.8 constructor",
    text: "class Loader { constructor() { Promise.resolve(1).then(consume); } }",
  },
  {
    expected: groups.await,
    group: "await",
    name: "D8.8 typed non-promise heuristic",
    text: "const store = { catch: () => { return 1; } }; const read = () => { return store.catch(); };",
    typedExpected: ["promise/prefer-await-to-then"],
  },
  {
    expected: [],
    group: "await",
    name: "D8.8 plain await",
    text: "const read = async () => { return await Promise.resolve(1); };",
  },
  {
    expected: ["unicorn/require-array-sort-compare"],
    group: "sort",
    name: "D8.9 numeric array",
    text: "[10, 2, 1].toSorted();",
    typedExpected: groups.sort,
  },
  {
    expected: ["unicorn/require-array-sort-compare"],
    group: "sort",
    name: "D8.9 string array",
    text: '["b", "a"].sort();',
  },
  {
    expected: ["unicorn/require-array-sort-compare"],
    group: "sort",
    name: "D8.9 undefined comparator",
    text: "[10, 2, 1].sort(undefined);",
  },
  {
    expected: [],
    group: "sort",
    name: "D8.9 computed method",
    text: '[10, 2, 1]["sort"]();',
    typedExpected: ["@typescript-eslint/require-array-sort-compare"],
  },
  {
    expected: [],
    group: "sort",
    name: "D8.9 optional call",
    text: "[10, 2, 1].sort?.();",
    typedExpected: ["@typescript-eslint/require-array-sort-compare"],
  },
  {
    expected: [],
    group: "sort",
    name: "D8.9 numeric comparator",
    text: "[10, 2, 1].toSorted((left, right) => { return left - right; });",
  },
  {
    expected: [],
    group: "sort",
    name: "D8.9 Uint8Array",
    text: "new Uint8Array([10, 2, 1]).sort();",
  },
  {
    expected: [],
    group: "sort",
    name: "D8.9 BigInt64Array",
    text: "new BigInt64Array([10n, 2n, 1n]).sort();",
  },
  {
    expected: ["regexp/prefer-regexp-exec"],
    group: "exec",
    name: "D8.10 ordinary match",
    text: '"aba".match(/a/u);',
  },
  {
    expected: [],
    group: "exec",
    name: "D8.10 global match",
    text: '"aba".match(/a/gu);',
  },
  {
    expected: [],
    group: "exec",
    name: "D8.10 accepted computed-access loss",
    text: '"aba"["match"](/a/u);',
  },
  {
    expected: [],
    group: "exec",
    name: "D8.10 inherited flags",
    text: "const read = (text, source) => { return text.match(new RegExp(source)); };",
    typedExpected: ["regexp/prefer-regexp-exec"],
    typedText:
      "const read = (text: string, source: RegExp) => { return text.match(new RegExp(source)); };",
  },
  {
    expected: [],
    group: "exec",
    name: "D8.10 explicit execution",
    text: '/a/u.exec("aba");',
  },
  {
    expected: ["require-unicode-regexp"],
    group: "unicode",
    name: "D8.11 general flag requirement",
    text: "const pattern = /abc/;",
  },
  {
    expected: ["require-unicode-regexp"],
    group: "unicode",
    name: "D8.11 explicit Unicode syntax",
    text: String.raw`const pattern = /\p{L}/;`,
    typedExpected: groups.unicode,
  },
  {
    expected: [],
    group: "unicode",
    name: "D8.11 u flag",
    text: String.raw`const pattern = /\p{L}/u;`,
  },
  {
    expected: [],
    group: "unicode",
    name: "D8.11 v flag",
    text: String.raw`const pattern = /\p{L}/v;`,
  },
  {
    expected: [],
    group: "unicode",
    name: "D8.11 implicit match pattern",
    text: String.raw`"A".match("\\p{L}");`,
    typedExpected: ["sonarjs/unicode-aware-regex"],
  },
  {
    expected: [],
    group: "unicode",
    name: "D8.11 implicit search pattern",
    text: String.raw`"A".search("\\p{L}");`,
    typedExpected: ["sonarjs/unicode-aware-regex"],
  },
  {
    expected: ["default-case"],
    group: "switch",
    name: "D8.12 missing broad-type default",
    text: 'const read = (state) => { switch (state) { case "ready": break; } };',
    typedExpected: groups.switch,
    typedText:
      'const read = (state: string) => { switch (state) { case "ready": break; } };',
  },
  {
    expected: [],
    group: "switch",
    name: "D8.12 empty switch",
    text: "const read = (state) => { switch (state) {} };",
    typedExpected: ["@typescript-eslint/switch-exhaustiveness-check"],
    typedText: "const read = (state: string) => { switch (state) {} };",
  },
  {
    expected: [],
    group: "switch",
    name: "D8.12 exact omission marker",
    text: 'const read = (state) => { switch (state) { case "ready": break;\n// no default\n} };',
    typedText:
      'const read = (state: string) => { switch (state) { case "ready": break;\n// no default\n} };',
  },
  {
    expected: [],
    group: "switch",
    name: "D8.12 uppercase omission marker",
    text: 'const read = (state) => { switch (state) { case "ready": break;\n// NO DEFAULT\n} };',
    typedExpected: ["@typescript-eslint/switch-exhaustiveness-check"],
    typedText:
      'const read = (state: string) => { switch (state) { case "ready": break;\n// NO DEFAULT\n} };',
  },
  {
    expected: ["default-case"],
    group: "switch",
    name: "D8.12 misplaced omission marker",
    text: 'const read = (state) => { switch (state) {\n// no default\ncase "ready": break; } };',
    typedExpected: groups.switch,
    typedText:
      'const read = (state: string) => { switch (state) {\n// no default\ncase "ready": break; } };',
  },
  {
    expected: [],
    group: "switch",
    name: "D8.12 missing union case despite default",
    text: 'const read = (state) => { switch (state) { case "ready": break; default: break; } };',
    typedExpected: ["@typescript-eslint/switch-exhaustiveness-check"],
    typedText:
      'const read = (state: "ready" | "failed") => { switch (state) { case "ready": break; default: break; } };',
  },
  {
    expected: ["default-case"],
    group: "switch",
    name: "D8.12 exhaustive union still needs fallback intent",
    text: 'const read = (state) => { switch (state) { case "ready": break; case "failed": break; } };',
    typedText:
      'const read = (state: "ready" | "failed") => { switch (state) { case "ready": break; case "failed": break; } };',
  },
  {
    expected: [],
    group: "switch",
    name: "D8.12 exhaustive union with default",
    text: 'const read = (state) => { switch (state) { case "ready": break; case "failed": break; default: break; } };',
    typedText:
      'const read = (state: "ready" | "failed") => { switch (state) { case "ready": break; case "failed": break; default: break; } };',
  },
  {
    expected: [],
    group: "switch",
    name: "D8.12 missing enum member despite default",
    text: 'const read = (state) => { switch (state) { case "ready": break; default: break; } };',
    typedExpected: ["@typescript-eslint/switch-exhaustiveness-check"],
    typedText:
      'enum State { Ready = "ready", Failed = "failed" } const read = (state: State) => { switch (state) { case State.Ready: break; default: break; } };',
  },
];

describe.each([
  { fileName: "sample.js", name: "JavaScript", typeAware: false },
  { fileName: "sample.ts", name: "untyped TypeScript", typeAware: false },
  { fileName: "typed.ts", name: "typed TypeScript", typeAware: true },
  { fileName: "component.tsx", name: "typed TSX", typeAware: true },
  { fileName: "View.svelte", name: "Svelte JavaScript", typeAware: false },
  { fileName: "TypedView.svelte", name: "Svelte TypeScript", typeAware: false },
])("reviewed ownership in $name", ({ fileName, typeAware }) => {
  it.each(samples)(
    "$name",
    async ({ expected, group, text, typedExpected, typedText }) => {
      const source = typeAware ? (typedText ?? text) : text;
      const code = fileName.endsWith(".svelte")
        ? `<script${fileName.startsWith("Typed") ? ' lang="ts"' : ""}>\n${source}\n</script>\n`
        : source;
      const result = await lint(typeAware ? typed : untyped, code, fileName);
      // eslint-disable-next-line security/detect-object-injection -- The key is a fixed coverage group from this suite's sample matrix.
      const reports = select(result.messages, groups[group]);
      const ruleIds = reports.map(({ ruleId }) => {
        return ruleId ?? expect.fail("Expected a rule diagnostic");
      });
      const wanted = typeAware ? (typedExpected ?? expected) : expected;
      expect(ruleIds.toSorted(compareRuleIds)).toEqual(
        wanted.toSorted(compareRuleIds),
      );
      expect(
        reports.every(({ ruleId, severity }) => {
          return (
            severity === (ruleId === "security/detect-unsafe-regex" ? 1 : 2)
          );
        }),
      ).toBe(true);
    },
  );
});

describe("policy-aligned fixes", () => {
  it("D8.11 leaves Unicode-mode changes for review", async () => {
    const fixer = await createEngine(
      { typescript: { typeChecked: false } },
      true,
    );
    const code = 'export const matches = /^.$/.test("😀");\n';
    const first = await lint(fixer, code, "sample.js");
    const fixed = first.output ?? code;
    const second = await lint(fixer, fixed, "sample.js");
    expect(fixed).toContain('/^.$/.test("😀")');
    expect(second.output).toBeUndefined();
    expect(select(second.messages, groups.unicode)).toEqual([
      expect.objectContaining({ ruleId: "require-unicode-regexp" }),
    ]);
    const { stdout } = await execute(process.execPath, [
      "--input-type=module",
      "--eval",
      `${fixed}\nprocess.stdout.write(JSON.stringify([matches, /^.$/u.test("😀")]));`,
    ]);
    expect(JSON.parse(stdout)).toEqual([false, true]);
  });
  it("D8.7 leaves direct Buffer constructors for manual conversion", async () => {
    const fixer = await createEngine(
      { typescript: { typeChecked: false } },
      true,
    );
    const code =
      'const { Buffer } = await import("node:buffer");\nexport const bytes = new Buffer(10);\n';
    const first = await lint(fixer, code, "sample.js");
    const second = await lint(fixer, first.output ?? code, "sample.js");
    expect(first.output ?? code).toContain("new Buffer(10)");
    expect(first.output ?? code).not.toMatch(/Buffer\.(?:alloc|from)/u);
    expect(second.output).toBeUndefined();
    expect(select(second.messages, groups.buffer)).toEqual([
      expect.objectContaining({
        message: "Use Uint8Array instead.",
        ruleId: "no-restricted-syntax",
      }),
    ]);
    expect(
      select(first.messages, groups.buffer).every(({ fix, suggestions }) => {
        return typeof fix === "undefined" && typeof suggestions === "undefined";
      }),
    ).toBe(true);
  });
  it("D8.10 preserves all global matches through repeated composed fixes", async () => {
    const fixer = await createEngine({}, true);
    const code =
      "export const read = (text: string, source: RegExp) => { return text.match(new RegExp(source)); };\n";
    const first = await lint(fixer, code, "typed.ts");
    const second = await lint(fixer, first.output ?? code, "typed.ts");
    const fixed = first.output ?? code;
    expect(fixed).toContain("text.match(new RegExp(source))");
    expect(second.output).toBeUndefined();
    expect(select(second.messages, groups.exec)).toEqual([
      expect.objectContaining({ ruleId: "regexp/prefer-regexp-exec" }),
    ]);
    expect(select(second.messages, groups.exec)[0]?.fix).toBeUndefined();
    const { stdout } = await execute(process.execPath, [
      "--input-type=module-typescript",
      "--eval",
      `${fixed}\nprocess.stdout.write(JSON.stringify([read("aba", /a/gu), read("aba", /a/u)]));`,
    ]);
    expect(JSON.parse(stdout)).toEqual([["a", "a"], ["a"]]);
  });
});

describe("effective settings and static ownership", () => {
  it.each([
    { code: "Buffer.alloc(10);", owner: "no-restricted-globals" },
    { code: "globalThis.Buffer.from(input);", owner: "no-restricted-globals" },
    {
      code: 'import { Buffer as NodeBuffer } from "node:buffer"; new NodeBuffer(10);',
      owner: "no-restricted-imports",
    },
    {
      code: 'import { Buffer } from "buffer"; Buffer.alloc(10);',
      owner: "no-restricted-imports",
    },
    {
      code: 'import { Buffer } from "node:buffer"; new Buffer(10);',
      owner: "n/no-deprecated-api",
    },
  ])("D8.7 retains $owner for $code", async ({ code, owner }) => {
    const result = await lint(untyped, code, "sample.js");
    expect(select(result.messages, [owner])).toEqual([
      expect.objectContaining({ ruleId: owner, severity: 2 }),
    ]);
  });
  it("retains the reviewed complementary settings and typed guards", async () => {
    expect(
      await typed.calculateConfigForFile(path.join(directory, "typed.ts")),
    ).toMatchObject({
      rules: {
        "default-case": [2, {}],
        eqeqeq: [2, "always", { null: "always" }],
        "n/no-deprecated-api": [
          2,
          { ignoreGlobalItems: [], ignoreModuleItems: [] },
        ],
        "no-control-regex": [0],
        "no-eq-null": [0],
        "no-eval": [2, { allowIndirect: false }],
        "no-nested-ternary": [2],
        "no-useless-escape": [2, { allowRegexCharacters: [] }],
        "promise/prefer-await-to-then": [2, { strict: false }],
        "regexp/no-control-character": [2],
        "regexp/no-super-linear-backtracking": [2, { report: "certain" }],
        "regexp/no-super-linear-move": [
          2,
          { ignorePartial: true, ignoreSticky: true, report: "certain" },
        ],
        "regexp/no-useless-escape": [2],
        "regexp/prefer-regexp-exec": [2],
        "require-unicode-regexp": [2, {}],
        "security/detect-eval-with-expression": [0],
        "security/detect-new-buffer": [0],
        "security/detect-unsafe-regex": [1],
        "sonarjs/prefer-regexp-exec": [0],
        "sonarjs/unicode-aware-regex": [2],
        "@typescript-eslint/prefer-regexp-exec": [0],
        "@typescript-eslint/require-array-sort-compare": [
          2,
          { ignoreStringArrays: true },
        ],
        "@typescript-eslint/switch-exhaustiveness-check": [
          2,
          {
            allowDefaultCaseForExhaustiveSwitch: true,
            considerDefaultExhaustiveForUnions: false,
            defaultCaseCommentPattern: "^no default$",
            requireDefaultForNonUnion: true,
          },
        ],
        "unicorn/no-new-buffer": [0],
        "unicorn/no-unnecessary-nested-ternary": [0],
        "unicorn/prefer-await": [2],
        "unicorn/require-array-sort-compare": [2],
      },
    });
    expect(
      await untyped.calculateConfigForFile(path.join(directory, "sample.ts")),
    ).toMatchObject({
      rules: {
        "sonarjs/unicode-aware-regex": [0],
        "@typescript-eslint/prefer-regexp-exec": [0],
        "@typescript-eslint/require-array-sort-compare": [0],
        "@typescript-eslint/switch-exhaustiveness-check": [0],
      },
    });
  });
  it.each([
    { javascript: { files: ["lib/**"] } },
    { javascript: { ignores: ["sample.js"] } },
    {
      javascript: {
        overrides: {
          eqeqeq: "off",
          "no-eval": "off",
          "no-nested-ternary": "off",
          "no-restricted-syntax": "off",
        },
      },
    },
  ] as const satisfies readonly Options[])(
    "does not revive alternatives when the core owner is unavailable: %j",
    async (options) => {
      const engine = await createEngine(options);
      const result = await lint(
        engine,
        'value == null; eval(input); enabled ? (ready ? "yes" : "no") : "no"; new Buffer(size);',
        "sample.js",
      );
      expect(
        select(result.messages, [
          ...groups.equality,
          ...groups.eval,
          ...groups.ternary,
          ...groups.buffer,
        ]),
      ).toEqual([]);
    },
  );
  it.each([
    { regexp: false },
    { regexp: { files: ["lib/**"] } },
    { regexp: { ignores: ["typed.ts"] } },
  ] as const satisfies readonly Options[])(
    "keeps execution and control alternatives off when RegExp is unavailable: %j",
    async (options) => {
      const engine = await createEngine(options);
      const result = await lint(
        engine,
        String.raw`"aba".match(/a/u); new RegExp("\t", "u");`,
        "typed.ts",
      );
      expect(
        select(result.messages, [...groups.exec, ...groups.control]),
      ).toEqual([]);
    },
  );
  it.each([
    { expected: ["promise/prefer-await-to-then"], unicorn: false },
    { expected: ["unicorn/prefer-await"], promise: false },
  ] as const)(
    "retains the other await check with %j",
    async ({ expected, ...options }) => {
      const engine = await createEngine(options);
      const result = await lint(
        engine,
        "Promise.resolve(1).then(consume); const start = () => { void Promise.resolve(1).catch(handleError); };",
        "sample.js",
      );
      expect(
        select(result.messages, groups.await).map(({ ruleId }) => {
          return ruleId;
        }),
      ).toEqual(expected);
    },
  );
  it("permits deliberate core, Security, and Unicorn overrides", async () => {
    const engine = await createEngine({
      javascript: {
        overrides: {
          eqeqeq: "off",
          "no-eq-null": "warn",
          "no-eval": "off",
          "no-nested-ternary": "off",
          "no-restricted-syntax": "off",
        },
      },
      security: {
        overrides: {
          "security/detect-eval-with-expression": "warn",
          "security/detect-new-buffer": "warn",
        },
      },
      unicorn: {
        overrides: {
          "unicorn/no-new-buffer": "warn",
          "unicorn/no-unnecessary-nested-ternary": "warn",
        },
      },
    });
    const result = await lint(
      engine,
      'value == null; eval(input); new Buffer(size); enabled ? (ready ? "yes" : "no") : "no";',
      "sample.js",
    );
    const reports = select(result.messages, [
      ...groups.equality,
      ...groups.eval,
      ...groups.buffer,
      ...groups.ternary,
    ]);
    expect(
      reports.map(({ ruleId }) => {
        return ruleId;
      }),
    ).toEqual(
      expect.arrayContaining([
        "no-eq-null",
        "security/detect-eval-with-expression",
        "security/detect-new-buffer",
        "unicorn/no-new-buffer",
        "unicorn/no-unnecessary-nested-ternary",
      ]),
    );
    expect(reports).toHaveLength(5);
    expect(
      reports.every(({ severity }) => {
        return severity === 1;
      }),
    ).toBe(true);
  });
  it.each([
    { typeChecked: true },
    { typeChecked: false },
    { ignoresTypeAware: ["typed.ts"], typeChecked: true },
  ])(
    "limits an explicit TypeScript execution override to available type information: %j",
    async (scope) => {
      const engine = await createEngine({
        typescript: {
          tsconfigRootDir: directory,
          ...scope,
          overrides: { "@typescript-eslint/prefer-regexp-exec": "warn" },
        },
      });
      const result = await lint(engine, '"aba"["match"](/a/u);', "typed.ts");
      expect(
        select(result.messages, ["@typescript-eslint/prefer-regexp-exec"]),
      ).toHaveLength(
        scope.typeChecked && !("ignoresTypeAware" in scope) ? 1 : 0,
      );
    },
  );
});
