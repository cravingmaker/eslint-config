import type { ESLint } from "eslint";

import { preferArrowFunctions } from "./prefer-arrow-functions.js";
import { starredDocumentation } from "./starred-documentation.js";
import { svelteFunctionVariablePadding } from "./svelte-function-variable-padding.js";

const internalPlugin: ESLint.Plugin = {
  meta: { name: "@cravingmaker/eslint-config/internal" },
  rules: {
    "prefer-arrow-functions": preferArrowFunctions,
    "starred-documentation": starredDocumentation,
    "svelte-function-variable-padding": svelteFunctionVariablePadding,
  },
};

export { internalPlugin };
