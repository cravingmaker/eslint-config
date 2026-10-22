import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginComments from "@eslint-community/eslint-plugin-eslint-comments";

import { commentsRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

// Builds the flat config for ESLint directive comments.
const comments = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "comments",
      plugins: { "@eslint-community/eslint-comments": pluginComments },
      rules: commentsRules,
    },
    options,
    context,
  );
};

export { comments };
