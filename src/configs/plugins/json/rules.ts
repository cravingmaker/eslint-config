import type { Rules } from "../../../types.js";

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

export { jsonRules };
