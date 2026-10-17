import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginUnusedImports from "eslint-plugin-unused-imports";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { unusedImportsRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for eslint-plugin-unused-imports.
const unusedImports = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/unused-imports/setup",
      plugins: { "unused-imports": pluginUnusedImports },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/unused-imports/rules",
      rules: { ...unusedImportsRules, ...overrides },
    },
  ];
};

export { unusedImports };

export { unusedImportsRules } from "./rules.js";
