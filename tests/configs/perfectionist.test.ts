import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../utilities.js";

const jsOptions = { filePath: "test.js" } as const;
const tsOptions = {
  filePath: "tests/utilities.ts",
  tsTypeChecked: true,
} as const;

describe("perfectionist rules", () => {
  it("perfectionist/sort-arrays: sorts const-asserted array literals only", async () => {
    await expectLintError(
      `const names = ['beta', 'alpha'] as const;\nconsole.log(names);\n`,
      "perfectionist/sort-arrays",
      tsOptions,
    );
  });

  it("perfectionist/sort-intersection-types: sorts intersection members by configured type groups", async () => {
    await expectLintError(
      `type Entity = { id: string } & string;\nconst entity = 'id' as Entity;\nconsole.log(entity);\n`,
      "perfectionist/sort-intersection-types",
      tsOptions,
    );
  });

  it("perfectionist/sort-union-types: sorts union members by configured type groups", async () => {
    await expectLintError(
      `type Value = { id: string } | string;\nconst value = 'id' as Value;\nconsole.log(value);\n`,
      "perfectionist/sort-union-types",
      tsOptions,
    );
  });

  it("perfectionist/sort-variable-declarations: stays disabled in favor of one-var", async () => {
    await expectNoLintError(
      `const beta = 2, alpha = 1;\nconsole.log(beta, alpha);\n`,
      "perfectionist/sort-variable-declarations",
      jsOptions,
    );
  });
});
