import type { ESLint } from "eslint";

import { writeFile } from "node:fs/promises";

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
import pluginUnicorn from "eslint-plugin-unicorn";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { pluginsToRulesDTS } from "eslint-typegen/core";
import pluginJson from "@eslint/json";
import pluginMarkdown from "@eslint/markdown";
import { builtinRules } from "eslint/use-at-your-own-risk";
import pluginHtml from "@html-eslint/eslint-plugin";
import pluginHtmlReact from "@html-eslint/eslint-plugin-react";
import pluginHtmlSvelte from "@html-eslint/eslint-plugin-svelte";
import { plugin as pluginTypeScript } from "typescript-eslint";

// Keys are the plugin names that createConfig registers. The empty key holds ESLint's core rules.
const plugins: Record<string, ESLint.Plugin> = {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- ESLint exposes its core rules only through this registry
  "": { rules: Object.fromEntries(builtinRules) },
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types
  promise: pluginPromise,
  // Only the rules: the plugin's `configs.flat` does not match ESLint's plugin type.
  "react-hooks": { rules: pluginReactHooks.rules },
  "react-refresh": reactRefresh.plugin,
  regexp: pluginRegexp,
  security: pluginSecurity,
  "@typescript-eslint": pluginTypeScript,
  unicorn: pluginUnicorn,
  "unused-imports": pluginUnusedImports,
};

const declarations = await pluginsToRulesDTS(plugins, {
  includeAugmentation: false,
});

// eslint-disable-next-line security/detect-non-literal-fs-filename -- The output path is fixed relative to this script.
await writeFile(new URL("../src/typegen.d.ts", import.meta.url), declarations);
