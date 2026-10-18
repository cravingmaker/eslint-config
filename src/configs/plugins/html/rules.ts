import type { Rules } from "../../../types.js";

import { accessibilityRules } from "./rules/accessibility.js";
import { bestPracticeRules } from "./rules/best-practice.js";
import { seoRules } from "./rules/seo.js";
import { styleRules } from "./rules/style.js";

const htmlRules: Rules = {
  ...bestPracticeRules, // 31/65 rules, 9 automatically fixable, 2 editor suggestions fixable.
  ...styleRules, // 12/65 rules, 11 automatically fixable, 0 editor suggestions fixable.
  ...accessibilityRules, // 17/65 rules, 1 automatically fixable, 1 editor suggestions fixable.
  ...seoRules, // 5/65 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { htmlRules };
