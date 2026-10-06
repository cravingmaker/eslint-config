import type { Rules } from "../../types.js";

const enforcePackageTypeEslintRules: Rules = {
  "enforce-package-type/enforce-package-type": [
    "error",
    { enforceType: "module" },
  ],
} as const;

export { enforcePackageTypeEslintRules };
