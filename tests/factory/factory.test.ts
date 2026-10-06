/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import type { Linter } from "eslint";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";

const prefix = "@cravingmaker/eslint-config/";
const baseOptions = {
  projectRootDirectory: process.cwd(),
  typescript: { tsconfigRootDir: process.cwd() },
} as const;

// The feature segment of each block name, without repeats.
async function getFeatureOrder(
  options: Parameters<typeof createConfig>[0] = {},
): Promise<readonly string[]> {
  const configs = await createConfig(options);
  const features = configs.map(
    (config) => (config.name ?? "").slice(prefix.length).split("/", 1)[0],
  );
  return features.filter(
    (feature, index) => features.indexOf(feature) === index,
  );
}

describe("createConfig", () => {
  it("composes the features in a fixed order", async () => {
    expect(
      await getFeatureOrder({
        ...baseOptions,
        express: true,
        react: true,
        svelte: true,
      }),
    ).toEqual([
      "ignores",
      "javascript",
      "comments",
      "node",
      "security",
      "imports",
      "unused-imports",
      "promise",
      "regexp",
      "unicorn",
      "functional",
      "perfectionist",
      "typescript",
      "react",
      "svelte",
      "express",
      "html",
      "json",
      "package-json",
      "markdown",
      "overlaps",
    ]);
  });

  it("names every block once, under the package prefix", async () => {
    const configs = await createConfig(baseOptions);
    const names = configs.map((config) => config.name);
    const uniqueNames = new Set(names);

    expect(names.every((name) => name?.startsWith(prefix) === true)).toBe(true);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("leaves out a feature that is off and keeps the others", async () => {
    const order = await getFeatureOrder({
      ...baseOptions,
      markdown: false,
      typescript: false,
      unicorn: false,
    });

    expect(order).not.toContain("markdown");
    expect(order).not.toContain("typescript");
    expect(order).not.toContain("unicorn");
    expect(order).toContain("functional");
  });

  it("turns frameworks on when their plugins are installed, unless they are off", async () => {
    const detected = await getFeatureOrder(baseOptions);
    const disabled = await getFeatureOrder({
      ...baseOptions,
      express: false,
      react: false,
      svelte: false,
    });

    expect(detected).toEqual(
      expect.arrayContaining(["react", "svelte", "express"]),
    );
    expect(disabled).not.toEqual(
      expect.arrayContaining(["react", "svelte", "express"]),
    );
  });

  it("passes feature options to the feature and appends user configs last", async () => {
    const userConfig: Linter.Config = {
      files: ["**/*.js"],
      name: "user/rules",
      rules: { "no-console": "error" },
    };
    const configs = await createConfig(
      { ...baseOptions, unicorn: { overrides: { "unicorn/no-null": "off" } } },
      userConfig,
    );
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
    const config = (await eslint.calculateConfigForFile("src/example.js")) as
      | { readonly rules?: Readonly<Record<string, readonly unknown[]>> }
      | undefined;

    expect(configs.at(-1)).toBe(userConfig);
    expect(config?.rules?.["unicorn/no-null"]?.[0]).toBe(0);
    expect(config?.rules?.["no-console"]?.[0]).toBe(2);
  });
});
