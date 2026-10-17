import type { Rules } from "../../../types.js";

import { possibleSecurityVulnerabilityRules } from "./possible-security-vulnerability.js";

// Explicit policy grouped by the upstream rule categories.
const securityRules: Rules = {
  ...possibleSecurityVulnerabilityRules,
} as const;

export { securityRules };
