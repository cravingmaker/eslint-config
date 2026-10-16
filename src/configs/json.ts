import type { Linter } from "eslint";
import type { JsonOptions, Rules } from "../types.js";

import pluginJson from "@eslint/json";

import { json5Files, jsoncFiles, jsonFiles, jsonIgnores } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for @eslint/json, shared by JSON, JSONC, and JSON5 files.
const jsonRules: Rules = {
  "json/no-duplicate-keys": "error",
  "json/no-empty-keys": "error",
  "json/no-unnormalized-keys": ["error", { form: "NFC" }],
  "json/no-unsafe-values": "error",
  "json/top-level-interop": "error",

  "json/sort-keys": [
    "error",
    "asc",
    {
      minKeys: 2,

      allowLineSeparatedGroups: true,
      caseSensitive: false,
      natural: true,
    },
  ],
} as const;

// Builds the flat config for JSON, JSONC, and JSON5 files. `files` and `ignores` limit all three
// languages. `overrides` apply to JSON files; JSONC and JSON5 files have their own overrides. The
// JSON block leaves out the files of the JSONC block, some of which its own patterns match: the
// JSONC block sets most rules with a severity alone, which keeps the options that an earlier
// block gave them. The patterns that the JSON block leaves out by itself come after `ignores`:
// ESLint reads an ignore list in order, so a negated pattern brings back only what the patterns
// before it left out.
function json({
  files,
  ignores = [],
  overrides = {},
  overridesJson5 = {},
  overridesJsonc = {},
}: JsonOptions = {}): Linter.Config[] {
  return [
    {
      files: narrowFiles(jsonFiles, files),
      ignores: [...ignores, ...jsonIgnores, ...jsoncFiles],
      language: "json/json",
      name: "@cravingmaker/eslint-config/json/rules",
      plugins: { json: pluginJson },
      rules: { ...jsonRules, ...overrides },
    },
    {
      files: narrowFiles(jsoncFiles, files),
      ignores: [...ignores],
      language: "json/jsonc",
      name: "@cravingmaker/eslint-config/json/rules-jsonc",
      plugins: { json: pluginJson },
      rules: { ...jsonRules, ...overridesJsonc },
    },
    {
      files: narrowFiles(json5Files, files),
      ignores: [...ignores],
      language: "json/json5",
      name: "@cravingmaker/eslint-config/json/rules-json5",
      plugins: { json: pluginJson },
      rules: { ...jsonRules, ...overridesJson5 },
    },
  ];
}

export { json };
