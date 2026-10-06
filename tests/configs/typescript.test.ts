/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { typescript } from "../../src/configs/typescript/index.js";
import { defaultContext } from "../../src/context.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parserOptions?: Readonly<Record<string, unknown>>;
  };
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};

const typedContext: Context = {
  ...defaultContext,
  tsconfigRootDir: "/project",
  typeAware: { files: ["**/*.ts"], ignores: [] },
};

async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}

describe("typescript feature", () => {
  it("parses TypeScript files in a parser block and sets its rules in a rules block", async () => {
    const configs = await typescript();

    expect(configs.map((config) => config.name)).toEqual([
      "@cravingmaker/eslint-config/typescript/parser",
      "@cravingmaker/eslint-config/typescript/rules",
    ]);
    expect(Object.keys(configs[0]?.plugins ?? {})).toEqual([
      "@typescript-eslint",
    ]);
  });

  it("turns off the rules that need type information without it", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(),
      overrideConfigFile: true,
    });
    const config = await getEffectiveConfig(eslint, "src/example.ts");

    expect(config?.languageOptions?.parserOptions).toEqual({});
    expect(config?.rules?.["@typescript-eslint/no-floating-promises"]).toEqual([
      0,
    ]);
    expect(config?.rules?.["require-await"]).toBeUndefined();
  });

  it("turns on the rules that need type information with typed linting", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript({}, typedContext),
      overrideConfigFile: true,
    });
    const config = await getEffectiveConfig(eslint, "src/example.ts");

    expect(config?.languageOptions?.parserOptions).toEqual({
      projectService: true,
      tsconfigRootDir: "/project",
    });
    expect(
      config?.rules?.["@typescript-eslint/no-floating-promises"]?.[0],
    ).toBe(2);
    expect(config?.rules?.["require-await"]).toEqual([0]);
  });

  it("keeps files, ignores, and overrides local to the feature", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript({
        files: ["app/**/*.ts"],
        ignores: ["**/*.generated.ts"],
        overrides: { "@typescript-eslint/no-explicit-any": "off" },
      }),
      overrideConfigFile: true,
    });
    const [included, excluded, outside] = await Promise.all([
      getEffectiveConfig(eslint, "app/example.ts"),
      getEffectiveConfig(eslint, "app/example.generated.ts"),
      getEffectiveConfig(eslint, "scripts/example.ts"),
    ]);

    expect(included?.rules?.["@typescript-eslint/no-explicit-any"]).toEqual([
      0,
    ]);
    expect(excluded).toBeUndefined();
    expect(outside).toBeUndefined();
  });
});
