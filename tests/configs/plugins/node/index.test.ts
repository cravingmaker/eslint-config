import type { Context } from "../../../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { node } from "../../../../src/configs/plugins/node/index.js";
import { defaultContext } from "../../../../src/context.js";
import { typescriptFiles } from "../../../../src/globs.js";
import { getResolvedRules as getRules } from "../../../support/resolved-config.js";

const typedContext: Context = {
  ...defaultContext,
  typeAware: [[...typescriptFiles, "!**/*.d.ts"]],
};
const untypedContext: Context = { ...defaultContext, typeAware: undefined };
// What a Svelte feature that ignores `generated/` parses.
const svelteScope = {
  javascriptRuneModules: [["**/*.svelte.js", "!**/generated/**"]],
  svelteComponents: [["**/*.svelte", "!**/generated/**"]],
} as const satisfies Partial<Context>;
const svelteContext: Context = { ...untypedContext, ...svelteScope };

// The severity of a rule in the configuration for a file, or `undefined` when it is not set.
const getSeverity = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> => {
  const rules = new Map(
    Object.entries((await getRules(eslint, filePath)) ?? {}),
  );
  return rules.get(ruleId)?.[0];
};

describe("node feature", () => {
  it("turns n/no-sync off in TypeScript files without type information", async () => {
    const untyped = new ESLint({
      overrideConfig: node({}, untypedContext),
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
      overrideConfig: node({}, { ...typedContext, ...svelteScope }),
      overrideConfigFile: true,
    });

    expect(await getSeverity(eslint, "src/Component.svelte", "n/no-sync")).toBe(
      0,
    );
  });

  it("turns n/no-sync off in the JavaScript rune modules that the Svelte feature parses", async () => {
    // The Svelte parser hands them to typescript-eslint's parser, which reads no type information
    // in JavaScript files. Other JavaScript files keep the rule, also a rune module that the
    // Svelte feature leaves out, or every one while it is off.
    const svelte = new ESLint({
      overrideConfig: node({}, { ...typedContext, ...svelteScope }),
      overrideConfigFile: true,
    });
    const withoutSvelte = new ESLint({
      overrideConfig: node({}, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(svelte, "src/state.svelte.js", "n/no-sync"),
      getSeverity(svelte, "src/generated/state.svelte.js", "n/no-sync"),
      getSeverity(svelte, "src/example.js", "n/no-sync"),
      getSeverity(withoutSvelte, "src/state.svelte.js", "n/no-sync"),
    ]);

    expect(severities).toEqual([0, 2, 2, 2]);
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
        { ...typedContext, ...svelteScope },
      ),
      overrideConfigFile: true,
    });
    const [script, typed, declaration, component, runeModule] =
      await Promise.all([
        getRules(eslint, "src/example.js"),
        getRules(eslint, "src/example.ts"),
        getRules(eslint, "src/example.d.ts"),
        getRules(eslint, "src/Component.svelte"),
        getRules(eslint, "src/state.svelte.js"),
      ]);
    // ESLint adds the default of `ignores` while the rule is on.
    const overridden = [2, { allowAtRootLevel: false, ignores: [] }];

    expect(script?.["n/no-sync"]).toEqual(overridden);
    expect(typed?.["n/no-sync"]).toEqual(overridden);
    expect(declaration?.["n/no-sync"]?.[0]).toBe(0);
    expect(component?.["n/no-sync"]?.[0]).toBe(0);
    expect(runeModule?.["n/no-sync"]?.[0]).toBe(0);
  });

  it("does not apply such an override in TypeScript files, Svelte components, and JavaScript rune modules without typed linting", async () => {
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
      getSeverity(eslint, "src/state.svelte.js", "n/no-sync"),
    ]);

    expect(severities).toEqual([2, 0, 0, 0]);
  });

  it("leaves import resolution to import-x in every language", async () => {
    const eslint = new ESLint({
      overrideConfig: node({}, svelteContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all(
      [
        "src/example.js",
        "src/state.svelte.js",
        "src/example.ts",
        "src/example.d.ts",
        "src/state.svelte.ts",
        "src/Component.svelte",
      ].map(async (filePath) => {
        return await getSeverity(eslint, filePath, "n/no-missing-import");
      }),
    );

    expect(severities).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("applies an override of n/no-missing-import in every file", async () => {
    const eslint = new ESLint({
      overrideConfig: node(
        {
          overrides: {
            "n/no-missing-import": ["warn", { ignoreTypeImport: true }],
          },
        },
        { ...typedContext, ...svelteScope },
      ),
      overrideConfigFile: true,
    });
    const rules = await Promise.all(
      [
        "src/example.js",
        "src/example.ts",
        "src/example.d.ts",
        "src/Component.svelte",
      ].map(async (filePath) => {
        return await getRules(eslint, filePath);
      }),
    );

    expect(
      rules.map((entries) => {
        return entries?.["n/no-missing-import"];
      }),
    ).toEqual(
      rules.map(() => {
        return [1, { ignoreTypeImport: true }];
      }),
    );
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

    expect(
      rules.map((entries) => {
        return entries?.["n/no-sync"]?.[0];
      }),
    ).toEqual([0, 0, 0]);
  });
});
