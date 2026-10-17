import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginUnicorn from "eslint-plugin-unicorn";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { unicornRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for eslint-plugin-unicorn.
const unicorn = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/unicorn/setup",
      plugins: { unicorn: pluginUnicorn },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/unicorn/rules",
      rules: { ...unicornRules, ...overrides },
    },
  ];
};

export { unicorn };

export { unicornRules } from "./rules.js";
