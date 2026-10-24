import type { Linter } from "eslint";
import type { Options } from "../../src/types.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";
import { getResolvedRules } from "../support/resolved-config.js";

const rootDirectory = process.cwd();
const prefix = "@cravingmaker/eslint-config/";
// Every framework is on, so that every block that applies overrides is there. Typed linting is on
// by default.
const baseOptions = {
  express: true,
  projectRootDirectory: rootDirectory,
  react: { refresh: "vite" },
  svelte: true,
} as const satisfies Options;
/*
For each block that applies overrides, a rule that its policy gives options, and an override that
gives the rule another severity alone. A feature with several blocks gives each block the overrides
of its rules, and the typed blocks of TypeScript take `overridesTypeAware` as well.
*/
const cases = [
  {
    block: "comments/rules",
    options: {
      comments: {
        overrides: {
          "@eslint-community/eslint-comments/disable-enable-pair": "warn",
        },
      },
    },
    ruleId: "@eslint-community/eslint-comments/disable-enable-pair",
    severity: "warn",
  },
  {
    block: "enforce-package-type/rules",
    options: {
      packageJson: {
        overrides: { "enforce-package-type/enforce-package-type": "warn" },
      },
    },
    ruleId: "enforce-package-type/enforce-package-type",
    severity: "warn",
  },
  {
    block: "express/rules",
    options: {
      express: {
        overrides: { "express-security/no-cors-credentials-wildcard": "warn" },
      },
    },
    ruleId: "express-security/no-cors-credentials-wildcard",
    severity: "warn",
  },
  {
    block: "functional/rules",
    options: { functional: { overrides: { "functional/no-let": "warn" } } },
    ruleId: "functional/no-let",
    severity: "warn",
  },
  {
    block: "functional/rules-type-aware",
    options: {
      functional: {
        overrides: { "functional/no-conditional-statements": "warn" },
      },
    },
    ruleId: "functional/no-conditional-statements",
    severity: "warn",
  },
  {
    block: "html/rules",
    options: {
      html: { overrides: { "@html-eslint/require-closing-tags": "error" } },
    },
    ruleId: "@html-eslint/require-closing-tags",
    severity: "error",
  },
  {
    block: "imports/rules",
    options: { imports: { overrides: { "import-x/named": "warn" } } },
    ruleId: "import-x/named",
    severity: "warn",
  },
  {
    block: "javascript/rules",
    options: { javascript: { overrides: { "no-restricted-globals": "warn" } } },
    ruleId: "no-restricted-globals",
    severity: "warn",
  },
  {
    block: "json/rules",
    options: { json: { overrides: { "json/sort-keys": "warn" } } },
    ruleId: "json/sort-keys",
    severity: "warn",
  },
  {
    block: "json/rules-json5",
    options: { json: { overridesJson5: { "json/sort-keys": "warn" } } },
    ruleId: "json/sort-keys",
    severity: "warn",
  },
  {
    block: "json/rules-jsonc",
    options: { json: { overridesJsonc: { "json/sort-keys": "warn" } } },
    ruleId: "json/sort-keys",
    severity: "warn",
  },
  {
    block: "markdown/rules",
    options: {
      markdown: { overrides: { "markdown/fenced-code-language": "warn" } },
    },
    ruleId: "markdown/fenced-code-language",
    severity: "warn",
  },
  {
    block: "node/rules",
    options: { node: { overrides: { "n/no-sync": "warn" } } },
    ruleId: "n/no-sync",
    severity: "warn",
  },
  {
    block: "node/rules-type-aware",
    options: { node: { overrides: { "n/no-sync": "warn" } } },
    ruleId: "n/no-sync",
    severity: "warn",
  },
  {
    block: "package-json/rules",
    options: {
      packageJson: {
        overrides: { "package-json/repository-shorthand": "warn" },
      },
    },
    ruleId: "package-json/repository-shorthand",
    severity: "warn",
  },
  {
    block: "perfectionist/rules",
    options: {
      perfectionist: { overrides: { "perfectionist/sort-objects": "warn" } },
    },
    ruleId: "perfectionist/sort-objects",
    severity: "warn",
  },
  {
    block: "promise/rules",
    options: {
      promise: { overrides: { "promise/prefer-await-to-then": "warn" } },
    },
    ruleId: "promise/prefer-await-to-then",
    severity: "warn",
  },
  {
    block: "react/hooks",
    options: {
      react: {
        overrides: { "react-hooks/exhaustive-deps": "warn" },
        refresh: "vite",
      },
    },
    ruleId: "react-hooks/exhaustive-deps",
    severity: "warn",
  },
  {
    block: "react/html",
    options: {
      react: {
        overrides: { "@html-eslint/react/use-baseline": "warn" },
        refresh: "vite",
      },
    },
    ruleId: "@html-eslint/react/use-baseline",
    severity: "warn",
  },
  {
    block: "react/refresh",
    options: {
      react: {
        overrides: { "react-refresh/only-export-components": "error" },
        refresh: "vite",
      },
    },
    ruleId: "react-refresh/only-export-components",
    severity: "error",
  },
  {
    block: "regexp/rules",
    options: { regexp: { overrides: { "regexp/letter-case": "warn" } } },
    ruleId: "regexp/letter-case",
    severity: "warn",
  },
  {
    block: "sonarjs/rules",
    options: {
      sonarjs: { overrides: { "sonarjs/cognitive-complexity": "error" } },
    },
    ruleId: "sonarjs/cognitive-complexity",
    severity: "error",
  },
  {
    block: "sonarjs/rules-type-aware",
    options: {
      sonarjs: { overrides: { "sonarjs/regex-complexity": "error" } },
    },
    ruleId: "sonarjs/regex-complexity",
    severity: "error",
  },
  {
    block: "stylistic/rules",
    options: {
      stylistic: {
        overrides: { "@stylistic/padding-line-between-statements": "warn" },
      },
    },
    ruleId: "@stylistic/padding-line-between-statements",
    severity: "warn",
  },
  {
    block: "svelte/rules",
    options: {
      svelte: { overrides: { "@html-eslint/svelte/use-baseline": "warn" } },
    },
    ruleId: "@html-eslint/svelte/use-baseline",
    severity: "warn",
  },
  {
    block: "typescript/rules",
    options: {
      typescript: {
        overrides: { "@typescript-eslint/consistent-type-definitions": "warn" },
      },
    },
    ruleId: "@typescript-eslint/consistent-type-definitions",
    severity: "warn",
  },
  {
    block: "typescript/rules-type-aware",
    options: {
      typescript: {
        overrides: { "@typescript-eslint/no-floating-promises": "warn" },
      },
    },
    ruleId: "@typescript-eslint/no-floating-promises",
    severity: "warn",
  },
  {
    block: "typescript/rules-type-aware",
    options: {
      typescript: {
        overridesTypeAware: {
          "@typescript-eslint/no-floating-promises": "warn",
        },
      },
    },
    ruleId: "@typescript-eslint/no-floating-promises",
    severity: "warn",
  },
  {
    block: "typescript/rules-type-aware-tsx",
    options: {
      typescript: {
        overrides: { "@typescript-eslint/naming-convention": "warn" },
      },
    },
    ruleId: "@typescript-eslint/naming-convention",
    severity: "warn",
  },
  {
    block: "unicorn/rules",
    options: { unicorn: { overrides: { "unicorn/template-indent": "warn" } } },
    ruleId: "unicorn/template-indent",
    severity: "warn",
  },
  {
    block: "unused-imports/rules",
    options: {
      unusedImports: { overrides: { "unused-imports/no-unused-vars": "warn" } },
    },
    ruleId: "unused-imports/no-unused-vars",
    severity: "warn",
  },
] as const satisfies ReadonlyArray<{
  readonly block: string;
  readonly options: Options;
  readonly ruleId: string;
  readonly severity: Linter.StringSeverity;
}>;

// The settings that the block named `block` gives `ruleId` in the config of `options`.
const getBlockEntry = async (
  options: Options,
  block: string,
  ruleId: string,
): Promise<unknown> => {
  const configs = await createConfig({ ...baseOptions, ...options });
  const config = configs.find(({ name }) => {
    return name === `${prefix}${block}`;
  });
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return rules.get(ruleId);
};

// The settings that ESLint resolves for `ruleId` in `filePath`, with `options` and `userConfigs`.
const getResolvedEntry = async (
  filePath: string,
  ruleId: string,
  options: Options,
  userConfigs: readonly Linter.Config[] = [],
): Promise<unknown> => {
  const eslint = new ESLint({
    overrideConfig: await createConfig(
      { ...baseOptions, ...options },
      ...userConfigs,
    ),
    overrideConfigFile: true,
  });
  const rules = new Map(
    Object.entries((await getResolvedRules(eslint, filePath)) ?? {}),
  );
  return rules.get(ruleId);
};

// The severities that turn a rule off.
const offSeverities: ReadonlySet<unknown> = new Set([0, "off"]);
// The options of a rule's settings, which follow its severity.
const optionsOf = (entry: unknown): readonly unknown[] => {
  return Array.isArray(entry) ? entry.slice(1) : [];
};

describe("a feature override", () => {
  it.each(cases)(
    "keeps the options of the policy in $block for a severity alone",
    async ({ block, options, ruleId, severity }) => {
      const [policy, overridden] = await Promise.all([
        getBlockEntry({}, block, ruleId),
        getBlockEntry(options, block, ruleId),
      ]);

      expect(optionsOf(policy)).not.toEqual([]);
      expect(overridden).toEqual([severity, ...optionsOf(policy)]);
    },
  );

  it("replaces the options of the policy with its own, without merging them", async () => {
    expect(
      await getBlockEntry(
        {
          unicorn: {
            overrides: {
              "unicorn/template-indent": ["warn", { tags: ["sql"] }],
            },
          },
        },
        "unicorn/rules",
        "unicorn/template-indent",
      ),
    ).toEqual(["warn", { tags: ["sql"] }]);
  });

  it("keeps the options of overrides for a severity alone in overridesTypeAware", async () => {
    const ruleId = "@typescript-eslint/no-floating-promises";

    expect(
      await getBlockEntry(
        {
          typescript: {
            overrides: { [ruleId]: ["error", { ignoreVoid: false }] },
            overridesTypeAware: { [ruleId]: "warn" },
          },
        },
        "typescript/rules-type-aware",
        ruleId,
      ),
    ).toEqual(["warn", { ignoreVoid: false }]);
  });

  it('turns a rule off with "off", which a later severity alone turns on with the options of the policy', async () => {
    const ruleId = "unicorn/template-indent";
    const options = { unicorn: { overrides: { [ruleId]: "off" } } } as const;
    const userConfig: Linter.Config = {
      files: ["**/*.js"],
      rules: { [ruleId]: "warn" },
    };
    const [policy, off, reenabled, withoutOverride] = await Promise.all([
      getBlockEntry({}, "unicorn/rules", ruleId),
      getResolvedEntry("src/example.js", ruleId, options),
      getResolvedEntry("src/example.js", ruleId, options, [userConfig]),
      getResolvedEntry("src/example.js", ruleId, {}, [userConfig]),
    ]);

    expect(off).toEqual([0, ...optionsOf(policy)]);
    expect(reenabled).toEqual(withoutOverride);
  });

  it("turns a disabled rule on with the rule's own options, because no disabled entry of the policy has options", async () => {
    const configs = await createConfig(baseOptions);
    const disabled = configs.flatMap(({ name, rules = {} }) => {
      return Object.entries(rules)
        .filter(([, entry]) => {
          return offSeverities.has(Array.isArray(entry) ? entry[0] : entry);
        })
        .map(([ruleId, entry]) => {
          return { entry, name, ruleId };
        });
    });

    expect(disabled.length).toBeGreaterThan(500);
    expect(
      disabled.filter(({ entry }) => {
        return optionsOf(entry).length > 0;
      }),
    ).toEqual([]);
    expect(
      await getBlockEntry(
        { unicorn: { overrides: { "unicorn/no-nested-ternary": "error" } } },
        "unicorn/rules",
        "unicorn/no-nested-ternary",
      ),
    ).toBe("error");
  });

  // The cases of the problem: each one resolves as the same settings in a user config do, with
  // the options of the policy.
  it.each([
    {
      filePath: "src/App.tsx",
      options: {
        react: {
          overrides: { "react-refresh/only-export-components": "error" },
          refresh: "vite",
        },
      },
      ruleId: "react-refresh/only-export-components",
      settings: "error",
    },
    {
      filePath: "src/example.js",
      options: {
        javascript: { overrides: { "no-restricted-globals": "warn" } },
      },
      ruleId: "no-restricted-globals",
      settings: "warn",
    },
    {
      filePath: "src/example.js",
      options: {
        unicorn: { overrides: { "unicorn/template-indent": "warn" } },
      },
      ruleId: "unicorn/template-indent",
      settings: "warn",
    },
    {
      filePath: "src/example.ts",
      options: {
        typescript: {
          overrides: { "@typescript-eslint/no-floating-promises": "warn" },
        },
      },
      ruleId: "@typescript-eslint/no-floating-promises",
      settings: "warn",
    },
  ] as const)(
    "resolves $ruleId in $filePath as a user config does",
    async ({ filePath, options, ruleId, settings }) => {
      const [overridden, userConfig, policy] = await Promise.all([
        getResolvedEntry(filePath, ruleId, options),
        getResolvedEntry(filePath, ruleId, {}, [
          { files: [filePath], rules: { [ruleId]: settings } },
        ]),
        getResolvedEntry(filePath, ruleId, {}),
      ]);

      expect(optionsOf(policy)).not.toEqual([]);
      expect(overridden).toEqual(userConfig);
      expect(optionsOf(overridden)).toEqual(optionsOf(policy));
    },
  );

  it("keeps the restriction of the Buffer global for a warning", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        ...baseOptions,
        javascript: { overrides: { "no-restricted-globals": "warn" } },
      }),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      "export const bytes = Buffer.alloc(1);\n",
      { filePath: "src/example.js" },
    );

    expect(
      result.messages
        .filter(({ ruleId }) => {
          return ruleId === "no-restricted-globals";
        })
        .map(({ message, severity }) => {
          return `${String(severity)} ${message}`;
        }),
    ).toEqual(["1 Unexpected use of 'Buffer'. Use Uint8Array instead."]);
  });
});
