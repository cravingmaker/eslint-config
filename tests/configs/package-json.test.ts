import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { packageJson } from "../../src/configs/package-json.js";
import { expectLintError } from "../utilities.js";

describe("package-json feature", () => {
  it("registers eslint-plugin-package-json everywhere and lints package.json files", async () => {
    const configs = packageJson();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const ruleId = "enforce-package-type/enforce-package-type";

    expect(configs.map((config) => config.name)).toEqual([
      "@cravingmaker/eslint-config/package-json/setup",
      "@cravingmaker/eslint-config/package-json/rules",
    ]);
    expect(
      await Promise.all([
        describeFile(eslint, "packages/app/package.json", ruleId),
        describeFile(eslint, "src/example.js", ruleId),
      ]),
    ).toEqual([
      {
        language: "@/js",
        plugins: ["@", "enforce-package-type", "package-json"],
        severity: 2,
      },
      { language: "@/js", plugins: ["@", "package-json"], severity: undefined },
    ]);
  });
});

describe("package.json rules", () => {
  it("package-json/require-description: reports package manifests without descriptions", async () => {
    await expectLintError(
      `{\n\t"name": "fixture-package",\n\t"version": "1.0.0",\n\t"type": "module"\n}\n`,
      "package-json/require-description",
      { filePath: "package.json" },
    );
  });
});

describe("enforce package type rules", () => {
  it("enforce-package-type/enforce-package-type: reports non-module package manifests", async () => {
    await expectLintError(
      `{\n\t"name": "fixture-package",\n\t"version": "1.0.0",\n\t"type": "commonjs"\n}\n`,
      "enforce-package-type/enforce-package-type",
      { filePath: "package.json" },
    );
  });
});
