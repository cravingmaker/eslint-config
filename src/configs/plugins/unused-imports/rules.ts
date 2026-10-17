import type { Rules } from "../../../types.js";

import {
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `no-unused-vars` rule name
  noUnusedVarsOptions,
} from "../../shared-options.js";

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

export { unusedImportsRules };
