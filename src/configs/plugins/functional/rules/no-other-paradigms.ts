import type { Rules } from "../../../../types.js";

// No Other Paradigms: https://github.com/eslint-functional/eslint-plugin-functional#rules.
const recommendedRules: Rules = {
  // --- Rules with default options (3/3) -----------------------------------------------------------------------------------------------------------.
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
  // --- Turned off rules (1/1) ---------------------------------------------------------------------------------------------------------------------.
  "functional/no-this-expressions": "off", // Project specific.
} as const;

const noOtherParadigmsRules: Rules = {
  ...recommendedRules, // 3/4 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 1/4 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { noOtherParadigmsRules };
