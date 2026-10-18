import type { Rules } from "../../../types.js";

const recommendedRules: Rules = {
  // --- Rules with default options (9/10) ----------------------------------------------------------------------------------------------------------.
  "promise/always-return": [
    "error",
    { ignoreAssignmentVariable: ["globalThis"], ignoreLastCallback: false },
  ],
  "promise/no-callback-in-promise": [
    "error",
    { exceptions: [], timeoutsErr: false },
  ],
  "promise/no-nesting": "error",
  "promise/no-new-statics": "error", // Automatically fixable by the --fix command.
  "promise/no-promise-in-callback": ["error", { exemptDeclarations: false }],
  "promise/no-return-in-finally": "error",
  "promise/no-return-wrap": ["error", { allowReject: false }],
  "promise/param-names": [
    "error",
    { rejectPattern: "^_?reject$", resolvePattern: "^_?resolve$" },
  ],
  "promise/valid-params": ["error", { exclude: [] }],

  // --- Rules with overridden options (1/10) -------------------------------------------------------------------------------------------------------.
  "promise/catch-or-return": [
    "error",
    {
      allowThen: false,
      allowThenStrict: false,

      allowFinally: true,
      terminationMethod: "catch",
    },
  ],
} as const;

const otherRules: Rules = {
  // --- Rules with default options (6/7) -----------------------------------------------------------------------------------------------------------.
  "promise/avoid-new": "error",
  "promise/no-multiple-resolved": "error",
  "promise/prefer-await-to-callbacks": "error",
  "promise/prefer-await-to-then": ["error", { strict: false }],
  "promise/prefer-catch": "error", // Automatically fixable by the --fix command.
  "promise/spec-only": ["error", { allowedMethods: [] }],

  // --- Turned off rules (1/7) ---------------------------------------------------------------------------------------------------------------------.
  "promise/no-native": "off", // Prefer built-in Promise.
} as const;

const promiseRules: Rules = {
  ...recommendedRules, // 10/17 rules, 1 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 7/17 rules, 1 automatically fixable, 0 editor suggestions fixable.
} as const;

export { promiseRules };
