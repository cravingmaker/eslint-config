import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { express } from "../../../../src/configs/plugins/express/index.js";
import { getResolvedConfig as getEffectiveConfig } from "../../../support/resolved-config.js";

describe("express feature", () => {
  it("lints ES module sources with eslint-plugin-express-security", async () => {
    const eslint = new ESLint({
      overrideConfig: await express({
        overrides: { "express-security/require-helmet": "off" },
      }),
      overrideConfigFile: true,
    });
    const [server, component] = await Promise.all([
      getEffectiveConfig(eslint, "src/server.ts"),
      getEffectiveConfig(eslint, "src/Component.tsx"),
    ]);

    expect(server?.rules?.["express-security/require-helmet"]?.[0]).toBe(0);
    expect(server?.rules?.["express-security/require-rate-limiting"]).toEqual([
      2,
      {
        allowInTests: false,
        alternativeMiddleware: [],
        appReceiverNames: [
          "app",
          "server",
          "router",
          "express",
          "api",
          "apiRouter",
          "routes",
        ],
        assumeRateLimiting: false,
      },
    ]);
    expect(component).toBeUndefined();
  });
});
