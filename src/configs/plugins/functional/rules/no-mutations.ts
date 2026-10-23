import type { Rules } from "../../../../types.js";

// No Mutations: https://github.com/eslint-functional/eslint-plugin-functional#rules.
const noMutationsRules: Rules = {
  // --- Rules with default options (1/4) -----------------------------------------------------------------------------------------------------------.
  "functional/immutable-data": [
    "error",
    {
      ignoreAccessorPattern: undefined,
      ignoreClasses: false,
      ignoreIdentifierPattern: undefined,
      ignoreImmediateMutation: true,
      ignoreMapsAndSets: false,
      ignoreNonConstDeclarations: false,
      overrides: undefined,
    },
  ],

  // --- Rules with overridden options (3/4) --------------------------------------------------------------------------------------------------------.
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
      enforcement: "None",
      fixer: undefined,
      ignoreClasses: false,
      ignoreInferredTypes: true,
      ignoreNamePattern: undefined,
      ignoreTypePattern: undefined,
      overrides: undefined,
      parameters: {
        enforcement: "ReadonlyShallow",
      },
      returnTypes: undefined,
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
      variables: undefined,
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "functional/type-declaration-immutability": [
    "error",
    {
      ignoreIdentifierPattern: undefined,
      ignoreInterfaces: false,
      ignoreTypePattern: undefined,
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
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

export { noMutationsRules }; // 4 rules, 2 automatically fixable, 2 editor suggestions fixable.
