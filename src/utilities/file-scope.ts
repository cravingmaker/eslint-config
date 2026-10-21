import type { Linter } from "eslint";

/**
 * Limits `scope` to the files that also match one of `files`, or keeps it when `files` is not
 * set. Each nested array is a set of patterns that a file must all match.
 */
const narrowFiles = (
  scope: ReadonlyArray<string | readonly string[]>,
  files?: readonly string[],
): NonNullable<Linter.Config["files"]> => {
  if (typeof files === "undefined") {
    return scope.map((entry) => {
      return typeof entry === "string" ? entry : [...entry];
    });
  }
  return scope.flatMap((entry) => {
    return files.map((file) => {
      return [...(typeof entry === "string" ? [entry] : entry), file];
    });
  });
};

/**
 * The patterns of `ignores` that leave files out, each negated: a file matches all of them when
 * none of those patterns leaves it out. The negated patterns of the list, which bring files back,
 * are not among them.
 */
const negateIgnores = (ignores: readonly string[]): readonly string[] => {
  return ignores
    .filter((pattern) => {
      return !pattern.startsWith("!");
    })
    .map((pattern) => {
      return `!${pattern}`;
    });
};

/**
 * Limits `scope` to the files that the ignore list `ignores` leaves in, as patterns for `files`
 * alone. ESLint reads an ignore list in order, and a negated pattern brings back files that the
 * patterns before it left out, so two lists that are joined into one do not leave out what each of
 * them does on its own. A file is left in when no pattern leaves it out, or when a negated pattern
 * brings it back and no later pattern leaves it out again. Each case becomes a set of patterns that
 * a file must all match.
 */
const withoutIgnores = (
  scope: ReadonlyArray<string | readonly string[]>,
  ignores: readonly string[],
): NonNullable<Linter.Config["files"]> => {
  if (ignores.length === 0) {
    return narrowFiles(scope);
  }

  const leftIn = [
    negateIgnores(ignores),
    ...ignores.flatMap((pattern, index) => {
      return pattern.startsWith("!")
        ? [
            [
              // ESLint reads any number of leading `!` as one.
              pattern.replace(/^!+/v, ""),
              ...negateIgnores(ignores.slice(index + 1)),
            ],
          ]
        : [];
    }),
  ];
  return scope.flatMap((entry) => {
    return leftIn.map((patterns) => {
      return [...(typeof entry === "string" ? [entry] : entry), ...patterns];
    });
  });
};

export { narrowFiles, withoutIgnores };
