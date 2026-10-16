import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../../types.js";

import { builtinRules } from "eslint/use-at-your-own-risk";

import { defaultContext } from "../../context.js";
import { jsxFiles, sourceFiles, withSvelteComponents } from "../../globs.js";
import { possibleProblemRules } from "./possible-problems.js";
import { suggestionRules } from "./suggestions.js";
import { narrowFiles } from "../../utilities/file-scope.js";
import { supportedRuleOptions } from "../../utilities/plugin-policy.js";

// Policy for every non-deprecated ESLint core rule, shared by JavaScript and TypeScript files.
const coreRules: Rules = {
  ...possibleProblemRules,
  ...suggestionRules,
};
// Earlier supported ESLint versions can predate a declared option.
const supportedCoreRules: Rules = Object.fromEntries(
  Object.entries(coreRules).map(([id, entry]) => [
    id,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Read the host rule's schema to preserve the supported ESLint peer range.
    supportedRuleOptions(entry, builtinRules.get(id)),
  ]),
);

// Builds the flat config of the `javascript` feature: ESLint's built-in rules on JavaScript and
// TypeScript files, which are ES modules, and on the scripts of Svelte components. JSX parses in
// `.jsx` files without any React plugin.
function core(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { globals, svelteComponents }: Context = defaultContext,
): Linter.Config[] {
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
}

export { core, coreRules };
