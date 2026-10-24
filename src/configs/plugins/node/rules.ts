import type { Rules } from "../../../types.js";

// Policy for eslint-plugin-n. Unset version and resolution options keep the
// consumer's settings, package engines, and tsconfig inference.
const recommendedRules: Rules = {
  // --- Rules with default options (6/14) ----------------------------------------------------------------------------------------------------------.
  "n/no-deprecated-api": [
    "error",
    {
      ignoreGlobalItems: [],
      ignoreIndirectDependencies: true,
      ignoreModuleItems: [],
      version: undefined,
    },
  ],
  "n/no-unpublished-import": [
    "error",
    {
      allowModules: undefined,
      convertPath: undefined,
      ignorePrivate: true,
      ignoreTypeImport: false,
      resolvePaths: undefined,
      resolverConfig: undefined,
      tryExtensions: undefined,
    },
  ],
  "n/no-unsupported-features/es-builtins": [
    "error",
    { ignores: [], version: undefined },
  ],
  "n/no-unsupported-features/es-syntax": [
    "error",
    { ignores: [], version: undefined },
  ],
  "n/no-unsupported-features/node-builtins": [
    "error",
    { allowExperimental: false, ignores: [], version: undefined },
  ],
  "n/process-exit-as-throw": "error",

  // --- Rules with overridden options (1/14) -------------------------------------------------------------------------------------------------------.
  "n/hashbang": [
    "error",
    {
      additionalExecutables: [],
      convertPath: undefined,
      executableMap: {
        ".js": "node",
        ".mjs": "node",
      },
      ignoreUnpublished: true,
    },
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (7/14) --------------------------------------------------------------------------------------------------------------------.
  "n/no-exports-assign": "off", // Irrelevant for ESM-only project.
  "n/no-extraneous-import": "off", // Handled by `import-x/no-extraneous-dependencies`.
  "n/no-extraneous-require": "off", // Irrelevant for ESM-only project.
  "n/no-missing-import": "off", // Handled by `import-x/no-unresolved`.
  "n/no-missing-require": "off", // Irrelevant for ESM-only project.
  "n/no-process-exit": "off", // Handled by `unicorn/no-process-exit`.
  "n/no-unpublished-require": "off", // Irrelevant for ESM-only project.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (15/29) ---------------------------------------------------------------------------------------------------------.
  "n/callback-return": ["error", ["callback", "cb", "next"]],
  "n/handle-callback-err": ["error", "err"],
  "n/no-callback-literal": "error",
  "n/no-path-concat": "error",
  "n/no-unpublished-bin": ["error", { convertPath: undefined }],
  "n/prefer-global/console": ["error", "always"],
  "n/prefer-global/text-decoder": ["error", "always"],
  "n/prefer-global/text-encoder": ["error", "always"],
  "n/prefer-global/timers": ["error", "always"],
  "n/prefer-global/url": ["error", "always"],
  "n/prefer-global/url-search-params": ["error", "always"],
  "n/prefer-import/assert-strict": "error",
  "n/prefer-process-get-builtin-module": ["error", { version: undefined }],
  "n/prefer-promises/dns": "error",
  "n/prefer-promises/fs": "error",

  // --- Rules with overridden options (4/29) -------------------------------------------------------------------------------------------------------.
  "n/no-process-env": ["warn", { allowedVariables: ["NODE_ENV"] }],
  "n/no-sync": ["error", { allowAtRootLevel: true, ignores: [] }], // Needs type information in the files that typescript-eslint parses.
  "n/prefer-global/crypto": ["error", "never"],
  "n/prefer-global/process": ["error", "never"],

  // --- Turned off rules (10/29) -------------------------------------------------------------------------------------------------------------------.
  "n/exports-style": "off", // Irrelevant for ESM-only project. Automatically fixable by the --fix command.
  "n/file-extension-in-import": "off", // Handled by `import-x/extensions`. Automatically fixable by the --fix command.
  "n/global-require": "off", // Irrelevant for ESM-only project.
  "n/no-mixed-requires": "off", // Irrelevant for ESM-only project.
  "n/no-new-require": "off", // Irrelevant for ESM-only project.
  "n/no-restricted-import": "off", // Project specific.
  "n/no-restricted-require": "off", // Irrelevant for ESM-only project.
  "n/no-top-level-await": "off", // Irrelevant for ESM-only project.
  "n/prefer-global/buffer": "off", // Buffer globals and imports are restricted in favor of Uint8Array.
  "n/prefer-node-protocol": "off", // Handled by `unicorn/prefer-node-protocol`. Automatically fixable by the --fix command.
} as const;

const nodeRules: Rules = {
  ...recommendedRules, // 14/43 rules, 1 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 29/43 rules, 3 automatically fixable, 0 editor suggestions fixable.
} as const;

export { nodeRules };
