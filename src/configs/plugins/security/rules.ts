import type { Rules } from "../../../types.js";

import { possibleSecurityVulnerabilityRules } from "./rules/possible-security-vulnerability.js";

const securityRules: Rules = {
  ...possibleSecurityVulnerabilityRules, // 15/15 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { securityRules };
