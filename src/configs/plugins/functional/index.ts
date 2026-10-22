import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginFunctional from "eslint-plugin-functional";

import { defaultContext } from "../../../context.js";
import {
  typeAwareRuleIds,
  typeAwareRules,
  typeAwareRulesOff,
} from "./rules-type-aware.js";
import { functionalRules } from "./rules.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";
import {
  overridesWithoutTypeInformation,
  typeAwareConfig,
} from "../../../utilities/type-aware.js";

// Builds the flat config for eslint-plugin-functional. The rules that need type information
// are off, and turned on again for the type-aware scope when typed linting is on. An override
// that turns such a rule on applies in that scope only.
const functional = (
  options: FeatureOptions = {},
  context: Context = defaultContext,
): Linter.Config[] => {
  const { overrides = {} } = options;
  const { typeAware } = context;

  return [
    ...sourcePluginConfigs(
      {
        name: "functional",
        plugins: { functional: pluginFunctional },
        rules: { ...functionalRules, ...typeAwareRulesOff },
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
          typeAwareConfig("functional", typeAware, options, {
            ...typeAwareRules,
            ...overrides,
          }),
        ]),
  ];
};

export { functional };
