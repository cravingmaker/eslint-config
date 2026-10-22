import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginRegexp from "eslint-plugin-regexp";

import { regexpRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

// Builds the flat config for eslint-plugin-regexp.
const regexp = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "regexp",
      plugins: { regexp: pluginRegexp },
      rules: regexpRules,
    },
    options,
    context,
  );
};

export { regexp };
