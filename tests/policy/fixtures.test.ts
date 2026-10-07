import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type Fixture = {
  readonly fileType: string;
  readonly path: string;
};

const fixturesDirectory = fileURLToPath(
  new URL("../fixtures", import.meta.url),
);
// One valid file of each type that the configuration lints.
const fixtures: readonly Fixture[] = [
  { fileType: "JavaScript", path: "format-date.js" },
  { fileType: "JavaScript module", path: "parse-version.mjs" },
  { fileType: "JSX, without React imports", path: "react/Greeting.jsx" },
  { fileType: "TypeScript", path: "temperature.ts" },
  { fileType: "TypeScript module", path: "settle.mts" },
  { fileType: "TypeScript declarations", path: "format-date.d.ts" },
  { fileType: "TSX", path: "react/Counter.tsx" },
  { fileType: "React hook in TypeScript", path: "react/use-toggle.ts" },
  { fileType: "Svelte component, TypeScript", path: "svelte/Counter.svelte" },
  { fileType: "Svelte component, JavaScript", path: "svelte/Toggle.svelte" },
  {
    fileType: "Svelte rune module, JavaScript",
    path: "svelte/visits.svelte.js",
  },
  {
    fileType: "Svelte rune module, TypeScript",
    path: "svelte/theme.svelte.ts",
  },
  { fileType: "HTML", path: "index.html" },
  { fileType: "JSON", path: "data.json" },
  { fileType: "JSONC", path: "tsconfig.json" },
  { fileType: "JSON5", path: "data.json5" },
  { fileType: "Package manifest", path: "package.json" },
  { fileType: "Markdown", path: "README.md" },
];

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}
/*
Lints every fixture with every feature and framework on, and returns the messages of each by path.
React Refresh uses its strictest variant, which allows nothing but components to be exported next
to them. The React fixtures are left out of typed linting. React ships no type declarations, so
every value from React would be an error type, which the type-aware rules report; and with them,
typed linting reports the components themselves, which the plan records under stage 4.
*/
async function lintFixtures(
  isTypeChecked: boolean,
): Promise<ReadonlyMap<string, readonly string[]>> {
  const eslint = new ESLint({
    cwd: fixturesDirectory,
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
  const results = await eslint.lintFiles(
    fixtures.map((fixture) => fixture.path),
  );
  return new Map(
    results.map(({ filePath, messages }) => [
      path.relative(fixturesDirectory, filePath).replaceAll(path.sep, "/"),
      messages.map(
        ({ column, line, message, ruleId }) =>
          `${String(line)}:${String(column)} ${ruleId ?? "fatal"}: ${message}`,
      ),
    ]),
  );
}

describe("fixtures", () => {
  it("are one file of each type, and nothing else", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixtures directory has a fixed path.
    const entries = await readdir(fixturesDirectory, {
      recursive: true,
      withFileTypes: true,
    });
    const filePaths = entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path
          .relative(fixturesDirectory, path.join(entry.parentPath, entry.name))
          .replaceAll(path.sep, "/"),
      );

    expect(filePaths.toSorted(compareText)).toEqual(
      fixtures.map((fixture) => fixture.path).toSorted(compareText),
    );
  });

  it("type-check, so that typed linting reads no error types", () => {
    const configFile = ts.readConfigFile(
      path.join(fixturesDirectory, "tsconfig.json"),
      (fileName) => ts.sys.readFile(fileName),
    );
    const { fileNames, options } = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      fixturesDirectory,
    );
    const diagnostics = ts
      .getPreEmitDiagnostics(ts.createProgram(fileNames, options))
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      );

    expect(fileNames).not.toEqual([]);
    expect(diagnostics).toEqual([]);
  });

  describe.each([false, true])("with typed linting %s", (isTypeChecked) => {
    const lintResults = lintFixtures(isTypeChecked);

    it.each(fixtures)(
      "$fileType: $path parses and has no lint messages",
      async (fixture) => {
        const messages = await lintResults;

        expect(messages.get(fixture.path)).toEqual([]);
      },
    );
  });
});
