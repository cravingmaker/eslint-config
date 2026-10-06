/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { html } from "../../src/configs/html.js";
import { json } from "../../src/configs/json.js";
import { markdown } from "../../src/configs/markdown.js";
import { packageJson } from "../../src/configs/package-json.js";

type EffectiveConfig = {
  readonly language?: string;
  readonly plugins?: Readonly<Record<string, unknown>>;
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};
type SerializableConfig = {
  readonly toJSON: () => { readonly language?: unknown };
};

// The language, the plugin names, and the severity of `ruleId` that ESLint resolves for a file.
async function describeFile(
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    (EffectiveConfig & SerializableConfig) | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return {
    language: config?.toJSON().language,
    plugins: Object.keys(config?.plugins ?? {}).toSorted((left, right) =>
      left.localeCompare(right),
    ),
    severity: rules.get(ruleId)?.[0],
  };
}

describe("html feature", () => {
  it("parses and lints HTML files with a plugin registered for them only", async () => {
    const configs = html({ overrides: { "@html-eslint/indent": "off" } });
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });

    expect(configs.map((config) => config.name)).toEqual([
      "@cravingmaker/eslint-config/html/rules",
    ]);
    expect(
      await Promise.all([
        describeFile(eslint, "index.html", "@html-eslint/indent"),
        describeFile(eslint, "src/example.js", "@html-eslint/indent"),
      ]),
    ).toEqual([
      { language: "@/js", plugins: ["@", "@html-eslint"], severity: 0 },
      { language: "@/js", plugins: ["@"], severity: undefined },
    ]);
  });
});

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

describe("markdown feature", () => {
  it("registers @eslint/markdown everywhere and lints Markdown files as GitHub Flavored Markdown", async () => {
    const eslint = new ESLint({
      overrideConfig: markdown({ overrides: { "markdown/no-html": "warn" } }),
      overrideConfigFile: true,
    });

    expect(
      await Promise.all([
        describeFile(eslint, "README.md", "markdown/no-html"),
        describeFile(eslint, "src/example.js", "markdown/no-html"),
      ]),
    ).toEqual([
      { language: "markdown/gfm", plugins: ["@", "markdown"], severity: 1 },
      { language: "@/js", plugins: ["@", "markdown"], severity: undefined },
    ]);
  });
});
