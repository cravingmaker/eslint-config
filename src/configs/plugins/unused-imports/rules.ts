import type { Rules } from "../../../types.js";

const unusedImportsRules: Rules = {
  // --- Rules with default options (1/2) -----------------------------------------------------------------------------------------------------------.
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
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.

  // --- Rules with overridden options (1/2) --------------------------------------------------------------------------------------------------------.
  "unused-imports/no-unused-vars": [
    "error",
    {
      args: "after-used",
      argsIgnorePattern: "^_",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      enableAutofixRemoval: { imports: false },
      ignoreClassWithStaticInitBlock: false,
      ignoreRestSiblings: true,
      ignoreUsingDeclarations: false,
      reportUsedIgnorePattern: false,
      vars: "all",
      varsIgnorePattern: "^_",
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

export { unusedImportsRules }; // 2 rules, 2 automatically fixable, 2 editor suggestions fixable.
