import type { Rules } from "../../../../types.js";

const recommendedRules: Rules = {
  // --- Rules with default options (10/10) ---------------------------------------------------------------------------------------------------------.
  "package-json/require-attribution": [
    "error",
    {
      ignorePrivate: true,
      preferContributorsOnly: false,
    },
  ], // Manually fixable by editor suggestions.
  "package-json/require-description": ["error", { ignorePrivate: false }],
  "package-json/require-exports": ["error", { ignorePrivate: true }],
  "package-json/require-files": ["error", { ignorePrivate: true }],
  "package-json/require-license": ["error", { ignorePrivate: true }],
  "package-json/require-name": ["error", { ignorePrivate: true }],
  "package-json/require-repository": ["error", { ignorePrivate: true }],
  "package-json/require-sideEffects": ["error", { ignorePrivate: true }],
  "package-json/require-type": ["error", { ignorePrivate: false }], // Automatically fixable by the --fix command.
  "package-json/require-version": ["error", { ignorePrivate: true }],
} as const;

const otherRules: Rules = {
  // --- Rules with default options (12/31) ---------------------------------------------------------------------------------------------------------.
  "package-json/require-author": ["error", { ignorePrivate: false }], // Automatically fixable by the --fix command.
  "package-json/require-bugs": ["error", { ignorePrivate: true }],
  "package-json/require-devDependencies": ["error", { ignorePrivate: false }],
  "package-json/require-devEngines": ["error", { ignorePrivate: false }],
  "package-json/require-engines": ["error", { ignorePrivate: false }],
  "package-json/require-homepage": ["error", { ignorePrivate: true }],
  "package-json/require-keywords": ["error", { ignorePrivate: true }],
  "package-json/require-package-json-export": "error", // Manually fixable by editor suggestions.
  "package-json/require-peerDependenciesMeta": [
    "error",
    { ignorePrivate: false },
  ],
  "package-json/require-private": "error", // Automatically fixable by the --fix command.
  "package-json/require-scripts": ["error", { ignorePrivate: false }],
  "package-json/require-types": ["error", { ignorePrivate: true }],

  // --- Turned off rules (19/31) -------------------------------------------------------------------------------------------------------------------.
  "package-json/require-bin": "off", // Prefer to be optional.
  "package-json/require-browser": "off", // Prefer to be optional; only relevant to browser-targeted packages.
  "package-json/require-bundleDependencies": "off", // Prefer to be optional.
  "package-json/require-config": "off", // Prefer to be optional; npm config defaults are package-specific.
  "package-json/require-contributors": "off", // Prefer to be optional.
  "package-json/require-cpu": "off", // Prefer to be optional.
  "package-json/require-dependencies": "off", // Prefer to be optional.
  "package-json/require-directories": "off", // Prefer to be optional.
  "package-json/require-funding": "off", // Prefer to be optional.
  "package-json/require-gypfile": "off", // Prefer to be optional; only relevant to native addon packages.
  "package-json/require-libc": "off", // Prefer to be optional; only relevant to libc-specific packages.
  "package-json/require-main": "off", // Prefer to be optional.
  "package-json/require-man": "off", // Prefer to be optional.
  "package-json/require-module": "off", // Prefer to be optional.
  "package-json/require-optionalDependencies": "off", // Prefer to be optional.
  "package-json/require-os": "off", // Prefer to be optional.
  "package-json/require-packageManager": "off", // Prefer to be optional.
  "package-json/require-peerDependencies": "off", // Prefer to be optional.
  "package-json/require-publishConfig": "off", // Prefer to be optional.
} as const;

const requirePropertiesRules: Rules = {
  ...recommendedRules, // 10/41 rules, 1 automatically fixable, 1 editor suggestions fixable.
  ...otherRules, // 31/41 rules, 2 automatically fixable, 1 editor suggestions fixable.
} as const;

export { requirePropertiesRules };
