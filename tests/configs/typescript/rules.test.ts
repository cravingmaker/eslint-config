import { describe, it } from "vitest";

import { expectLintError } from "../../utilities.js";

const tsOptions = {
  filePath: "tests/utilities.ts",
  tsTypeChecked: true,
} as const;

describe("typescript-eslint rules", () => {
  it("@typescript-eslint/ban-ts-comment: requires descriptions for expected errors", async () => {
    await expectLintError(
      `// @ts-expect-error: TODO\nconst value: string = 1;\nconsole.log(value);\n`,
      "@typescript-eslint/ban-ts-comment",
      tsOptions,
    );
  });

  it("@typescript-eslint/consistent-type-definitions: reports interface declarations", async () => {
    await expectLintError(
      `interface User {\n\tname: string;\n}\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
      "@typescript-eslint/consistent-type-definitions",
      tsOptions,
    );
  });

  it("@typescript-eslint/explicit-member-accessibility: reports explicit public members", async () => {
    await expectLintError(
      `class Store {\n\tpublic value = 1;\n}\nconsole.log(Store);\n`,
      "@typescript-eslint/explicit-member-accessibility",
      tsOptions,
    );
  });
});
