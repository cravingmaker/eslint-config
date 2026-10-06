import type { Linter } from "eslint";
import type { ResolvedOptions } from "./options.js";

import { sourceFiles, typescriptFiles } from "./globs.js";
import { resolveOptions } from "./options.js";

/**
A feature whose rules replace rules of other features.
*/
type Owner =
  "imports" | "perfectionist" | "regexp" | "unicorn" | "unusedImports";
/**
A feature whose rule map holds rules that an owner replaces.
*/
type ReplacedFeature = "imports" | "javascript" | "node" | "typescript";

/**
Each owner, the rules it replaces, and its own rules that cover them. A replaced rule is on in
its own feature's rule map. While its owner is on, the factory turns it off, unless the user sets
it in that feature's overrides.
*/
const overlaps: Readonly<
  Record<Owner, Readonly<Record<string, readonly string[]>>>
> = {
  imports: {
    "n/file-extension-in-import": ["import-x/extensions"],
    "n/no-extraneous-import": ["import-x/no-extraneous-dependencies"],
    "n/no-missing-import": ["import-x/no-unresolved"],
    "no-duplicate-imports": ["import-x/no-duplicates"],
  },
  perfectionist: {
    "import-x/first": ["perfectionist/sort-imports"],
    "import-x/order": ["perfectionist/sort-imports"],
    "sort-imports": ["perfectionist/sort-imports"],
    "sort-keys": ["perfectionist/sort-objects"],
    "@typescript-eslint/adjacent-overload-signatures": [
      "perfectionist/sort-interfaces",
      "perfectionist/sort-object-types",
    ],
    "@typescript-eslint/member-ordering": ["perfectionist/sort-classes"],
  },
  regexp: {
    "no-empty-character-class": ["regexp/no-empty-character-class"],
    "no-invalid-regexp": ["regexp/no-invalid-regexp"],
    "no-useless-backreference": ["regexp/no-useless-backreference"],
  },
  unicorn: {
    "n/no-process-exit": ["unicorn/no-process-exit"],
    "n/prefer-node-protocol": ["unicorn/prefer-node-protocol"],
    "no-negated-condition": ["unicorn/no-negated-condition"],
    "no-nested-ternary": ["unicorn/no-nested-ternary"],
    "no-warning-comments": ["unicorn/expiring-todo-comments"],
  },
  unusedImports: {
    "no-unused-vars": ["unused-imports/no-unused-vars"],
    "@typescript-eslint/no-unused-vars": ["unused-imports/no-unused-vars"],
  },
};
// The feature of each plugin whose rules can be replaced. Core rules belong to `javascript`.
const featuresByPlugin = new Map<string, ReplacedFeature>([
  ["import-x", "imports"],
  ["n", "node"],
  ["@typescript-eslint", "typescript"],
]);

/**
The feature whose rule map holds `ruleId`, or `undefined` for a plugin that no feature replaces.
*/
function featureOf(ruleId: string): ReplacedFeature | undefined {
  const slash = ruleId.lastIndexOf("/");
  if (slash === -1) return "javascript";
  return featuresByPlugin.get(ruleId.slice(0, slash));
}
/**
Builds the blocks that turn off replaced rules: one for each feature that holds such rules,
over that feature's files, with every replaced rule whose owner is on and that the feature's
overrides do not set.
*/
function overlapConfigs(
  options: ResolvedOptions = resolveOptions(),
): Linter.Config[] {
  const replacedRuleIds = [
    options.imports === undefined ? {} : overlaps.imports,
    options.perfectionist === undefined ? {} : overlaps.perfectionist,
    options.regexp === undefined ? {} : overlaps.regexp,
    options.unicorn === undefined ? {} : overlaps.unicorn,
    options.unusedImports === undefined ? {} : overlaps.unusedImports,
  ].flatMap((replacedRules) => Object.keys(replacedRules));
  const scopes = [
    {
      defaultFiles: sourceFiles,
      feature: "javascript",
      overrides: options.javascript.overrides,
      settings: options.javascript,
    },
    {
      defaultFiles: sourceFiles,
      feature: "node",
      overrides: options.node?.overrides,
      settings: options.node,
    },
    {
      defaultFiles: sourceFiles,
      feature: "imports",
      overrides: options.imports?.overrides,
      settings: options.imports,
    },
    {
      defaultFiles: typescriptFiles,
      feature: "typescript",
      overrides: {
        ...options.typescript?.overrides,
        ...options.typescript?.overridesTypeAware,
      },
      settings: options.typescript,
    },
  ];

  return scopes.flatMap(({ defaultFiles, feature, overrides, settings }) => {
    const ruleIds = replacedRuleIds.filter(
      (ruleId) =>
        featureOf(ruleId) === feature &&
        !Object.hasOwn(overrides ?? {}, ruleId),
    );
    if (settings === undefined || ruleIds.length === 0) return [];

    return [
      {
        files: [...(settings.files ?? defaultFiles)],
        ignores: [...(settings.ignores ?? [])],
        name: `@cravingmaker/eslint-config/overlaps/${feature}`,
        rules: Object.fromEntries(
          ruleIds.map((ruleId): readonly [string, "off"] => [ruleId, "off"]),
        ),
      },
    ];
  });
}

export { featureOf, overlapConfigs, overlaps };
export type { Owner };
