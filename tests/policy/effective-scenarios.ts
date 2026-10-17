import process from "node:process";

import { ESLint } from "eslint";

import { createConfig } from "../../dist/index.mjs";
import { describeEffectiveConfig } from "./effective-config.js";

type ConfigOptions = NonNullable<Parameters<typeof createConfig>[0]>;
/**
A set of options and the snapshots of the configuration that they give.
*/
type EffectiveScenario = {
  readonly name: string;
  readonly options: ConfigOptions;
  readonly snapshots: readonly EffectiveSnapshot[];
};
/**
The description of the configuration that ESLint resolves for `filePath`, stored in `path`
under `__snapshots__/effective-rules/`. With `ruleIdPrefix`, it keeps only the rules whose ID
starts with it.
*/
type EffectiveSnapshot = {
  readonly filePath: string;
  readonly path: string;

  readonly ruleIdPrefix?: string;
};

const rootDirectory = process.cwd();
const baseOptions = {
  express: true,
  projectRootDirectory: rootDirectory,
  react: { refresh: "generic" },
  svelte: true,
  typescript: { tsconfigRootDir: rootDirectory },
} as const satisfies ConfigOptions;

/*
The suites turn every framework on, and every optional peer is installed in this
repository, so these snapshots describe the configuration with all integrations
active. Update them with `vitest -u` only after reviewing the diff: a changed
line is a changed lint policy.

The narrowed-owners suite limits each feature that replaces rules of other
features to `src/`, and records files outside it.

The type-aware-scope suite limits typed linting to `src/` without
`src/legacy/`, and leaves generated files out of the TypeScript feature. It
records a file outside `filesTypeAware`, one in `ignoresTypeAware`, and one in
`typescript.ignores`.

The type-checked suite also records a Svelte component, which typed linting
leaves out of the type-aware scope.

The React Refresh scenarios record only the `react-refresh/` rules, with each
variant.
*/
const suites = [
  {
    filePaths: ["scripts/example.js", "scripts/example.ts"],
    name: "narrowed-owners",
    options: {
      ...baseOptions,
      imports: { files: ["src/**"] },
      perfectionist: { files: ["src/**"] },
      regexp: { files: ["src/**"] },
      unicorn: { files: ["src/**"] },
      unusedImports: { files: ["src/**"] },
    },
  },
  {
    filePaths: [
      "scripts/example.ts",
      "src/legacy/example.ts",
      "src/example.generated.ts",
    ],
    name: "type-aware-scope",
    options: {
      ...baseOptions,
      typescript: {
        ...baseOptions.typescript,
        filesTypeAware: ["src/**"],
        ignores: ["**/*.generated.ts"],
        ignoresTypeAware: ["src/legacy/**"],
        typeChecked: true,
      },
    },
  },
  {
    filePaths: [
      "src/example.js",
      "src/example.cjs",
      "src/example.jsx",
      "src/example.ts",
      "src/example.cts",
      "src/example.tsx",
      "eslint.config.js",
      "src/Component.svelte",
      "src/state.svelte.js",
      "src/state.svelte.ts",
      "index.html",
      "data.json",
      "data.jsonc",
      "data.json5",
      "tsconfig.json",
      "package.json",
      "packages/app/package.json",
      "package-lock.json",
      "README.md",
      "notes.txt",
      "dist/generated.js",
      "packages/app/dist/generated.js",
    ],
    name: "default",
    options: baseOptions,
  },
  {
    filePaths: [
      "src/example.ts",
      "src/example.tsx",
      "src/example.test.ts",
      "src/Component.svelte",
    ],
    name: "type-checked",
    options: {
      ...baseOptions,
      typescript: { ...baseOptions.typescript, typeChecked: true },
    },
  },
] as const satisfies ReadonlyArray<{
  readonly filePaths: readonly string[];
  readonly name: string;
  readonly options: ConfigOptions;
}>;
const reactRefreshVariants = ["generic", "next", "vite"] as const;

/**
Every scenario of the effective-rules snapshots, in the order that the snapshot test and the
policy difference report present them.
*/
const effectiveScenarios: readonly EffectiveScenario[] = [
  ...suites.map(({ filePaths, name, options }) => {
    return {
      name,
      options,
      snapshots: filePaths.map((filePath) => {
        return {
          filePath,
          path: `${name}/${filePath.replaceAll("/", "__")}.txt`,
        };
      }),
    };
  }),
  ...reactRefreshVariants.map((variant) => {
    return {
      name: `react-refresh-${variant}`,
      options: { ...baseOptions, react: { refresh: variant } },
      snapshots: [
        {
          filePath: "src/example.tsx",
          path: `react-refresh/${variant}.tsx.txt`,
          ruleIdPrefix: "react-refresh/",
        },
      ],
    };
  }),
];

const createEslint = async (options: ConfigOptions): Promise<ESLint> => {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
};
/**
Describes the configuration that `eslint` resolves for the file of `snapshot`, as its snapshot
stores it.
*/
const describeSnapshot = async (
  eslint: ESLint,
  { filePath, ruleIdPrefix }: EffectiveSnapshot,
): Promise<string> => {
  const description = await describeEffectiveConfig(
    eslint,
    filePath,
    rootDirectory,
  );
  if (typeof ruleIdPrefix === "undefined") {
    return description;
  }

  const rules = description.split("\n").filter((line) => {
    return line.startsWith(ruleIdPrefix);
  });
  return `${rules.join("\n")}\n`;
};

export type { EffectiveScenario, EffectiveSnapshot };
export { createEslint, describeSnapshot, effectiveScenarios };
