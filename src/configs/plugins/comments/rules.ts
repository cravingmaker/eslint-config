import type { Rules } from "../../../types.js";

import { bestPracticesRules } from "./best-practices.js";
import { stylisticIssuesRules } from "./stylistic-issues.js";

// Explicit policy grouped by the upstream rule categories.
const commentsRules: Rules = {
  ...bestPracticesRules,
  ...stylisticIssuesRules,
} as const;

export { commentsRules };
