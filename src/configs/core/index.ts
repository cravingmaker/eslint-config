import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../types.js";

import { defaultContext } from "../../context.js";
import { jsxFiles, sourceFiles, withSvelteComponents } from "../../globs.js";
import { supportedCoreRules } from "./rules.js";
import { internalPlugin } from "../../rules/index.js";
import { narrowFiles } from "../../utilities/file-scope.js";

/**
 * Builds the core source rules and JSX parser options, including supported Svelte scripts.
 */
const core = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { globals, svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      languageOptions: {
        ecmaVersion: "latest",
        globals: { ...globals },
        sourceType: "module",
      },
      name: "@cravingmaker/eslint-config/javascript/rules",
      plugins: { "@cravingmaker": internalPlugin },
      rules: {
        ...supportedCoreRules,
        ...overrides,
      },
    },
    {
      files: [...jsxFiles],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      name: "@cravingmaker/eslint-config/javascript/jsx",
    },
  ];
};

export { core };
