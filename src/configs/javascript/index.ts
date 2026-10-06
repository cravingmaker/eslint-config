import type { Linter } from "eslint";

import { javascriptFiles } from "../../globs.js";
import { possibleProblemRules } from "./possible-problems.js";
import { suggestionRules } from "./suggestions.js";

type JavaScriptOptions = {
  // File patterns for this feature, relative to the ESLint configuration.
  readonly files?: readonly string[];
  // Globals available to the matched files.
  readonly globals?: Readonly<Linter.Globals>;
  // Exclude files from this feature without adding global ignores.
  readonly ignores?: readonly string[];
  // Rule overrides applied after the core rule policy.
  readonly overrides?: Readonly<Linter.RulesRecord>;
};

// Policy for every non-deprecated ESLint core rule, shared by JavaScript and TypeScript files.
const javascriptRules: Linter.RulesRecord = {
  ...possibleProblemRules,
  ...suggestionRules,
};

// Builds the flat config for ESLint's built-in rules on JavaScript files.
function javascript({
  files = javascriptFiles,
  globals = {},
  ignores = [],
  overrides = {},
}: JavaScriptOptions = {}): Linter.Config[] {
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
  ];
}

export { javascript, javascriptRules };
export type { JavaScriptOptions };
