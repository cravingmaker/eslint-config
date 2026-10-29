import type { Linter } from "eslint";

/**
 * Reports a disable directive or an inline config that changes no result as an error, so that an exception goes away with the code that needed it. A user config can set other `linterOptions`.
 */
const linterOptions: readonly Linter.Config[] = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
    name: "@cravingmaker/eslint-config/linter-options",
  },
];

export { linterOptions };
