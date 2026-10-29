import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it } from "vitest";

import {
  createConsumer,
  createTarball,
  createTemporaryDirectory,
  execute,
  getOutput,
  runCommand,
} from "./consumers.js";

type LintResult = {
  readonly filePath: string;
  readonly messages: ReadonlyArray<{
    readonly column: number;
    readonly line: number;
    readonly message: string;
    readonly ruleId: string | null;
  }>;
};
type Messages = Readonly<Record<string, readonly string[]>>;

// The fixtures that need no optional peer, the JSX component among them.
const fixturesWithoutPeers = [
  "fixtures/data.json",
  "fixtures/data.json5",
  "fixtures/format-date.d.ts",
  "fixtures/format-date.js",
  "fixtures/index.html",
  "fixtures/package.json",
  "fixtures/parse-version.mjs",
  "fixtures/react/Greeting.jsx",
  "fixtures/README.md",
  "fixtures/settle.mts",
  "fixtures/temperature.ts",
  "fixtures/tsconfig.json",
] as const;
const reactFixtures = [
  "fixtures/react/Counter.tsx",
  "fixtures/react/use-toggle.ts",
] as const;
// The TypeScript fixtures that need no optional peer. The tsconfig of the fixtures includes them.
const typescriptFixtures = [
  "fixtures/format-date.d.ts",
  "fixtures/settle.mts",
  "fixtures/temperature.ts",
] as const;
const defaultConfig = `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig();
`;
// The default config for the React fixtures, which typed linting leaves out: React ships no type declarations, so the tsconfig of the fixtures does not include them.
const reactConfig = `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: { ignoresTypeAware: ["fixtures/react/**"] },
});
`;
// A config that turns on the rule of React Refresh through the overrides of the React feature.
const refreshOverrideConfig = `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  react: {
    overrides: { "react-refresh/only-export-components": "error" },
  },
  typescript: { ignoresTypeAware: ["fixtures/react/**"] },
});
`;
/*
Configs with typed linting and a root directory that is a relative path, each by the option that
has it. ESLint runs in the consumer, so `.` is the consumer and `fixtures` is the directory of
the tsconfig.
*/
const relativeRootConfigs = [
  [
    "projectRootDirectory",
    `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  projectRootDirectory: ".",
  typescript: { typeChecked: true },
});
`,
  ],
  [
    "typescript.tsconfigRootDir",
    `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: { tsconfigRootDir: "fixtures", typeChecked: true },
});
`,
  ],
] as const;

const temporaryDirectory = await createTemporaryDirectory(
  "eslint-config-install-",
);

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

const compareText = (left: string, right: string): number => {
  return left.localeCompare(right);
};

// A project root in the consumer in `directory` whose manifest declares `dependencies`.
const createProjectRoot = async (
  directory: string,
  name: string,
  dependencies: readonly string[],
): Promise<string> => {
  const projectRootDirectory = path.join(directory, "projects", name);
  const devDependencies = Object.fromEntries(
    dependencies.map((dependency) => {
      return [dependency, "1.0.0"];
    }),
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Callers select fixed project fixture names under an owned temporary consumer.
  await mkdir(projectRootDirectory, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only package.json inside the fixture project created above.
  await writeFile(
    path.join(projectRootDirectory, "package.json"),
    JSON.stringify({ devDependencies, private: true, type: "module" }),
  );
  return projectRootDirectory;
};

/*
Runs the ESLint CLI of the consumer in `directory` with `config` as `eslint.config.js` on
`filePaths`, and returns the messages of each file by path.
*/
const lint = async (
  directory: string,
  config: string,
  filePaths: readonly string[],
): Promise<Messages> => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only eslint.config.js in a consumer created by this suite.
  await writeFile(path.join(directory, "eslint.config.js"), config);
  const output = await getOutput(
    process.execPath,
    [
      path.join(directory, "node_modules", "eslint", "bin", "eslint.js"),
      "--format",
      "json",
      ...filePaths,
    ],
    directory,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint's JSON formatter prints this shape.
  const results = JSON.parse(output) as readonly LintResult[];
  return Object.fromEntries(
    results.map(({ filePath, messages }) => {
      return [
        path.relative(directory, filePath).replaceAll(path.sep, "/"),
        messages.map((diagnostic) => {
          return `${String(diagnostic.line)}:${String(diagnostic.column)} ${diagnostic.ruleId ?? "fatal"}: ${diagnostic.message}`;
        }),
      ];
    }),
  );
};

// Runs `script` as an ES module in the consumer in `directory` and returns what it prints.
const run = async (directory: string, script: string): Promise<string> => {
  const { stdout } = await execute(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: directory },
  );
  return stdout;
};

/*
Calls `createConfig` in the consumer in `directory` with the options of each case, and returns
the names of the framework blocks for each, or the message that it fails with.
*/
const runFrameworkCases = async (
  directory: string,
  cases: Readonly<Record<string, Readonly<Record<string, unknown>>>>,
): Promise<Readonly<Record<string, unknown>>> => {
  const output = await run(
    directory,
    `
      import { createConfig } from "@cravingmaker/eslint-config";

      const results = {};
      for (const [name, options] of Object.entries(${JSON.stringify(cases)})) {
        try {
          const config = await createConfig(options);
          results[name] = config
            .map((entry) => entry.name)
            .filter((blockName) => ["express", "react", "svelte", "vitest"].includes(blockName.split("/")[2]));
        } catch (error) {
          results[name] = error.message;
        }
      }
      process.stdout.write(JSON.stringify(results));
    `,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The script prints an object.
  return JSON.parse(output) as Readonly<Record<string, unknown>>;
};

// `filePaths` without messages, by path.
const withoutMessages = (filePaths: readonly string[]): Messages => {
  return Object.fromEntries(
    filePaths.map((filePath) => {
      return [filePath, []];
    }),
  );
};

const tarball = await createTarball(temporaryDirectory);
// Three peer sets, installed in parallel: none, a partial set, and every optional peer.
const [withoutPeers, withPartialPeers, withAllPeers] = await Promise.all([
  createConsumer(temporaryDirectory, "without-peers", tarball, []),
  createConsumer(temporaryDirectory, "partial-peers", tarball, [
    "@html-eslint/eslint-plugin-react",
    "@html-eslint/eslint-plugin-svelte",
    "eslint-plugin-react-hooks",
    "react",
  ]),
  createConsumer(temporaryDirectory, "all-peers", tarball, [
    "@html-eslint/eslint-plugin-react",
    "@html-eslint/eslint-plugin-svelte",
    "@vitest/eslint-plugin",
    "eslint-plugin-express-security",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh",
    "react",
    "svelte",
    "svelte-eslint-parser",
  ]),
]);

describe("the packed package", () => {
  it("contains the build and the package documents only", async () => {
    const { stdout } = await execute("tar", ["-tzf", tarball]);

    expect(stdout.trim().split("\n").toSorted(compareText)).toEqual([
      "package/dist/index.d.mts",
      "package/dist/index.mjs",
      "package/LICENSE",
      "package/package.json",
      "package/README.md",
    ]);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Read the fixed installed package dist directory inside the owned withoutPeers consumer.
    const installedFiles = await readdir(
      path.join(
        withoutPeers,
        "node_modules",
        "@cravingmaker",
        "eslint-config",
        "dist",
      ),
    );

    expect(installedFiles.toSorted(compareText)).toEqual([
      "index.d.mts",
      "index.mjs",
    ]);
  });

  it.each(["index.d.mts", "index.mjs"])(
    "packs and installs %s without external or inline source maps",
    async (filename) => {
      const { stdout } = await execute("tar", [
        "-xOzf",
        tarball,
        `package/dist/${filename}`,
      ]);

      expect(stdout).not.toContain("sourceMappingURL");
      expect(
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Read one of the two literal artifact names in the owned installed package dist directory.
        await readFile(
          path.join(
            withoutPeers,
            "node_modules",
            "@cravingmaker",
            "eslint-config",
            "dist",
            filename,
          ),
          "utf8",
        ),
      ).toBe(stdout);
    },
  );

  it("exports createConfig from its root and nothing else", async () => {
    const output = await run(
      withoutPeers,
      `
        const exported = Object.keys(await import("@cravingmaker/eslint-config"));
        let deepImport;
        try {
          await import("@cravingmaker/eslint-config/dist/index.mjs");
          deepImport = "resolved";
        } catch (error) {
          deepImport = error.code;
        }
        process.stdout.write(JSON.stringify({ deepImport, exported }));
      `,
    );

    expect(JSON.parse(output)).toEqual({
      deepImport: "ERR_PACKAGE_PATH_NOT_EXPORTED",
      exported: ["createConfig"],
    });
  });

  it("exports its package.json from the installed package", async () => {
    const output = await run(
      withoutPeers,
      `
        import manifest from "@cravingmaker/eslint-config/package.json" with { type: "json" };
        process.stdout.write(manifest.name);
      `,
    );

    expect(output).toBe("@cravingmaker/eslint-config");
  });
});

describe("packed consumer policy regressions", () => {
  it.each([
    ["with all optional peers", withAllPeers, true],
    ["without optional peers", withoutPeers, false],
  ] as const)(
    "ships the parser, fix, and review boundaries %s",
    async (_name, consumer, svelteEnabled) => {
      const output = await run(
        consumer,
        String.raw`
        import { mkdir, writeFile } from "node:fs/promises";
        import path from "node:path";
        import { ESLint } from "eslint";
        import { createConfig } from "@cravingmaker/eslint-config";
        const directory = path.resolve("stage-six");
        await mkdir(directory);
        await writeFile(path.join(directory, "package.json"), JSON.stringify({ type: "module" }));
        await writeFile(path.join(directory, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, noImplicitReturns: true, allowUnreachableCode: false, module: "nodenext" }, include: ["*.ts", "*.mts"] }));
        const opaque = 'export const parse = (raw: string): unknown => { return JSON.parse(raw); };\n';
        const ordinary = 'export const options = { value: 1 };\nPromise.resolve(options);\n';
        await writeFile(path.join(directory, "opaque.ts"), opaque);
        await writeFile(path.join(directory, "options.svelte.mts"), ordinary);
        const config = await createConfig({ projectRootDirectory: directory, svelte: ${svelteEnabled ? "true" : '"auto"'} });
        const reporter = new ESLint({ cwd: directory, overrideConfig: config, overrideConfigFile: true });
        const fixer = new ESLint({ cwd: directory, fix: true, overrideConfig: config, overrideConfigFile: true });
        const sources = [
          ["[https://example.com]\n\n![](image.png)\n", "README.md"],
          ["<my-element></my-element>\n<p>After</p>\n", "index.html"],
          [opaque, "opaque.ts"],
          [ordinary, "options.svelte.mts"],
          ['export const check = 1 == 1;\n', "options.svelte.mjs"],
          ['import { readFile } from "node:fs/promises";\nawait readFile(process.env.INPUT_FILE, "utf8");\nconst key = "dev";\nexport const value = record[key];\n', "fixture.test.js"],
          ['export const state = $state({ count: 0 });\n', "state.svelte.js"],
        ];
        const summaries = [];
        for (const [source, filePath] of sources) {
          const [result] = await reporter.lintText(source, { filePath });
          const rules = result.messages.map(({ ruleId }) => ruleId);
          summaries.push({ fatal: result.fatalErrorCount, rules });
        }
        const [fixed] = await fixer.lintText(sources[1][0], { filePath: "index.html" });
        const [second] = await fixer.lintText(fixed.output ?? sources[1][0], { filePath: "index.html" });
        const [opaqueResult] = await reporter.lintText(opaque, { filePath: "opaque.ts" });
        const review = opaqueResult.messages.find(({ ruleId }) => ruleId === "@typescript-eslint/promise-function-async");
        const parsers = [];
        for (const filePath of ["options.svelte.mjs", "options.svelte.mts", "state.svelte.js"]) {
          const { languageOptions: { parser } } = await reporter.calculateConfigForFile(filePath);
          parsers.push(parser.meta?.name ?? parser.name);
        }
        process.stdout.write(JSON.stringify({ summaries, parsers, retainedTags: (fixed.output ?? sources[1][0]).includes("<my-element></my-element>"), stable: second.output === undefined, opaqueReview: { severity: review?.severity, fix: review?.fix } }));
      `,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The packed consumer emits these lint summaries.
      const result = JSON.parse(output) as {
        readonly opaqueReview: {
          readonly severity: number;

          readonly fix?: unknown;
        };
        readonly parsers: readonly string[];
        readonly retainedTags: boolean;
        readonly stable: boolean;
        readonly summaries: ReadonlyArray<{
          readonly fatal: number;
          readonly rules: readonly string[];
        }>;
      };
      expect(
        result.summaries.map(({ fatal }) => {
          return fatal;
        }),
      ).toEqual([0, 0, 0, 0, 0, 0, 0]);
      expect(result.summaries[0]?.rules).toEqual(["markdown/require-alt-text"]);
      expect(result.summaries[1]?.rules).not.toContain(
        "@html-eslint/require-closing-tags",
      );
      expect(result.summaries[3]?.rules).toContain(
        "@typescript-eslint/no-floating-promises",
      );
      expect(result.summaries[4]?.rules).toContain("eqeqeq");
      expect(result.summaries[5]?.rules).toEqual(
        expect.arrayContaining([
          "security/detect-non-literal-fs-filename",
          "security/detect-object-injection",
        ]),
      );
      expect(result.summaries[6]?.rules.includes("no-undef")).toBe(
        !svelteEnabled,
      );
      expect(result.parsers).toEqual([
        "espree",
        "typescript-eslint/parser",
        svelteEnabled ? "svelte-eslint-parser" : "espree",
      ]);
      expect(result.retainedTags).toBe(true);
      expect(result.stable).toBe(true);
      expect(result.opaqueReview).toEqual({ severity: 2 });
    },
  );

  it("ships rule ownership and preserves global-match results without optional peers", async () => {
    const output = await run(
      withoutPeers,
      String.raw`
      import { mkdir, writeFile } from "node:fs/promises";
      import path from "node:path";
      import { ESLint } from "eslint";
      import { createConfig } from "@cravingmaker/eslint-config";
      const directory = path.resolve("stage-five");
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, "package.json"), JSON.stringify({ type: "module" }));
      await writeFile(path.join(directory, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, module: "nodenext" }, include: ["*.ts"] }));
      const source = 'export const read = (text: string, source: RegExp) => { return text.match(new RegExp(source)); };\n';
      await writeFile(path.join(directory, "match.ts"), source);
      const config = await createConfig({ projectRootDirectory: directory });
      const reporter = new ESLint({ cwd: directory, overrideConfig: config, overrideConfigFile: true });
      const fixer = new ESLint({ cwd: directory, fix: true, overrideConfig: config, overrideConfigFile: true });
      const owners = ["eqeqeq", "no-eq-null", "no-eval", "security/detect-eval-with-expression", "no-nested-ternary", "unicorn/no-unnecessary-nested-ternary", "no-restricted-syntax", "unicorn/no-new-buffer", "security/detect-new-buffer"];
      const [diagnostics] = await reporter.lintText('value == null; eval(input); enabled ? (ready ? "yes" : "no") : "no"; new Buffer(size);', { filePath: "sample.js" });
      const [first] = await fixer.lintText(source, { filePath: "match.ts" });
      const fixed = first.output ?? source;
      const [second] = await fixer.lintText(fixed, { filePath: "match.ts" });
      await writeFile(path.join(directory, "fixed.ts"), fixed);
      const { read } = await import("./stage-five/fixed.ts");
      process.stdout.write(JSON.stringify({
        fatal: [diagnostics.fatalErrorCount, first.fatalErrorCount, second.fatalErrorCount],
        owners: diagnostics.messages.map(({ ruleId }) => ruleId).filter((ruleId) => owners.includes(ruleId)),
        execution: second.messages.map(({ ruleId }) => ruleId).filter((ruleId) => ruleId?.includes("prefer-regexp-exec")),
        unchangedMatch: fixed.includes("text.match(new RegExp(source))"),
        stable: second.output === undefined,
        results: [read("aba", /a/gu), read("aba", /a/u)],
      }));
    `,
    );
    expect(JSON.parse(output)).toEqual({
      execution: ["regexp/prefer-regexp-exec"],
      fatal: [0, 0, 0],
      owners: [
        "eqeqeq",
        "no-eval",
        "no-nested-ternary",
        "no-restricted-syntax",
      ],
      results: [["a", "a"], ["a"]],
      stable: true,
      unchangedMatch: true,
    });
  });

  it("ships passing configs, conditional metadata, explicit callbacks, and typed TSX names", async () => {
    const output = await run(
      withoutPeers,
      String.raw`
      import { mkdir, readFile, writeFile } from "node:fs/promises";
      import path from "node:path";
      import { ESLint } from "eslint";
      import { createConfig } from "@cravingmaker/eslint-config";
      const directory = path.resolve("stage-four");
      await mkdir(directory);
      await writeFile(path.join(directory, "package.json"), await readFile("package.json", "utf8"));
      await writeFile(path.join(directory, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true }, include: ["*.tsx"] }));
      const source = 'const double = (value: number): number => {\n  return value * 2;\n};\n\nconst values = [1, 2, 3].map((value) => {\n  return double(value);\n});\n\nconst Greeting = (name: string): string => {\n  return name;\n};\n\nexport { Greeting, values };\n';
      await writeFile(path.join(directory, "component.tsx"), source);
      const eslint = new ESLint({ cwd: directory, overrideConfig: await createConfig({ projectRootDirectory: directory }), overrideConfigFile: true });
      const metadata = JSON.parse(await readFile("fixtures/package.json", "utf8"));
      const application = structuredClone(metadata);
      delete application.peerDependencies;
      delete application.peerDependenciesMeta;
      const missing = structuredClone(metadata);
      delete missing.peerDependenciesMeta;
      const cases = [
        [${JSON.stringify(defaultConfig)}, "eslint.config.js"],
        [JSON.stringify(application), "apps/app/package.json"],
        [JSON.stringify(metadata), "packages/library/package.json"],
        [source, "component.tsx"],
        [JSON.stringify(missing), "packages/missing/package.json"],
        [${JSON.stringify(defaultConfig)}, "application.js"],
        [source.replace('(value) => {\n  return double(value);\n}', 'double'), "component.tsx"],
      ];
      const results = [];
      for (const [code, filePath] of cases) {
        const [result] = await eslint.lintText(code, { filePath });
        results.push({ fatal: result.fatalErrorCount, rules: result.messages.map(({ ruleId }) => ruleId) });
      }
      process.stdout.write(JSON.stringify(results));
    `,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The consumer script emits these diagnostic summaries.
    const results = JSON.parse(output) as ReadonlyArray<{
      readonly fatal: number;
      readonly rules: readonly string[];
    }>;
    expect(results).toHaveLength(7);
    expect(results.slice(0, 5)).toEqual([
      { fatal: 0, rules: [] },
      { fatal: 0, rules: [] },
      { fatal: 0, rules: [] },
      { fatal: 0, rules: [] },
      { fatal: 0, rules: ["@cravingmaker/require-peer-metadata"] },
    ]);
    expect(results[5]?.fatal).toBe(0);
    expect(results[5]?.rules).toContain("unicorn/no-top-level-side-effects");
    expect(results[6]).toEqual({
      fatal: 0,
      rules: ["unicorn/no-array-callback-reference"],
    });
  });

  it("ships the internal arrow and documentation policies with stable function spacing", async () => {
    const output = await run(
      withoutPeers,
      String.raw`
      import { ESLint } from "eslint";
      import { createConfig } from "@cravingmaker/eslint-config";
      const config = await createConfig({ typescript: { typeChecked: false } });
      const reporter = new ESLint({ overrideConfig: config, overrideConfigFile: true });
      const fixer = new ESLint({ fix: true, overrideConfig: config, overrideConfigFile: true });
      const cases = [];
      for (const filePath of ["example.js", "example.ts"]) {
        const [reported] = await reporter.lintText("export const double = function double(value) {\n  return value * 2;\n};\n", { filePath });
        const source = "const first = (value) => {\n  return value;\n};\n/**\nDescribe the second function.\n\nExplain a detail.\n*/\nconst second = (value) => {\n  return value;\n};\nexport { first, second };\n";
        const [first] = await fixer.lintText(source, { filePath });
        const [second] = await fixer.lintText(first.output ?? source, { filePath });
        cases.push({
          arrowReports: reported.messages.map(({ ruleId, fix, suggestions }) => ({ ruleId, fix, suggestions })),
          fatalErrors: reported.fatalErrorCount + first.fatalErrorCount + second.fatalErrorCount,
          changedAgain: typeof second.output === "string",
          messages: first.messages.concat(second.messages),
          text: first.output ?? source,
        });
      }
      process.stdout.write(JSON.stringify(cases));
    `,
    );
    expect(JSON.parse(output)).toEqual(
      ["js", "ts"].map(() => {
        return {
          arrowReports: [{ ruleId: "@cravingmaker/prefer-arrow-functions" }],
          changedAgain: false,
          fatalErrors: 0,
          messages: [],
          text: "const first = (value) => {\n  return value;\n};\n\n/**\n * Describe the second function.\n *\n * Explain a detail.\n */\nconst second = (value) => {\n  return value;\n};\n\nexport { first, second };\n",
        };
      }),
    );
  });

  it("converges on uppercase escapes and commented imports from the installed package", async () => {
    const output = await run(
      withoutPeers,
      String.raw`
        import process from "node:process";
        import { setImmediate } from "node:timers/promises";
        import { ESLint } from "eslint";
        import { createConfig } from "@cravingmaker/eslint-config";

        const eslint = new ESLint({
          fix: true,
          overrideConfig: await createConfig({ typescript: { typeChecked: false } }),
          overrideConfigFile: true,
        });
        const source = [
          "// First section.",
          'import path from "node:path";',
          "// Second section.",
          'import os from "node:os";',
          "",
          "/**",
          "Read the configured directories.",
          "*/",
          'const directories = [os.tmpdir(), path.resolve(".")];',
          'const pattern = /\\u{e9}/u;',
          'const characters = ["\\xab", "\\u00e9", "\\u{e9}"];',
          "",
          "export { characters, directories, pattern };",
          "",
        ].join("\n");
        const warnings = [];
        const capture = (warning) => { warnings.push(warning.name); };
        process.on("warning", capture);
        try {
          const cases = [];
          for (const filePath of ["example.js", "example.ts"]) {
            if (await eslint.isPathIgnored(filePath)) throw new Error(filePath + " was ignored");
            const [first] = await eslint.lintText(source, { filePath });
            const [second] = await eslint.lintText(first.output ?? source, { filePath });
            cases.push({
              changedAgain: typeof second.output === "string",
              fatalErrors: first.fatalErrorCount + second.fatalErrorCount,
              messages: first.messages.concat(second.messages),
              text: first.output ?? source,
            });
          }
          await setImmediate();
          process.stdout.write(JSON.stringify({ cases, warnings }));
        } finally {
          process.off("warning", capture);
        }
      `,
    );

    expect(JSON.parse(output)).toEqual({
      cases: ["js", "ts"].map(() => {
        return {
          changedAgain: false,
          fatalErrors: 0,
          messages: [],
          text: [
            "// Second section.",
            'import os from "node:os";',
            "// First section.",
            'import path from "node:path";',
            "",
            "/**",
            " * Read the configured directories.",
            " */",
            'const directories = [os.tmpdir(), path.resolve(".")];',
            String.raw`const pattern = /\u{E9}/u;`,
            String.raw`const characters = ["\u{AB}", "\u{E9}", "\u{E9}"];`,
            "",
            "export { characters, directories, pattern };",
            "",
          ].join("\n"),
        };
      }),
      warnings: [],
    });
  });

  it("reports Buffer globals, imports, and types from the installed package", async () => {
    const output = await run(
      withoutPeers,
      String.raw`
        import { ESLint } from "eslint";
        import { createConfig } from "@cravingmaker/eslint-config";

        const eslint = new ESLint({
          overrideConfig: await createConfig({ environments: ["node"], typescript: { typeChecked: false } }),
          overrideConfigFile: true,
        });
        const cases = [
          ["buffer-global.js", "export const bytes = Buffer.from('data');\n"],
          ["buffer-import.js", "import { Buffer } from 'buffer';\nexport const bytes = Buffer.from('data');\n"],
          ["buffer-import.ts", "import { Buffer } from 'node:buffer';\nexport const bytes = Buffer.from('data');\n"],
          ["buffer-type.ts", "export type Bytes = Buffer;\n"],
          ["uint8array.ts", "export const bytes = new Uint8Array([1, 2]);\n"],
        ];
        const rules = [];
        for (const [filePath, code] of cases) {
          const results = await eslint.lintText(code, { filePath });
          if (await eslint.isPathIgnored(filePath) || results.some((result) => result.fatalErrorCount !== 0)) {
            throw new Error(filePath + " was ignored or failed to parse");
          }
          rules.push(results.flatMap((result) => result.messages).map((message) => message.ruleId));
        }
        process.stdout.write(JSON.stringify(rules));
      `,
    );

    expect(JSON.parse(output)).toEqual([
      expect.arrayContaining(["no-restricted-globals"]),
      expect.arrayContaining(["no-restricted-imports"]),
      expect.arrayContaining(["no-restricted-imports"]),
      expect.arrayContaining(["@typescript-eslint/no-restricted-types"]),
      [],
    ]);
  });

  it("lints the fixtures that need no peer, the JSX component among them, without messages", async () => {
    expect(
      await lint(withoutPeers, defaultConfig, fixturesWithoutPeers),
    ).toEqual(withoutMessages(fixturesWithoutPeers));
  }, 120_000);

  // Typescript-eslint takes an absolute `tsconfigRootDir` only, and reports any other as a parsing
  // error in every file that it reads with type information.
  it.each(relativeRootConfigs)(
    "lints the TypeScript fixtures with type information when %s is a relative path",
    async (_option, config) => {
      expect(await lint(withoutPeers, config, typescriptFixtures)).toEqual(
        withoutMessages(typescriptFixtures),
      );
    },
    120_000,
  );

  it("fails with an install message for a framework that is on or that the project declares, and needs no peer for one that is off", async () => {
    const declaresReact = await createProjectRoot(withoutPeers, "react", [
      "react",
    ]);

    expect(
      await runFrameworkCases(withoutPeers, {
        declared: { projectRootDirectory: declaresReact },
        declaredOff: { projectRootDirectory: declaresReact, react: false },
        express: { express: true },
        react: { react: true },
        svelte: { svelte: true },
        undeclared: {},
        vitest: { vitest: true },
      }),
    ).toEqual({
      declared:
        'The "react" feature needs "@html-eslint/eslint-plugin-react", which is not installed. Install it, or set `react: false` to turn the feature off.',
      declaredOff: [],
      express:
        'The "express" feature needs "eslint-plugin-express-security", which is not installed. Install it, or set `express: false` to turn the feature off.',
      react:
        'The "react" feature needs "@html-eslint/eslint-plugin-react", which is not installed. Install it, or set `react: false` to turn the feature off.',
      svelte:
        'The "svelte" feature needs "@html-eslint/eslint-plugin-svelte", which is not installed. Install it, or set `svelte: false` to turn the feature off.',
      undeclared: [],
      vitest:
        'The "vitest" feature needs "@vitest/eslint-plugin", which is not installed. Install it, or set `vitest: false` to turn the feature off.',
    });
  });

  it("stops ESLint before it lints, with a message that names what replaces the options of 0.1.0", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only eslint.config.js in the owned withoutPeers consumer for the migration fixture.
    await writeFile(
      path.join(withoutPeers, "eslint.config.js"),
      `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  reactRefreshVariant: "vite",
  rules: { js: { "no-console": "error" } },
  tsTypeChecked: true,
});
`,
    );
    const { exitCode, stderr, stdout } = await runCommand(
      process.execPath,
      [
        path.join(withoutPeers, "node_modules", "eslint", "bin", "eslint.js"),
        "fixtures/format-date.js",
      ],
      withoutPeers,
    );

    // ESLint exits with 2 when it cannot load the config, and with 0 or 1 once it has linted.
    expect(exitCode, stderr).toBe(2);
    expect(stdout).toBe("");
    expect(stderr).toContain(
      [
        "Error: createConfig() does not know these options:",
        "- `reactRefreshVariant`: an option of 0.1.0, now `react.refresh`.",
        "- `rules`: an option of 0.1.0, now the `overrides` of each feature: `javascript.overrides` for core rules, and the `overrides` of a plugin's feature for the plugin's rules.",
        "- `tsTypeChecked`: an option of 0.1.0, now `typescript.typeChecked`.",
        'See "Migrating from 0.1.0" in the README of 0.2.0: https://github.com/cravingmaker/eslint-config/blob/v0.2.0/README.md#migrating-from-010',
      ].join("\n"),
    );
  }, 120_000);

  it("compiles a TypeScript example of the options, and rejects invalid ones", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only options-example.ts in the owned withoutPeers consumer.
    await writeFile(
      path.join(withoutPeers, "options-example.ts"),
      `
import type { Linter } from "eslint";
import type {
  Feature,
  FeatureOptions,
  GlobalEnvironment,
  JsonOptions,
  Options,
  ReactOptions,
  ReactRefreshVariant,
  Rules,
  TypeScriptOptions,
} from "@cravingmaker/eslint-config";

import { createConfig } from "@cravingmaker/eslint-config";

const environments: readonly GlobalEnvironment[] = ["browser", "node"];
const refresh: ReactRefreshVariant = "vite";
const react: ReactOptions = { files: ["src/**/*.tsx"], refresh };
const json: JsonOptions = { overridesJsonc: { "json/sort-keys": "off" } };
const markdown: FeatureOptions = { overrides: { "markdown/no-html": "off" } };
const unicorn: Feature = { ignores: ["src/legacy/**"] };
const rules: Rules = { eqeqeq: ["error", "smart"], "no-console": "warn" };
const sonarjs: Feature = { overrides: { "sonarjs/cognitive-complexity": ["warn", 20] } };
const stylistic: Feature = { overrides: { "@stylistic/spaced-comment": ["error", "always"] } };
const typescript: TypeScriptOptions = {
  filesTypeAware: ["src/**"],
  ignoresTypeAware: ["scripts/**"],
  overridesTypeAware: { "@typescript-eslint/no-floating-promises": "warn" },
  typeChecked: true,
};
const options: Options = {
  environments,
  express: "auto",
  globals: { MY_GLOBAL: "readonly" },
  ignores: ["generated/**"],
  javascript: { overrides: rules },
  json,
  markdown,
  projectRootDirectory: "/project",
  react,
  sonarjs,
  stylistic,
  svelte: false,
  typescript,
  unicorn,
};
const userConfig: Linter.Config = { files: ["**/*.js"], rules: { "no-console": "off" } };
const config: Promise<Linter.Config[]> = createConfig(options, userConfig);

// @ts-expect-error -- The 0.1.0 option is \`typescript.typeChecked\` now.
const removedOption: Options = { tsTypeChecked: true };
// @ts-expect-error -- Only react, svelte, and express detect themselves.
const invalidAuto: Options = { unicorn: "auto" };
// @ts-expect-error -- The options of a rule are checked against its schema.
const invalidRuleOptions: Rules = { eqeqeq: ["error", "sometimes"] };
// @ts-expect-error -- Stylistic options are checked against the bundled rule schemas.
const invalidStylisticOptions: Rules = { "@stylistic/spaced-comment": ["error", "sometimes"] };

// @ts-expect-error -- SonarJS thresholds are checked against the bundled rule schema.
const invalidSonarjsOptions: Rules = { "sonarjs/cognitive-complexity": ["warn", false] };

export { config, invalidAuto, invalidRuleOptions, invalidSonarjsOptions, invalidStylisticOptions, removedOption };
`,
    );
    // Without optional peers and without ambient types, and with every declaration checked.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only tsconfig.json in the owned withoutPeers consumer.
    await writeFile(
      path.join(withoutPeers, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          module: "nodenext",
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: "es2024",
          types: [],
        },
        files: ["options-example.ts"],
      }),
    );

    expect(
      await getOutput(
        process.execPath,
        [
          path.join(withoutPeers, "node_modules", "typescript", "bin", "tsc"),
          "--project",
          "tsconfig.json",
          "--pretty",
          "false",
        ],
        withoutPeers,
      ),
    ).toBe("");
  }, 120_000);
});

describe("a consumer with a partial peer set", () => {
  it("lints the React fixtures without React Refresh, which needs a bundler that the project does not declare", async () => {
    const filePaths = [...fixturesWithoutPeers, ...reactFixtures];

    expect(await lint(withPartialPeers, reactConfig, filePaths)).toEqual(
      withoutMessages(filePaths),
    );
  }, 120_000);

  // Without React Refresh, no block registers its plugin, which this consumer has not installed.
  // ESLint stops when a rule is on in a file whose configuration lacks its plugin.
  it("lints the React fixtures with an override of the React Refresh rule, which applies nowhere without React Refresh", async () => {
    const filePaths = ["fixtures/react/Greeting.jsx", ...reactFixtures];

    expect(
      await lint(withPartialPeers, refreshOverrideConfig, filePaths),
    ).toEqual(withoutMessages(filePaths));
  }, 120_000);

  it("fails with an install message for a missing peer, and with Node's message for a missing peer of a peer", async () => {
    const declaresVite = await createProjectRoot(withPartialPeers, "vite", [
      "react",
      "vite",
    ]);
    const { svelte, ...results } = await runFrameworkCases(withPartialPeers, {
      detected: {},
      refresh: { projectRootDirectory: declaresVite },
      refreshOff: {
        projectRootDirectory: declaresVite,
        react: { refresh: false },
      },
      svelte: { svelte: true },
    });

    expect(results).toEqual({
      detected: [
        "@cravingmaker/eslint-config/react/html",
        "@cravingmaker/eslint-config/react/hooks",
      ],
      refresh:
        'The "react" feature needs "eslint-plugin-react-refresh", which is not installed. Install it, or set `react: { refresh: false }` to turn `refresh` off.',
      refreshOff: [
        "@cravingmaker/eslint-config/react/html",
        "@cravingmaker/eslint-config/react/hooks",
      ],
    });
    // Npm installs svelte-eslint-parser with @html-eslint/eslint-plugin-svelte, whose peer it is.
    // The parser imports svelte, its optional peer, which is missing. Peers of peers are not
    // checked, so Node's message reaches the consumer.
    expect(svelte).toMatch(/^Cannot find package 'svelte' imported from /u);
  });
});

describe("a consumer with every optional peer", () => {
  it("lints every fixture without messages, with the frameworks that the fixtures declare", async () => {
    const messages = await lint(
      withAllPeers,
      `import path from "node:path";

import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  projectRootDirectory: path.join(import.meta.dirname, "fixtures"),
  // React ships no type declarations.
  typescript: { ignoresTypeAware: ["fixtures/react/**"] },
});
`,
      ["fixtures"],
    );

    expect(Object.keys(messages)).toHaveLength(18);
    expect(messages).toEqual(withoutMessages(Object.keys(messages)));
  }, 120_000);

  it("lints typed sources with type information and a script outside every tsconfig without it", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Create only the scripts child inside the owned withAllPeers consumer.
    await mkdir(path.join(withAllPeers, "scripts"));
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only scripts/build.ts inside the owned withAllPeers consumer.
    await writeFile(
      path.join(withAllPeers, "scripts", "build.ts"),
      "export const build = (target: string): string => {\n  return target;\n};\n",
    );
    const messages = await lint(
      withAllPeers,
      `import path from "node:path";

import { createConfig } from "@cravingmaker/eslint-config";

const fixtures = path.join(import.meta.dirname, "fixtures");

export default createConfig({
  express: true,
  projectRootDirectory: fixtures,
  react: { refresh: "generic" },
  svelte: true,
  typescript: {
    // React ships no type declarations, and no tsconfig includes the scripts.
    ignoresTypeAware: ["fixtures/react/**", "scripts/**"],
    tsconfigRootDir: fixtures,
    typeChecked: true,
  },
  vitest: true,
});
`,
      ["fixtures", "scripts"],
    );

    expect(Object.keys(messages)).toHaveLength(19);
    expect(messages).toEqual(withoutMessages(Object.keys(messages)));
  }, 120_000);

  it("adds no framework blocks for a project that declares no framework", async () => {
    const declaresNothing = await createProjectRoot(
      withAllPeers,
      "nothing",
      [],
    );

    expect(
      await runFrameworkCases(withAllPeers, {
        declared: {
          projectRootDirectory: path.join(withAllPeers, "fixtures"),
        },
        undeclared: { projectRootDirectory: declaresNothing },
      }),
    ).toEqual({
      declared: [
        "@cravingmaker/eslint-config/react/html",
        "@cravingmaker/eslint-config/react/hooks",
        "@cravingmaker/eslint-config/svelte/rules",
      ],
      undeclared: [],
    });
  });
});
