import type { Linter } from "eslint";

import { globalIgnores } from "eslint/config";

// Builds the global ignores: build output and coverage directories at any depth, then
// `patterns`.
function ignores(patterns: readonly string[] = []): Linter.Config[] {
  return [
    globalIgnores(
      ["**/dist/", "**/build/", "**/coverage/", ...patterns],
      "@cravingmaker/eslint-config/ignores",
    ),
  ];
}

export { ignores };
