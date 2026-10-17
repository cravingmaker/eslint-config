import type { Rules } from "../../../types.js";

import { bestPracticesRules } from "./best-practices.js";
import { possibleErrorsRules } from "./possible-errors.js";
import { stylisticIssuesRules } from "./stylistic-issues.js";

// Explicit policy grouped by the upstream rule categories.
const regexpRules: Rules = {
  ...bestPracticesRules,
  ...stylisticIssuesRules,
  ...possibleErrorsRules,
} as const;

export { regexpRules };
