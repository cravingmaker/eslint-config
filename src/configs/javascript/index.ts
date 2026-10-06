import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../../types.js";

import { defaultContext } from "../../context.js";
import { commonjsFiles, jsxFiles, sourceFiles } from "../../globs.js";
import { possibleProblemRules } from "./possible-problems.js";
import { suggestionRules } from "./suggestions.js";

// Policy for every non-deprecated ESLint core rule, shared by JavaScript and TypeScript files.
const javascriptRules: Rules = {
  ...possibleProblemRules,
  ...suggestionRules,
};

// Builds the flat config for ESLint's built-in rules on JavaScript and TypeScript files. JSX
// parses in `.jsx` files without any React plugin, and `.cjs` and `.cts` files are CommonJS.
function javascript(
  { files = sourceFiles, ignores = [], overrides = {} }: FeatureOptions = {},
  { globals }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      files: [...files],
      ignores: [...ignores],
      languageOptions: {
        ecmaVersion: "latest",
        globals: { ...globals },
        sourceType: "module",
      },
      name: "@cravingmaker/eslint-config/javascript/rules",
      rules: { ...javascriptRules, ...overrides },
    },
    {
      files: [...jsxFiles],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      name: "@cravingmaker/eslint-config/javascript/jsx",
    },
    {
      files: [...commonjsFiles],
      languageOptions: { sourceType: "commonjs" },
      name: "@cravingmaker/eslint-config/javascript/commonjs",
    },
  ];
}

export { javascript, javascriptRules };
