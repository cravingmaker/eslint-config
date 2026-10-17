import type { Linter } from "eslint";

import { globalIgnores } from "eslint/config";

const ignores = (patterns: readonly string[] = []): Linter.Config[] => {
  return [
    globalIgnores(
      // Build output and coverage directories at any depth, then `patterns`.
      ["**/dist/", "**/build/", "**/coverage/", ...patterns],
      "@cravingmaker/eslint-config/ignores",
    ),
  ];
};

export { ignores };
