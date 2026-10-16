import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginNode from "eslint-plugin-n";

import { defaultContext } from "../context.js";
import {
  sourceFiles,
  typescriptFiles,
  withSvelteComponents,
} from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";
import { typeAwareConfig } from "../utilities/type-aware.js";

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

  "n/prefer-global/buffer": ["off", "always"], // Buffer globals and imports are restricted in favor of Uint8Array
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

  "n/no-restricted-import": ["off", []], // Project specific

  // Off while their replacements are on, see src/overlaps.ts
  "n/file-extension-in-import": ["error", "always", {}],
  "n/no-extraneous-import": [
    "error",
    {
      allowModules: undefined,
      convertPath: undefined,
      resolvePaths: undefined,
      resolverConfig: undefined,
    },
  ],
  "n/no-missing-import": [
    "error",
    {
      allowModules: undefined,
      ignoreTypeImport: false,
      resolvePaths: undefined,
      resolverConfig: undefined,
      tryExtensions: undefined,
      tsconfigPath: undefined,
      typescriptExtensionMap: undefined,
    },
  ], // Off in TypeScript files and Svelte components, see `node`
  "n/no-process-exit": "error",
  "n/prefer-node-protocol": ["error", { version: undefined }],

  "n/exports-style": ["off", "module.exports", { allowBatchAssign: false }], // Irrelevant for ESM-only project
  "n/global-require": "off", // Irrelevant for ESM-only project
  "n/no-exports-assign": "off", // Irrelevant for ESM-only project
  "n/no-extraneous-require": [
    "off",
    {
      allowModules: undefined,
      convertPath: undefined,
      resolvePaths: undefined,
      resolverConfig: undefined,
      tryExtensions: undefined,
    },
  ], // Irrelevant for ESM-only project
  "n/no-missing-require": [
    "off",
    {
      allowModules: undefined,
      resolvePaths: undefined,
      resolverConfig: undefined,
      tryExtensions: undefined,
      tsconfigPath: undefined,
      typescriptExtensionMap: undefined,
    },
  ], // Irrelevant for ESM-only project
  "n/no-mixed-requires": ["off", { allowCall: false, grouping: false }], // Irrelevant for ESM-only project
  "n/no-new-require": "off", // Irrelevant for ESM-only project
  "n/no-restricted-require": ["off", []], // Irrelevant for ESM-only project
  "n/no-top-level-await": ["off", { convertPath: undefined, ignoreBin: false }], // Irrelevant for ESM-only project
  "n/no-unpublished-require": [
    "off",
    {
      allowModules: undefined,
      convertPath: undefined,
      ignorePrivate: true,
      resolvePaths: undefined,
      resolverConfig: undefined,
      tryExtensions: undefined,
    },
  ], // Irrelevant for ESM-only project
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
