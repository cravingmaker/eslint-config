import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { react } from "../../src/configs/react.js";
import { expectLintError, expectNoLintError } from "../utilities.js";

type EffectiveConfig = {
  readonly plugins?: Readonly<Record<string, unknown>>;
  readonly rules?: Readonly<Record<string, RuleEntry>>;
};
// A rule's settings as ESLint resolves them: the severity as a number, then the options.
type RuleEntry = readonly [number, ...unknown[]];

// Fixtures with type annotations use .tsx. The hooks rules also apply to .js, .jsx, and .ts files,
// where custom hooks live; react-refresh/only-export-components applies to JSX file extensions only.
const tsxOptions = { filePath: "test.tsx" } as const;
const sourceFilePaths = ["test.js", "test.jsx", "test.ts", "test.tsx"] as const;
const moduleFilePaths = ["test.js", "test.ts"] as const;

// A file that exports only a React component — never a violation in any variant.
const onlyComponentCode = "export function MyComponent() { return null; }";

// A file mixing a component with a non-component utility — violation in ALL variants.
const mixedHelperCode = [
  "export function helper() { return 1; }",
  "export function MyComponent() { return null; }",
].join("\n");

// A file mixing a component with a constant — violation in generic, allowed in vite.
const constantExportCode = [
  "export const VERSION = '1.0';",
  "export function MyComponent() { return null; }",
].join("\n");

// A file mixing a component with a Next.js-specific export — violation in generic, allowed in next.
const nextSpecificExportCode = [
  "export function generateStaticParams() { return []; }",
  "export function MyComponent() { return null; }",
].join("\n");

const rule = "react-refresh/only-export-components";

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

describe("react-hooks rules", () => {
  describe("react-hooks/rules-of-hooks", () => {
    it.each(sourceFilePaths)(
      "reports a custom hook that calls a hook conditionally in %s",
      async (filePath) => {
        const code = [
          "function useValue(value) { return value; }",
          "export function useToggle(isOn) {",
          "	if (isOn) { useValue(true); }",
          "	return null;",
          "}",
        ].join("\n");
        await expectLintError(code, "react-hooks/rules-of-hooks", {
          filePath,
        });
      },
    );

    it.each(sourceFilePaths)(
      "does not report a custom hook that calls a hook unconditionally in %s",
      async (filePath) => {
        const code = [
          "function useValue(value) { return value; }",
          "export function useToggle(isOn) {",
          "	useValue(isOn);",
          "	return null;",
          "}",
        ].join("\n");
        await expectNoLintError(code, "react-hooks/rules-of-hooks", {
          filePath,
        });
      },
    );
  });

  describe("react-hooks/exhaustive-deps", () => {
    it.each(moduleFilePaths)(
      "reports a missing dependency in a custom hook in %s",
      async (filePath) => {
        const code = [
          "import { useEffect } from 'react';",
          "export function useLogger(message) {",
          "	useEffect(() => { console.log(message); }, []);",
          "}",
        ].join("\n");
        await expectLintError(code, "react-hooks/exhaustive-deps", {
          filePath,
        });
      },
    );
  });

  // fbt depends on Meta's FBT library, and todo and rule-suppression serve Meta-internal tracking.
  // No sample triggers them without Meta's compiler settings, so the test reads the configuration.
  it("leaves out the React Compiler rules that are internal to Meta", async () => {
    const internalRuleIds = [
      "react-hooks/fbt",
      "react-hooks/rule-suppression",
      "react-hooks/todo",
    ];
    const configs = await react();
    const hooks = configs.find(
      (config) => config.name === "@cravingmaker/eslint-config/react/hooks",
    );
    const pluginRuleIds = Object.keys(
      hooks?.plugins?.["react-hooks"]?.rules ?? {},
    ).map((ruleName) => `react-hooks/${ruleName}`);

    expect(pluginRuleIds).toEqual(expect.arrayContaining(internalRuleIds));
    expect(
      internalRuleIds.filter((ruleId) =>
        Object.hasOwn(hooks?.rules ?? {}, ruleId),
      ),
    ).toEqual([]);
  });
});

describe("react-refresh/only-export-components", () => {
  describe("generic variant (default / strictest)", () => {
    const genericOptions = {
      ...tsxOptions,
      reactRefreshVariant: "generic" as const,
    };

    it("does not report a file that only exports components", async () => {
      await expectNoLintError(onlyComponentCode, rule, genericOptions);
    });

    it("reports a non-component utility export alongside a component", async () => {
      await expectLintError(mixedHelperCode, rule, genericOptions);
    });

    it("reports a constant export alongside a component (allowConstantExport: false)", async () => {
      await expectLintError(constantExportCode, rule, genericOptions);
    });

    it("reports a Next.js-specific export alongside a component (no allowExportNames)", async () => {
      await expectLintError(nextSpecificExportCode, rule, genericOptions);
    });
  });

  describe("vite variant (allowConstantExport: true)", () => {
    const viteOptions = { ...tsxOptions, reactRefreshVariant: "vite" as const };

    it("does not report a file that only exports components", async () => {
      await expectNoLintError(onlyComponentCode, rule, viteOptions);
    });

    it("reports a non-component utility export alongside a component", async () => {
      await expectLintError(mixedHelperCode, rule, viteOptions);
    });

    it("does not report a constant export alongside a component", async () => {
      await expectNoLintError(constantExportCode, rule, viteOptions);
    });
  });

  describe("next variant (allowExportNames includes Next.js page exports)", () => {
    const nextOptions = { ...tsxOptions, reactRefreshVariant: "next" as const };

    it("does not report a file that only exports components", async () => {
      await expectNoLintError(onlyComponentCode, rule, nextOptions);
    });

    it("reports a non-component utility export alongside a component", async () => {
      await expectLintError(mixedHelperCode, rule, nextOptions);
    });

    it("does not report generateStaticParams alongside a component", async () => {
      await expectNoLintError(nextSpecificExportCode, rule, nextOptions);
    });

    it("does not report metadata export alongside a component", async () => {
      const code = [
        'export const metadata = { title: "App" };',
        "export function MyComponent() { return null; }",
      ].join("\n");
      await expectNoLintError(code, rule, nextOptions);
    });
  });
});
