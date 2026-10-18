import type { Rules } from "../../../types.js";

import { bestPracticeRules } from "./rules/best-practice.js";
import { stylisticIssuesRules } from "./rules/stylistic-issues.js";

const svelteRules: Rules = {
  ...stylisticIssuesRules, // 1/10 rules, 1 automatically fixable, 0 editor suggestions fixable.
  ...bestPracticeRules, // 9/10 rules, 2 automatically fixable, 0 editor suggestions fixable.
} as const;

export { svelteRules };
