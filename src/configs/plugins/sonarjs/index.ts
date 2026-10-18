import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginSonarjs from "eslint-plugin-sonarjs";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import {
  typeAwareRuleIds,
  typeAwareRules,
  typeAwareRulesOff,
} from "./rules-type-aware.js";
import { sonarjsRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import {
  overridesWithoutTypeInformation,
  typeAwareConfig,
} from "../../../utilities/type-aware.js";

// Builds the flat config for eslint-plugin-sonarjs. Rules and overrides that need type
// information apply only within the shared type-aware scope and the feature's own files.
const sonarjs = (
  options: FeatureOptions = {},
  { svelteComponents, typeAware }: Context = defaultContext,
): Linter.Config[] => {
  const { files, ignores = [], overrides = {} } = options;

  return [
    {
      name: "@cravingmaker/eslint-config/sonarjs/setup",
      plugins: { sonarjs: pluginSonarjs },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/sonarjs/rules",
      rules: {
        ...sonarjsRules,
        ...typeAwareRulesOff,
        ...overridesWithoutTypeInformation(overrides, typeAwareRuleIds),
      },
    },
    ...(typeof typeAware === "undefined"
      ? []
      : [
          typeAwareConfig("sonarjs", typeAware, options, {
            ...typeAwareRules,
            ...overrides,
          }),
        ]),
  ];
};

export { sonarjs };
