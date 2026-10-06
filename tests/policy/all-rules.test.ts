/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, expect, it } from "vitest";

import {
  disableConfigRules,
  enableAllRules,
} from "../../src/utilities/all-rules.js";

const rules = {
  current: { meta: {} },
  deprecatedFlag: { meta: { deprecated: true } },
  deprecatedInfo: { meta: { deprecated: { message: "Use current." } } },
  everyLanguage: { meta: { languages: ["*"] } },
  javascriptOnly: { meta: { languages: ["js/js"] } },
  jsonOnly: { meta: { languages: ["json/json"] } },
  notDeprecated: { meta: { deprecated: false } },
  withoutMeta: {},
};

describe("enableAllRules", () => {
  it("turns on every rule that is not deprecated, as an error", () => {
    expect(enableAllRules("example", rules)).toEqual({
      "example/current": "error",
      "example/everyLanguage": "error",
      "example/javascriptOnly": "error",
      "example/jsonOnly": "error",
      "example/notDeprecated": "error",
      "example/withoutMeta": "error",
    });
  });

  it("skips rules for other languages and keeps rules that name no language", () => {
    expect(
      Object.keys(enableAllRules("example", rules, { language: "js/js" })),
    ).toEqual([
      "example/current",
      "example/everyLanguage",
      "example/javascriptOnly",
      "example/notDeprecated",
      "example/withoutMeta",
    ]);
  });

  it("leaves out excluded rules", () => {
    expect(
      Object.keys(
        enableAllRules("example", rules, {
          exclude: ["current", "withoutMeta"],
        }),
      ),
    ).toEqual([
      "example/everyLanguage",
      "example/javascriptOnly",
      "example/jsonOnly",
      "example/notDeprecated",
    ]);
  });
});

describe("disableConfigRules", () => {
  it("turns off every rule that the config sets, except deprecated rules", () => {
    expect(
      disableConfigRules("example", rules, {
        "example/current": "off",
        "example/deprecatedFlag": "off",
        "example/deprecatedInfo": "off",
        "example/withoutMeta": "warn",
      }),
    ).toEqual({ "example/current": "off", "example/withoutMeta": "off" });
  });
});
