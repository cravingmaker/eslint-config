import type { Linter } from "eslint";
import type { ResolvedOptions } from "../options.js";

import { configFiles, sourceFiles, testFiles } from "../globs.js";
import { resolveOptions } from "../options.js";
import { narrowFiles } from "../utilities/type-aware.js";

/**
A feature that holds rules a file role turns off.
*/
type ExceptionFeature = "functional" | "imports";
/**
The files of one role, and the rules that are off in them by the feature that holds each rule.
*/
type FileRole = {
  readonly files: readonly string[];
  readonly rules: Readonly<
    Partial<Record<ExceptionFeature, readonly string[]>>
  >;
};

/**
Rules that files with a particular role break by design. Each exception replaces a suppression
that every such file in this repository needed; add one only with similar evidence.
*/
const fileRoles: Readonly<Record<string, FileRole>> = {
  // Tools such as ESLint, Vite, and Vitest read their config from the default export.
  "config-files": {
    files: configFiles,
    rules: { imports: ["import-x/no-default-export"] },
  },
  // Test suites declare tests and assertions through calls whose results go unused.
  "test-files": {
    files: testFiles,
    rules: {
      functional: [
        "functional/no-expression-statements",
        "functional/no-return-void",
      ],
    },
  },
};

/**
Builds one block per file role that turns its rules off, limited to the rules whose feature is
on. The blocks come after every feature, so a user config is the way to turn a rule back on.
*/
function exceptions(
  options: ResolvedOptions = resolveOptions(),
): Linter.Config[] {
  return Object.entries(fileRoles).flatMap(([role, { files, rules }]) => {
    const ruleIds = [
      ...(options.functional === undefined ? [] : (rules.functional ?? [])),
      ...(options.imports === undefined ? [] : (rules.imports ?? [])),
    ];
    if (ruleIds.length === 0) return [];

    return [
      {
        // Only JavaScript and TypeScript sources: on its own, a pattern such as
        // `**/*.config.*` would make ESLint lint every file it matches, such as a YAML file.
        files: narrowFiles(files, sourceFiles),
        name: `@cravingmaker/eslint-config/exceptions/${role}`,
        rules: Object.fromEntries(
          ruleIds.map((ruleId): readonly [string, "off"] => [ruleId, "off"]),
        ),
      },
    ];
  });
}

export { exceptions, fileRoles };
