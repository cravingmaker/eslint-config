/* eslint-disable security/detect-non-literal-fs-filename -- The consumers are created in a temporary directory. */

import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

type LintResult = {
  readonly filePath: string;
  readonly messages: ReadonlyArray<{
    readonly column: number;
    readonly line: number;
    readonly message: string;
    readonly ruleId: string | null;
  }>;
};
type Manifest = { readonly devDependencies: Readonly<Record<string, string>> };
type Messages = Readonly<Record<string, readonly string[]>>;

// eslint-disable-next-line @typescript-eslint/strict-void-return -- promisify takes the callback form of execFile, which also returns its child process.
const execute = promisify(execFile);
const projectDirectory = fileURLToPath(new URL("../..", import.meta.url));
const fixturesDirectory = fileURLToPath(
  new URL("../fixtures", import.meta.url),
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This repository's manifest has this shape.
const manifest = JSON.parse(
  await readFile(path.join(projectDirectory, "package.json"), "utf8"),
) as Manifest;
// ESLint and the peers are the versions that this repository tests with.
const testedVersions = new Map(Object.entries(manifest.devDependencies));

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
const defaultConfig = `import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig();
`;

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-install-"),
);

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}
/*
A project that installs the packed package, ESLint, and `peers` from the registry, as a consumer
does, with this repository's install policy: no install scripts, and no version less than seven
days old. The fixtures are copied into `fixtures/`.
*/
async function createConsumer(
  name: string,
  tarball: string,
  peers: readonly string[],
): Promise<string> {
  const directory = path.join(temporaryDirectory, name);
  await mkdir(directory);
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ name: `consumer-${name}`, private: true, type: "module" }),
  );
  await writeFile(
    path.join(directory, ".npmrc"),
    "audit=false\nfund=false\nignore-scripts=true\nmin-release-age=7\n",
  );
  await execute(
    "npm",
    [
      "install",
      "--prefer-offline",
      "--save-exact",
      tarball,
      ...["eslint", ...peers].map(
        (packageName) =>
          `${packageName}@${testedVersions.get(packageName) ?? "missing"}`,
      ),
    ],
    { cwd: directory },
  );
  await cp(fixturesDirectory, path.join(directory, "fixtures"), {
    recursive: true,
  });
  return directory;
}
// A project root in the consumer in `directory` whose manifest declares `dependencies`.
async function createProjectRoot(
  directory: string,
  name: string,
  dependencies: readonly string[],
): Promise<string> {
  const projectRootDirectory = path.join(directory, "projects", name);
  const devDependencies = Object.fromEntries(
    dependencies.map((dependency) => [dependency, "1.0.0"]),
  );
  await mkdir(projectRootDirectory, { recursive: true });
  await writeFile(
    path.join(projectRootDirectory, "package.json"),
    JSON.stringify({ devDependencies, private: true, type: "module" }),
  );
  return projectRootDirectory;
}
// The package as published: `npm pack` of the current build, in `destination`.
async function createTarball(destination: string): Promise<string> {
  const { stdout } = await execute(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", destination],
    { cwd: projectDirectory },
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- `npm pack --json` prints this shape.
  const [{ filename }] = JSON.parse(stdout) as readonly [
    { readonly filename: string },
  ];
  return path.join(destination, filename);
}
/*
Runs a command and returns what it prints, also when it exits with an error, as ESLint does when
it reports a problem and TypeScript does when it finds one.
*/
async function getOutput(
  command: string,
  commandArguments: readonly string[],
  directory: string,
): Promise<string> {
  try {
    const { stdout } = await execute(command, [...commandArguments], {
      cwd: directory,
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    return typeof error === "object" &&
      error !== null &&
      "stdout" in error &&
      typeof error.stdout === "string"
      ? error.stdout
      : String(error);
  }
}
/*
Runs the ESLint CLI of the consumer in `directory` with `config` as `eslint.config.js` on
`filePaths`, and returns the messages of each file by path.
*/
async function lint(
  directory: string,
  config: string,
  filePaths: readonly string[],
): Promise<Messages> {
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
    results.map(({ filePath, messages }) => [
      path.relative(directory, filePath).replaceAll(path.sep, "/"),
      messages.map(
        ({ column, line, message, ruleId }) =>
          `${String(line)}:${String(column)} ${ruleId ?? "fatal"}: ${message}`,
      ),
    ]),
  );
}
// Runs `script` as an ES module in the consumer in `directory` and returns what it prints.
async function run(directory: string, script: string): Promise<string> {
  const { stdout } = await execute(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: directory },
  );
  return stdout;
}
/*
Calls `createConfig` in the consumer in `directory` with the options of each case, and returns
the names of the framework blocks for each, or the message that it fails with.
*/
async function runFrameworkCases(
  directory: string,
  cases: Readonly<Record<string, Readonly<Record<string, unknown>>>>,
): Promise<Readonly<Record<string, unknown>>> {
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
            .filter((blockName) => ["express", "react", "svelte"].includes(blockName.split("/")[2]));
        } catch (error) {
          results[name] = error.message;
        }
      }
      process.stdout.write(JSON.stringify(results));
    `,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The script prints an object.
  return JSON.parse(output) as Readonly<Record<string, unknown>>;
}
// `filePaths` without messages, by path.
function withoutMessages(filePaths: readonly string[]): Messages {
  return Object.fromEntries(filePaths.map((filePath) => [filePath, []]));
}

const tarball = await createTarball(temporaryDirectory);
// Three peer sets, installed in parallel: none, a partial set, and every optional peer.
const [withoutPeers, withPartialPeers, withAllPeers] = await Promise.all([
  createConsumer("without-peers", tarball, []),
  createConsumer("partial-peers", tarball, [
    "@html-eslint/eslint-plugin-react",
    "@html-eslint/eslint-plugin-svelte",
    "eslint-plugin-react-hooks",
    "react",
  ]),
  createConsumer("all-peers", tarball, [
    "@html-eslint/eslint-plugin-react",
    "@html-eslint/eslint-plugin-svelte",
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
      "package/dist/index.d.mts.map",
      "package/dist/index.mjs",
      "package/dist/index.mjs.map",
      "package/LICENSE",
      "package/package.json",
      "package/README.md",
    ]);
  });

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
});

describe("a consumer without optional peers", () => {
  it("lints the fixtures that need no peer, the JSX component among them, without messages", async () => {
    expect(
      await lint(withoutPeers, defaultConfig, fixturesWithoutPeers),
    ).toEqual(withoutMessages(fixturesWithoutPeers));
  }, 120_000);

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
    });
  });

  it("compiles a TypeScript example of the options, and rejects invalid ones", async () => {
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

export { config, invalidAuto, invalidRuleOptions, removedOption };
`,
    );
    // Without optional peers and without ambient types, and with every declaration checked.
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

    expect(await lint(withPartialPeers, defaultConfig, filePaths)).toEqual(
      withoutMessages(filePaths),
    );
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
    // npm installs svelte-eslint-parser with @html-eslint/eslint-plugin-svelte, whose peer it is.
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
});
`,
      ["fixtures"],
    );

    expect(Object.keys(messages)).toHaveLength(18);
    expect(messages).toEqual(withoutMessages(Object.keys(messages)));
  }, 120_000);

  it("lints typed sources with type information and a script outside every tsconfig without it", async () => {
    await mkdir(path.join(withAllPeers, "scripts"));
    await writeFile(
      path.join(withAllPeers, "scripts", "build.ts"),
      "export function build(target: string): string {\n  return target;\n}\n",
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
