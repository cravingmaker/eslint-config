import type { Rules } from "../../../../types.js";

const recommendedRules: Rules = {
  // --- Rules with default options (7/7) ------------------------------------------------------------------------------------------------------------
  "package-json/no-empty-fields": ["error", { ignoreProperties: ["files"] }], // Manually fixable by editor suggestions.
  "package-json/no-redundant-files": "error", // Manually fixable by editor suggestions.
  "package-json/no-redundant-publishConfig": "error", // Manually fixable by editor suggestions.
  "package-json/repository-shorthand": ["error", { form: "object" }], // Automatically fixable by the --fix command.
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
  ], // Automatically fixable by the --fix command.
  "package-json/specify-peers-locally": "error", // Manually fixable by editor suggestions.
  "package-json/unique-dependencies": "error", // Manually fixable by editor suggestions.
} as const;

const additionalRules: Rules = {
  // --- Rules with default options (7/10) -----------------------------------------------------------------------------------------------------------
  "package-json/bin-name-casing": "error", // Manually fixable by editor suggestions.
  "package-json/exports-subpaths-style": ["error", { prefer: "explicit" }], // Automatically fixable by the --fix command.
  "package-json/no-local-dependencies": ["error", { ignorePrivate: true }],
  "package-json/order-properties": ["error", { order: "sort-package-json" }], // Automatically fixable by the --fix command.
  "package-json/prefer-rolling-workspace-spec": [
    "error",
    { ignoreDependencies: [], ignorePatterns: [] },
  ], // Manually fixable by editor suggestions.
  "package-json/restrict-private-properties": [
    "error",
    { blockedProperties: ["files", "publishConfig"] },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "package-json/scripts-name-casing": [
    "error",
    { ignoreNames: [], ignorePatterns: [] },
  ], // Manually fixable by editor suggestions.

  // --- Rules with overridden options (2/10) --------------------------------------------------------------------------------------------------------
  "package-json/restrict-dependency-ranges": [
    "error",
    {
      forDependencyTypes: ["dependencies", "devDependencies"],
      forPackages: undefined,
      forVersions: undefined,
      rangeType: "pin",
    },
  ], // Manually fixable by editor suggestions.
  "package-json/restrict-dist-tags": [
    "error",
    {
      allowed: ["latest", "dev", "next", "alpha", "beta", "canary", "rc"],
      allowedFor: undefined,
    },
  ],

  // --- Turned off rules (1/10) ---------------------------------------------------------------------------------------------------------------------
  "package-json/restrict-top-level-properties": "off", // Project specific. Manually fixable by editor suggestions.
} as const;

const otherRules: Rules = {
  ...recommendedRules, // 7/17 rules, 2 automatically fixable, 5 editor suggestions fixable.
  ...additionalRules, // 10/17 rules, 3 automatically fixable, 6 editor suggestions fixable.
} as const;

export { otherRules };
