import type { Linter } from "eslint";
import type { ResolvedOptions } from "./options.js";
import type { FeatureOptions } from "./types.js";

import { sourceFiles, typescriptFiles, withSvelteComponents } from "./globs.js";
import { resolveOptions } from "./options.js";
import { narrowFiles, narrowTypeAwareScope } from "./utilities/type-aware.js";

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
its own feature's rule map. While its owner is on, the factory turns it off in the files that
both features lint, unless the user sets it in that feature's overrides.
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
Whether a feature's options give it files or ignores of its own.
*/
function hasOwnScope({ files, ignores = [] }: FeatureOptions): boolean {
  return files !== undefined || ignores.length > 0;
}
/**
Builds the blocks that turn off replaced rules where their owner lints, for each feature that
holds such rules. The rules of every owner that keeps its default scope are off in one block
over that feature's files. An owner with files or ignores of its own gets a block that is
narrowed to them. A rule that the holding feature's overrides set stays on.
`typescript.overridesTypeAware` apply in the type-aware scope only, so a rule that only they set
is turned off with the others, and a last block sets it again over that scope.
*/
function overlapConfigs(
  options: ResolvedOptions = resolveOptions(),
): Linter.Config[] {
  const owners = [
    {
      name: "imports",
      replacedRules: overlaps.imports,
      settings: options.imports,
    },
    {
      name: "perfectionist",
      replacedRules: overlaps.perfectionist,
      settings: options.perfectionist,
    },
    {
      name: "regexp",
      replacedRules: overlaps.regexp,
      settings: options.regexp,
    },
    {
      name: "unicorn",
      replacedRules: overlaps.unicorn,
      settings: options.unicorn,
    },
    {
      name: "unused-imports",
      replacedRules: overlaps.unusedImports,
      settings: options.unusedImports,
    },
  ];
  // The default files of the features that hold replaced rules, Svelte components included.
  const sources = withSvelteComponents(sourceFiles, options.svelteComponents);
  const scopes = [
    {
      defaultFiles: sources,
      feature: "javascript",
      overrides: options.javascript.overrides,
      settings: options.javascript,
    },
    {
      defaultFiles: sources,
      feature: "node",
      overrides: options.node?.overrides,
      settings: options.node,
    },
    {
      defaultFiles: sources,
      feature: "imports",
      overrides: options.imports?.overrides,
      settings: options.imports,
    },
    {
      defaultFiles: withSvelteComponents(
        typescriptFiles,
        options.svelteComponents,
      ),
      feature: "typescript",
      overrides: options.typescript?.overrides,
      overridesTypeAware: options.typescript?.overridesTypeAware,
      settings: options.typescript,
    },
  ];

  return scopes.flatMap(
    ({ defaultFiles, feature, overrides, overridesTypeAware, settings }) => {
      if (settings === undefined) return [];

      const files = settings.files ?? defaultFiles;
      const ignores = settings.ignores ?? [];
      const replaced = owners.flatMap(
        ({ name, replacedRules, settings: ownerSettings }) => {
          const ruleIds = Object.keys(replacedRules).filter(
            (ruleId) =>
              featureOf(ruleId) === feature &&
              !Object.hasOwn(overrides ?? {}, ruleId),
          );
          if (ownerSettings === undefined || ruleIds.length === 0) return [];
          return [{ name, ownerSettings, ruleIds }];
        },
      );
      const sharedRuleIds = replaced
        .filter(({ ownerSettings }) => !hasOwnScope(ownerSettings))
        .flatMap(({ ruleIds }) => ruleIds);
      // The settings of `overridesTypeAware` for the rules that the blocks below turn off.
      const typeAwareEntries = Object.entries(overridesTypeAware ?? {}).filter(
        ([ruleId]) => replaced.some(({ ruleIds }) => ruleIds.includes(ruleId)),
      );

      return [
        ...(sharedRuleIds.length === 0
          ? []
          : [
              {
                files: [...files],
                ignores: [...ignores],
                name: `@cravingmaker/eslint-config/overlaps/${feature}`,
                rules: turnOff(sharedRuleIds),
              },
            ]),
        ...replaced
          .filter(({ ownerSettings }) => hasOwnScope(ownerSettings))
          .map(({ name, ownerSettings, ruleIds }) => ({
            files: narrowFiles(files, ownerSettings.files),
            ignores: [...ignores, ...(ownerSettings.ignores ?? [])],
            name: `@cravingmaker/eslint-config/overlaps/${feature}/${name}`,
            rules: turnOff(ruleIds),
          })),
        ...(options.typeAware === undefined || typeAwareEntries.length === 0
          ? []
          : [
              {
                // The scope stays within the feature's files and ignores, so they are not
                // applied again.
                files: narrowTypeAwareScope(options.typeAware),
                name: `@cravingmaker/eslint-config/overlaps/${feature}/overrides-type-aware`,
                rules: Object.fromEntries(typeAwareEntries),
              },
            ]),
      ];
    },
  );
}
/**
Rule settings that turn each of `ruleIds` off, keeping the options of earlier blocks.
*/
function turnOff(ruleIds: readonly string[]): Linter.RulesRecord {
  return Object.fromEntries(
    ruleIds.map((ruleId): readonly [string, "off"] => [ruleId, "off"]),
  );
}

export { featureOf, overlapConfigs, overlaps };
export type { Owner };
