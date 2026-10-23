import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginPerfectionist from "eslint-plugin-perfectionist";

import { perfectionistRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

/**
 * Builds the flat config for eslint-plugin-perfectionist.
 */
const perfectionist = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "perfectionist",
      plugins: { perfectionist: pluginPerfectionist },
      rules: perfectionistRules,
    },
    options,
    context,
  );
};

export { perfectionist };
