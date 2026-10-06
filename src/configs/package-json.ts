import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginEnforcePackageType from "eslint-enforce-package-type";
import pluginPackageJson from "eslint-plugin-package-json";
import * as jsoncParser from "jsonc-eslint-parser";

import { packageJsonFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for package.json files, from eslint-plugin-package-json and eslint-enforce-package-type.
const packageJsonRules: Rules = {
  ...enableAllRules("package-json", pluginPackageJson.rules),

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
function packageJson({
  files = packageJsonFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/package-json/setup",
      plugins: { "package-json": pluginPackageJson },
    },
    {
      files: [...files],
      ignores: [...ignores],
      languageOptions: { parser: jsoncParser },
      name: "@cravingmaker/eslint-config/package-json/rules",
      plugins: { "enforce-package-type": pluginEnforcePackageType },
      rules: { ...packageJsonRules, ...overrides },
    },
  ];
}

export { packageJson };
