import type { Linter } from "eslint";
import type { ResolvedOptions } from "../options.js";

import { configFiles, sourceFiles, testFiles } from "../globs.js";
import { resolveOptions } from "../options.js";
import { narrowFiles } from "../utilities/type-aware.js";

/**
A feature that holds rules a file role turns off.
*/
type ExceptionFeature = "functional" | "imports" | "unicorn";
/**
The files of one role, and the rules that are off in them by the feature that holds each rule.
*/
type FileRole = {
  readonly files: NonNullable<Linter.Config["files"]>;
  readonly rules: Readonly<
    Partial<Record<ExceptionFeature, readonly string[]>>
  >;
};

/**
Builds one block per file role that turns its rules off, limited to the rules whose feature is
on. The blocks come after every feature, so a user config is the way to turn a rule back on.
*/
function exceptions(
  options: ResolvedOptions = resolveOptions(),
): Linter.Config[] {
  return Object.entries(fileRoles(options)).flatMap(
    ([role, { files, rules }]) => {
      const ruleIds = [
        ...(options.functional === undefined ? [] : (rules.functional ?? [])),
        ...(options.imports === undefined ? [] : (rules.imports ?? [])),
        ...(options.unicorn === undefined ? [] : (rules.unicorn ?? [])),
      ];
      if (files.length === 0 || ruleIds.length === 0) return [];

      return [
        {
          files,
          name: `@cravingmaker/eslint-config/exceptions/${role}`,
          rules: Object.fromEntries(
            ruleIds.map((ruleId): readonly [string, "off"] => [ruleId, "off"]),
          ),
        },
      ];
    },
  );
}
/**
Rules that files with a particular role break by design, and the files of each role with
`options`. Each exception replaces a suppression that every such file would need; add one only
with similar evidence.
*/
function fileRoles({
  svelteComponents,
}: ResolvedOptions): Readonly<Record<string, FileRole>> {
  return {
    // Tools such as ESLint, Vite, and Vitest read their config from the default export. Only
    // JavaScript and TypeScript sources, as for test files: on its own, a pattern such as
    // `**/*.config.*` would make ESLint lint every file it matches, such as a YAML file.
    "config-files": {
      files: narrowFiles(configFiles, sourceFiles),
      rules: { imports: ["import-x/no-default-export"] },
    },
    // The instance script of a component runs once per instance, so its top-level variables are
    // the instance's state. Svelte updates them through assignments, which need `let`, as do the
    // targets of `bind:` and the `export let` props of legacy mode. svelte-eslint-parser puts the
    // statements of a script below its element, not the program, where import-x/unambiguous looks
    // for them. None while the Svelte feature is off.
    "svelte-components": {
      files: narrowFiles(svelteComponents, undefined),
      rules: {
        functional: ["functional/no-let"],
        imports: ["import-x/no-mutable-exports", "import-x/unambiguous"],
        unicorn: ["unicorn/no-top-level-assignment-in-function"],
      },
    },
    // Test suites declare tests and assertions through calls whose results go unused.
    "test-files": {
      files: narrowFiles(testFiles, sourceFiles),
      rules: {
        functional: [
          "functional/no-expression-statements",
          "functional/no-return-void",
        ],
      },
    },
  };
}

export { exceptions, fileRoles };
