/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it } from "vitest";

// The messages of each file, by file name.
type LintMessages = Readonly<Record<string, readonly string[]>>;

const rootDirectory = process.cwd();

/*
Each fixture declares parameters of the same generic types: `ReadonlyArray`, `Readonly`, and
`ReadonlyMap`. In `readonly-deep.ts` their contents are readonly as well; in
`readonly-shallow.ts` they are not.
*/
const fixtures = {
  "mutable.ts": [
    "export function countValues(values: string[]): number { return values.length; }",
    "export function getName(user: { name: string }): string { return user.name; }",
  ],
  "readonly-deep.ts": [
    "export function countValues(values: readonly string[]): number { return values.length; }",
    "export function getName(user: Readonly<{ name: string }>): string { return user.name; }",
    "export function countEntries(entries: ReadonlyMap<string, string>): number { return entries.size; }",
  ],
  "readonly-shallow.ts": [
    "export function countItems(items: readonly { name: string }[]): number { return items.length; }",
    "export function countNames(user: Readonly<{ names: string[] }>): number { return user.names.length; }",
    "export function countEntries(entries: ReadonlyMap<string, string[]>): number { return entries.size; }",
  ],
} as const;
const tsconfig = {
  compilerOptions: {
    module: "esnext",
    moduleResolution: "bundler",
    skipLibCheck: true,
    strict: true,
    target: "es2022",
  },
  include: ["*.ts"],
};

/*
Lints the files named on the command line one after another in one process, and prints the
`functional/prefer-immutable-types` messages and fatal errors of each file. One `lintFiles`
call for all files would not keep their order: ESLint lints each file as soon as it is read.

eslint-plugin-functional caches the immutability of each type for the whole process, but not
while NODE_ENV is "test", which Vitest sets. The script removes it, so that the files linted
first fill the cache for the files after them, as in the ESLint CLI or an editor.
*/
const lintScript = `
import process from "node:process";

import { ESLint } from "eslint";

import { createConfig } from "./dist/index.mjs";

delete process.env.NODE_ENV;

const directory = process.argv[1];
const fileNames = process.argv.slice(2);
const eslint = new ESLint({
  cwd: directory,
  overrideConfig: await createConfig({
    projectRootDirectory: directory,
    typescript: { tsconfigRootDir: directory, typeChecked: true },
  }),
  overrideConfigFile: true,
});
const messages = {};
for (const fileName of fileNames) {
  const [result] = await eslint.lintFiles([fileName]);
  messages[fileName] = result.messages
    .filter(({ ruleId }) => ruleId === null || ruleId === "functional/prefer-immutable-types")
    .map(({ line, message }) => line + ": " + message);
}

process.stdout.write(JSON.stringify(messages));
`;

const fixtureDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-parameter-immutability-"),
);
const fixtureFiles = [
  ["tsconfig.json", JSON.stringify(tsconfig)],
  ...Object.entries(fixtures).map(([fileName, lines]) => [
    fileName,
    `${lines.join("\n")}\n`,
  ]),
] as const;

await Promise.all(
  fixtureFiles.map(async ([fileName, content]) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixtures are written to a new temporary directory.
    await writeFile(path.join(fixtureDirectory, fileName), content);
  }),
);

afterAll(async () => {
  await rm(fixtureDirectory, { force: true, recursive: true });
});

function lintInOrder(fileNames: readonly string[]): LintMessages {
  // eslint-disable-next-line n/no-sync -- Each run needs its own process, and the test waits for it.
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      lintScript,
      fixtureDirectory,
      ...fileNames,
    ],
    { cwd: rootDirectory, encoding: "utf8" },
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The lint script prints this shape.
  return JSON.parse(output) as LintMessages;
}

describe("functional/prefer-immutable-types", () => {
  it("reports the same parameters whatever files are linted before them", () => {
    const fileNames = Object.keys(fixtures);
    const forward = lintInOrder(fileNames);
    const backward = lintInOrder(fileNames.toReversed());

    expect(backward).toEqual(forward);
    expect(forward).toEqual({
      "mutable.ts": [
        '1: Parameter should have an immutability of at least "ReadonlyShallow" (actual: "Mutable").',
        '2: Parameter should have an immutability of at least "ReadonlyShallow" (actual: "Mutable").',
      ],
      "readonly-deep.ts": [],
      "readonly-shallow.ts": [],
    });
  }, 120_000);
});
