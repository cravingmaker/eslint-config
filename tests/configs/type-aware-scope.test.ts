/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */

import type { TypeScriptOptions } from "../../src/types.js";

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";
import { withoutIgnores } from "../../src/utilities/type-aware.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parserOptions?: Readonly<Record<string, unknown>>;
  };
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};
// How a file is linted: whether the parser reads type information, and which of
// `typeAwareRuleIds` are on.
type TypeInformation = {
  readonly projectService: boolean;
  readonly typeAwareRules: readonly string[];
};

const floatingPromise =
  "export async function load(): Promise<number> {\n  return await Promise.resolve(1);\n}\n\nload();\n";
/*
A project whose tsconfig includes `src/` only. `scripts/build.ts` is outside it, as scripts and
config files often are, so the project service cannot find it. `src/read.generated.ts` has no
type syntax, so espree can parse it, and `src/legacy/index.ts` is a typed source that a project
may leave out of the type-aware rules. The manifest declares no framework.
*/
const projectFiles = {
  "package.json": JSON.stringify({ name: "fixture", type: "module" }),
  "scripts/build.ts":
    "export function build(target: string): string {\n  return target;\n}\n",
  "src/data.json": '{ "name": "fixture" }\n',
  "src/index.ts": floatingPromise,
  "src/legacy/index.ts": floatingPromise,
  "src/read.generated.ts": "export function read(file) {\n  return file;\n}\n",
  "src/util.js": "export const triple = (value) => value * 3;\n",
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      module: "esnext",
      moduleResolution: "bundler",
      skipLibCheck: true,
      strict: true,
      target: "es2022",
    },
    include: ["src/**/*.ts"],
  }),
} as const;
// Paths that the ignore lists below tell apart.
const scopedPaths = [
  "index.ts",
  "scripts/build.ts",
  "src/generated/data.ts",
  "src/generated/deep/keep.ts",
  "src/generated/keep.ts",
  "src/index.ts",
] as const;
// Ignore lists, each with the paths that it leaves in when ESLint reads it in order.
const ignoreLists: ReadonlyArray<
  readonly [ignores: readonly string[], leftIn: readonly string[]]
> = [
  [[], scopedPaths],
  [
    ["scripts/**"],
    [
      "index.ts",
      "src/generated/data.ts",
      "src/generated/deep/keep.ts",
      "src/generated/keep.ts",
      "src/index.ts",
    ],
  ],
  [
    ["**/generated/**", "!**/generated/keep.ts"],
    ["index.ts", "scripts/build.ts", "src/generated/keep.ts", "src/index.ts"],
  ],
  [["**/*", "!scripts/**"], ["scripts/build.ts"]],
  // A negated pattern brings back only what the patterns before it left out.
  [["!scripts/**", "**/*"], []],
  // A later pattern leaves a file out again.
  [
    ["**/generated/**", "!**/generated/keep.ts", "**/keep.ts"],
    ["index.ts", "scripts/build.ts", "src/index.ts"],
  ],
  [
    ["**/*", "!src/**", "src/generated/**", "!src/generated/deep/**"],
    ["src/generated/deep/keep.ts", "src/index.ts"],
  ],
  [
    ["src/**", "scripts/**", "!src/index.ts", "!scripts/**"],
    ["index.ts", "scripts/build.ts", "src/index.ts"],
  ],
  // ESLint reads any number of leading `!` as one.
  [
    ["**/generated/**", "!!**/generated/keep.ts"],
    ["index.ts", "scripts/build.ts", "src/generated/keep.ts", "src/index.ts"],
  ],
  // ESLint drops a leading `./`, also after the `!`.
  [
    ["./src/generated/**", "!./src/generated/keep.ts"],
    ["index.ts", "scripts/build.ts", "src/generated/keep.ts", "src/index.ts"],
  ],
];
// One rule that needs type information from each feature that has them.
const typeAwareRuleIds = [
  "functional/readonly-type",
  "n/no-sync",
  "@typescript-eslint/await-thenable",
] as const;
const typed: TypeInformation = {
  projectService: true,
  typeAwareRules: typeAwareRuleIds,
};
const untyped: TypeInformation = { projectService: false, typeAwareRules: [] };

const projectDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-type-aware-scope-"),
);
await Promise.all(
  Object.entries(projectFiles).map(async ([fileName, content]) => {
    const filePath = path.join(projectDirectory, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }),
);

afterAll(async () => {
  await rm(projectDirectory, { force: true, recursive: true });
});

// ESLint for the fixture project with typed linting and `typescript`.
async function createEslint(typescript: TypeScriptOptions): Promise<ESLint> {
  return new ESLint({
    cwd: projectDirectory,
    overrideConfig: await createConfig({
      projectRootDirectory: projectDirectory,
      typescript: {
        ...typescript,
        tsconfigRootDir: projectDirectory,
        typeChecked: true,
      },
    }),
    overrideConfigFile: true,
  });
}
/*
The paths that each of two blocks reaches: one with `ignores` as its ignore list, which ESLint
reads in order, and one with the files of `withoutIgnores` and no ignore list.
*/
async function describeLeftIn(ignores: readonly string[]): Promise<{
  readonly byFiles: readonly string[];
  readonly byIgnores: readonly string[];
}> {
  const eslint = new ESLint({
    overrideConfig: [
      {
        files: ["**/*.ts"],
        ignores: [...ignores],
        rules: { "no-debugger": "error" },
      },
      {
        files: withoutIgnores(["**/*.ts"], ignores),
        rules: { "no-console": "error" },
      },
    ],
    overrideConfigFile: true,
  });
  const reached = await Promise.all(
    scopedPaths.map(async (filePath) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
      const config = (await eslint.calculateConfigForFile(filePath)) as
        EffectiveConfig | undefined;
      return { filePath, ruleIds: Object.keys(config?.rules ?? {}) };
    }),
  );
  const pathsWith = (ruleId: string): readonly string[] =>
    reached
      .filter(({ ruleIds }) => ruleIds.includes(ruleId))
      .map(({ filePath }) => filePath);
  return {
    byFiles: pathsWith("no-console"),
    byIgnores: pathsWith("no-debugger"),
  };
}
// How each of `filePaths` is linted, by path.
async function describeTypeInformation(
  eslint: ESLint,
  filePaths: readonly string[],
): Promise<Readonly<Record<string, TypeInformation>>> {
  return Object.fromEntries(
    await Promise.all(
      filePaths.map(
        async (filePath): Promise<readonly [string, TypeInformation]> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
          const config = (await eslint.calculateConfigForFile(filePath)) as
            EffectiveConfig | undefined;
          const rules = new Map(Object.entries(config?.rules ?? {}));
          return [
            filePath,
            {
              projectService:
                config?.languageOptions?.parserOptions?.projectService === true,
              typeAwareRules: typeAwareRuleIds.filter(
                (ruleId) => (rules.get(ruleId)?.[0] ?? 0) !== 0,
              ),
            },
          ];
        },
      ),
    ),
  );
}
// The fatal errors of each of `filePaths`, and whether `ruleId` reports it, by path.
async function lintByPath(
  eslint: ESLint,
  filePaths: readonly string[],
  ruleId: string,
): Promise<
  Readonly<Record<string, { fatal: readonly string[]; reported: boolean }>>
> {
  const results = await eslint.lintFiles([...filePaths]);
  return Object.fromEntries(
    results.map(({ filePath, messages }) => [
      path.relative(projectDirectory, filePath).replaceAll(path.sep, "/"),
      {
        fatal: messages
          .filter((message) => message.fatal === true)
          .map((message) => message.message),
        reported: messages.some((message) => message.ruleId === ruleId),
      },
    ]),
  );
}

describe("withoutIgnores", () => {
  it.each(ignoreLists)(
    "leaves in the files that ESLint leaves in with the ignores %j",
    async (ignores, leftIn) => {
      expect(await describeLeftIn(ignores)).toEqual({
        byFiles: leftIn,
        byIgnores: leftIn,
      });
    },
  );

  it("limits every set of patterns of the scope, and keeps the scope without ignores", () => {
    const scope = ["scripts/**/*.ts", ["src/**", "**/*.ts"]] as const;

    expect(withoutIgnores(scope, [])).toEqual(scope);
    expect(
      withoutIgnores(scope, ["**/generated/**", "!**/generated/keep.ts"]),
    ).toEqual([
      ["scripts/**/*.ts", "!**/generated/**"],
      ["scripts/**/*.ts", "**/generated/keep.ts"],
      ["src/**", "**/*.ts", "!**/generated/**"],
      ["src/**", "**/*.ts", "**/generated/keep.ts"],
    ]);
  });
});

describe("type-aware scope", () => {
  it("lints typed sources with type information and other TypeScript files without it", async () => {
    const eslint = await createEslint({
      filesTypeAware: ["src/**"],
      ignoresTypeAware: ["src/legacy/**"],
    });

    expect(
      await lintByPath(
        eslint,
        ["scripts/build.ts", "src/index.ts", "src/legacy/index.ts"],
        "@typescript-eslint/no-floating-promises",
      ),
    ).toEqual({
      "scripts/build.ts": { fatal: [], reported: false },
      "src/index.ts": { fatal: [], reported: true },
      "src/legacy/index.ts": { fatal: [], reported: false },
    });
  });

  it("keeps type information and type-aware rules within TypeScript files", async () => {
    // A directory pattern also matches the JavaScript and JSON files in it.
    const eslint = await createEslint({ filesTypeAware: ["src/**"] });

    expect(
      await lintByPath(
        eslint,
        ["src/data.json", "src/index.ts", "src/util.js"],
        "@typescript-eslint/no-floating-promises",
      ),
    ).toEqual({
      "src/data.json": { fatal: [], reported: false },
      "src/index.ts": { fatal: [], reported: true },
      "src/util.js": { fatal: [], reported: false },
    });
  });

  it("lints a TypeScript file that the TypeScript feature leaves out without type-aware rules", async () => {
    const eslint = await createEslint({ ignores: ["**/*.generated.ts"] });

    expect(
      await lintByPath(
        eslint,
        ["src/read.generated.ts"],
        "functional/prefer-immutable-types",
      ),
    ).toEqual({ "src/read.generated.ts": { fatal: [], reported: false } });
  });

  it.each([
    [
      "by default",
      {},
      {
        "scripts/build.ts": typed,
        "src/index.ts": typed,
        "src/legacy/index.ts": typed,
        "src/read.generated.ts": typed,
      },
    ],
    [
      "with filesTypeAware and ignoresTypeAware",
      { filesTypeAware: ["src/**"], ignoresTypeAware: ["src/legacy/**"] },
      {
        "scripts/build.ts": untyped,
        "src/index.ts": typed,
        "src/legacy/index.ts": untyped,
        "src/read.generated.ts": typed,
      },
    ],
    [
      "within the files and ignores of the TypeScript feature",
      { files: ["src/**/*.ts"], ignores: ["**/*.generated.ts"] },
      {
        "scripts/build.ts": untyped,
        "src/index.ts": typed,
        "src/legacy/index.ts": typed,
        "src/read.generated.ts": untyped,
      },
    ],
  ] as const)(
    "turns type-aware rules on where the parser reads type information, %s",
    async (_description, typescript, expected) => {
      const eslint = await createEslint(typescript);

      expect(
        await describeTypeInformation(eslint, Object.keys(expected)),
      ).toEqual(expected);
    },
  );
});
