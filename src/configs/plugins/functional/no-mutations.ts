import type { Rules } from "../../../types.js";

// No Mutations: https://github.com/eslint-functional/eslint-plugin-functional#rules
const noMutationsRules: Rules = {
  // Enabled rules.
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
} as const;

export { noMutationsRules };
