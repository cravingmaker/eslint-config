import type { Rules } from "../../../../types.js";

// Static analysis: https://github.com/un-ts/eslint-plugin-import-x#rules.
const recommendedRules: Rules = {
  // --- Rules with default options (4/4) -----------------------------------------------------------------------------------------------------------.
  "import-x/default": "error",
  "import-x/named": ["error", { commonjs: false }],
  "import-x/namespace": ["error", { allowComputed: false }],
  "import-x/no-unresolved": [
    "error",
    {
      amd: false,
      caseSensitive: true,
      caseSensitiveStrict: false,
      commonjs: false,
      esmodule: true,
      ignore: undefined,
    },
  ],
} as const;

const otherRules: Rules = {
  // --- Rules with default options (5/10) ----------------------------------------------------------------------------------------------------------.
  "import-x/no-absolute-path": [
    "error",
    { amd: false, commonjs: true, esmodule: true, ignore: undefined },
  ], // Automatically fixable by the --fix command.
  "import-x/no-dynamic-require": ["error", { esmodule: false }],
  "import-x/no-relative-packages": [
    "error",
    { amd: false, commonjs: false, esmodule: true, ignore: undefined },
  ], // Automatically fixable by the --fix command.
  "import-x/no-self-import": "error",
  "import-x/no-useless-path-segments": [
    "error",
    { commonjs: false, noUselessIndex: false },
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (5/10) --------------------------------------------------------------------------------------------------------------------.
  "import-x/no-cycle": "off", // Prefer lightweight workflow, it's computationally expensive.
  "import-x/no-internal-modules": "off", // Project specific.
  "import-x/no-relative-parent-imports": "off", // Project specific.
  "import-x/no-restricted-paths": "off", // Project specific.
  "import-x/no-webpack-loader-syntax": "off", // Project specific, only target Webpack.
} as const;

const staticAnalysisRules: Rules = {
  ...recommendedRules, // 4/14 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 10/14 rules, 3 automatically fixable, 0 editor suggestions fixable.
} as const;

export { staticAnalysisRules };
