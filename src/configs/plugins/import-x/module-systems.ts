import type { Rules } from "../../../types.js";

// Module systems: https://github.com/un-ts/eslint-plugin-import-x#rules
const moduleSystemsRules: Rules = {
  "import-x/no-amd": "error",
  "import-x/no-commonjs": [
    "error",
    {
      allowConditionalRequire: false,
      allowPrimitiveModules: false,
      allowRequire: false,
    },
  ],
  // Enabled rules.
  "import-x/no-import-module-exports": ["error", { exceptions: [] }],
  "import-x/unambiguous": "error",

  // Turned off rules.
  "import-x/no-nodejs-modules": "off", // Prefer built-in Node.js modules
} as const;

export { moduleSystemsRules };
