import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { describeEffectiveConfig } from "./effective-config.js";

type ConfigOptions = NonNullable<Parameters<typeof createConfig>[0]>;

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
*/
const suites = [
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
    filePaths: ["src/example.ts", "src/example.tsx", "src/example.test.ts"],
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

async function createEslint(options: ConfigOptions): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
}
function getSnapshotPath(suiteName: string, filePath: string): string {
  return `./__snapshots__/effective-rules/${suiteName}/${filePath.replaceAll("/", "__")}.txt`;
}

describe.each(suites)(
  "effective rules: $name",
  ({ filePaths, name, options }) => {
    const eslint = createEslint(options);

    it.each(filePaths)(
      "matches the reviewed policy for %s",
      async (filePath) => {
        const description = await describeEffectiveConfig(
          await eslint,
          filePath,
          rootDirectory,
        );

        await expect(description).toMatchFileSnapshot(
          getSnapshotPath(name, filePath),
        );
      },
    );
  },
);

describe("effective rules: React Refresh variants", () => {
  it.each(reactRefreshVariants)(
    "matches the reviewed policy for the %s variant",
    async (reactRefreshVariant) => {
      const eslint = await createEslint({
        ...baseOptions,
        react: { refresh: reactRefreshVariant },
      });
      const description = await describeEffectiveConfig(
        eslint,
        "src/example.tsx",
        rootDirectory,
      );
      const refreshRule = description
        .split("\n")
        .filter((line) => line.startsWith("react-refresh/"))
        .join("\n");

      await expect(`${refreshRule}\n`).toMatchFileSnapshot(
        getSnapshotPath("react-refresh", `${reactRefreshVariant}.tsx`),
      );
    },
  );
});
