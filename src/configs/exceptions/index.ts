import type { Linter } from "eslint";
import type { ResolvedOptions } from "../../options.js";

import { resolveOptions } from "../../options.js";
import { fileRoles } from "./rules.js";

/**
 * Builds one block per file role that turns its rules off, limited to the rules whose feature is on. The blocks come after every feature, so a user config is the way to turn a rule back on.
 */
const exceptions = (
  options: ResolvedOptions = resolveOptions(),
): Linter.Config[] => {
  const features = new Map(Object.entries(options));
  return Object.entries(fileRoles(options)).flatMap(
    ([role, { files, rules }]) => {
      const ruleIds = Object.entries(rules).flatMap(([feature, entries]) => {
        return typeof features.get(feature) === "undefined" ? [] : entries;
      });

      if (files.length === 0 || ruleIds.length === 0) {
        return [];
      }

      return {
        files,
        name: `@cravingmaker/eslint-config/exceptions/${role}`,
        rules: Object.fromEntries(
          ruleIds.map((ruleId): readonly [string, "off"] => {
            return [ruleId, "off"];
          }),
        ),
      };
    },
  );
};

export { exceptions };
