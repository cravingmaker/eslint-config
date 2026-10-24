import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../../../support/lint.js";

const jsOptions = { filePath: "test.js" } as const;

describe("unused-imports rules", () => {
  it.each(["test.js", "test.mjs", "test.jsx"])(
    "unused-imports/no-unused-vars: recognizes runtime variable reads in %s",
    async (filePath) => {
      await expectNoLintError(
        `const value = 1;\nconsole.log(value);\n`,
        "unused-imports/no-unused-vars",
        { filePath },
      );
    },
  );

  it("unused-imports/no-unused-vars: reports unused variables through the plugin replacement rule", async () => {
    await expectLintError(
      `const unusedValue = 1;\nconsole.log('ready');\n`,
      "unused-imports/no-unused-vars",
      jsOptions,
    );
  });

  it("unused-imports/no-unused-vars: allows intentionally ignored underscore-prefixed variables", async () => {
    await expectNoLintError(
      `const _unusedValue = 1;\nconsole.log('ready');\n`,
      "unused-imports/no-unused-vars",
      jsOptions,
    );
  });
});
