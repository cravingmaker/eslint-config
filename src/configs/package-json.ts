import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginEnforcePackageType from "eslint-enforce-package-type";
import pluginPackageJson from "eslint-plugin-package-json";
import * as jsoncParser from "jsonc-eslint-parser";

import { packageJsonFiles } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for package.json files, from eslint-plugin-package-json and eslint-enforce-package-type.
const packageJsonRules: Rules = {
  "package-json/bin-name-casing": "error",
  "package-json/exports-subpaths-style": ["error", { prefer: "explicit" }],
  "package-json/no-empty-fields": ["error", { ignoreProperties: ["files"] }],
  "package-json/no-local-dependencies": ["error", { ignorePrivate: true }],
  "package-json/no-redundant-files": "error",
  "package-json/no-redundant-publishConfig": "error",
  "package-json/order-properties": ["error", { order: "sort-package-json" }],
  "package-json/prefer-rolling-workspace-spec": [
    "error",
    { ignoreDependencies: [], ignorePatterns: [] },
  ],
  "package-json/repository-shorthand": ["error", { form: "object" }],
  "package-json/require-attribution": [
    "error",
    { ignorePrivate: true, preferContributorsOnly: false },
  ],
  "package-json/require-author": ["error", { ignorePrivate: false }],
  "package-json/require-description": ["error", { ignorePrivate: false }],
  "package-json/require-devDependencies": ["error", { ignorePrivate: false }],
  "package-json/require-devEngines": ["error", { ignorePrivate: false }],
  "package-json/require-engines": ["error", { ignorePrivate: false }],
  "package-json/require-name": ["error", { ignorePrivate: true }],
  "package-json/require-peerDependenciesMeta": [
    "error",
    { ignorePrivate: false },
  ],
  "package-json/require-private": "error",
  "package-json/require-scripts": ["error", { ignorePrivate: false }],
  "package-json/require-type": ["error", { ignorePrivate: false }],
  "package-json/require-version": ["error", { ignorePrivate: true }],
  "package-json/restrict-dist-tags": [
    "error",
    {
      allowed: ["latest", "dev", "next", "alpha", "beta", "canary", "rc"],
      allowedFor: undefined,
    },
  ],
  "package-json/restrict-private-properties": [
    "error",
    { blockedProperties: ["files", "publishConfig"] },
  ],
  "package-json/scripts-name-casing": [
    "error",
    { ignoreNames: [], ignorePatterns: [] },
  ],
  "package-json/sort-collections": [
    "error",
    [
      "config",
      "dependencies",
      "devDependencies",
      "exports",
      "optionalDependencies",
      "overrides",
      "peerDependencies",
      "peerDependenciesMeta",
      "scripts",
    ],
  ],
  "package-json/specify-peers-locally": "error",
  "package-json/unique-dependencies": "error",
  "package-json/valid-author": "error",
  "package-json/valid-bin": "error",
  "package-json/valid-browser": "error",
  "package-json/valid-bugs": "error",
  "package-json/valid-bundleDependencies": "error",
  "package-json/valid-config": "error",
  "package-json/valid-contributors": "error",
  "package-json/valid-cpu": "error",
  "package-json/valid-dependencies": "error",
  "package-json/valid-description": "error",
  "package-json/valid-devDependencies": "error",
  "package-json/valid-devEngines": "error",
  "package-json/valid-directories": "error",
  "package-json/valid-engines": "error",
  "package-json/valid-exports": "error",
  "package-json/valid-files": "error",
  "package-json/valid-funding": "error",
  "package-json/valid-gypfile": "error",
  "package-json/valid-homepage": "error",
  "package-json/valid-keywords": "error",
  "package-json/valid-libc": "error",
  "package-json/valid-license": "error",
  "package-json/valid-main": "error",
  "package-json/valid-man": "error",
  "package-json/valid-module": "error",
  "package-json/valid-name": "error",
  "package-json/valid-optionalDependencies": "error",
  "package-json/valid-os": "error",
  "package-json/valid-packageManager": "error",
  "package-json/valid-peerDependencies": "error",
  "package-json/valid-peerDependenciesMeta": "error",
  "package-json/valid-peerDependenciesMeta-relationship": "error",
  "package-json/valid-private": "error",
  "package-json/valid-publishConfig": "error",
  "package-json/valid-repository": "error",
  "package-json/valid-repository-directory": "error",
  "package-json/valid-scripts": "error",
  "package-json/valid-sideEffects": "error",
  "package-json/valid-type": "error",
  "package-json/valid-version": "error",
  "package-json/valid-workspaces": "error",

  "enforce-package-type/enforce-package-type": [
    "error",
    { enforceType: "module" },
  ],

  "package-json/require-bugs": ["error", { ignorePrivate: true }],
  "package-json/require-exports": ["error", { ignorePrivate: true }],
  "package-json/require-files": ["error", { ignorePrivate: true }],
  "package-json/require-homepage": ["error", { ignorePrivate: true }],
  "package-json/require-keywords": ["error", { ignorePrivate: true }],
  "package-json/require-license": ["error", { ignorePrivate: true }],
  "package-json/require-repository": ["error", { ignorePrivate: true }],
  "package-json/require-sideEffects": ["error", { ignorePrivate: true }],
  "package-json/require-types": ["error", { ignorePrivate: true }],
  "package-json/restrict-dependency-ranges": [
    "error",
    {
      forPackages: undefined,
      forVersions: undefined,

      forDependencyTypes: ["dependencies", "devDependencies"],
      rangeType: "pin",
    },
  ],

  "package-json/restrict-top-level-properties": "off", // Project specific

  "package-json/require-bin": "off", // Prefer optional
  "package-json/require-browser": "off", // Prefer optional; only relevant to browser-targeted packages
  "package-json/require-bundleDependencies": "off", // Prefer optional
  "package-json/require-config": "off", // Prefer optional; npm config defaults are package-specific
  "package-json/require-contributors": "off", // Prefer optional
  "package-json/require-cpu": "off", // Prefer optional
  "package-json/require-dependencies": "off", // Prefer optional
  "package-json/require-directories": "off", // Prefer optional
  "package-json/require-funding": "off", // Prefer optional
  "package-json/require-gypfile": "off", // Prefer optional; only relevant to native addon packages
  "package-json/require-libc": "off", // Prefer optional; only relevant to libc-specific packages
  "package-json/require-main": "off", // Prefer optional
  "package-json/require-man": "off", // Prefer optional
  "package-json/require-module": "off", // Prefer optional
  "package-json/require-optionalDependencies": "off", // Prefer optional
  "package-json/require-os": "off", // Prefer optional
  "package-json/require-packageManager": "off", // Prefer optional
  "package-json/require-peerDependencies": "off", // Prefer optional
  "package-json/require-publishConfig": "off", // Prefer optional
} as const;

// Builds the flat config for package.json files.
const packageJson = ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/package-json/setup",
      plugins: { "package-json": pluginPackageJson },
    },
    {
      files: narrowFiles(packageJsonFiles, files),
      ignores: [...ignores],
      languageOptions: { parser: jsoncParser },
      name: "@cravingmaker/eslint-config/package-json/rules",
      plugins: { "enforce-package-type": pluginEnforcePackageType },
      rules: { ...packageJsonRules, ...overrides },
    },
  ];
};

export { packageJson };
