import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { json } from "../../src/configs/json.js";

describe("json feature", () => {
  it("keeps each override in its own JSON language", async () => {
    const eslint = new ESLint({
      overrideConfig: json({
        overrides: { "json/no-empty-keys": "warn" },
        overridesJson5: { "json/no-empty-keys": "off" },
        overridesJsonc: { "json/sort-keys": "off" },
      }),
      overrideConfigFile: true,
    });

    expect(
      await Promise.all(
        ["data.json", "data.jsonc", "data.json5", "package.json"].map(
          async (filePath) =>
            await describeFile(eslint, filePath, "json/no-empty-keys"),
        ),
      ),
    ).toEqual([
      { language: "json/json", plugins: ["@", "json"], severity: 1 },
      { language: "json/jsonc", plugins: ["@", "json"], severity: 2 },
      { language: "json/json5", plugins: ["@", "json"], severity: 0 },
      { language: undefined, plugins: [], severity: undefined },
    ]);
    expect(
      await describeFile(eslint, "tsconfig.json", "json/sort-keys"),
    ).toEqual({ language: "json/jsonc", plugins: ["@", "json"], severity: 0 });
  });
});
