import type { Rules } from "../../../types.js";

// Static analysis: https://github.com/un-ts/eslint-plugin-import-x#rules
const recommendedRules: Rules = {
  // Enabled rules.
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
  "import-x/no-absolute-path": [
    "error",
    { amd: false, commonjs: true, esmodule: true, ignore: undefined },
  ],
  "import-x/no-dynamic-require": ["error", { esmodule: false }],
  "import-x/no-relative-packages": [
    "error",
    { amd: false, commonjs: false, esmodule: true, ignore: undefined },
  ],
  // Enabled rules.
  "import-x/no-self-import": "error",
  "import-x/no-useless-path-segments": [
    "error",
    { commonjs: false, noUselessIndex: false },
  ],

  // Turned off rules.
  "import-x/no-cycle": "off", // Prefer lightweight workflow, it's computationally expensive
  "import-x/no-internal-modules": "off", // Project specific
  "import-x/no-relative-parent-imports": "off", // Project specific
  "import-x/no-restricted-paths": "off", // Project specific
  "import-x/no-webpack-loader-syntax": "off", // Project specific, only target Webpack
} as const;

const staticAnalysisRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { staticAnalysisRules };
