import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginComments from "@eslint-community/eslint-plugin-eslint-comments";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for ESLint directive comments, from @eslint-community/eslint-plugin-eslint-comments.
const commentsRules: Rules = {
  "@eslint-community/eslint-comments/no-aggregating-enable": "error",
  "@eslint-community/eslint-comments/no-duplicate-disable": "error",
  "@eslint-community/eslint-comments/no-unlimited-disable": "error",
  "@eslint-community/eslint-comments/no-unused-enable": "error",
  "@eslint-community/eslint-comments/require-description": [
    "error",
    { additionalDirectives: [], ignore: [] },
  ],

  "@eslint-community/eslint-comments/disable-enable-pair": [
    "error",
    { allowWholeFile: true },
  ],
  "@eslint-community/eslint-comments/no-use": [
    "error",
    {
      additionalDirectives: [],
      allow: ["eslint-disable", "eslint-enable", "eslint-disable-next-line"],
    },
  ],

  "@eslint-community/eslint-comments/no-restricted-disable": "off", // Project specific
} as const;

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

export { comments, commentsRules };
