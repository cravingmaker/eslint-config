import type { Linter } from "eslint";

import { ESLint } from "eslint";
import { describe, expect, it, vi } from "vitest";

type PluginModule = {
  readonly default: {
    readonly configs?: Readonly<
      Record<string, { readonly rules?: Linter.RulesRecord }>
    >;
    readonly rules?: Readonly<Record<string, unknown>>;
  };
};

// Simulate an upstream update before the policy modules are evaluated. These cover static imports, optional peers, and a recommended preset that used to set policy.
const withFutureRule = vi.hoisted(() => {
  // eslint-disable-next-line unicorn/consistent-function-scoping -- The factory must be initialized before mocked modules are imported.
  return (module: PluginModule) => {
    return {
      ...module,
      default: {
        ...module.default,
        configs: {
          ...module.default.configs,
          recommended: {
            ...module.default.configs?.recommended,
            rules: {
              ...module.default.configs?.recommended.rules,
              "security/future-rule": "error",
            },
          },
        },
        rules: {
          ...module.default.rules,
          "future-rule": {
            create: (_context: unknown) => {
              return {};
            },
            meta: { schema: [] },
          },
        },
      },
    };
  };
});

vi.mock("eslint-plugin-promise", async (importOriginal) => {
  return withFutureRule(await importOriginal<PluginModule>());
});
vi.mock("@stylistic/eslint-plugin", async (importOriginal) => {
  return withFutureRule(await importOriginal<PluginModule>());
});
vi.mock("eslint-plugin-security", async (importOriginal) => {
  return withFutureRule(await importOriginal<PluginModule>());
});

vi.mock("eslint-plugin-sonarjs", async (importOriginal) => {
  return withFutureRule(await importOriginal<PluginModule>());
});
vi.mock("@html-eslint/eslint-plugin-react", async (importOriginal) => {
  return withFutureRule(await importOriginal<PluginModule>());
});
vi.mock("@html-eslint/eslint-plugin-svelte", async (importOriginal) => {
  return withFutureRule(await importOriginal<PluginModule>());
});

const { createConfig } = await import("../../dist/index.mjs");

describe("explicit rule policy", () => {
  it("lets a consumer explicitly enable a new optional-peer rule", async () => {
    const config = await createConfig({
      react: {
        overrides: { "@html-eslint/react/future-rule": "warn" },
        refresh: false,
      },
      svelte: { overrides: { "@html-eslint/svelte/future-rule": "warn" } },
    });
    const eslint = new ESLint({
      overrideConfig: config,
      overrideConfigFile: true,
    });

    await expect(
      eslint.calculateConfigForFile("src/example.tsx"),
    ).resolves.toHaveProperty(["rules", "@html-eslint/react/future-rule"], [1]);
    await expect(
      eslint.calculateConfigForFile("src/Component.svelte"),
    ).resolves.toHaveProperty(
      ["rules", "@html-eslint/svelte/future-rule"],
      [1],
    );
  });

  it.each([
    "promise",
    "security",
    "sonarjs",
    "@stylistic",
    "@html-eslint/react",
    "@html-eslint/svelte",
  ])(
    "does not configure a new %s rule added by an upstream update",
    async (prefix) => {
      const config = await createConfig({
        express: false,
        react: { refresh: false },
        svelte: true,
      });
      const plugins = new Map(
        config.flatMap((entry) => {
          return Object.entries(entry.plugins ?? {});
        }),
      );

      expect(plugins.get(prefix)?.rules).toHaveProperty("future-rule");
      expect(
        config.some((entry) => {
          return Object.hasOwn(entry.rules ?? {}, `${prefix}/future-rule`);
        }),
      ).toBe(false);

      const eslint = new ESLint({
        overrideConfig: config,
        overrideConfigFile: true,
      });
      await expect(
        eslint.calculateConfigForFile("src/example.tsx"),
      ).resolves.toBeDefined();
      await expect(
        eslint.calculateConfigForFile("src/Component.svelte"),
      ).resolves.toBeDefined();
    },
  );
});
