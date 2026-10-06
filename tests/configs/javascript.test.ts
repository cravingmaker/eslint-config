import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { javascript } from "../../src/configs/javascript/index.js";

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
