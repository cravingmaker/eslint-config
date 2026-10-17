import type { Rules } from "../../../types.js";

// Policy for eslint-plugin-n. Unset version and resolution options keep the
// consumer's settings, package engines, and tsconfig inference.
const nodeRules: Rules = {
  "n/callback-return": ["error", ["callback", "cb", "next"]],
  "n/handle-callback-err": ["error", "err"],
  "n/no-callback-literal": "error",
  "n/no-path-concat": "error",
  "n/no-unpublished-bin": ["error", { convertPath: undefined }],
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
  "n/process-exit-as-throw": "error",

  "n/prefer-global/buffer": "off", // Buffer globals and imports are restricted in favor of Uint8Array
  "n/prefer-global/crypto": ["error", "never"],
  "n/prefer-global/process": ["error", "never"],

  "n/hashbang": [
    "error",
    {
      convertPath: undefined,

      additionalExecutables: [],

      executableMap: {
        ".js": "node",
        ".mjs": "node",
      },
      ignoreUnpublished: true,
    },
  ],
  "n/no-deprecated-api": [
    "error",
    {
      version: undefined,

      ignoreGlobalItems: [],
      ignoreIndirectDependencies: true,
      ignoreModuleItems: [],
    },
  ],
  "n/no-sync": ["error", { allowAtRootLevel: true, ignores: [] }], // Needs type information in TypeScript files

  "n/no-process-env": ["warn", { allowedVariables: ["NODE_ENV"] }],

  "n/no-restricted-import": "off", // Project specific

  "n/file-extension-in-import": "off", // Handled by `import-x/extensions`.
  "n/no-extraneous-import": "off", // Handled by `import-x/no-extraneous-dependencies`.
  "n/no-missing-import": "off", // Handled by `import-x/no-unresolved`.
  "n/no-process-exit": "off", // Handled by `unicorn/no-process-exit`.
  "n/prefer-node-protocol": "off", // Handled by `unicorn/prefer-node-protocol`.

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

// Rules requiring type information stay off in TypeScript files outside typed linting.
const typescriptRulesOff: Rules = { "n/no-sync": "off" };

// The rules that need type information in TypeScript files.
const typeAwareRules: Rules = { "n/no-sync": nodeRules["n/no-sync"] };

export { nodeRules, typeAwareRules, typescriptRulesOff };
