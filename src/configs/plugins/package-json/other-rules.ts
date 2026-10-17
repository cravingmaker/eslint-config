import type { Rules } from "../../../types.js";

// General package.json rules and the module-type rule: https://github.com/michaelfaith/eslint-plugin-package-json#supported-rules
const recommendedRules: Rules = {
  // Enabled rules.
  "package-json/no-empty-fields": ["error", { ignoreProperties: ["files"] }],
  "package-json/no-redundant-files": "error",
  "package-json/no-redundant-publishConfig": "error",
  "package-json/repository-shorthand": ["error", { form: "object" }],
  "package-json/require-attribution": [
    "error",
    { ignorePrivate: true, preferContributorsOnly: false },
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
} as const;

const additionalRules: Rules = {
  // Enabled rules.
  "enforce-package-type/enforce-package-type": [
    "error",
    { enforceType: "module" },
  ],
  "package-json/bin-name-casing": "error",
  "package-json/exports-subpaths-style": ["error", { prefer: "explicit" }],
  "package-json/no-local-dependencies": ["error", { ignorePrivate: true }],
  "package-json/order-properties": ["error", { order: "sort-package-json" }],
  "package-json/prefer-rolling-workspace-spec": [
    "error",
    { ignoreDependencies: [], ignorePatterns: [] },
  ],
  "package-json/restrict-dependency-ranges": [
    "error",
    {
      forPackages: undefined,
      forVersions: undefined,

      forDependencyTypes: ["dependencies", "devDependencies"],
      rangeType: "pin",
    },
  ],
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

  // Turned off rules.
  "package-json/restrict-top-level-properties": "off", // Project specific
} as const;

const otherRules: Rules = {
  ...recommendedRules,
  ...additionalRules,
} as const;

export { otherRules };
