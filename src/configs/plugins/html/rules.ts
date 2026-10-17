import type { Rules } from "../../../types.js";

import { accessibilityRules } from "./accessibility.js";
import { bestPracticeRules } from "./best-practice.js";
import { seoRules } from "./seo.js";
import { styleRules } from "./style.js";

// Explicit policy grouped by the upstream rule categories.
const htmlRules: Rules = {
  ...bestPracticeRules,
  ...styleRules,
  ...accessibilityRules,
  ...seoRules,
} as const;

export { htmlRules };
