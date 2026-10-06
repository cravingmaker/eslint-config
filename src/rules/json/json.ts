import type { Linter } from "eslint";

import eslintPluginJson from "@eslint/json";

import { getPluginRules } from "../../utilities/plugin-rules.js";

const jsonEslintRules: Linter.RulesRecord = {
  ...getPluginRules("json", eslintPluginJson.rules),

  "json/sort-keys": [
    "error",
    "asc",
    {
      allowLineSeparatedGroups: true,
      caseSensitive: false,
      natural: true,
    },
  ],
} as const;

export { jsonEslintRules };
