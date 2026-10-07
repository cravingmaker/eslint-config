import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../utilities.js";

const jsOptions = { filePath: "test.js" } as const;

describe("unused-imports rules", () => {
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
