import type { Options } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { createConfig } from "../../dist/index.mjs";
import { packageJson } from "../../src/configs/plugins/package-json/index.js";

const conditionalRule = "@cravingmaker/require-peer-metadata";
const shapeRule = "package-json/valid-peerDependenciesMeta";
const emptyRule = "package-json/no-empty-fields";
const relationshipRule = "package-json/valid-peerDependenciesMeta-relationship";
const peerOwners = new Set([
  conditionalRule,
  emptyRule,
  "package-json/require-peerDependenciesMeta",
  "package-json/valid-peerDependencies",
  relationshipRule,
  shapeRule,
]);

const lintPeers = async (
  manifest: Readonly<Record<string, unknown>>,
): Promise<readonly string[]> => {
  const eslint = new ESLint({
    overrideConfig: packageJson(),
    overrideConfigFile: true,
  });
  const [result] = await eslint.lintText(JSON.stringify(manifest), {
    filePath: "packages/app/package.json",
  });
  expect(result.fatalErrorCount).toBe(0);
  return result.messages
    .map(({ ruleId }) => {
      return ruleId;
    })
    .filter((ruleId): ruleId is string => {
      return typeof ruleId === "string" && peerOwners.has(ruleId);
    })
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
};

describe("conditional peer metadata", () => {
  it.each([
    { manifest: {}, rules: [] },
    { manifest: { peerDependencies: {} }, rules: [emptyRule] },
    { manifest: { peerDependenciesMeta: {} }, rules: [emptyRule] },
    {
      manifest: { peerDependencies: { react: "^19.0.0" } },
      rules: [conditionalRule],
    },
    {
      manifest: {
        peerDependencies: { eslint: "^10.0.0", react: "^19.0.0" },
        peerDependenciesMeta: { react: { optional: true } },
      },
      rules: [conditionalRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: {},
      },
      rules: [emptyRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: { react: {} },
      },
      rules: [emptyRule, shapeRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: { react: { optional: "true" } },
      },
      rules: [shapeRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: { react: { unrelated: true } },
      },
      rules: [shapeRule, shapeRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        // eslint-disable-next-line unicorn/no-null -- Invalid JSON metadata must remain a shape error.
        peerDependenciesMeta: null,
      },
      rules: [shapeRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: { react: false },
      },
      rules: [shapeRule],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: { react: { optional: false } },
      },
      rules: [],
    },
    {
      manifest: {
        peerDependencies: { eslint: "^10.0.0", react: "^19.0.0" },
        peerDependenciesMeta: {
          eslint: { optional: false },
          react: { optional: true },
        },
      },
      rules: [],
    },
    {
      manifest: {
        peerDependencies: { react: "^19.0.0" },
        peerDependenciesMeta: {
          eslint: { optional: false },
          react: { optional: true },
        },
      },
      rules: [relationshipRule],
    },
    {
      manifest: { peerDependenciesMeta: { react: { optional: true } } },
      rules: [relationshipRule],
    },
    {
      // eslint-disable-next-line unicorn/no-null -- Invalid JSON peers must remain a shape error.
      manifest: { peerDependencies: null },
      rules: ["package-json/valid-peerDependencies"],
    },
  ])(
    "adds conditional completeness without duplicating existing shape errors: $manifest",
    async ({ manifest, rules }) => {
      expect(await lintPeers(manifest)).toEqual(rules);
    },
  );

  it.each([false, true])(
    "requires metadata for private=%s as well as published packages",
    async (privatePackage) => {
      expect(
        await lintPeers({
          peerDependencies: { react: "^19.0.0" },
          private: privatePackage,
        }),
      ).toEqual([conditionalRule]);
    },
  );

  it("reports every missing peer entry without inventing optionality or fixes", async () => {
    const eslint = new ESLint({
      overrideConfig: packageJson(),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      JSON.stringify({
        peerDependencies: {
          eslint: "^10.0.0",
          react: "^19.0.0",
          "@scope/tool": "^1.0.0",
        },
        peerDependenciesMeta: { react: { optional: true } },
      }),
      { filePath: "package.json" },
    );
    const reports = result.messages.filter(({ ruleId }) => {
      return ruleId === conditionalRule;
    });
    expect(reports).toHaveLength(2);
    expect(
      reports.map(({ message }) => {
        return message;
      }),
    ).toEqual(
      expect.arrayContaining([
        "Declare peerDependenciesMeta for '@scope/tool' with an explicit optional boolean.",
        "Declare peerDependenciesMeta for 'eslint' with an explicit optional boolean.",
      ]),
    );
    expect(
      reports.every(({ fix, suggestions }) => {
        return typeof fix === "undefined" && typeof suggestions === "undefined";
      }),
    ).toBe(true);
  });

  it("checks only the root peer contract", async () => {
    expect(
      await lintPeers({ config: { peerDependencies: { react: "^19.0.0" } } }),
    ).toEqual([]);
  });

  it.each([
    { options: { packageJson: false }, severity: undefined },
    { options: { packageJson: { files: ["other/**"] } }, severity: undefined },
    {
      options: { packageJson: { ignores: ["packages/**"] } },
      severity: undefined,
    },
    {
      options: { packageJson: { overrides: { [conditionalRule]: "off" } } },
      severity: 0,
    },
  ] satisfies ReadonlyArray<{
    readonly options: Options;
    readonly severity: 0 | undefined;
  }>)(
    "honors package feature scope and overrides: $options",
    async ({ options, severity }) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig({
          react: false,
          svelte: false,
          ...options,
        }),
        overrideConfigFile: true,
      });
      expect(
        await describeFile(
          eslint,
          "packages/app/package.json",
          conditionalRule,
        ),
      ).toMatchObject({ severity });
    },
  );

  it("allows a following consumer config to disable the conditional owner", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig(
        { react: false, svelte: false },
        { rules: { [conditionalRule]: "off" } },
      ),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      '{"peerDependencies":{"react":"^19.0.0"}}',
      { filePath: "package.json" },
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.filter(({ ruleId }) => {
        return ruleId === conditionalRule;
      }),
    ).toEqual([]);
  });
});

describe("package-json feature", () => {
  it("registers eslint-plugin-package-json everywhere and lints package.json files", async () => {
    const configs = packageJson();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const ruleId = "package-json/require-package-json-export";

    expect(
      configs.map((config) => {
        return config.name;
      }),
    ).toEqual([
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
        plugins: ["@", "@cravingmaker", "package-json"],
        severity: 2,
      },
      {
        language: "@/js",
        plugins: ["@", "@cravingmaker", "package-json"],
        severity: undefined,
      },
    ]);
  });
});
