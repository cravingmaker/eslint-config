import type { Rules } from "../../../types.js";

const layoutAndFormattingRules: Rules = {
  // --- Rules with default options (1/1) -----------------------------------------------------------------------------------------------------------.
  "unicode-bom": ["error", "never"], // Automatically fixable by the --fix command.
} as const;

export { layoutAndFormattingRules }; // 1 rule, 1 automatically fixable, 0 editor suggestions fixable.
