import { describe, it } from "vitest";

import { expectNoLintError } from "../utilities.js";

const jsOptions = { filePath: "test.js" } as const;

describe("promise rules", () => {
  it("promise/no-native: stays disabled in favor of the built-in Promise", async () => {
    await expectNoLintError(
      `const task = Promise.resolve('ready');\nconsole.log(task);\n`,
      "promise/no-native",
      jsOptions,
    );
  });
});
