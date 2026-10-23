import type { Rules } from "../../../../types.js";

// Helpful warnings: https://github.com/un-ts/eslint-plugin-import-x#rules.
const recommendedRules: Rules = {
  // --- Rules with default options (3/3) -----------------------------------------------------------------------------------------------------------.
  "import-x/export": "error",
  "import-x/no-named-as-default": "error",
  "import-x/no-named-as-default-member": "error",
} as const;

const otherRules: Rules = {
  // --- Rules with default options (5/6) -----------------------------------------------------------------------------------------------------------.
  "import-x/no-deprecated": "error",
  "import-x/no-empty-named-blocks": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "import-x/no-extraneous-dependencies": [
    "error",
    {
      bundledDependencies: true,
      devDependencies: true,
      includeInternal: false,
      includeTypes: false,
      optionalDependencies: true,
      packageDir: undefined,
      peerDependencies: true,
      whitelist: [],
    },
  ],
  "import-x/no-mutable-exports": "error",
  "import-x/no-rename-default": [
    "error",
    { commonjs: false, preventRenamingBindings: true },
  ],

  // --- Turned off rules (1/6) ---------------------------------------------------------------------------------------------------------------------.
  // Its schema requires an active export check whenever options are supplied.
  "import-x/no-unused-modules": "off", // Prefer flat config, it's only compatible with legacy configs.
} as const;

const helpfulWarningsRules: Rules = {
  ...recommendedRules, // 3/9 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 6/9 rules, 1 automatically fixable, 1 editor suggestions fixable.
} as const;

export { helpfulWarningsRules };
