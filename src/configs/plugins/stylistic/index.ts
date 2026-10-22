import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginStylistic from "@stylistic/eslint-plugin";

import { stylisticRules } from "./rules.js";
import { internalPlugin } from "../../../rules/index.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

// Builds the flat config for @stylistic/eslint-plugin.
const stylistic = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "stylistic",
      plugins: {
        "@cravingmaker": internalPlugin,
        "@stylistic": pluginStylistic,
      },
      rules: stylisticRules,
    },
    options,
    context,
  );
};

export { stylistic };
