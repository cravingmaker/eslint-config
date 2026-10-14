import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { javascript } from "../../../src/configs/javascript/index.js";
import { defaultContext } from "../../../src/context.js";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

async function getRules(
  eslint: ESLint,
  filePath: string,
): Promise<RuleEntries | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return config?.rules;
}

describe("javascript feature", () => {
  it("contains only ESLint core rules in one named block without plugins", async () => {
    const configs = javascript();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const rules = (await getRules(eslint, "src/example.js")) ?? {};
    const unknownRules = Object.keys(rules).filter(
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- The feature owns ESLint's builtin rule registry
      (ruleId) => !builtinRules.has(ruleId),
    );

    expect(unknownRules).toEqual([]);
    expect(configs.map((entry) => entry.name)).toEqual([
      "@cravingmaker/eslint-config/javascript/rules",
      "@cravingmaker/eslint-config/javascript/jsx",
    ]);
    expect(
      configs.flatMap((entry) => Object.keys(entry.plugins ?? {})),
    ).toEqual([]);
  });

  it("lints the Svelte components of the context that its files match", async () => {
    const svelteContext = {
      ...defaultContext,
      svelteComponents: ["**/*.svelte"],
    };
    const [byDefault, withDirectory, withExtension] = await Promise.all(
      [
        javascript({}, svelteContext),
        javascript({ files: ["src/**"] }, svelteContext),
        javascript({ files: ["**/*.js"] }, svelteContext),
      ].map(
        async (configs) =>
          await getRules(
            new ESLint({ overrideConfig: configs, overrideConfigFile: true }),
            "src/Component.svelte",
          ),
      ),
    );

    expect(byDefault).toHaveProperty(["eqeqeq", 0], 2);
    expect(withDirectory).toHaveProperty(["eqeqeq", 0], 2);
    expect(withExtension).toBeUndefined();
  });

  it("keeps to its default files within a directory that is its files", async () => {
    const eslint = new ESLint({
      overrideConfig: javascript({ files: ["src/**"] }),
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
      ].map(async (filePath) => await getRules(eslint, filePath)),
    );

    expect(script).toHaveProperty(["eqeqeq", 0], 2);
    expect(typescript).toHaveProperty(["eqeqeq", 0], 2);
    expect(others.map((rules) => Object.keys(rules ?? {}))).toEqual([
      [],
      [],
      [],
      [],
    ]);
  });

  it("keeps files, ignores, and overrides local to the feature", async () => {
    const eslint = new ESLint({
      overrideConfig: javascript({
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
