import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { withoutIgnores } from "../../src/utilities/file-scope.js";
import { getResolvedConfig } from "../support/resolved-config.js";

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

/*
The paths that each of two blocks reaches: one with `ignores` as its ignore list, which ESLint
reads in order, and one with the files of `withoutIgnores` and no ignore list.
*/
const describeLeftIn = async (
  ignores: readonly string[],
): Promise<{
  readonly byFiles: readonly string[];
  readonly byIgnores: readonly string[];
}> => {
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
      const config = await getResolvedConfig(eslint, filePath);
      return { filePath, ruleIds: Object.keys(config?.rules ?? {}) };
    }),
  );
  const pathsWith = (ruleId: string): readonly string[] => {
    return reached
      .filter(({ ruleIds }) => {
        return ruleIds.includes(ruleId);
      })
      .map(({ filePath }) => {
        return filePath;
      });
  };

  return {
    byFiles: pathsWith("no-console"),
    byIgnores: pathsWith("no-debugger"),
  };
};

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
