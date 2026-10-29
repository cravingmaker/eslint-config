import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import markdown from "@eslint/markdown";
import ts from "typescript";
import { afterAll, describe, expect, it } from "vitest";

import {
  consumerNode,
  createConsumer,
  createTarball,
  createTemporaryDirectory,
  fixturesDirectory,
  getOutput,
  manifest,
  runCommand,
} from "./consumers.js";
import { isRecord } from "../../src/utilities/is-record.js";

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

// eslint-disable-next-line security/detect-non-literal-fs-filename -- The README path is fixed relative to this test module.
const readme = await readFile(
  fileURLToPath(new URL("../../README.md", import.meta.url)),
  "utf8",
);
/*
The code blocks of the README as ESLint's Markdown processor extracts them, which leaves out a
block that follows an `<!-- eslint-skip -->` comment, such as the `overrides` for `npm audit` in
"Known issues". `line` is the line of a block's first line of code.
*/
const codeBlocks: readonly CodeBlock[] = markdown.processors.markdown
  .preprocess(readme, "README.md")
  .map(({ filename, text }, index) => {
    return {
      index,
      language: path.extname(filename).slice(1),
      line: readme.slice(0, readme.indexOf(text)).split("\n").length,
      text,
    };
  });
// Each JavaScript block is a complete `eslint.config.js`.
const examples = codeBlocks.filter(({ language }) => {
  return language === "js";
});
// The JSON block is the tsconfig that the README asks of every project with TypeScript files.
const tsconfigExamples = codeBlocks.filter(({ language }) => {
  return language === "json";
});
// The packages that the `npm install` commands of the README name.
const installedPackages = codeBlocks
  .filter(({ language }) => {
    return language === "bash";
  })
  .flatMap(({ text }) => {
    return text.split("\n");
  })
  .filter((command) => {
    return command.startsWith("npm install ");
  })
  .flatMap((command) => {
    return command
      .split(" ")
      .slice(2)
      .filter((word) => {
        return !word.startsWith("-");
      });
  });
// The frameworks, which a project that uses one depends on already.
const frameworks: ReadonlySet<string> = new Set(["react", "svelte"]);
/*
React ships no type declarations, so the tsconfig of the fixtures leaves the React files out.
This one lets typed linting parse them; it reports the errors in their types, but no fatal message.
*/
const reactTsconfig = JSON.stringify({
  compilerOptions: {
    allowUnreachableCode: false,
    jsx: "react-jsx",
    module: "nodenext",
    noEmit: true,
    noImplicitReturns: true,
    strict: true,
    target: "es2024",
    types: [],
  },
  include: ["*.ts", "*.tsx"],
});

const temporaryDirectory = await createTemporaryDirectory(
  "eslint-config-readme-",
);

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

const compareText = (left: string, right: string): number => {
  return left.localeCompare(right);
};

// The compiler options of a tsconfig, read from `text` as the compiler reads them, comments included.
const readCompilerOptions = (
  fileName: string,
  text: string,
): ts.CompilerOptions => {
  const tsconfig: unknown = ts.parseConfigFileTextToJson(fileName, text).config;
  return ts.convertCompilerOptionsFromJson(
    isRecord(tsconfig) ? tsconfig.compilerOptions : undefined,
    path.dirname(fileName),
  ).options;
};

// The fatal messages of `results`, such as parsing errors, with their file and, if any, position.
const getFatalMessages = (
  directory: string,
  results: readonly LintResult[],
): readonly string[] => {
  return results.flatMap(({ filePath, messages }) => {
    return messages
      .filter(({ fatal }) => {
        return fatal === true;
      })
      .map(({ column = 0, line, message }) => {
        return [
          path.relative(directory, filePath),
          ...(typeof line === "undefined"
            ? []
            : [String(line), String(column)]),
          ` ${message}`,
        ].join(":");
      });
  });
};

const tarball = await createTarball(temporaryDirectory);
// A consumer that installs what the commands of the README name, and the frameworks. The Node.js
// types are for `import.meta.dirname`.
const consumer = await createConsumer(temporaryDirectory, "readme", tarball, [
  ...installedPackages.filter((packageName) => {
    return (
      packageName !== "@cravingmaker/eslint-config" && packageName !== "eslint"
    );
  }),
  ...frameworks,
  "@types/node",
]);

/*
Writes `example` as the `eslint.config.js` of a project in the consumer in `consumer`, next to a
copy of the fixtures, and returns its directory. The project declares what the consumer declares,
so the frameworks are detected as in the consumer.
*/
const createExampleProject = async ({
  index,
  text,
}: CodeBlock): Promise<string> => {
  const directory = path.join(consumer, "examples", String(index));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The directory is a numeric README block index beneath the owned consumer examples root.
  await mkdir(directory, { recursive: true });
  await cp(
    path.join(consumer, "package.json"),
    path.join(directory, "package.json"),
  );
  await cp(fixturesDirectory, path.join(directory, "fixtures"), {
    recursive: true,
  });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only fixtures/react/tsconfig.json beneath the owned example directory.
  await writeFile(
    path.join(directory, "fixtures", "react", "tsconfig.json"),
    reactTsconfig,
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only eslint.config.js beneath the owned example directory.
  await writeFile(path.join(directory, "eslint.config.js"), text);
  return directory;
};

describe("the README", () => {
  it("lints the actual Usage configuration without consumer exceptions", async () => {
    const [example] = examples;
    expect(example.text).toContain("export default createConfig();");
    const directory = await createExampleProject(example);
    const { exitCode, stderr, stdout } = await runCommand(
      consumerNode,
      [
        path.join(consumer, "node_modules", "eslint", "bin", "eslint.js"),
        "--format",
        "json",
        "eslint.config.js",
      ],
      directory,
    );
    expect(exitCode, stderr).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint's JSON formatter prints this result shape.
    const results = JSON.parse(stdout) as readonly LintResult[];
    expect(results).toHaveLength(1);
    expect(results[0]?.messages).toEqual([]);
  });

  it("has examples, install commands, and a tsconfig, and no other code than shell commands, examples, the tsconfig, and output", () => {
    expect(examples).not.toHaveLength(0);
    expect(installedPackages).not.toHaveLength(0);
    expect(tsconfigExamples).toHaveLength(1);
    expect(
      codeBlocks
        .filter(({ language }) => {
          return !["bash", "js", "json", "text"].includes(language);
        })
        .map(({ language, line }) => {
          return `${language} at line ${String(line)}`;
        }),
    ).toEqual([]);
  });

  it("installs ESLint, the package, and every optional peer but the frameworks, each once", () => {
    expect(installedPackages.toSorted(compareText)).toEqual(
      [
        "@cravingmaker/eslint-config",
        ...Object.keys(manifest.peerDependencies).filter((packageName) => {
          return !frameworks.has(packageName);
        }),
      ].toSorted(compareText),
    );
  });

  it("retains the three-option compiler contract in the README and consumer projects", async () => {
    const [tsconfigExample] = tsconfigExamples;
    expect(tsconfigExamples).toHaveLength(1);
    const expected = readCompilerOptions("README.md", tsconfigExample.text);
    const repositoryTsconfig = fileURLToPath(
      new URL("../../tsconfig.json", import.meta.url),
    );
    const fixturesTsconfig = path.join(fixturesDirectory, "tsconfig.json");

    const repositoryOptions = readCompilerOptions(
      repositoryTsconfig,
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The repository tsconfig.json path is fixed relative to this test module.
      await readFile(repositoryTsconfig, "utf8"),
    );
    const fixtureOptions = readCompilerOptions(
      fixturesTsconfig,
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixture tsconfig.json path is fixed relative to the repository fixtures directory.
      await readFile(fixturesTsconfig, "utf8"),
    );
    const reactOptions = readCompilerOptions(
      "react/tsconfig.json",
      reactTsconfig,
    );

    expect(expected).toEqual({
      allowUnreachableCode: false,
      noImplicitReturns: true,
      strict: true,
    });
    expect(repositoryOptions).toMatchObject(expected);
    expect(fixtureOptions).toMatchObject(expected);
    expect(reactOptions).toMatchObject(expected);
    expect(
      [expected, repositoryOptions, fixtureOptions, reactOptions].map(
        (options) => {
          return [
            options.noUncheckedIndexedAccess === true,
            options.verbatimModuleSyntax === true,
            options.noFallthroughCasesInSwitch === true,
          ];
        },
      ),
    ).toEqual(
      Array.from({ length: 4 }, () => {
        return [false, false, false];
      }),
    );
  });

  // Each example starts ESLint and TypeScript processes; serialize them to bound memory use.
  it.for(examples)(
    "example at line $line type-checks, and lints the fixtures without a fatal message",
    { timeout: 120_000 },
    async (example, { expect: expectInTest }) => {
      const directory = await createExampleProject(example);

      // Only the example: install.test.ts checks the declarations of the package without
      // `skipLibCheck`.
      expectInTest(
        await getOutput(
          consumerNode,
          [
            path.join(consumer, "node_modules", "typescript", "bin", "tsc"),
            "--allowJs",
            "--allowUnreachableCode",
            "false",
            "--checkJs",
            "--module",
            "nodenext",
            "--noEmit",
            "--noImplicitReturns",
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
        consumerNode,
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
