import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginNode from "eslint-plugin-n";

import { javascriptFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

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
  "n/no-sync": ["error", { allowAtRootLevel: true }],

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

// Builds the flat config for eslint-plugin-n.
function node({
  files = javascriptFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/node/setup",
      plugins: { n: pluginNode },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/node/rules",
      rules: { ...nodeRules, ...overrides },
    },
  ];
}

export { node, nodeRules };
