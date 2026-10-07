import type { Options as PrettierOptions } from "prettier";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import repositoryPrettierConfig from "@cravingmaker/prettier-config";
import { ESLint } from "eslint";
import { format as formatWithPrettier } from "prettier";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

const fixturesDirectory = fileURLToPath(
  new URL("../fixtures", import.meta.url),
);
// Every fixture.
const fixturePaths = [
  "data.json",
  "data.json5",
  "format-date.d.ts",
  "format-date.js",
  "index.html",
  "package.json",
  "parse-version.mjs",
  "react/Counter.tsx",
  "react/Greeting.jsx",
  "react/use-toggle.ts",
  "README.md",
  "settle.mts",
  "svelte/Counter.svelte",
  "svelte/theme.svelte.ts",
  "svelte/Toggle.svelte",
  "svelte/visits.svelte.js",
  "temperature.ts",
  "tsconfig.json",
] as const;
/*
Prettier's defaults, this repository's configuration, and two layouts that other projects choose.
Prettier formats Svelte components only with prettier-plugin-svelte, which this repository's
configuration loads when it is installed, and the others load explicitly.
*/
const prettierConfigs = new Map<string, PrettierOptions>([
  ["defaults", { plugins: ["prettier-plugin-svelte"] }],
  [
    "single quotes without semicolons",
    {
      arrowParens: "avoid",
      plugins: ["prettier-plugin-svelte"],
      semi: false,
      singleQuote: true,
      trailingComma: "none",
    },
  ],
  [
    "tabs and 120 columns",
    { plugins: ["prettier-plugin-svelte"], printWidth: 120, useTabs: true },
  ],
  ["the configuration of this repository", repositoryPrettierConfig],
]);
/*
Files with problems that eslint --fix fixes, in each language that the configuration lints, by
name: unsorted imports, keys, members, and attributes, core and plugin rules with fixes, and
layout that Prettier changes.
*/
const unfixedFiles = new Map([
  [
    "package.json",
    '{"version": "1.0.0", "name": "unfixed", "type": "module", "private": true, "description": "Unfixed", "author": "Someone", "scripts": {"test": "vitest", "build": "tsdown"}, "devDependencies": {"zod": "1.0.0", "ava": "1.0.0"}, "engines": {"node": ">=24"}, "devEngines": {"runtime": {"name": "node"}}, "peerDependencies": {"react": ">=19"}, "peerDependenciesMeta": {"react": {"optional": true}}}',
  ],
  [
    "unfixed.html",
    '<!DOCTYPE html><html lang="en"><head><title>Unfixed</title><meta charset="utf-8"></head><body><IMG alt="x" src="a.png" width="1" height="1" loading="lazy" decoding="async"><p class="b  a">Text</p></body></html>',
  ],
  [
    "unfixed.js",
    [
      'import { writeFile, readFile } from "fs/promises"',
      'import path from "path"',
      "var list = [3, 1, 2]",
      "const options = {zeta: 1, alpha: 2, 'beta': 3}",
      "function greet(name) { return 'Hello, ' + name + '!' }",
      "const last = list[list.length - 1]",
      "const found = list.indexOf(2) !== -1",
      "const parsed = parseInt('42', 10)",
      "const sorted = {name: name, value: last}",
      "if (found) { console.log(sorted) } else { console.log(parsed) }",
      "export { readFile, writeFile, path, options, greet }",
      "",
    ].join("\n"),
  ],
  ["unfixed.json", '{"zeta": 1, "alpha": {"d": 1, "c": 2}, "beta": [3, 2]}'],
  [
    "unfixed.md",
    "#Title\n\nSome ** strong ** text, and a bare link: https://example.com\n\n* one\n* two\n",
  ],
  [
    "unfixed.svelte",
    [
      '<script lang="ts">',
      "  import { writable, derived } from 'svelte/store'",
      "  var count = writable(0)",
      "  const doubled = derived(count, ($count) => $count * 2)",
      "  let label = 'Count: ' + 1",
      "</script>",
      "",
      '<p class="b  a">{label} {$doubled}</p>',
      "",
    ].join("\n"),
  ],
  [
    "unfixed.ts",
    [
      "import type { Readable } from 'node:stream'",
      "import { Writable } from 'node:stream'",
      "interface Shape { size: number; name: string }",
      "type Values = Array<string>",
      "const value = <string>'one'",
      "function area(shape: Shape): number { return shape.size * shape.size }",
      "export const result = { values: ['b', 'a'] as Values, area, value }",
      "export type { Readable, Shape }",
      "export { Writable }",
      "",
    ].join("\n"),
  ],
]);

/*
ESLint with every feature and framework on. The fixtures are linted with typed linting, apart from
the React fixtures, as in `fixtures.test.ts`; the unfixed files exist only in memory, where the
project service cannot find them, so they are linted without it.
*/
async function createEslint(isTypeChecked: boolean): Promise<ESLint> {
  return new ESLint({
    cwd: fixturesDirectory,
    fix: true,
    overrideConfig: await createConfig({
      express: true,
      projectRootDirectory: fixturesDirectory,
      react: { refresh: "generic" },
      svelte: true,
      typescript: {
        ignoresTypeAware: ["react/**"],
        tsconfigRootDir: fixturesDirectory,
        typeChecked: isTypeChecked,
      },
    }),
    overrideConfigFile: true,
  });
}
/*
Runs eslint --fix on `code` as `filePath`, and returns the fixed code and the messages that remain,
marking those that ESLint could still fix.
*/
async function fix(
  eslint: ESLint,
  code: string,
  filePath: string,
): Promise<{ readonly messages: readonly string[]; readonly output: string }> {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(fixturesDirectory, filePath),
  });
  return {
    messages: result.messages.map(
      ({ fix: messageFix, line, ruleId }) =>
        `${String(line)} ${ruleId ?? "fatal"}${messageFix === undefined ? "" : " (fixable)"}`,
    ),
    output: result.output ?? code,
  };
}
async function format(
  code: string,
  filePath: string,
  options: Readonly<PrettierOptions>,
): Promise<string> {
  return await formatWithPrettier(code, {
    ...options,
    filepath: path.join(fixturesDirectory, filePath),
  });
}

describe.each([...prettierConfigs])("Prettier with %s", (_name, options) => {
  const typedEslint = createEslint(true);
  const eslint = createEslint(false);

  it.each(fixturePaths)(
    "prints %s in a way that ESLint accepts and does not fix",
    async (fixturePath) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixtures directory has a fixed path.
      const source = await readFile(
        path.join(fixturesDirectory, fixturePath),
        "utf8",
      );
      const formatted = await format(source, fixturePath, options);

      expect(await fix(await typedEslint, formatted, fixturePath)).toEqual({
        messages: [],
        output: formatted,
      });
      expect(await format(formatted, fixturePath, options)).toBe(formatted);
    },
  );

  it.each([...unfixedFiles])(
    "and eslint --fix agree on %s after one round",
    async (filePath, code) => {
      const fixed = await fix(
        await eslint,
        await format(code, filePath, options),
        filePath,
      );
      const formatted = await format(fixed.output, filePath, options);
      const refixed = await fix(await eslint, formatted, filePath);

      expect(refixed.output).toBe(formatted);
      expect(
        refixed.messages.filter((message) => message.endsWith("(fixable)")),
      ).toEqual([]);
      expect(await format(formatted, filePath, options)).toBe(formatted);
    },
  );
});

describe("eslint --fix", () => {
  const eslint = createEslint(false);

  it.each([...unfixedFiles])(
    "fixes every fixable problem in %s, and changes nothing when run again",
    async (filePath, code) => {
      const fixed = await fix(await eslint, code, filePath);

      expect(fixed.output).not.toBe(code);
      expect(
        fixed.messages.filter((message) => message.endsWith("(fixable)")),
      ).toEqual([]);
      expect(await fix(await eslint, fixed.output, filePath)).toEqual(fixed);
    },
  );
});
