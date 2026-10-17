import type { Rules } from "../../../types.js";

const enforcePackageTypeRules: Rules = {
  // --- Rules with default options (1/1) ------------------------------------------------------------------------------------------------------------
  "enforce-package-type/enforce-package-type": [
    "error",
    { enforceType: "module" },
  ],
}; // Automatically fixable by the --fix command.

export { enforcePackageTypeRules }; // 1 rules, 1 automatically fixable, 0 editor suggestions fixable.
