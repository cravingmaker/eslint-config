import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { node } from "../../src/configs/node.js";
import { defaultContext } from "../../src/context.js";
import { typescriptFiles } from "../../src/globs.js";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

const typedContext: Context = {
  ...defaultContext,
  typeAware: [[...typescriptFiles, "!**/*.d.ts"]],
};
const svelteContext: Context = {
  ...defaultContext,
  svelteComponents: [["**/*.svelte", "!**/generated/**"]],
};

async function getRules(
  eslint: ESLint,
  filePath: string,
): Promise<RuleEntries | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return config?.rules;
}
// The severity of a rule in the configuration for a file, or `undefined` when it is not set.
async function getSeverity(
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> {
  const rules = new Map(
    Object.entries((await getRules(eslint, filePath)) ?? {}),
  );
  return rules.get(ruleId)?.[0];
}

describe("node feature", () => {
  it("turns n/no-sync off in TypeScript files without type information", async () => {
    const untyped = new ESLint({
      overrideConfig: node(),
      overrideConfigFile: true,
    });
    const typed = new ESLint({
      overrideConfig: node({}, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(untyped, "src/example.js", "n/no-sync"),
      getSeverity(untyped, "src/example.ts", "n/no-sync"),
      getSeverity(typed, "src/example.ts", "n/no-sync"),
      getSeverity(typed, "src/example.d.ts", "n/no-sync"),
    ]);

    expect(severities).toEqual([2, 0, 2, 0]);
  });

  it("turns n/no-sync off in Svelte components, which have no type information", async () => {
    const eslint = new ESLint({
      overrideConfig: node(
        {},
        { ...typedContext, svelteComponents: svelteContext.svelteComponents },
      ),
      overrideConfigFile: true,
    });

    expect(await getSeverity(eslint, "src/Component.svelte", "n/no-sync")).toBe(
      0,
    );
  });

  it("keeps the type-aware block within the type-aware scope, whatever its ignores bring back", async () => {
    // The feature lints `src/` only, declaration files included, which the scope leaves out.
    const eslint = new ESLint({
      overrideConfig: node({ ignores: ["**/*", "!src/**"] }, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(eslint, "src/example.ts", "n/no-sync"),
      getSeverity(eslint, "src/example.d.ts", "n/no-sync"),
      getSeverity(eslint, "lib/example.ts", "n/no-sync"),
    ]);

    expect(severities).toEqual([2, 0, undefined]);
  });

  it("applies an override that turns n/no-sync on only where the rule needs no type information or has it", async () => {
    const eslint = new ESLint({
      overrideConfig: node(
        { overrides: { "n/no-sync": ["error", { allowAtRootLevel: false }] } },
        { ...typedContext, svelteComponents: svelteContext.svelteComponents },
      ),
      overrideConfigFile: true,
    });
    const [script, typed, declaration, component] = await Promise.all([
      getRules(eslint, "src/example.js"),
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.d.ts"),
      getRules(eslint, "src/Component.svelte"),
    ]);
    // ESLint adds the default of `ignores` while the rule is on.
    const overridden = [2, { allowAtRootLevel: false, ignores: [] }];

    expect(script?.["n/no-sync"]).toEqual(overridden);
    expect(typed?.["n/no-sync"]).toEqual(overridden);
    expect(declaration?.["n/no-sync"]?.[0]).toBe(0);
    expect(component?.["n/no-sync"]?.[0]).toBe(0);
  });

  it("does not apply such an override in TypeScript files and Svelte components without typed linting", async () => {
    const eslint = new ESLint({
      overrideConfig: node(
        { overrides: { "n/no-sync": ["error", { allowAtRootLevel: false }] } },
        svelteContext,
      ),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(eslint, "src/example.js", "n/no-sync"),
      getSeverity(eslint, "src/example.ts", "n/no-sync"),
      getSeverity(eslint, "src/Component.svelte", "n/no-sync"),
    ]);

    expect(severities).toEqual([2, 0, 0]);
  });

  it("applies an override that turns n/no-sync off in every file", async () => {
    const eslint = new ESLint({
      overrideConfig: node({ overrides: { "n/no-sync": "off" } }, typedContext),
      overrideConfigFile: true,
    });
    const rules = await Promise.all([
      getRules(eslint, "src/example.js"),
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.d.ts"),
    ]);

    expect(rules.map((entries) => entries?.["n/no-sync"])).toEqual([
      [0],
      [0],
      [0],
    ]);
  });
});
