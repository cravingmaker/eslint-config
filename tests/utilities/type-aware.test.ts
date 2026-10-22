import type { Linter } from "eslint";
import type { Rules } from "../../src/types.js";

import { describe, expect, it } from "vitest";

import { overridesWithoutTypeInformation } from "../../src/utilities/type-aware.js";

// `example/typed` stands for a rule that needs type information. The settings below turn a rule
// off, or on, with the severity alone or first in an array.
const exampleTypeAwareRuleIds = ["example/typed"];
const turnedOff: ReadonlyArray<{ readonly entry: Linter.RuleEntry }> = [
  { entry: "off" },
  { entry: 0 },
  { entry: ["off"] },
  { entry: [0, { option: true }] },
];
const turnedOn: ReadonlyArray<{ readonly entry: Linter.RuleEntry }> = [
  { entry: "warn" },
  { entry: 1 },
  { entry: "error" },
  { entry: 2 },
  { entry: ["warn"] },
  { entry: [2, { option: true }] },
];

describe("overridesWithoutTypeInformation", () => {
  it.each(turnedOff)(
    "keeps the override $entry of a rule that needs type information, which turns it off",
    ({ entry }) => {
      const overrides = { "example/typed": entry };

      expect(
        overridesWithoutTypeInformation(overrides, exampleTypeAwareRuleIds),
      ).toEqual(overrides);
    },
  );

  it.each(turnedOn)(
    "leaves out the override $entry of a rule that needs type information, which turns it on",
    ({ entry }) => {
      expect(
        overridesWithoutTypeInformation(
          { "example/typed": entry },
          exampleTypeAwareRuleIds,
        ),
      ).toEqual({});
    },
  );

  it("keeps settings that ESLint rejects, so that ESLint reports them", () => {
    const overrides = { "example/typed": undefined };

    // `toEqual` takes a property that is `undefined` for a missing one.
    expect(
      overridesWithoutTypeInformation(overrides, exampleTypeAwareRuleIds),
    ).toStrictEqual(overrides);
  });

  it("keeps the overrides of the rules that need no type information", () => {
    const plain: Rules = {
      "example/other": "off",
      "example/plain": ["error", { option: true }],
    };

    expect(
      overridesWithoutTypeInformation(
        { ...plain, "example/typed": "error" },
        exampleTypeAwareRuleIds,
      ),
    ).toEqual(plain);
  });
});
