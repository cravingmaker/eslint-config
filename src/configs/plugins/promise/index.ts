import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginPromise from "eslint-plugin-promise";

import { promiseRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

/**
 * Builds the flat config for eslint-plugin-promise.
 */
const promise = (
  options: FeatureOptions = {},
  context?: Context,
): Linter.Config[] => {
  return sourcePluginConfigs(
    {
      name: "promise",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types.
        promise: pluginPromise,
      },
      rules: promiseRules,
    },
    options,
    context,
  );
};

export { promise };
