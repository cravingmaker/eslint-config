import type { Rules } from "../../../types.js";

import { otherRules } from "./rules/other.js";
import { recommendedRules } from "./rules/recommended.js";

const unicornRules: Rules = {
  ...recommendedRules, // 338/374 rules, 198 automatically fixable, 136 editor suggestions fixable.
  ...otherRules, // 36/374 rules, 19 automatically fixable, 11 editor suggestions fixable.
} as const;

export { unicornRules };
