import type { Linter } from "eslint";
import type { FeatureOptions, Rules, TypeAwareScope } from "../types.js";

// The severities that turn a rule on. Apart from them, ESLint takes only `"off"` and `0`.
const severitiesOn: ReadonlySet<unknown> = new Set([1, 2, "error", "warn"]);

/**
Whether the settings of a rule turn it on, with one of `severitiesOn` alone or first in an array.
*/
function isOn(entry: Readonly<Linter.RuleEntry> | undefined): boolean {
  // `Array.isArray` narrows a readonly tuple to `any[]`.
  const severity: unknown = Array.isArray(entry) ? entry[0] : entry;
  return severitiesOn.has(severity);
}
/**
Limits `scope` to the files that also match one of `files`, or keeps it when `files` is not
set. Each nested array is a set of patterns that a file must all match.
*/
function narrowFiles(
  scope: ReadonlyArray<string | readonly string[]>,
  files: readonly string[] | undefined,
): NonNullable<Linter.Config["files"]> {
  if (files === undefined)
    return scope.map((entry) =>
      typeof entry === "string" ? entry : [...entry],
    );
  return scope.flatMap((entry) =>
    files.map((file) => [
      ...(typeof entry === "string" ? [entry] : entry),
      file,
    ]),
  );
}
/**
The files of a feature's type-aware block: the type-aware scope, within the feature's own files
when they are set, and without the files that its ignores leave out. The block takes them as its
`files` and has no `ignores`, which could bring back a file that the scope leaves out.
*/
function narrowTypeAwareScope(
  typeAware: TypeAwareScope,
  { files, ignores = [] }: FeatureOptions = {},
): NonNullable<Linter.Config["files"]> {
  return withoutIgnores(narrowFiles(typeAware, files), ignores);
}
/**
The patterns of `ignores` that leave files out, each negated: a file matches all of them when
none of those patterns leaves it out. The negated patterns of the list, which bring files back,
are not among them.
*/
function negateIgnores(ignores: readonly string[]): readonly string[] {
  return ignores
    .filter((pattern) => !pattern.startsWith("!"))
    .map((pattern) => `!${pattern}`);
}
/**
The overrides of a feature for a block that reaches files without type information. A rule that
needs it, one of `typeAwareRuleIds`, stops ESLint in such a file while it is on, so an override
that turns it on is left out, and one that turns it off stays. So do settings that ESLint rejects,
which it then reports as for any other rule. The feature's type-aware block takes every override.
*/
function overridesWithoutTypeInformation(
  overrides: Readonly<Rules>,
  typeAwareRuleIds: readonly string[],
): Rules {
  return Object.fromEntries(
    Object.entries(overrides).filter(
      ([ruleId, entry]) => !(typeAwareRuleIds.includes(ruleId) && isOn(entry)),
    ),
  );
}
/**
Builds a feature's block for the rules that need type information, over the files of
`narrowTypeAwareScope`.
*/
function typeAwareConfig(
  feature: string,
  typeAware: TypeAwareScope,
  options: FeatureOptions = {},
  rules: Rules = {},
): Linter.Config {
  return {
    files: narrowTypeAwareScope(typeAware, options),
    name: `@cravingmaker/eslint-config/${feature}/rules-type-aware`,
    rules,
  };
}
/**
Limits `scope` to the files that the ignore list `ignores` leaves in, as patterns for `files`
alone. ESLint reads an ignore list in order, and a negated pattern brings back files that the
patterns before it left out, so two lists that are joined into one do not leave out what each of
them does on its own. A file is left in when no pattern leaves it out, or when a negated pattern
brings it back and no later pattern leaves it out again. Each case becomes a set of patterns that
a file must all match.
*/
function withoutIgnores(
  scope: ReadonlyArray<string | readonly string[]>,
  ignores: readonly string[],
): NonNullable<Linter.Config["files"]> {
  if (ignores.length === 0) return narrowFiles(scope, undefined);

  const leftIn = [
    negateIgnores(ignores),
    ...ignores.flatMap((pattern, index) =>
      pattern.startsWith("!")
        ? [
            [
              // ESLint reads any number of leading `!` as one.
              pattern.replace(/^!+/v, ""),
              ...negateIgnores(ignores.slice(index + 1)),
            ],
          ]
        : [],
    ),
  ];
  return scope.flatMap((entry) =>
    leftIn.map((patterns) => [
      ...(typeof entry === "string" ? [entry] : entry),
      ...patterns,
    ]),
  );
}

export {
  narrowFiles,
  narrowTypeAwareScope,
  overridesWithoutTypeInformation,
  typeAwareConfig,
  withoutIgnores,
};
