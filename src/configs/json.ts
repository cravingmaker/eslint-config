import type { Linter } from "eslint";
import type { JsonOptions, Rules } from "../types.js";

import pluginJson from "@eslint/json";

import { json5Files, jsoncFiles, jsonFiles, jsonIgnores } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for @eslint/json, shared by JSON, JSONC, and JSON5 files.
const jsonRules: Rules = {
  ...enableAllRules("json", pluginJson.rules),

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

// Builds the flat config for JSON, JSONC, and JSON5 files. `files` and `overrides` apply to
// JSON files; JSONC and JSON5 files have their own overrides.
function json({
  files = jsonFiles,
  ignores = [],
  overrides = {},
  overridesJson5 = {},
  overridesJsonc = {},
}: JsonOptions = {}): Linter.Config[] {
  return [
    {
      files: [...files],
      ignores: [...jsonIgnores, ...ignores],
      language: "json/json",
      name: "@cravingmaker/eslint-config/json/rules",
      plugins: { json: pluginJson },
      rules: { ...jsonRules, ...overrides },
    },
    {
      files: [...jsoncFiles],
      ignores: [...ignores],
      language: "json/jsonc",
      name: "@cravingmaker/eslint-config/json/rules-jsonc",
      plugins: { json: pluginJson },
      rules: { ...jsonRules, ...overridesJsonc },
    },
    {
      files: [...json5Files],
      ignores: [...ignores],
      language: "json/json5",
      name: "@cravingmaker/eslint-config/json/rules-json5",
      plugins: { json: pluginJson },
      rules: { ...jsonRules, ...overridesJson5 },
    },
  ];
}

export { json };
