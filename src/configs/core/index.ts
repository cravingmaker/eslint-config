import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../types.js";

import { defaultContext } from "../../context.js";
import { jsxFiles, sourceFiles, withSvelteComponents } from "../../globs.js";
import { supportedCoreRules } from "./rules.js";
import { narrowFiles } from "../../utilities/file-scope.js";

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
      rules: { ...supportedCoreRules, ...overrides },
    },
    {
      files: [...jsxFiles],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      name: "@cravingmaker/eslint-config/javascript/jsx",
    },
  ];
};

export { core };
