import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginSecurity from "eslint-plugin-security";

import { securityRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

/**
 * Builds the flat config for eslint-plugin-security.
 */
const security = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "security",
      plugins: { security: pluginSecurity },
      rules: securityRules,
    },
    options,
    context,
  );
};

export { security };
