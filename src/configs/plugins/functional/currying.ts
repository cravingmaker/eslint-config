import type { Rules } from "../../../types.js";

// Currying: https://github.com/eslint-functional/eslint-plugin-functional#rules
const curryingRules: Rules = {
  // Enabled rules.
  "functional/functional-parameters": [
    "error",
    {
      ignoreIdentifierPattern: undefined,
      ignorePrefixSelector: undefined,
      overrides: undefined,

      allowArgumentsKeyword: false,
      allowRestParameter: false,
      enforceParameterCount: {
        count: "atLeastOne",
        ignoreGettersAndSetters: true,
        ignoreIIFE: true,
        ignoreLambdaExpression: true,
      },
    },
  ],
} as const;

export { curryingRules };
