import type { Rules } from "../../../types.js";

import { otherRules } from "./rules/other-rules.js";
import { requirePropertiesRules } from "./rules/require-properties.js";
import { validPropertiesRules } from "./rules/valid-properties.js";

const packageJsonRules: Rules = {
  ...otherRules, // 17/100 rules, 5 automatically fixable, 11 editor suggestions fixable.
  ...requirePropertiesRules, // 42/100 rules, 3 automatically fixable, 2 editor suggestions fixable.
  ...validPropertiesRules, // 41/100 rules, 1 automatically fixable, 2 editor suggestions fixable.
} as const;

export { packageJsonRules };
