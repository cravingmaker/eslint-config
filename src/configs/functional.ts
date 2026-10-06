import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginFunctional from "eslint-plugin-functional";

import { defaultContext } from "../context.js";
import { sourceFiles } from "../globs.js";
import { disableConfigRules, enableAllRules } from "../utilities/all-rules.js";
import { typeAwareConfig } from "../utilities/type-aware.js";

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
  // Shallow, because the plugin caches immutability per generic type for the whole ESLint
  // process: a deeper check of `readonly T[]` or `Readonly<T>` reuses the `T` linted first.
  "functional/prefer-immutable-types": [
    "error",
    {
      enforcement: "None",
      ignoreInferredTypes: true,
      parameters: {
        enforcement: "ReadonlyShallow",
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

// The rules that need type information, off as in the plugin's `disableTypeChecked` config.
const typeAwareRulesOff = disableConfigRules(
  "functional",
  pluginFunctional.rules,
  pluginFunctional.configs.disableTypeChecked.rules,
);
// The policy for the rules that need type information.
const typeAwareRules: Rules = Object.fromEntries(
  Object.entries(functionalRules).filter(([ruleId]) =>
    Object.hasOwn(typeAwareRulesOff, ruleId),
  ),
);

// Builds the flat config for eslint-plugin-functional. The rules that need type information
// are off, and turned on again for the type-aware scope when typed linting is on.
function functional(
  options: FeatureOptions = {},
  { typeAware }: Context = defaultContext,
): Linter.Config[] {
  const { files = sourceFiles, ignores = [], overrides = {} } = options;

  return [
    {
      name: "@cravingmaker/eslint-config/functional/setup",
      plugins: { functional: pluginFunctional },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/functional/rules",
      rules: { ...functionalRules, ...typeAwareRulesOff, ...overrides },
    },
    ...(typeAware === undefined
      ? []
      : [
          typeAwareConfig("functional", typeAware, options, {
            ...typeAwareRules,
            ...overrides,
          }),
        ]),
  ];
}

export { functional };
