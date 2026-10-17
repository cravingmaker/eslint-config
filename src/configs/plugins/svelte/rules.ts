import type { Rules } from "../../../types.js";

import { bestPracticeRules } from "./best-practice.js";
import { stylisticIssuesRules } from "./stylistic-issues.js";

// Explicit policy grouped by the upstream rule categories.
const svelteRules: Rules = {
  ...stylisticIssuesRules,
  ...bestPracticeRules,
} as const;

export { svelteRules };
