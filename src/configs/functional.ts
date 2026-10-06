import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginFunctional from "eslint-plugin-functional";

import { javascriptFiles } from "../globs.js";
import { disableConfigRules, enableAllRules } from "../utilities/all-rules.js";

// Policy for eslint-plugin-functional, including the rules that need type information.
const functionalRules: Rules = {
  ...enableAllRules("functional", pluginFunctional.rules),

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

// The same policy with the rules that need type information turned off, as the plugin's
// `disableTypeChecked` config does.
const functionalUntypedRules: Rules = {
  ...functionalRules,
  ...disableConfigRules(
    "functional",
    pluginFunctional.rules,
    pluginFunctional.configs.disableTypeChecked.rules,
  ),
} as const;

// Builds the flat config for eslint-plugin-functional.
function functional({
  files = javascriptFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/functional/setup",
      plugins: { functional: pluginFunctional },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/functional/rules",
      rules: { ...functionalUntypedRules, ...overrides },
    },
  ];
}

export { functional, functionalRules, functionalUntypedRules };
