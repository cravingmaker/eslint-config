import type { Linter } from "eslint";
import type { FeatureOptions } from "../../types.js";

import pluginHtml from "@html-eslint/eslint-plugin";
import htmlParser from "@html-eslint/parser";

import { htmlFiles } from "../../globs.js";
import { htmlRules } from "./rules.js";
import { narrowFiles } from "../../utilities/type-aware.js";

// Builds the flat config for HTML files.
function html({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      files: narrowFiles(htmlFiles, files),
      ignores: [...ignores],
      languageOptions: { parser: htmlParser },
      name: "@cravingmaker/eslint-config/html/rules",
      plugins: { "@html-eslint": pluginHtml },
      rules: { ...htmlRules, ...overrides },
    },
  ];
}

export { html };
