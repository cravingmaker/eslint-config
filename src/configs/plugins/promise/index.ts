import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginPromise from "eslint-plugin-promise";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { promiseRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for eslint-plugin-promise.
const promise = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/promise/setup",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types.
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
};

export { promise };
