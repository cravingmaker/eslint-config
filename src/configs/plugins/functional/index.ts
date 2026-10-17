import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginFunctional from "eslint-plugin-functional";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import {
  typeAwareRuleIds,
  typeAwareRules,
  typeAwareRulesOff,
} from "./rules-type-aware.js";
import { functionalRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import {
  overridesWithoutTypeInformation,
  typeAwareConfig,
} from "../../../utilities/type-aware.js";

// Builds the flat config for eslint-plugin-functional. The rules that need type information
// are off, and turned on again for the type-aware scope when typed linting is on. An override
// that turns such a rule on applies in that scope only.
const functional = (
  options: FeatureOptions = {},
  { svelteComponents, typeAware }: Context = defaultContext,
): Linter.Config[] => {
  const { files, ignores = [], overrides = {} } = options;

  return [
    {
      name: "@cravingmaker/eslint-config/functional/setup",
      plugins: { functional: pluginFunctional },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/functional/rules",
      rules: {
        ...functionalRules,
        ...typeAwareRulesOff,
        ...overridesWithoutTypeInformation(overrides, typeAwareRuleIds),
      },
    },
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
