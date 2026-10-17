import type { Rules } from "../../../types.js";

import { helpfulWarningsRules } from "./helpful-warnings.js";
import { moduleSystemsRules } from "./module-systems.js";
import { staticAnalysisRules } from "./static-analysis.js";
import { styleGuideRules } from "./style-guide.js";

// Explicit policy grouped by the upstream rule categories.
const importsRules: Rules = {
  ...styleGuideRules,
  ...staticAnalysisRules,
  ...helpfulWarningsRules,
  ...moduleSystemsRules,
} as const;

export { importsRules };
