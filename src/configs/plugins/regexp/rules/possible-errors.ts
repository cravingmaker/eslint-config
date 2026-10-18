import type { Rules } from "../../../../types.js";

// Possible Errors: https://ota-meshi.github.io/eslint-plugin-regexp/rules/.
const recommendedRules: Rules = {
  // --- Rules with default options (20/20) ---------------------------------------------------------------------------------------------------------.
  "regexp/no-contradiction-with-assertion": "error", // Manually fixable by editor suggestions.
  "regexp/no-dupe-disjunctions": [
    "error",
    {
      report: "trivial",
      reportExponentialBacktracking: "potential",
      reportUnreachable: "certain",
    },
  ], // Manually fixable by editor suggestions.
  "regexp/no-empty-alternative": "error", // Manually fixable by editor suggestions.
  "regexp/no-empty-capturing-group": "error",
  "regexp/no-empty-character-class": "error",
  "regexp/no-empty-group": "error",
  "regexp/no-empty-lookarounds-assertion": "error",
  "regexp/no-escape-backspace": "error", // Manually fixable by editor suggestions.
  "regexp/no-invalid-regexp": "error",
  "regexp/no-lazy-ends": ["error", { ignorePartial: true }], // Manually fixable by editor suggestions.
  "regexp/no-misleading-capturing-group": [
    "error",
    { reportBacktrackingEnds: true },
  ], // Manually fixable by editor suggestions.
  "regexp/no-misleading-unicode-character": ["error", { fixable: false }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "regexp/no-missing-g-flag": ["error", { strictTypes: true }], // Automatically fixable by the --fix command.
  "regexp/no-optional-assertion": "error",
  "regexp/no-potentially-useless-backreference": "error",
  "regexp/no-super-linear-backtracking": ["error", { report: "certain" }], // Automatically fixable by the --fix command.
  "regexp/no-useless-assertions": "error", // Manually fixable by editor suggestions.
  "regexp/no-useless-backreference": "error",
  "regexp/no-useless-dollar-replacements": "error",
  "regexp/strict": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (2/2) -----------------------------------------------------------------------------------------------------------.
  "regexp/no-control-character": "error", // Manually fixable by editor suggestions.
  "regexp/no-super-linear-move": [
    "error",
    { ignorePartial: true, ignoreSticky: true, report: "certain" },
  ],
} as const;

const possibleErrorsRules: Rules = {
  ...recommendedRules, // 20/22 rules, 4 automatically fixable, 9 editor suggestions fixable.
  ...otherRules, // 2/22 rules, 0 automatically fixable, 1 editor suggestions fixable.
} as const;

export { possibleErrorsRules };
