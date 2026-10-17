import type { Rules } from "../../../types.js";

// Possible Errors: https://ota-meshi.github.io/eslint-plugin-regexp/rules/
const recommendedRules: Rules = {
  // Enabled rules.
  "regexp/no-contradiction-with-assertion": "error",
  "regexp/no-dupe-disjunctions": [
    "error",
    {
      report: "trivial",
      reportExponentialBacktracking: "potential",
      reportUnreachable: "certain",
    },
  ],
  "regexp/no-empty-alternative": "error",
  "regexp/no-empty-capturing-group": "error",
  "regexp/no-empty-character-class": "error",
  "regexp/no-empty-group": "error",
  "regexp/no-empty-lookarounds-assertion": "error",
  "regexp/no-escape-backspace": "error",
  "regexp/no-invalid-regexp": "error",
  "regexp/no-lazy-ends": ["error", { ignorePartial: true }],
  "regexp/no-misleading-capturing-group": [
    "error",
    { reportBacktrackingEnds: true },
  ],
  "regexp/no-misleading-unicode-character": ["error", { fixable: false }],
  "regexp/no-missing-g-flag": ["error", { strictTypes: true }],
  "regexp/no-optional-assertion": "error",
  "regexp/no-potentially-useless-backreference": "error",
  "regexp/no-super-linear-backtracking": ["error", { report: "certain" }],
  "regexp/no-useless-assertions": "error",
  "regexp/no-useless-backreference": "error",
  "regexp/no-useless-dollar-replacements": "error",
  "regexp/strict": "error",
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "regexp/no-control-character": "error",
  "regexp/no-super-linear-move": [
    "error",
    { ignorePartial: true, ignoreSticky: true, report: "certain" },
  ],
} as const;

const possibleErrorsRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { possibleErrorsRules };
