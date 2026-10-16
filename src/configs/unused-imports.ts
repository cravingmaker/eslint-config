import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginUnusedImports from "eslint-plugin-unused-imports";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import {
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `no-unused-vars` rule name
  noUnusedVarsOptions,
} from "./shared-options.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for eslint-plugin-unused-imports.
const unusedImportsRules: Rules = {
  "unused-imports/no-unused-imports": [
    "error",
    {
      args: "after-used",
      argsIgnorePattern: undefined,
      caughtErrors: "all",
      caughtErrorsIgnorePattern: undefined,
      destructuredArrayIgnorePattern: undefined,
      enableAutofixRemoval: { imports: false },
      ignoreClassWithStaticInitBlock: false,
      ignoreRestSiblings: false,
      ignoreUsingDeclarations: false,
      reportUsedIgnorePattern: false,
      vars: "all",
      varsIgnorePattern: undefined,
    },
  ],

  "unused-imports/no-unused-vars": [
    "error",
    { enableAutofixRemoval: { imports: false }, ...noUnusedVarsOptions },
  ],
};

// Builds the flat config for eslint-plugin-unused-imports.
function unusedImports(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/unused-imports/setup",
      plugins: { "unused-imports": pluginUnusedImports },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/unused-imports/rules",
      rules: { ...unusedImportsRules, ...overrides },
    },
  ];
}

export { unusedImports, unusedImportsRules };
