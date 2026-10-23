import type { Rules } from "../../../../types.js";

// Currying: https://github.com/eslint-functional/eslint-plugin-functional#rules.
const curryingRules: Rules = {
  // --- Rules with overridden options (1/1) --------------------------------------------------------------------------------------------------------.
  "functional/functional-parameters": [
    "error",
    {
      allowArgumentsKeyword: false,
      allowRestParameter: false,
      enforceParameterCount: {
        count: "atLeastOne",
        ignoreGettersAndSetters: true,
        ignoreIIFE: true,
        ignoreLambdaExpression: true,
      },
      ignoreIdentifierPattern: undefined,
      ignorePrefixSelector: undefined,
      overrides: undefined,
    },
  ],
} as const;

export { curryingRules }; // 1 rule, 0 automatically fixable, 0 editor suggestions fixable.
