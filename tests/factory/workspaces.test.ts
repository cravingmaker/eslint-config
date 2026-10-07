/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parserOptions?: Readonly<Record<string, unknown>>;
  };
  readonly rules?: Readonly<Record<string, readonly [number, ...unknown[]]>>;
};
// Whether the parser reads type information for a file, and which of `ruleIds` are on there.
type Scope = {
  readonly projectService: boolean;
  readonly rules: readonly string[];
};

/*
A monorepo whose root declares no framework. The web app declares React, the API declares Express,
and only the API has a tsconfig. Each feature is scoped to its workspace with `files`.
*/
const monorepoFiles = {
  "apps/web/package.json": JSON.stringify({
    dependencies: { react: "19.0.0" },
    private: true,
    type: "module",
  }),
  "package.json": JSON.stringify({
    private: true,
    type: "module",
    workspaces: ["apps/*", "packages/*"],
  }),
  "packages/api/package.json": JSON.stringify({
    dependencies: { express: "5.0.0" },
    private: true,
    type: "module",
  }),
  "packages/api/src/handle.ts":
    "export async function handle(request: Promise<string>): Promise<string> {\n  return await request;\n}\n\nhandle(Promise.resolve(''));\n",
  "packages/api/tsconfig.json": JSON.stringify({
    compilerOptions: {
      module: "nodenext",
      noEmit: true,
      strict: true,
      target: "es2024",
    },
    include: ["src"],
  }),
} as const;
// One rule of each scoped feature.
const ruleIds = [
  "express-security/require-helmet",
  "react-hooks/rules-of-hooks",
  "@typescript-eslint/no-floating-promises",
] as const;

const rootDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-workspaces-"),
);
await Promise.all(
  Object.entries(monorepoFiles).map(async ([fileName, content]) => {
    const filePath = path.join(rootDirectory, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }),
);
const eslint = new ESLint({
  cwd: rootDirectory,
  overrideConfig: await createConfig({
    express: { files: ["packages/api/**/*.ts"] },
    projectRootDirectory: rootDirectory,
    react: { files: ["apps/web/**/*.{ts,tsx}"] },
    typescript: {
      filesTypeAware: ["packages/api/**"],
      tsconfigRootDir: rootDirectory,
      typeChecked: true,
    },
  }),
  overrideConfigFile: true,
});

afterAll(async () => {
  await rm(rootDirectory, { force: true, recursive: true });
});

// How `filePath` is scoped.
async function describeScope(filePath: string): Promise<Scope> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return {
    projectService:
      config?.languageOptions?.parserOptions?.projectService === true,
    rules: ruleIds.filter((ruleId) => (rules.get(ruleId)?.[0] ?? 0) !== 0),
  };
}
// How each of `filePaths` is scoped, by path.
async function describeScopes(
  filePaths: readonly string[],
): Promise<Readonly<Record<string, Scope>>> {
  return Object.fromEntries(
    await Promise.all(
      filePaths.map(async (filePath): Promise<readonly [string, Scope]> => [
        filePath,
        await describeScope(filePath),
      ]),
    ),
  );
}

describe("features scoped to workspaces", () => {
  it("apply in their workspace only, even where the root declares no framework", async () => {
    const expected = {
      "apps/web/src/App.tsx": {
        projectService: false,
        rules: ["react-hooks/rules-of-hooks"],
      },
      "packages/api/src/handle.ts": {
        projectService: true,
        rules: [
          "express-security/require-helmet",
          "@typescript-eslint/no-floating-promises",
        ],
      },
      "packages/ui/src/Button.tsx": { projectService: false, rules: [] },
    };

    expect(await describeScopes(Object.keys(expected))).toEqual(expected);
  });

  it("read type information through the tsconfig of their workspace", async () => {
    const [result] = await eslint.lintFiles(["packages/api/src/handle.ts"]);

    expect(
      result.messages.map(
        ({ fatal, ruleId }) => ruleId ?? `fatal: ${String(fatal)}`,
      ),
    ).toContain("@typescript-eslint/no-floating-promises");
    expect(result.messages.filter(({ fatal }) => fatal === true)).toEqual([]);
  });
});
