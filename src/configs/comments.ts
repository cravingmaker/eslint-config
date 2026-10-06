import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginComments from "@eslint-community/eslint-plugin-eslint-comments";

import { javascriptFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for ESLint directive comments, from @eslint-community/eslint-plugin-eslint-comments.
const commentsRules: Rules = {
  ...enableAllRules("@eslint-community/eslint-comments", pluginComments.rules),

  "@eslint-community/eslint-comments/disable-enable-pair": [
    "error",
    { allowWholeFile: true },
  ],
  "@eslint-community/eslint-comments/no-use": [
    "error",
    { allow: ["eslint-disable", "eslint-enable", "eslint-disable-next-line"] },
  ],

  "@eslint-community/eslint-comments/no-restricted-disable": "off", // Project specific
} as const;

// Builds the flat config for ESLint directive comments.
function comments({
  files = javascriptFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/comments/setup",
      plugins: { "@eslint-community/eslint-comments": pluginComments },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/comments/rules",
      rules: { ...commentsRules, ...overrides },
    },
  ];
}

export { comments, commentsRules };
