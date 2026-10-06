import type { Rules } from "../../types.js";

import eslintPluginN from "eslint-plugin-n";

import { getPluginRules } from "../../utilities/plugin-rules.js";

const nEslintRules: Rules = {
  ...getPluginRules("n", eslintPluginN.rules ?? {}),

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

const nUntypedTypeScriptEslintRules: Rules = {
  ...nEslintRules,
  "n/no-sync": "off",
} as const;

export { nEslintRules, nUntypedTypeScriptEslintRules };
