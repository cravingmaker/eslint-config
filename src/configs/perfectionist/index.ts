import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../types.js";

import pluginPerfectionist from "eslint-plugin-perfectionist";

import { defaultContext } from "../../context.js";
import { sourceFiles, withSvelteComponents } from "../../globs.js";
import { perfectionistRules } from "./rules.js";
import { narrowFiles } from "../../utilities/type-aware.js";

// Builds the flat config for eslint-plugin-perfectionist.
function perfectionist(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/perfectionist/setup",
      plugins: { perfectionist: pluginPerfectionist },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/perfectionist/rules",
      rules: { ...perfectionistRules, ...overrides },
    },
  ];
}

export { perfectionist };
