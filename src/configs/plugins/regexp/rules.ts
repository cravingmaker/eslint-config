import type { Rules } from "../../../types.js";

import { bestPracticesRules } from "./rules/best-practices.js";
import { possibleErrorsRules } from "./rules/possible-errors.js";
import { stylisticIssuesRules } from "./rules/stylistic-issues.js";

const regexpRules: Rules = {
  ...bestPracticesRules, // 38/82 rules, 27 automatically fixable, 5 editor suggestions fixable.
  ...stylisticIssuesRules, // 22/82 rules, 20 automatically fixable, 0 editor suggestions fixable.
  ...possibleErrorsRules, // 22/82 rules, 4 automatically fixable, 10 editor suggestions fixable.
} as const;

export { regexpRules };
