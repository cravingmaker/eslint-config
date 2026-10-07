import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginPromise from "eslint-plugin-promise";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for eslint-plugin-promise.
const promiseRules: Rules = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- eslint-plugin-promise does not provide typed rule metadata
  ...enableAllRules("promise", pluginPromise.rules ?? {}),

  "promise/catch-or-return": [
    "error",
    {
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
      files: [
        ...(files ?? withSvelteComponents(sourceFiles, svelteComponents)),
      ],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/promise/rules",
      rules: { ...promiseRules, ...overrides },
    },
  ];
}

export { promise, promiseRules };
