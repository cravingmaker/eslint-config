import type { Rules } from "../../../types.js";

import { curryingRules } from "./rules/currying.js";
import { noExceptionsRules } from "./rules/no-exceptions.js";
import { noMutationsRules } from "./rules/no-mutations.js";
import { noOtherParadigmsRules } from "./rules/no-other-paradigms.js";
import { noStatementsRules } from "./rules/no-statements.js";
import { stylisticRules } from "./rules/stylistic.js";

const functionalRules: Rules = {
  ...noMutationsRules, // 4/19 rules, 2 automatically fixable, 2 editor suggestions fixable.
  ...noOtherParadigmsRules, // 4/19 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...noStatementsRules, // 4/19 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...noExceptionsRules, // 3/19 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...stylisticRules, // 3/19 rules, 1 automatically fixable, 1 editor suggestions fixable.
  ...curryingRules, // 1/19 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { functionalRules };
