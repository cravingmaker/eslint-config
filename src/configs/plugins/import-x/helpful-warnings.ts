import type { Rules } from "../../../types.js";

// Helpful warnings: https://github.com/un-ts/eslint-plugin-import-x#rules
const recommendedRules: Rules = {
  // Enabled rules.
  "import-x/export": "error",
  "import-x/no-named-as-default": "error",
  "import-x/no-named-as-default-member": "error",
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "import-x/no-deprecated": "error",
  "import-x/no-empty-named-blocks": "error",
  "import-x/no-extraneous-dependencies": [
    "error",
    {
      packageDir: undefined,

      bundledDependencies: true,
      devDependencies: true,
      includeInternal: false,
      includeTypes: false,
      optionalDependencies: true,
      peerDependencies: true,
      whitelist: [],
    },
  ],
  "import-x/no-mutable-exports": "error",
  "import-x/no-rename-default": [
    "error",
    { commonjs: false, preventRenamingBindings: true },
  ],

  // Turned off rules.
  // Its schema requires an active export check whenever options are supplied.
  "import-x/no-unused-modules": "off", // Prefer flat config, it's only compatible with legacy configs
} as const;

const helpfulWarningsRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { helpfulWarningsRules };
