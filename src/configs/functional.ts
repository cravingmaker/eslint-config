import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginFunctional from "eslint-plugin-functional";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";
import {
  overridesWithoutTypeInformation,
  typeAwareConfig,
} from "../utilities/type-aware.js";

// Policy for eslint-plugin-functional, including the rules that need type information.
const functionalRules: Rules = {
  "functional/immutable-data": [
    "error",
    {
      ignoreAccessorPattern: undefined,
      ignoreIdentifierPattern: undefined,
      overrides: undefined,

      ignoreClasses: false,
      ignoreImmediateMutation: true,
      ignoreMapsAndSets: false,
      ignoreNonConstDeclarations: false,
    },
  ],
  "functional/no-class-inheritance": [
    "error",
    { ignoreCodePattern: undefined, ignoreIdentifierPattern: undefined },
  ],
  "functional/no-classes": [
    "error",
    { ignoreCodePattern: undefined, ignoreIdentifierPattern: undefined },
  ],
  "functional/no-loop-statements": "error",
  "functional/no-mixed-types": [
    "error",
    { checkInterfaces: true, checkTypeLiterals: true },
  ],
  "functional/no-promise-reject": "error",
  "functional/no-return-void": [
    "error",
    { allowNull: true, allowUndefined: true, ignoreInferredTypes: false },
  ],
  "functional/no-throw-statements": ["error", { allowToRejectPromises: false }],
  "functional/prefer-property-signatures": [
    "error",
    { ignoreIfReadonlyWrapped: false },
  ],
  "functional/prefer-tacit": ["error", { checkMemberExpressions: false }],

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
  "functional/no-conditional-statements": [
    "error",
    { allowReturningBranches: true, ignoreCodePattern: undefined },
  ],
  "functional/no-expression-statements": [
    "error",
    {
      ignoreCodePattern: undefined,
      ignoreSelfReturning: false,
      ignoreVoid: true,
    },
  ],
  "functional/no-let": [
    "error",
    {
      allowInForLoopInit: true,
      allowInFunctions: false,
      ignoreIdentifierPattern: undefined,
    },
  ],
  // Shallow, because the plugin caches immutability per generic type for the whole ESLint
  // process: a deeper check of `readonly T[]` or `Readonly<T>` reuses the `T` linted first.
  "functional/prefer-immutable-types": [
    "error",
    {
      fixer: undefined,
      ignoreNamePattern: undefined,
      ignoreTypePattern: undefined,
      overrides: undefined,
      returnTypes: undefined,
      variables: undefined,

      ignoreClasses: false,
      suggestions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- The rule schema names immutability levels in PascalCase.
        ReadonlyShallow: [
          [
            {
              message: "Prepend with readonly.",
              pattern: String.raw`^([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\[\])$`,
              replace: "readonly $1",
            },
            {
              message: "Use Readonly$1 instead of $1.",
              pattern: "^(Array|Map|Set)<(.+)>$",
              replace: "Readonly$1<$2>",
            },
          ],
          [
            {
              message: "Surround with Readonly.",
              pattern: "^(.+)$",
              replace: "Readonly<$1>",
            },
          ],
        ],
      },

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
      ignoreIdentifierPattern: undefined,
      ignoreTypePattern: undefined,

      ignoreInterfaces: false,

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

  "functional/no-try-statements": [
    "off",
    { allowCatch: false, allowFinally: false },
  ], // Prefer try statements
} as const;

// Rules requiring type information stay off outside typed linting.
const typeAwareRulesOff: Rules = {
  "functional/functional-parameters": "off",
  "functional/immutable-data": "off",
  "functional/no-conditional-statements": "off",
  "functional/no-expression-statements": "off",
  "functional/no-mixed-types": "off",
  "functional/no-return-void": "off",
  "functional/no-throw-statements": "off",
  "functional/prefer-immutable-types": "off",
  "functional/prefer-property-signatures": "off",
  "functional/prefer-tacit": "off",
  "functional/readonly-type": "off",
  "functional/type-declaration-immutability": "off",
};
const typeAwareRuleIds = [
  ...Object.keys(typeAwareRulesOff),
  // A consumer can still override this deprecated rule; it also needs typed scope.
  "functional/prefer-readonly-type",
];
// The policy for the rules that need type information.
const typeAwareRules: Rules = Object.fromEntries(
  Object.entries(functionalRules).filter(([ruleId]) =>
    Object.hasOwn(typeAwareRulesOff, ruleId),
  ),
);

// Builds the flat config for eslint-plugin-functional. The rules that need type information
// are off, and turned on again for the type-aware scope when typed linting is on. An override
// that turns such a rule on applies in that scope only.
function functional(
  options: FeatureOptions = {},
  { svelteComponents, typeAware }: Context = defaultContext,
): Linter.Config[] {
  const { files, ignores = [], overrides = {} } = options;

  return [
    {
      name: "@cravingmaker/eslint-config/functional/setup",
      plugins: { functional: pluginFunctional },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/functional/rules",
      rules: {
        ...functionalRules,
        ...typeAwareRulesOff,
        ...overridesWithoutTypeInformation(overrides, typeAwareRuleIds),
      },
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
