import type { Rules } from "../../../types.js";

import { otherRules } from "./rules/other.js";
import { recommendedRules } from "./rules/recommended.js";

const unicornRules: Rules = {
  ...recommendedRules, // 338/375 rules, 198 automatically fixable, 136 editor suggestions fixable.
  ...otherRules, // 36/375 rules, 19 automatically fixable, 11 editor suggestions fixable.
  "@cravingmaker/starred-documentation": "error", // Internal policy: 1/375 rules, 1 automatically fixable, 0 editor suggestions fixable.
} as const;

export { unicornRules };
