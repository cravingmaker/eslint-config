/* eslint-disable security/detect-non-literal-fs-filename -- The consumer is created in a temporary directory. */

import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import markdown from "@eslint/markdown";
import { afterAll, describe, expect, it } from "vitest";

import {
  createConsumer,
  createTarball,
  fixturesDirectory,
  getOutput,
  manifest,
  runCommand,
} from "./consumers.js";

type CodeBlock = {
  readonly index: number;
  readonly language: string;
  readonly line: number;
  readonly text: string;
};
type LintResult = {
  readonly filePath: string;
  readonly messages: ReadonlyArray<{
    readonly message: string;

    readonly column?: number;
    readonly fatal?: boolean;
    readonly line?: number;
  }>;
};

const readme = await readFile(
  fileURLToPath(new URL("../../README.md", import.meta.url)),
  "utf8",
);
/*
The code blocks of the README as ESLint's Markdown processor extracts them, which leaves out a
block that follows an `<!-- eslint-skip -->` comment, such as the config for 0.1.0 in the
migration notes. `line` is the line of a block's first line of code.
*/
const codeBlocks: readonly CodeBlock[] = markdown.processors.markdown
  .preprocess(readme, "README.md")
  .map(({ filename, text }, index) => ({
    index,
    language: path.extname(filename).slice(1),
    line: readme.slice(0, readme.indexOf(text)).split("\n").length,
    text,
  }));
// Each JavaScript block is a complete `eslint.config.js`.
const examples = codeBlocks.filter(({ language }) => language === "js");
// The packages that the `npm install` commands of the README name.
const installedPackages = codeBlocks
  .filter(({ language }) => language === "bash")
  .flatMap(({ text }) => text.split("\n"))
  .filter((command) => command.startsWith("npm install "))
  .flatMap((command) =>
    command
      .split(" ")
      .slice(2)
      .filter((word) => !word.startsWith("-")),
  );
// The frameworks, which a project that uses one depends on already.
const frameworks: ReadonlySet<string> = new Set(["react", "svelte"]);
/*
React ships no type declarations, so the tsconfig of the fixtures leaves the React files out.
This one lets typed linting parse them; it reports the errors in their types, but no fatal
message.
*/
const reactTsconfig = JSON.stringify({
  compilerOptions: {
    jsx: "react-jsx",
    module: "nodenext",
    noEmit: true,
    strict: true,
    target: "es2024",
    types: [],
  },
  include: ["*.ts", "*.tsx"],
});

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-readme-"),
);

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}
/*
Writes `example` as the `eslint.config.js` of a project in the consumer in `consumer`, next to a
copy of the fixtures, and returns its directory. The project declares what the consumer declares,
so the frameworks are detected as in the consumer.
*/
async function createExampleProject(
  consumer: string,
  { index, text }: CodeBlock,
): Promise<string> {
  const directory = path.join(consumer, "examples", String(index));
  await mkdir(directory, { recursive: true });
  await cp(
    path.join(consumer, "package.json"),
    path.join(directory, "package.json"),
  );
  await cp(fixturesDirectory, path.join(directory, "fixtures"), {
    recursive: true,
  });
  await writeFile(
    path.join(directory, "fixtures", "react", "tsconfig.json"),
    reactTsconfig,
  );
  await writeFile(path.join(directory, "eslint.config.js"), text);
  return directory;
}
// The fatal messages of `results`, such as parsing errors, with their file and, if any, position.
function getFatalMessages(
  directory: string,
  results: readonly LintResult[],
): readonly string[] {
  return results.flatMap(({ filePath, messages }) =>
    messages
      .filter(({ fatal }) => fatal === true)
      .map(({ column, line, message }) =>
        [
          path.relative(directory, filePath),
          ...(line === undefined ? [] : [String(line), String(column ?? 0)]),
          ` ${message}`,
        ].join(":"),
      ),
  );
}

const tarball = await createTarball(temporaryDirectory);
// A consumer that installs what the commands of the README name, and the frameworks. The Node.js
// types are for `import.meta.dirname`.
const consumer = await createConsumer(temporaryDirectory, "readme", tarball, [
  ...installedPackages.filter(
    (packageName) =>
      packageName !== "@cravingmaker/eslint-config" && packageName !== "eslint",
  ),
  ...frameworks,
  "@types/node",
]);

describe("the README", () => {
  it("has examples and install commands, and no other code than shell commands, examples, and output", () => {
    expect(examples).not.toHaveLength(0);
    expect(installedPackages).not.toHaveLength(0);
    expect(
      codeBlocks
        .filter(({ language }) => !["bash", "js", "text"].includes(language))
        .map(({ language, line }) => `${language} at line ${String(line)}`),
    ).toEqual([]);
  });

  it("installs ESLint, the package, and every optional peer but the frameworks, each once", () => {
    expect(installedPackages.toSorted(compareText)).toEqual(
      [
        "@cravingmaker/eslint-config",
        ...Object.keys(manifest.peerDependencies).filter(
          (packageName) => !frameworks.has(packageName),
        ),
      ].toSorted(compareText),
    );
  });

  it.concurrent.for(examples)(
    "example at line $line type-checks, and lints the fixtures without a fatal message",
    { timeout: 120_000 },
    async (example, { expect: expectInTest }) => {
      const directory = await createExampleProject(consumer, example);

      // Only the example: install.test.ts checks the declarations of the package without
      // `skipLibCheck`.
      expectInTest(
        await getOutput(
          process.execPath,
          [
            path.join(consumer, "node_modules", "typescript", "bin", "tsc"),
            "--allowJs",
            "--checkJs",
            "--module",
            "nodenext",
            "--noEmit",
            "--pretty",
            "false",
            "--skipLibCheck",
            "--strict",
            "--target",
            "es2024",
            "--types",
            "node",
            "eslint.config.js",
          ],
          directory,
        ),
      ).toBe("");

      const { exitCode, stderr, stdout } = await runCommand(
        process.execPath,
        [
          path.join(consumer, "node_modules", "eslint", "bin", "eslint.js"),
          "--format",
          "json",
          "fixtures",
        ],
        directory,
      );
      // ESLint exits with 2 when the config cannot be loaded or a rule crashes.
      expectInTest(exitCode, stderr).toBeLessThan(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint's JSON formatter prints this shape.
      const results = JSON.parse(stdout) as readonly LintResult[];

      expectInTest(results).not.toHaveLength(0);
      expectInTest(getFatalMessages(directory, results)).toEqual([]);
    },
  );
});
