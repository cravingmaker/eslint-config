import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { core } from "../../../src/configs/core/index.js";
import { defaultContext } from "../../../src/context.js";
import { getResolvedRules as getRules } from "../../support/resolved-config.js";

describe("core builder", () => {
  it("keeps the core blocks and registers the internal arrow policy", async () => {
    const configs = core();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const rules = (await getRules(eslint, "src/example.js")) ?? {};
    const unknownRules = Object.keys(rules).filter((ruleId) => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Audit configured IDs against ESLint's installed core rules.
      return !builtinRules.has(ruleId);
    });

    expect(unknownRules).toEqual(["@cravingmaker/prefer-arrow-functions"]);
    expect(
      configs.map((entry) => {
        return entry.name;
      }),
    ).toEqual([
      "@cravingmaker/eslint-config/javascript/rules",
      "@cravingmaker/eslint-config/javascript/jsx",
    ]);
    expect(
      configs.flatMap((entry) => {
        return Object.keys(entry.plugins ?? {});
      }),
    ).toEqual(["@cravingmaker"]);
  });

  it("lints the Svelte components of the context that its files match", async () => {
    const svelteContext = {
      ...defaultContext,
      svelteComponents: ["**/*.svelte"],
    };
    const [byDefault, withDirectory, withExtension] = await Promise.all(
      [
        core({}, svelteContext),
        core({ files: ["src/**"] }, svelteContext),
        core({ files: ["**/*.js"] }, svelteContext),
      ].map(async (configs) => {
        return await getRules(
          new ESLint({ overrideConfig: configs, overrideConfigFile: true }),
          "src/Component.svelte",
        );
      }),
    );

    expect(byDefault).toHaveProperty(["eqeqeq", 0], 2);
    expect(withDirectory).toHaveProperty(["eqeqeq", 0], 2);
    expect(withExtension).toBeUndefined();
  });

  it("keeps to its default files within a directory that is its files", async () => {
    const eslint = new ESLint({
      overrideConfig: core({ files: ["src/**"] }),
      overrideConfigFile: true,
    });
    // A CommonJS file still has ESLint's own configuration, without rules.
    const [script, typescript, ...others] = await Promise.all(
      [
        "src/example.js",
        "src/example.ts",
        "src/example.cjs",
        "src/data.json",
        "src/README.md",
        "lib/example.js",
      ].map(async (filePath) => {
        return await getRules(eslint, filePath);
      }),
    );

    expect(script).toHaveProperty(["eqeqeq", 0], 2);
    expect(typescript).toHaveProperty(["eqeqeq", 0], 2);
    expect(
      others.map((rules) => {
        return Object.keys(rules ?? {});
      }),
    ).toEqual([[], [], [], []]);
  });

  it("keeps files, ignores, and overrides local to the feature", async () => {
    const eslint = new ESLint({
      overrideConfig: core({
        files: ["app/**/*.js"],
        ignores: ["**/*.generated.js"],
        overrides: { eqeqeq: ["warn", "smart"] },
      }),
      overrideConfigFile: true,
    });
    const [included, excluded, outside] = await Promise.all([
      getRules(eslint, "app/example.js"),
      getRules(eslint, "app/example.generated.js"),
      getRules(eslint, "scripts/example.js"),
    ]);

    expect(included?.eqeqeq).toEqual([1, "smart"]);
    expect(excluded?.eqeqeq).toBeUndefined();
    expect(outside?.eqeqeq).toBeUndefined();
  });
});
