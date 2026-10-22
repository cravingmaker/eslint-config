import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginUnicorn from "eslint-plugin-unicorn";

import { unicornRules } from "./rules.js";
import { internalPlugin } from "../../../rules/index.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

// Builds the flat config for eslint-plugin-unicorn.
const unicorn = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "unicorn",
      plugins: { "@cravingmaker": internalPlugin, unicorn: pluginUnicorn },
      rules: unicornRules,
    },
    options,
    context,
  );
};

export { unicorn };
