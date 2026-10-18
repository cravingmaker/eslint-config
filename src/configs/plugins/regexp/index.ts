import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginRegexp from "eslint-plugin-regexp";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { regexpRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for eslint-plugin-regexp.
const regexp = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/regexp/setup",
      plugins: { regexp: pluginRegexp },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/regexp/rules",
      rules: { ...regexpRules, ...overrides },
    },
  ];
};

export { regexp };
