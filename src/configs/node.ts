import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginNode from "eslint-plugin-n";

import { defaultContext } from "../context.js";
import {
  sourceFiles,
  typescriptFiles,
  withSvelteComponents,
} from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";
import { narrowFiles } from "../utilities/file-scope.js";
import { typeAwareConfig } from "../utilities/type-aware.js";

// Policy for eslint-plugin-n.
const nodeRules: Rules = {
  ...enableAllRules("n", pluginNode.rules ?? {}),

  "n/prefer-global/buffer": "off", // Buffer globals and imports are restricted in favor of Uint8Array
  "n/prefer-global/crypto": ["error", "never"],
  "n/prefer-global/process": ["error", "never"],

  "n/hashbang": [
    "error",
    {
      executableMap: {
        ".js": "node",
        ".mjs": "node",
      },
      ignoreUnpublished: true,
    },
  ],
  "n/no-deprecated-api": ["error", { ignoreIndirectDependencies: true }],
  "n/no-sync": ["error", { allowAtRootLevel: true }], // Needs type information in TypeScript files

  "n/no-process-env": ["warn", { allowedVariables: ["NODE_ENV"] }],

  "n/no-restricted-import": "off", // Project specific

  // Off while their replacements are on, see src/overlaps.ts
  "n/file-extension-in-import": "error",
  "n/no-extraneous-import": "error",
  "n/no-missing-import": "error", // Off in TypeScript files and Svelte components, see `node`
  "n/no-process-exit": "error",
  "n/prefer-node-protocol": "error",

  "n/exports-style": "off", // Irrelevant for ESM-only project
  "n/global-require": "off", // Irrelevant for ESM-only project
  "n/no-exports-assign": "off", // Irrelevant for ESM-only project
  "n/no-extraneous-require": "off", // Irrelevant for ESM-only project
  "n/no-missing-require": "off", // Irrelevant for ESM-only project
  "n/no-mixed-requires": "off", // Irrelevant for ESM-only project
  "n/no-new-require": "off", // Irrelevant for ESM-only project
  "n/no-restricted-require": "off", // Irrelevant for ESM-only project
  "n/no-top-level-await": "off", // Irrelevant for ESM-only project
  "n/no-unpublished-require": "off", // Irrelevant for ESM-only project
};
// The rules that need type information in TypeScript files.
const typeAwareRules: Rules = { "n/no-sync": nodeRules["n/no-sync"] };

// Builds the flat config for eslint-plugin-n. In TypeScript files and Svelte components,
// `n/no-sync` is off unless they are in the type-aware scope, also when an override turns it on.
// The rules block applies the overrides to every file of the feature, so the block that turns
// the rule off takes none. `n/no-missing-import` is off in those files as well, unless an
// override sets it. It does not resolve imports as TypeScript does: in a TypeScript file it
// reports `./date.js` when `date.js` has a declaration file, and in a component also when the
// module is `date.ts`. The compiler reports a module that is missing there.
function node(
  options: FeatureOptions = {},
  { svelteComponents, typeAware }: Context = defaultContext,
): Linter.Config[] {
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
      rules: {
        "n/no-sync": "off",
        ...(!Object.hasOwn(overrides, "n/no-missing-import") && {
          "n/no-missing-import": "off",
        }),
      },
    },
    ...(typeAware === undefined
      ? []
      : [
          typeAwareConfig("node", typeAware, options, {
            ...typeAwareRules,
            ...overrides,
          }),
        ]),
  ];
}

export { node };
