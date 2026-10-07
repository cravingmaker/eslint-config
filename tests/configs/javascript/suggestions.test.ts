import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../../utilities.js";

describe("js suggestion rules", () => {
  it("func-style: stays disabled so declarations and expressions can coexist", async () => {
    await expectNoLintError(
      `function declared() {\n\treturn 'declared';\n}\nconst expressed = () => 'expressed';\nconsole.log(declared(), expressed());\n`,
      "func-style",
      { filePath: "test.js" },
    );
  });

  it("no-nested-ternary: reports a chained ternary as Prettier prints it, in place of unicorn/no-nested-ternary", async () => {
    const code = `const pick = (first, second) => (first ? 1 : second ? 2 : 3);\nconsole.log(pick(true, false));\n`;

    await expectLintError(code, "no-nested-ternary", { filePath: "test.js" });
    await expectNoLintError(code, "unicorn/no-nested-ternary", {
      filePath: "test.js",
    });
  });
});
