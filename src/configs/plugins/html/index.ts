import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import pluginHtml from "@html-eslint/eslint-plugin";
import htmlParser from "@html-eslint/parser";

import { htmlFiles } from "../../../globs.js";
import { htmlRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { withOverrides } from "../../../utilities/overrides.js";

/**
 * Builds the flat config for HTML files.
 */
const html = ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] => {
  return [
    {
      files: narrowFiles(htmlFiles, files),
      ignores: [...ignores],
      languageOptions: { parser: htmlParser },
      name: "@cravingmaker/eslint-config/html/rules",
      plugins: { "@html-eslint": pluginHtml },
      rules: withOverrides(htmlRules, overrides),
    },
  ];
};

export { html };
