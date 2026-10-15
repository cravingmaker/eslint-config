import type { Linter } from "eslint";

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

export { narrowFiles, withoutIgnores };
