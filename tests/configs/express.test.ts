import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { express } from "../../src/configs/express.js";

type EffectiveConfig = {
  readonly rules?: Readonly<Record<string, readonly [number, ...unknown[]]>>;
};

async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}

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

    expect(server?.rules?.["express-security/require-helmet"]).toEqual([0]);
    expect(server?.rules?.["express-security/require-rate-limiting"]).toEqual([
      2,
    ]);
    expect(component).toBeUndefined();
  });
});
