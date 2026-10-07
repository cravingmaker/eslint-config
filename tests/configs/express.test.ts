import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { express } from "../../src/configs/express.js";
import { expectLintError } from "../utilities.js";

type EffectiveConfig = {
  readonly rules?: Readonly<Record<string, readonly [number, ...unknown[]]>>;
};

const expressOptions = { filePath: "server.js" } as const;

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

describe("express-security rules", () => {
  it("express-security/require-helmet: reports missing helmet middleware", async () => {
    await expectLintError(
      `import express from 'express';\nexpress().set('view engine', 'pug');\n`,
      "express-security/require-helmet",
      expressOptions,
    );
  });

  it("express-security/no-insecure-cookie-options: reports cookie without secure flag", async () => {
    await expectLintError(
      `import express from 'express';\nconst app = express();\napp.get('/', (req, res) => res.cookie('session', 'abc', { httpOnly: true }));\n`,
      "express-security/no-insecure-cookie-options",
      expressOptions,
    );
  });
});
