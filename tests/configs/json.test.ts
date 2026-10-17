import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { json } from "../../src/configs/plugins/json/index.js";

type EffectiveConfig = {
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};
type SerializableConfig = {
  readonly toJSON: () => { readonly language?: unknown };
};

// The language that ESLint resolves for a file, and the settings of `ruleId` there: the severity
// as a number, then the options.
const describeRule = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    (EffectiveConfig & SerializableConfig) | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return { entry: rules.get(ruleId), language: config?.toJSON().language };
};

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
          async (filePath) => {
            return await describeFile(eslint, filePath, "json/no-empty-keys");
          },
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

  it("keeps a rule that only overrides set out of JSONC and JSON5 files", async () => {
    // No block of the feature sets this rule, so a file that the JSON block reached next to its
    // own block would keep the whole entry of `overrides`, with its severity.
    const ruleId = "local/no-content";
    const eslint = new ESLint({
      overrideConfig: [
        {
          plugins: {
            local: {
              rules: {
                "no-content": {
                  create: (_context) => {
                    return {};
                  },
                },
              },
            },
          },
        },
        ...json({ overrides: { [ruleId]: "warn" } }),
      ],
      overrideConfigFile: true,
    });

    expect(
      await Promise.all(
        [
          "data.json",
          "data.jsonc",
          "data.json5",
          "tsconfig.json",
          ".vscode/settings.json",
          ".devcontainer/devcontainer.json",
        ].map(async (filePath) => {
          return await describeRule(eslint, filePath, ruleId);
        }),
      ),
    ).toEqual([
      { entry: [1], language: "json/json" },
      { entry: undefined, language: "json/jsonc" },
      { entry: undefined, language: "json/json5" },
      { entry: undefined, language: "json/jsonc" },
      { entry: undefined, language: "json/jsonc" },
      { entry: undefined, language: "json/jsonc" },
    ]);
  });

  it("limits each JSON language to the files that match files", async () => {
    const eslint = new ESLint({
      overrideConfig: json({ files: ["config/**"] }),
      overrideConfigFile: true,
    });
    const plugins = ["@", "json"];
    const outside = { language: undefined, plugins: [], severity: undefined };

    expect(
      await Promise.all(
        [
          "config/data.json",
          "config/data.jsonc",
          "config/data.json5",
          "config/tsconfig.json",
          "data.json",
          "data.jsonc",
          "data.json5",
          "tsconfig.json",
        ].map(async (filePath) => {
          return await describeFile(eslint, filePath, "json/no-duplicate-keys");
        }),
      ),
    ).toEqual([
      { language: "json/json", plugins, severity: 2 },
      { language: "json/jsonc", plugins, severity: 2 },
      { language: "json/json5", plugins, severity: 2 },
      { language: "json/jsonc", plugins, severity: 2 },
      outside,
      outside,
      outside,
      outside,
    ]);
  });

  it("leaves a JSON language out when no pattern of files matches its files", async () => {
    // A pattern with an extension names one language. The tsconfig is a JSONC file by its name.
    const eslint = new ESLint({
      overrideConfig: json({ files: ["**/*.json"] }),
      overrideConfigFile: true,
    });

    expect(
      await Promise.all(
        ["data.json", "tsconfig.json", "data.jsonc", "data.json5"].map(
          async (filePath) => {
            return await describeRule(
              eslint,
              filePath,
              "json/no-duplicate-keys",
            );
          },
        ),
      ),
    ).toEqual([
      { entry: [2], language: "json/json" },
      { entry: [2], language: "json/jsonc" },
      { entry: undefined, language: undefined },
      { entry: undefined, language: undefined },
    ]);
  });

  it("keeps the options of overrides out of JSONC files, whatever files names", async () => {
    // Every block turns this rule on with a severity alone, which keeps the options of an earlier
    // block: a JSONC file that the JSON block reached as well would take them from `overrides`.
    const ruleId = "json/no-unnormalized-keys";
    const eslint = new ESLint({
      overrideConfig: json({
        files: ["config/**/*.{json,jsonc}"],
        overrides: { [ruleId]: ["error", { form: "NFD" }] },
      }),
      overrideConfigFile: true,
    });
    const jsonc = { entry: [2, { form: "NFC" }], language: "json/jsonc" };

    expect(
      await Promise.all(
        [
          "config/data.json",
          "config/data.jsonc",
          "config/tsconfig.base.json",
          "config/.vscode/settings.json",
          "config/.devcontainer/devcontainer.json",
        ].map(async (filePath) => {
          return await describeRule(eslint, filePath, ruleId);
        }),
      ),
    ).toEqual([
      { entry: [2, { form: "NFD" }], language: "json/json" },
      jsonc,
      jsonc,
      jsonc,
      jsonc,
    ]);
  });
});
