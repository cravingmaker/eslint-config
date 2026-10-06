import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { express } from "../../src/configs/express.js";
import { react } from "../../src/configs/react.js";
import { svelte } from "../../src/configs/svelte.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parser?: { readonly meta?: { readonly name?: string } };
    readonly parserOptions?: {
      readonly parser?: { readonly meta?: { readonly name?: string } };
    };
  };
  readonly plugins?: Readonly<Record<string, unknown>>;
  readonly rules?: Readonly<Record<string, RuleEntry>>;
};
// A rule's settings as ESLint resolves them: the severity as a number, then the options.
type RuleEntry = readonly [number, ...unknown[]];

async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}
// The settings of the eslint-plugin-react-hooks rules in `config`.
function getHooksRules(
  config: EffectiveConfig | undefined,
): Readonly<Record<string, RuleEntry>> {
  return Object.fromEntries(
    Object.entries(config?.rules ?? {}).filter(([ruleId]) =>
      ruleId.startsWith("react-hooks/"),
    ),
  );
}
function getPluginNames(config: EffectiveConfig | undefined): string[] {
  return Object.keys(config?.plugins ?? {}).toSorted((left, right) =>
    left.localeCompare(right),
  );
}
// The severity of each of `ruleIds` in `config`, or `undefined` where it does not set the rule.
function getSeverities(
  config: EffectiveConfig | undefined,
  ruleIds: readonly string[],
): Array<number | undefined> {
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return ruleIds.map((ruleId) => rules.get(ruleId)?.[0]);
}

describe("react feature", () => {
  it("adds one block per React plugin, with the hooks rules in every source file", async () => {
    const configs = await react();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const [component, hooksModule, hooksScript, data] = await Promise.all([
      getEffectiveConfig(eslint, "src/Component.tsx"),
      getEffectiveConfig(eslint, "src/use-counter.ts"),
      getEffectiveConfig(eslint, "src/use-counter.js"),
      getEffectiveConfig(eslint, "src/data.json"),
    ]);
    const hooksRules = getHooksRules(component);

    expect(configs.map((config) => config.name)).toEqual([
      "@cravingmaker/eslint-config/react/html",
      "@cravingmaker/eslint-config/react/hooks",
      "@cravingmaker/eslint-config/react/refresh",
    ]);
    expect(getPluginNames(component)).toEqual([
      "@",
      "@html-eslint/react",
      "react-hooks",
      "react-refresh",
    ]);
    expect(hooksRules["react-hooks/rules-of-hooks"]).toEqual([2]);
    // Custom hooks also live in modules without JSX, which get the hooks rules and no others.
    expect(
      [hooksModule, hooksScript].map((config) => [
        getPluginNames(config),
        config?.rules,
      ]),
    ).toEqual([
      [["@", "react-hooks"], hooksRules],
      [["@", "react-hooks"], hooksRules],
    ]);
    expect(data).toBeUndefined();
  });

  it("applies overrides of the hooks rules wherever those apply, and other overrides to component files", async () => {
    const eslint = new ESLint({
      overrideConfig: await react({
        overrides: {
          "@html-eslint/react/no-obsolete-tags": "off",
          "no-console": "off",
          "react-hooks/exhaustive-deps": [
            "error",
            { additionalHooks: "useCustomEffect" },
          ],
          "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
          ],
        },
      }),
      overrideConfigFile: true,
    });
    // ESLint rejects a rule that is on in a file whose configuration lacks its plugin, so the
    // overrides of the component plugins must stay out of modules without JSX.
    const [component, hooksModule] = await Promise.all([
      getEffectiveConfig(eslint, "src/Component.tsx"),
      getEffectiveConfig(eslint, "src/use-counter.ts"),
    ]);
    const ruleIds = [
      "@html-eslint/react/no-obsolete-tags",
      "no-console",
      "react-hooks/exhaustive-deps",
      "react-refresh/only-export-components",
    ] as const;

    expect(getSeverities(component, ruleIds)).toEqual([0, 0, 2, 1]);
    expect(getSeverities(hooksModule, ruleIds)).toEqual([
      undefined,
      undefined,
      2,
      undefined,
    ]);
    expect(
      component?.rules?.["react-refresh/only-export-components"],
    ).toMatchObject([1, { allowConstantExport: true }]);
    expect(
      [component, hooksModule].map(
        (config) => config?.rules?.["react-hooks/exhaustive-deps"],
      ),
    ).toEqual([
      [2, { additionalHooks: "useCustomEffect" }],
      [2, { additionalHooks: "useCustomEffect" }],
    ]);
  });

  it.each([
    ["generic", false],
    ["next", false],
    ["vite", true],
  ] as const)(
    "configures React Refresh for the %s variant",
    async (refresh, allowConstantExport) => {
      const eslint = new ESLint({
        overrideConfig: await react({ refresh }),
        overrideConfigFile: true,
      });
      const config = await getEffectiveConfig(eslint, "src/Component.jsx");

      expect(
        config?.rules?.["react-refresh/only-export-components"],
      ).toMatchObject([1, { allowConstantExport }]);
    },
  );

  it("leaves React Refresh out when it is off", async () => {
    const configs = await react({ refresh: false });

    expect(configs.map((config) => config.name)).not.toContain(
      "@cravingmaker/eslint-config/react/refresh",
    );
  });
});

describe("svelte feature", () => {
  it("parses Svelte files with svelte-eslint-parser and TypeScript script blocks", async () => {
    const eslint = new ESLint({
      overrideConfig: await svelte(),
      overrideConfigFile: true,
    });
    const configs = await Promise.all([
      getEffectiveConfig(eslint, "src/Component.svelte"),
      getEffectiveConfig(eslint, "src/state.svelte.ts"),
    ]);

    expect(
      configs.map((config) => [
        config?.languageOptions?.parser?.meta?.name,
        config?.languageOptions?.parserOptions?.parser?.meta?.name,
      ]),
    ).toEqual([
      ["svelte-eslint-parser", "typescript-eslint/parser"],
      ["svelte-eslint-parser", "typescript-eslint/parser"],
    ]);
  });
});

describe("express feature", () => {
  it("lints ES module sources with eslint-plugin-express-security", async () => {
    const eslint = new ESLint({
      overrideConfig: await express({
        overrides: { "express-security/require-helmet": "off" },
      }),
      overrideConfigFile: true,
    });
    const [server, component] = await Promise.all([
      getEffectiveConfig(eslint, "src/server.ts"),
      getEffectiveConfig(eslint, "src/Component.tsx"),
    ]);

    expect(server?.rules?.["express-security/require-helmet"]).toEqual([0]);
    expect(server?.rules?.["express-security/require-rate-limiting"]).toEqual([
      2,
    ]);
    expect(component).toBeUndefined();
  });
});
