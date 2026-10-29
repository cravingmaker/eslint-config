import type { ESLint } from "eslint";

import { writeFile } from "node:fs/promises";
// eslint-disable-next-line n/no-unsupported-features/node-builtins -- registerHooks is available throughout the supported Node.js range.
import { registerHooks } from "node:module";

import pluginEslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import pluginEnforcePackageType from "eslint-enforce-package-type";
import pluginExpressSecurity from "eslint-plugin-express-security";
import pluginFunctional from "eslint-plugin-functional";
import pluginImportX from "eslint-plugin-import-x";
import pluginN from "eslint-plugin-n";
import pluginPackageJson from "eslint-plugin-package-json";
import pluginPerfectionist from "eslint-plugin-perfectionist";
import pluginPromise from "eslint-plugin-promise";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import pluginRegexp from "eslint-plugin-regexp";
import pluginSecurity from "eslint-plugin-security";
import pluginSonarjs from "eslint-plugin-sonarjs";
import pluginUnicorn from "eslint-plugin-unicorn";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { pluginsToRulesDTS } from "eslint-typegen/core";
import pluginJson from "@eslint/json";
import pluginMarkdown from "@eslint/markdown";
import { builtinRules } from "eslint/use-at-your-own-risk";
import pluginHtml from "@html-eslint/eslint-plugin";
import pluginHtmlReact from "@html-eslint/eslint-plugin-react";
import pluginHtmlSvelte from "@html-eslint/eslint-plugin-svelte";
import pluginStylistic from "@stylistic/eslint-plugin";
import { plugin as pluginTypeScript } from "typescript-eslint";
import pluginVitest from "@vitest/eslint-plugin";

// Node strips TypeScript but does not resolve the compiler's relative .js imports to source files.
const hooks = registerHooks({
  resolve: (specifier, context, nextResolve) => {
    return nextResolve(
      context.parentURL?.endsWith(".ts") === true &&
        /^\.{1,2}\/.*\.js$/u.test(specifier)
        ? specifier.replace(/\.js$/u, ".ts")
        : specifier,
      context,
    );
  },
});
const { internalPlugin } = await import("../src/rules/index.js");
hooks.deregister();

/**
 * `plugin` with the pattern properties of the first option of `ruleName` declared as the
 * properties in `names` that they match. json-schema-to-typescript turns pattern properties into
 * an index signature that the other properties of the option do not satisfy, so the declarations
 * fail to compile, as they do for `mustMatch` and `mustNotMatch` of `vitest/valid-title`. Only the
 * declarations use the changed schema: ESLint checks the options against the plugin's own.
 */
const withNamedPatternProperties = (
  plugin: Readonly<ESLint.Plugin>,
  ruleName: string,
  names: readonly string[],
): ESLint.Plugin => {
  const rules = new Map(Object.entries(plugin.rules ?? {}));
  const rule = rules.get(ruleName);
  const schema = rule?.meta?.schema;
  const [option = {}, ...otherOptions] = Array.isArray(schema) ? schema : [];
  if (
    typeof rule === "undefined" ||
    typeof option.patternProperties === "undefined"
  ) {
    return plugin;
  }

  const { patternProperties, ...namedOption } = option;
  const namedProperties = Object.entries(patternProperties).flatMap(
    ([pattern, property]) => {
      // eslint-disable-next-line security/detect-non-literal-regexp -- The pattern comes from the schema of an installed plugin.
      const expression = new RegExp(pattern, "u");
      return names
        .filter((name) => {
          return expression.test(name);
        })
        .map((name) => {
          return [name, property] as const;
        });
    },
  );
  return {
    ...plugin,
    rules: {
      ...plugin.rules,
      [ruleName]: {
        ...rule,
        meta: {
          ...rule.meta,
          schema: [
            {
              ...namedOption,
              properties: {
                ...namedOption.properties,
                ...Object.fromEntries(namedProperties),
              },
            },
            ...otherOptions,
          ],
        },
      },
    },
  };
};

// Keys are the plugin names that createConfig registers. The empty key holds ESLint's core rules.
// Keep this build-only registry local: runtime features load optional peers lazily, with scoped
// registration and compatibility adapters. The typegen test checks every registered rule below.
const plugins: Record<string, ESLint.Plugin> = {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- ESLint exposes its core rules only through this registry.
  "": { rules: Object.fromEntries(builtinRules) },
  "@cravingmaker": internalPlugin,
  "enforce-package-type": pluginEnforcePackageType,
  "@eslint-community/eslint-comments": pluginEslintComments,
  "express-security": pluginExpressSecurity,
  functional: pluginFunctional,
  "@html-eslint": pluginHtml,
  "@html-eslint/react": pluginHtmlReact,
  "@html-eslint/svelte": pluginHtmlSvelte,
  "import-x": pluginImportX,
  json: pluginJson,
  markdown: pluginMarkdown,
  n: pluginN,
  "package-json": pluginPackageJson,
  perfectionist: pluginPerfectionist,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types.
  promise: pluginPromise,
  // Only the rules: the plugin's `configs.flat` does not match ESLint's plugin type.
  "react-hooks": { rules: pluginReactHooks.rules },
  "react-refresh": reactRefresh.plugin,
  regexp: pluginRegexp,
  security: pluginSecurity,
  sonarjs: pluginSonarjs,
  "@stylistic": pluginStylistic,
  "@typescript-eslint": pluginTypeScript,
  unicorn: pluginUnicorn,
  "unused-imports": pluginUnusedImports,
  vitest: withNamedPatternProperties(pluginVitest, "valid-title", [
    "mustMatch",
    "mustNotMatch",
  ]),
};

/**
 * Drops repeated copies of a top-level declaration. json-schema-to-typescript can emit one
 * definition twice, as it does for `unicorn/name-replacements`, and a repeated interface fails
 * to compile when declaration files are type-checked.
 */
const removeRepeatedDeclarations = (source: string): string => {
  const parts = source.split(/^(?=(?:interface|type) |\/\/ -{5} )/mu);
  return parts
    .filter((part, index) => {
      return (
        !/^(?:interface|type) /u.test(part) || parts.indexOf(part) === index
      );
    })
    .join("");
};

const declarations = await pluginsToRulesDTS(plugins, {
  includeAugmentation: false,
});

// eslint-disable-next-line security/detect-non-literal-fs-filename -- The output path is fixed relative to this script.
await writeFile(
  new URL("../src/typegen.d.ts", import.meta.url),
  removeRepeatedDeclarations(declarations),
);
