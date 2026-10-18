import type { Rules } from "../../../types.js";

import { bestPracticesRules } from "./rules/best-practices.js";
import { stylisticIssuesRules } from "./rules/stylistic-issues.js";

const commentsRules: Rules = {
  ...bestPracticesRules, // 5/8 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...stylisticIssuesRules, // 3/8 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { commentsRules };
