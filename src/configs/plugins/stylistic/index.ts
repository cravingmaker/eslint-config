import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginStylistic from "@stylistic/eslint-plugin";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { stylisticRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for @stylistic/eslint-plugin.
const stylistic = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/stylistic/setup",
      plugins: { "@stylistic": pluginStylistic },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/stylistic/rules",
      rules: { ...stylisticRules, ...overrides },
    },
  ];
};

export { stylistic };
