import type { Linter } from "eslint";
import type { Rules } from "../src/types.js";

import { describe, expect, it } from "vitest";

import {
  supportedPluginPolicy,
  supportedRuleOptions,
} from "../src/utilities/plugin-policy.js";

describe("supported rule policy", () => {
  describe.each(["oneOf", "anyOf"])("%s option forms", (keyword) => {
    it.each([false, true])(
      "adapts callback options with constructor support %s",
      (isConstructorSupported) => {
        const entry: Readonly<Linter.RuleEntry> = [
          "warn",
          { checkConstructorCallCallbacks: true, max: 3 },
        ];
        const rule = {
          meta: {
            schema: [
              {
                [keyword]: [
                  { minimum: 0, type: "integer" },
                  {
                    additionalProperties: false,
                    properties: {
                      max: { minimum: 0, type: "integer" },
                      maximum: { minimum: 0, type: "integer" },
                      ...(isConstructorSupported && {
                        checkConstructorCallCallbacks: { type: "boolean" },
                      }),
                    },
                    type: "object",
                  },
                ],
              },
            ],
          },
        };

        expect(supportedRuleOptions(entry, rule)).toEqual(
          isConstructorSupported ? entry : ["warn", { max: 3 }],
        );
        expect(supportedRuleOptions(["warn", 3], rule)).toEqual(["warn", 3]);
        expect(entry[1]).toEqual({
          checkConstructorCallCallbacks: true,
          max: 3,
        });
      },
    );
  });

  it("finds the object form inside nested schema alternatives", () => {
    expect(
      supportedRuleOptions(["warn", { max: 3, newer: true }], {
        meta: {
          schema: [
            {
              anyOf: [
                { type: "string" },
                {
                  oneOf: [
                    { minimum: 0, type: "integer" },
                    {
                      additionalProperties: false,
                      properties: { max: { minimum: 0, type: "integer" } },
                      type: "object",
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).toEqual(["warn", { max: 3 }]);
  });

  it("preserves options when multiple object forms need schema validation", () => {
    const entry: Readonly<Linter.RuleEntry> = ["error", { second: true }];
    expect(
      supportedRuleOptions(entry, {
        meta: {
          schema: [
            {
              oneOf: [
                {
                  additionalProperties: false,
                  properties: { first: { type: "boolean" } },
                  type: "object",
                },
                {
                  additionalProperties: false,
                  properties: { second: { type: "boolean" } },
                  type: "object",
                },
              ],
            },
          ],
        },
      }),
    ).toEqual(entry);
  });

  it("omits options for a host rule whose older schema accepts none", () => {
    expect(
      supportedRuleOptions(["error", { newer: false }], {
        meta: { schema: [] },
      }),
    ).toEqual(["error"]);
  });

  it("keeps declared rules supported by an older peer without enabling new upstream rules", () => {
    const policy = {
      "example/current": ["warn", { existing: true, newer: false }],
      "example/disabled": "off",
      "example/unavailable": "error",
    } satisfies Rules;
    const rules = {
      current: {
        meta: {
          schema: [
            {
              additionalProperties: false,
              properties: { existing: { type: "boolean" } },
              type: "object",
            },
          ],
        },
      },
      disabled: {},
      upstreamAddition: {},
    };

    expect(supportedPluginPolicy("example", policy, rules)).toEqual({
      "example/current": ["warn", { existing: true }],
      "example/disabled": "off",
    });
    expect(policy["example/current"]).toEqual([
      "warn",
      { existing: true, newer: false },
    ]);
  });

  it("keeps all explicit options accepted by the installed schema", () => {
    const policy = {
      "example/current": ["error", { existing: true, newer: false }],
    } satisfies Rules;

    expect(
      supportedPluginPolicy("example", policy, {
        current: {
          meta: {
            schema: [
              {
                additionalProperties: false,
                properties: {
                  existing: { type: "boolean" },
                  newer: { type: "boolean" },
                },
                type: "object",
              },
            ],
          },
        },
      }),
    ).toEqual(policy);
  });

  it("preserves scalar options and open-ended compiler options", () => {
    const policy = {
      "example/compiler": ["error", { environment: { custom: true } }],
      "example/style": ["off", "always"],
    } satisfies Rules;

    expect(
      supportedPluginPolicy("example", policy, {
        compiler: { meta: { schema: [{ type: "object" }] } },
        style: { meta: { schema: [{ enum: ["always", "never"] }] } },
      }),
    ).toEqual(policy);
  });
});
