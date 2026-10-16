import type { Rules } from "../src/types.js";

import { describe, expect, it } from "vitest";

import {
  supportedPluginPolicy,
  supportedRuleOptions,
} from "../src/utilities/plugin-policy.js";

describe("supported rule policy", () => {
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
