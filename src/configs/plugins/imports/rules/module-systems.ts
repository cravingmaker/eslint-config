import type { Rules } from "../../../../types.js";

// Module systems: https://github.com/un-ts/eslint-plugin-import-x#rules.
const moduleSystemsRules: Rules = {
  // --- Rules with default options (4/5) -----------------------------------------------------------------------------------------------------------.
  "import-x/no-amd": "error",
  "import-x/no-commonjs": [
    "error",
    {
      allowConditionalRequire: false,
      allowPrimitiveModules: false,
      allowRequire: false,
    },
  ],
  "import-x/no-import-module-exports": ["error", { exceptions: [] }], // Automatically fixable by the --fix command.
  "import-x/unambiguous": "error",

  // --- Turned off rules (1/5) ---------------------------------------------------------------------------------------------------------------------.
  "import-x/no-nodejs-modules": "off", // Prefer built-in Node.js modules.
} as const;

export { moduleSystemsRules }; // 5 rules, 1 automatically fixable, 0 editor suggestions fixable.
