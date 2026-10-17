import type { Rules } from "../../../types.js";

import { otherRules } from "./other-rules.js";
import { requirePropertiesRules } from "./require-properties.js";
import { validPropertiesRules } from "./valid-properties.js";

// Explicit policy grouped by the upstream rule categories.
const packageJsonRules: Rules = {
  ...otherRules,
  ...requirePropertiesRules,
  ...validPropertiesRules,
} as const;

export { packageJsonRules };
