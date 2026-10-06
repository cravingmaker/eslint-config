import type { Rules } from "../../types.js";

import eslintPluginFunctional from "eslint-plugin-functional";

import {
  getPluginConfigRules,
  getPluginRules,
} from "../../utilities/plugin-rules.js";

const functionalTypeCheckedEslintRules: Rules = {
  ...getPluginRules("functional", eslintPluginFunctional.rules),

  "functional/functional-parameters": [
    "error",
    { enforceParameterCount: { ignoreLambdaExpression: true } },
  ],
  "functional/no-conditional-statements": [
    "error",
    { allowReturningBranches: true },
  ],
  "functional/no-expression-statements": ["error", { ignoreVoid: true }],
  "functional/no-let": ["error", { allowInForLoopInit: true }],
  "functional/prefer-immutable-types": [
    "error",
    {
      enforcement: "None",
      ignoreInferredTypes: true,
      parameters: {
        enforcement: "ReadonlyDeep",
      },
    },
  ],
  "functional/readonly-type": ["error", "keyword"],
  "functional/type-declaration-immutability": [
    "error",
    {
      rules: [
        {
          comparator: "AtLeast",
          identifiers: "I?Immutable.+",
          immutability: "Immutable",
        },
        {
          comparator: "AtLeast",
          identifiers: "I?ReadonlyDeep.+",
          immutability: "ReadonlyDeep",
        },
        {
          comparator: "AtLeast",
          fixer: [
            {
              pattern: "^(Array|Map|Set)<(.+)>$",
              replace: "Readonly$1<$2>",
            },
            {
              pattern: "^(.+)$",
              replace: "Readonly<$1>",
            },
          ],
          identifiers: "I?Readonly.+",
          immutability: "ReadonlyShallow",
        },
        {
          comparator: "AtMost",
          fixer: [
            {
              pattern: "^Readonly(Array|Map|Set)<(.+)>$",
              replace: "$1<$2>",
            },
            {
              pattern: "^Readonly<(.+)>$",
              replace: "$1",
            },
          ],
          identifiers: "I?Mutable.+",
          immutability: "Mutable",
        },
      ],
    },
  ],

  "functional/no-this-expressions": "off", // Project specific

  "functional/no-try-statements": "off", // Prefer try statements
} as const;

const functionalEslintRules: Rules = {
  ...functionalTypeCheckedEslintRules,
  ...getPluginConfigRules(
    "functional",
    eslintPluginFunctional.rules,
    eslintPluginFunctional.configs.disableTypeChecked.rules,
  ),
} as const;

export { functionalEslintRules, functionalTypeCheckedEslintRules };
