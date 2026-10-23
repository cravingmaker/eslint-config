import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginUnusedImports from "eslint-plugin-unused-imports";

import { unusedImportsRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

/**
 * Builds the flat config for unused imports and variables in the shared source/component scope.
 */
const unusedImports = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "unused-imports",
      plugins: { "unused-imports": pluginUnusedImports },
      rules: unusedImportsRules,
    },
    options,
    context,
  );
};

export { unusedImports };
