import type { Linter } from "eslint";
import type { Rules } from "../../src/types.js";

import { describe, expect, it } from "vitest";

import { withOverrides } from "../../src/utilities/overrides.js";

// A policy with a rule that has options, one with a severity alone, and a disabled one.
const policy: Rules = {
  "local/configured": ["error", { option: "policy" }, "second"],
  "local/disabled": "off",
  "local/plain": "error",
};

describe("withOverrides", () => {
  // Each case is an object, because `it.each` would spread an array of settings into arguments.
  it.each<{ readonly override: Linter.RuleEntry }>([
    { override: "warn" },
    { override: 1 },
    { override: ["warn"] },
    { override: "off" },
    { override: 0 },
    { override: ["error"] },
  ])(
    "keeps the options of the policy for the severity alone $override",
    ({ override }) => {
      const severity = typeof override === "object" ? override[0] : override;

      expect(
        withOverrides(policy, { "local/configured": override })[
          "local/configured"
        ],
      ).toEqual([severity, { option: "policy" }, "second"]);
    },
  );

  it("replaces the options of the policy with those of an override, without merging them", () => {
    expect(
      withOverrides(policy, {
        "local/configured": ["warn", { other: true }],
      })["local/configured"],
    ).toEqual(["warn", { other: true }]);
  });

  it("keeps an override of a rule without options in the policy as it is", () => {
    const rules = withOverrides(policy, {
      "local/disabled": "error",
      "local/plain": ["warn"],
      "other/rule": "warn",
    });

    expect([
      rules["local/disabled"],
      rules["local/plain"],
      rules["other/rule"],
    ]).toEqual(["error", ["warn"], "warn"]);
  });

  it("keeps the other rules of the policy and changes neither map", () => {
    const overrides: Rules = { "local/plain": "warn" };
    const rules = withOverrides(policy, overrides);

    expect(rules).toEqual({ ...policy, "local/plain": "warn" });
    expect(policy).toEqual({
      "local/configured": ["error", { option: "policy" }, "second"],
      "local/disabled": "off",
      "local/plain": "error",
    });
    expect(overrides).toEqual({ "local/plain": "warn" });
  });
});
