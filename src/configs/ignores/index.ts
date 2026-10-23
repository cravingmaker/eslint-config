import type { Linter } from "eslint";

import { globalIgnores } from "eslint/config";

/**
 * Builds global generated-output ignores, followed by caller patterns in their supplied order.
 */
const ignores = (patterns: readonly string[] = []): Linter.Config[] => {
  return [
    globalIgnores(
      // Generated build/framework output and coverage directories at any depth, then caller patterns.
      [
        "**/dist/",
        "**/build/",
        "**/coverage/",
        "**/.next/",
        "**/.svelte-kit/",
        ...patterns,
      ],
      "@cravingmaker/eslint-config/ignores",
    ),
  ];
};

export { ignores };
