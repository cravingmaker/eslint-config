import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginUnusedImports from "eslint-plugin-unused-imports";

import { javascriptFiles } from "../globs.js";
import {
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `no-unused-vars` rule name
  noUnusedVarsOptions,
} from "./shared-options.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for eslint-plugin-unused-imports.
const unusedImportsRules: Rules = {
  ...enableAllRules("unused-imports", pluginUnusedImports.rules ?? {}),

  "unused-imports/no-unused-vars": ["error", { ...noUnusedVarsOptions }],
};

// Builds the flat config for eslint-plugin-unused-imports.
function unusedImports({
  files = javascriptFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/unused-imports/setup",
      plugins: { "unused-imports": pluginUnusedImports },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/unused-imports/rules",
      rules: { ...unusedImportsRules, ...overrides },
    },
  ];
}

export { unusedImports, unusedImportsRules };
