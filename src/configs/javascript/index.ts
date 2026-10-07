import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../../types.js";

import { defaultContext } from "../../context.js";
import { jsxFiles, sourceFiles, withSvelteComponents } from "../../globs.js";
import { possibleProblemRules } from "./possible-problems.js";
import { suggestionRules } from "./suggestions.js";

// Policy for every non-deprecated ESLint core rule, shared by JavaScript and TypeScript files.
const javascriptRules: Rules = {
  ...possibleProblemRules,
  ...suggestionRules,
};

// Builds the flat config for ESLint's built-in rules on JavaScript and TypeScript files, which
// are ES modules, and on the scripts of Svelte components. JSX parses in `.jsx` files without any
// React plugin.
function javascript(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { globals, svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      files: [
        ...(files ?? withSvelteComponents(sourceFiles, svelteComponents)),
      ],
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
  ];
}

export { javascript, javascriptRules };
