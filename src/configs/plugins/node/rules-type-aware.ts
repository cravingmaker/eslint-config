import type { Rules } from "../../../types.js";

import { nodeRules } from "./rules.js";

// Guards for the files that typescript-eslint parses, and reactivation; other JavaScript keeps the
// base n/no-sync policy. Rules requiring type information stay off in those files outside typed
// linting.
const typescriptRulesOff: Rules = {
  // --- Turned off rules (1/1) ---------------------------------------------------------------------------------------------------------------------.
  "n/no-sync": "off", // Requires type information; enabled only in the type-aware scope.
} as const;

// The rules that need type information in TypeScript files.
const typeAwareRules: Rules = {
  // --- Rules with overridden options (1/1) --------------------------------------------------------------------------------------------------------.
  "n/no-sync": nodeRules["n/no-sync"],
} as const;

export {
  typeAwareRules, // 1 rule, 0 automatically fixable, 0 editor suggestions fixable.
  typescriptRulesOff, // 1 rule, 0 automatically fixable, 0 editor suggestions fixable.
};
