import type { Rules } from "../../../types.js";

// No Other Paradigms: https://github.com/eslint-functional/eslint-plugin-functional#rules
const recommendedRules: Rules = {
  // Enabled rules.
  "functional/no-class-inheritance": [
    "error",
    { ignoreCodePattern: undefined, ignoreIdentifierPattern: undefined },
  ],
  "functional/no-classes": [
    "error",
    { ignoreCodePattern: undefined, ignoreIdentifierPattern: undefined },
  ],
  "functional/no-mixed-types": [
    "error",
    { checkInterfaces: true, checkTypeLiterals: true },
  ],
} as const;

const otherRules: Rules = {
  // Turned off rules.
  "functional/no-this-expressions": "off", // Project specific
} as const;

const noOtherParadigmsRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { noOtherParadigmsRules };
