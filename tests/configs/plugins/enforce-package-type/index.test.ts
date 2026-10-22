import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { enforcePackageType } from "../../../../src/configs/plugins/enforce-package-type/index.js";
import { describeFile } from "../../../support/describe-file.js";

describe("enforce-package-type plugin", () => {
  it("registers its plugin and module-type rule only for package.json files", async () => {
    const configs = enforcePackageType();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const ruleId = "enforce-package-type/enforce-package-type";

    expect(
      configs.map((config) => {
        return config.name;
      }),
    ).toEqual(["@cravingmaker/eslint-config/enforce-package-type/rules"]);
    expect(
      await Promise.all([
        describeFile(eslint, "packages/app/package.json", ruleId),
        describeFile(eslint, "src/example.js", ruleId),
      ]),
    ).toEqual([
      {
        language: "@/js",
        plugins: ["@", "enforce-package-type"],
        severity: 2,
      },
      { language: "@/js", plugins: ["@"], severity: undefined },
    ]);
  });
});
