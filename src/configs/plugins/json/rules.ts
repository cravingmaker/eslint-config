import type { Rules } from "../../../types.js";

const recommendedRules: Rules = {
  // --- Rules with default options (4/4) -----------------------------------------------------------------------------------------------------------.
  "json/no-duplicate-keys": "error",
  "json/no-empty-keys": "error",
  "json/no-unnormalized-keys": ["error", { form: "NFC" }], // Automatically fixable by the --fix command.
  "json/no-unsafe-values": "error",
} as const;

const otherRules: Rules = {
  // --- Rules with default options (1/2) -----------------------------------------------------------------------------------------------------------.
  "json/top-level-interop": "error",

  // --- Rules with overridden options (1/2) --------------------------------------------------------------------------------------------------------.
  "json/sort-keys": [
    "error",
    "asc",
    {
      minKeys: 2,

      allowLineSeparatedGroups: true,
      caseSensitive: false,
      natural: true,
    },
  ], // Automatically fixable by the --fix command.
} as const;

const jsonRules: Rules = {
  ...recommendedRules, // 4/6 rules, 1 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 2/6 rules, 1 automatically fixable, 0 editor suggestions fixable.
} as const;

export { jsonRules };
