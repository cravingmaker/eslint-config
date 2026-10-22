import type { Rules } from "../../../types.js";

import { helpfulWarningsRules } from "./rules/helpful-warnings.js";
import { moduleSystemsRules } from "./rules/module-systems.js";
import { staticAnalysisRules } from "./rules/static-analysis.js";
import { styleGuideRules } from "./rules/style-guide.js";

const importsRules: Rules = {
  ...styleGuideRules, // 18/46 rules, 8 automatically fixable, 2 editor suggestions fixable.
  ...staticAnalysisRules, // 14/46 rules, 3 automatically fixable, 0 editor suggestions fixable.
  ...helpfulWarningsRules, // 9/46 rules, 1 automatically fixable, 1 editor suggestions fixable.
  ...moduleSystemsRules, // 5/46 rules, 1 automatically fixable, 0 editor suggestions fixable.
} as const;

export { importsRules };
