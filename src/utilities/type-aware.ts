import type { Linter } from "eslint";
import type { FeatureOptions, Rules, TypeAwareScope } from "../types.js";

/**
Limits `scope` to the files that also match one of `files`, or keeps it when `files` is not
set. Each nested array is a set of patterns that a file must all match.
*/
function narrowFiles(
  scope: readonly string[],
  files: readonly string[] | undefined,
): NonNullable<Linter.Config["files"]> {
  if (files === undefined) return [...scope];
  return scope.flatMap((scopeFile) => files.map((file) => [scopeFile, file]));
}
/**
Builds a feature's block for the rules that need type information: the type-aware scope,
narrowed to the feature's own files when they are set, without the feature's ignores.
*/
function typeAwareConfig(
  feature: string,
  typeAware: TypeAwareScope,
  { files, ignores = [] }: FeatureOptions = {},
  rules: Rules = {},
): Linter.Config {
  return {
    files: narrowFiles(typeAware.files, files),
    ignores: [...typeAware.ignores, ...ignores],
    name: `@cravingmaker/eslint-config/${feature}/rules-type-aware`,
    rules,
  };
}

export { narrowFiles, typeAwareConfig };
