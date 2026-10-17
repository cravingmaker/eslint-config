import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginComments from "@eslint-community/eslint-plugin-eslint-comments";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { commentsRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for ESLint directive comments.
const comments = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/comments/setup",
      plugins: { "@eslint-community/eslint-comments": pluginComments },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/comments/rules",
      rules: { ...commentsRules, ...overrides },
    },
  ];
};

export { comments };

export { commentsRules } from "./rules.js";
