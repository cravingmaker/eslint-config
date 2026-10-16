import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginPromise from "eslint-plugin-promise";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for eslint-plugin-promise.
const promiseRules: Rules = {
  "promise/always-return": [
    "error",
    { ignoreAssignmentVariable: ["globalThis"], ignoreLastCallback: false },
  ],
  "promise/avoid-new": "error",
  "promise/no-callback-in-promise": [
    "error",
    { exceptions: [], timeoutsErr: false },
  ],
  "promise/no-multiple-resolved": "error",
  "promise/no-nesting": "error",
  "promise/no-new-statics": "error",
  "promise/no-promise-in-callback": ["error", { exemptDeclarations: false }],
  "promise/no-return-in-finally": "error",
  "promise/no-return-wrap": ["error", { allowReject: false }],
  "promise/param-names": [
    "error",
    { rejectPattern: "^_?reject$", resolvePattern: "^_?resolve$" },
  ],
  "promise/prefer-await-to-callbacks": "error",
  "promise/prefer-await-to-then": ["error", { strict: false }],
  "promise/prefer-catch": "error",
  "promise/spec-only": ["error", { allowedMethods: [] }],
  "promise/valid-params": ["error", { exclude: [] }],

  "promise/catch-or-return": [
    "error",
    {
      allowThen: false,
      allowThenStrict: false,

      allowFinally: true,
      terminationMethod: "catch",
    },
  ],

  "promise/no-native": "off", // Prefer built-in Promise
} as const;

// Builds the flat config for eslint-plugin-promise.
function promise(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/promise/setup",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types
        promise: pluginPromise,
      },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/promise/rules",
      rules: { ...promiseRules, ...overrides },
    },
  ];
}

export { promise, promiseRules };
