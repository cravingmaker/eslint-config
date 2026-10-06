import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginNode from "eslint-plugin-n";

import { defaultContext } from "../context.js";
import { sourceFiles, typescriptFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";
import { narrowFiles, typeAwareConfig } from "../utilities/type-aware.js";

// Policy for eslint-plugin-n.
const nodeRules: Rules = {
  ...enableAllRules("n", pluginNode.rules ?? {}),

  "n/prefer-global/buffer": ["error", "never"],
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

  "n/file-extension-in-import": "off", // Covered by `import-x/extensions` rule
  "n/no-extraneous-import": "off", // Covered by `import-x/no-extraneous-dependencies` rule
  "n/no-missing-import": "off", // Covered by `import-x/no-unresolved` rule
  "n/no-process-exit": "off", // Covered by `unicorn/no-process-exit` rule
  "n/prefer-node-protocol": "off", // Covered by `unicorn/prefer-node-protocol` rule

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

// Builds the flat config for eslint-plugin-n. In TypeScript files, `n/no-sync` is off unless
// they are in the type-aware scope.
function node(
  options: FeatureOptions = {},
  { typeAware }: Context = defaultContext,
): Linter.Config[] {
  const { files, ignores = [], overrides = {} } = options;

  return [
    {
      name: "@cravingmaker/eslint-config/node/setup",
      plugins: { n: pluginNode },
    },
    {
      files: [...(files ?? sourceFiles)],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/node/rules",
      rules: { ...nodeRules, ...overrides },
    },
    {
      files: narrowFiles(typescriptFiles, files),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/node/rules-typescript",
      rules: { "n/no-sync": "off", ...overrides },
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
