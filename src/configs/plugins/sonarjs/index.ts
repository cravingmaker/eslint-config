import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginSonarjs from "eslint-plugin-sonarjs";

import { defaultContext } from "../../../context.js";
import {
  typeAwareRuleIds,
  typeAwareRules,
  typeAwareRulesOff,
} from "./rules-type-aware.js";
import { sonarjsRules } from "./rules.js";
import { withOverrides } from "../../../utilities/overrides.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";
import {
  overridesWithoutTypeInformation,
  typeAwareConfig,
} from "../../../utilities/type-aware.js";

/**
 * Builds the flat config for eslint-plugin-sonarjs. Rules and overrides that need type information apply only within the shared type-aware scope and the feature's own files.
 */
const sonarjs = (
  options: FeatureOptions = {},
  context: Context = defaultContext,
): Linter.Config[] => {
  const { overrides = {} } = options;
  const { typeAware } = context;

  return [
    ...sourcePluginConfigs(
      {
        name: "sonarjs",
        plugins: { sonarjs: pluginSonarjs },
        rules: { ...sonarjsRules, ...typeAwareRulesOff },
      },
      {
        ...options,
        overrides: overridesWithoutTypeInformation(overrides, typeAwareRuleIds),
      },
      context,
    ),
    ...(typeof typeAware === "undefined"
      ? []
      : [
          typeAwareConfig(
            "sonarjs",
            typeAware,
            options,
            withOverrides(typeAwareRules, overrides),
          ),
        ]),
  ];
};

export { sonarjs };
