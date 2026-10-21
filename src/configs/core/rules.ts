import type { Rules } from "../../types.js";

import { builtinRules } from "eslint/use-at-your-own-risk";

import { layoutAndFormattingRules } from "./rules/layout-and-formatting.js";
import { possibleProblemRules } from "./rules/possible-problems.js";
import { suggestionRules } from "./rules/suggestions.js";
import { supportedRuleOptions } from "../../utilities/plugin-policy.js";

const coreRules: Rules = {
  ...possibleProblemRules, // 59/200 rules, 0 automatically fixable, 10 editor suggestions fixable.
  ...suggestionRules, // 139/200 rules, 37 automatically fixable, 19 editor suggestions fixable.
  ...layoutAndFormattingRules, // 1/200 rules, 1 automatically fixable, 0 editor suggestions fixable.
  "@cravingmaker/prefer-arrow-functions": "error", // Internal policy: 1/200 rules, no automatic fixes or editor suggestions.
} as const;

// Earlier supported ESLint versions can predate a declared option.
const supportedCoreRules: Rules = Object.fromEntries(
  Object.entries(coreRules).map(([id, entry]) => {
    return [
      id,
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Read the host rule's schema to preserve the supported ESLint peer range.
      supportedRuleOptions(entry, builtinRules.get(id)),
    ];
  }),
);

export { supportedCoreRules };
