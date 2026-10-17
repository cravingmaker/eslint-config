import type { Rules } from "../../../types.js";

import { curryingRules } from "./currying.js";
import { noExceptionsRules } from "./no-exceptions.js";
import { noMutationsRules } from "./no-mutations.js";
import { noOtherParadigmsRules } from "./no-other-paradigms.js";
import { noStatementsRules } from "./no-statements.js";
import { stylisticRules } from "./stylistic.js";

// Explicit policy grouped by the upstream rule categories.
const functionalRules: Rules = {
  ...noMutationsRules,
  ...noOtherParadigmsRules,
  ...noStatementsRules,
  ...noExceptionsRules,
  ...stylisticRules,
  ...curryingRules,
} as const;

export { functionalRules };
