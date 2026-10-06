import { describe, it } from "vitest";

import { expectLintError } from "../../utilities.js";

describe("package.json rules", () => {
  it("package-json/require-description: reports package manifests without descriptions", async () => {
    await expectLintError(
      `{\n\t"name": "fixture-package",\n\t"version": "1.0.0",\n\t"type": "module"\n}\n`,
      "package-json/require-description",
      { filePath: "package.json" },
    );
  });
});
