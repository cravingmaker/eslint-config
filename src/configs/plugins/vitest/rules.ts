import type { Rules } from "../../../types.js";

const vitestRules: Rules = {
  // --- Rules with default options (3/81) ----------------------------------------------------------------------------------------------------------.
  "vitest/no-disabled-tests": "error",
  "vitest/require-awaited-expect-poll": "error",
  "vitest/valid-expect-in-promise": "error",

  // --- Rules with overridden options (2/81) -------------------------------------------------------------------------------------------------------.
  "vitest/no-focused-tests": ["error", { fixable: false }], // Reported without a fix, so that `eslint --fix` never removes `.only` that the author added.
  "vitest/valid-expect": [
    "error",
    {
      alwaysAwait: false,
      asyncMatchers: ["toReject", "toResolve"],
      maxArgs: 2,
      minArgs: 1,
    },
  ], // Vitest's `expect()` takes a message as its second argument, which may be any string expression, not only a literal. Automatically fixable by the --fix command.

  // --- Turned off rules (76/81) -------------------------------------------------------------------------------------------------------------------.
  "vitest/consistent-each-for": "off", // Not part of the enabled policy.
  "vitest/consistent-test-filename": "off", // Not part of the enabled policy.
  "vitest/consistent-test-it": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/consistent-vitest-vi": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/expect-expect": "off", // Not part of the enabled policy.
  "vitest/hoisted-apis-on-top": "off", // Not part of the enabled policy. Manually fixable by editor suggestions.
  "vitest/max-expects": "off", // Not part of the enabled policy.
  "vitest/max-nested-describe": "off", // Not part of the enabled policy.
  "vitest/no-alias-methods": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/no-commented-out-tests": "off", // Not part of the enabled policy.
  "vitest/no-conditional-expect": "off", // Not part of the enabled policy.
  "vitest/no-conditional-in-test": "off", // Not part of the enabled policy.
  "vitest/no-conditional-tests": "off", // Not part of the enabled policy.
  "vitest/no-duplicate-hooks": "off", // Not part of the enabled policy.
  "vitest/no-hooks": "off", // Not part of the enabled policy.
  "vitest/no-identical-title": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/no-import-node-test": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/no-importing-vitest-globals": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/no-interpolation-in-snapshots": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/no-large-snapshots": "off", // Not part of the enabled policy.
  "vitest/no-mocks-import": "off", // Not part of the enabled policy.
  "vitest/no-restricted-matchers": "off", // Not part of the enabled policy.
  "vitest/no-restricted-vi-methods": "off", // Not part of the enabled policy.
  "vitest/no-standalone-expect": "off", // Not part of the enabled policy.
  "vitest/no-test-prefixes": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/no-test-return-statement": "off", // Not part of the enabled policy.
  "vitest/no-unneeded-async-expect-function": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-after-all-blocks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-after-each-blocks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-all": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-before-all-blocks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-before-each-blocks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-describe-blocks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-expect-groups": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/padding-around-test-blocks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-called-exactly-once-with": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-called-once": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-called-times": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-called-with": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-comparison-matcher": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-describe-function-title": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-each": "off", // Not part of the enabled policy.
  "vitest/prefer-equality-matcher": "off", // Not part of the enabled policy. Manually fixable by editor suggestions.
  "vitest/prefer-expect-assertions": "off", // Not part of the enabled policy. Manually fixable by editor suggestions.
  "vitest/prefer-expect-resolves": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-expect-type-of": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-hooks-in-order": "off", // Not part of the enabled policy.
  "vitest/prefer-hooks-on-top": "off", // Not part of the enabled policy.
  "vitest/prefer-import-in-mock": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-importing-vitest-globals": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-lowercase-title": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-mock-promise-shorthand": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-mock-return-shorthand": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-snapshot-hint": "off", // Not part of the enabled policy.
  "vitest/prefer-spy-on": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-strict-boolean-matchers": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-strict-equal": "off", // Not part of the enabled policy. Manually fixable by editor suggestions.
  "vitest/prefer-to-be": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-to-be-falsy": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-to-be-object": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-to-be-truthy": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-to-contain": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-to-have-been-called-times": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-to-have-length": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-todo": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/prefer-vi-mocked": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/require-hook": "off", // Not part of the enabled policy.
  "vitest/require-local-test-context-for-concurrent-snapshots": "off", // Not part of the enabled policy.
  "vitest/require-mock-type-parameters": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/require-test-timeout": "off", // Not part of the enabled policy.
  "vitest/require-to-throw-message": "off", // Not part of the enabled policy.
  "vitest/require-top-level-describe": "off", // Not part of the enabled policy.
  "vitest/unbound-method": "off", // Not part of the enabled policy.
  "vitest/valid-describe-callback": "off", // Not part of the enabled policy.
  "vitest/valid-title": "off", // Not part of the enabled policy. Automatically fixable by the --fix command.
  "vitest/warn-todo": "off", // Not part of the enabled policy.
} as const;

export { vitestRules }; // 81 rules, 45 automatically fixable, 4 editor suggestions fixable.
