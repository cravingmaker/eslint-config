import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginNode from "eslint-plugin-n";

import { defaultContext } from "../../../context.js";
import { typescriptFiles, withSvelteComponents } from "../../../globs.js";
import { typeAwareRules, typescriptRulesOff } from "./rules-type-aware.js";
import { nodeRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";
import { typeAwareConfig } from "../../../utilities/type-aware.js";

// Builds the flat config for eslint-plugin-n. In TypeScript files and Svelte components,
// `n/no-sync` is off unless they are in the type-aware scope, also when an override turns it on.
// The rules block applies the overrides to every file of the feature, so the block that turns
// the rule off takes none. Import resolution belongs to import-x in every language;
// `n/no-missing-import` stays off unless a consumer explicitly overrides it.
const node = (
  options: FeatureOptions = {},
  context: Context = defaultContext,
): Linter.Config[] => {
  const { files, ignores = [], overrides = {} } = options;
  const { svelteComponents, typeAware } = context;

  return [
    ...sourcePluginConfigs(
      {
        name: "node",
        plugins: { n: pluginNode },
        rules: nodeRules,
      },
      options,
      context,
    ),
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
