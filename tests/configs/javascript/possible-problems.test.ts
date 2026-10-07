import { describe, it } from "vitest";

import { expectLintError } from "../../utilities.js";

describe("js possible problem rules", () => {
  it("no-undef: reports typeof checks against undeclared variables", async () => {
    await expectLintError(
      `export const isMissing = typeof missingValue === 'undefined';\n`,
      "no-undef",
      {
        filePath: "test.js",
      },
    );
  });

  it("no-unsafe-negation: reports negated left operands in ordering relations", async () => {
    await expectLintError(
      `const value = 1;\nif (!value < 2) {\n\tconsole.log(value);\n}\n`,
      "no-unsafe-negation",
      {
        filePath: "test.js",
      },
    );
  });

  it("no-unsafe-optional-chaining: reports arithmetic on optional chains", async () => {
    await expectLintError(
      `const item = {};\nconst total = item?.count + 1;\nconsole.log(total);\n`,
      "no-unsafe-optional-chaining",
      { filePath: "test.js" },
    );
  });
});
