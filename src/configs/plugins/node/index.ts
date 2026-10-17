import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginNode from "eslint-plugin-n";

import { defaultContext } from "../../../context.js";
import {
  sourceFiles,
  typescriptFiles,
  withSvelteComponents,
} from "../../../globs.js";
import { nodeRules, typeAwareRules, typescriptRulesOff } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { typeAwareConfig } from "../../../utilities/type-aware.js";

// Builds the flat config for eslint-plugin-n. In TypeScript files and Svelte components,
// `n/no-sync` is off unless they are in the type-aware scope, also when an override turns it on.
// The rules block applies the overrides to every file of the feature, so the block that turns
// the rule off takes none. Import resolution belongs to import-x in every language;
// `n/no-missing-import` stays off unless a consumer explicitly overrides it.
const node = (
  options: FeatureOptions = {},
  { svelteComponents, typeAware }: Context = defaultContext,
): Linter.Config[] => {
  const { files, ignores = [], overrides = {} } = options;

  return [
    {
      name: "@cravingmaker/eslint-config/node/setup",
      plugins: { n: pluginNode },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/node/rules",
      rules: { ...nodeRules, ...overrides },
    },
    {
      files: narrowFiles(
        withSvelteComponents(typescriptFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/node/rules-typescript",
      rules: { ...typescriptRulesOff },
    },
    ...(typeof typeAware === "undefined"
      ? []
      : [
          typeAwareConfig("node", typeAware, options, {
            ...typeAwareRules,
            ...overrides,
          }),
        ]),
  ];
};

export { node };
