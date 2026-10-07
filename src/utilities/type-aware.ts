import type { Linter } from "eslint";
import type { FeatureOptions, Rules, TypeAwareScope } from "../types.js";

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
The files of a feature's type-aware blocks: the type-aware scope, narrowed to the feature's own
files when they are set, without the feature's ignores.
*/
function narrowTypeAwareScope(
  typeAware: TypeAwareScope,
  { files, ignores = [] }: FeatureOptions = {},
): Pick<Linter.Config, "files" | "ignores"> {
  return {
    files: narrowFiles(typeAware.files, files),
    ignores: [...typeAware.ignores, ...ignores],
  };
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
    ...narrowTypeAwareScope(typeAware, options),
    name: `@cravingmaker/eslint-config/${feature}/rules-type-aware`,
    rules,
  };
}

export { narrowFiles, narrowTypeAwareScope, typeAwareConfig };
