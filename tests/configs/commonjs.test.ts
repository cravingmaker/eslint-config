import type { Options } from "../../src/types.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";

type EffectiveConfig = {
  readonly languageOptions?: { readonly sourceType?: string };
  readonly rules?: Readonly<Record<string, unknown>>;
};

// Every feature on, typed linting included, so that a block of any feature that still matched
// CommonJS files would show.
const allFeatures = {
  express: true,
  projectRootDirectory: process.cwd(),
  react: true,
  svelte: true,
  typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
} as const satisfies Options;

async function createEslint(options: Options): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
}
// What `select` reads from the configuration for each of `filePaths`, by path. The
// configuration is `undefined` for a file that no block's `files` matches.
async function describeByPath<Value>(
  eslint: ESLint,
  filePaths: readonly string[],
  select: (config: EffectiveConfig | undefined) => Value,
): Promise<Readonly<Record<string, Value>>> {
  return Object.fromEntries(
    await Promise.all(
      filePaths.map(async (filePath): Promise<readonly [string, Value]> => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
        const config = (await eslint.calculateConfigForFile(filePath)) as
          EffectiveConfig | undefined;
        return [filePath, select(config)];
      }),
    ),
  );
}

describe("CommonJS files", () => {
  it("get no rules from any feature", async () => {
    const eslint = await createEslint(allFeatures);
    // Including a config file and a test file, which have file-role exceptions as ES modules.
    const expected = {
      "eslint.config.cjs": 0,
      "packages/app/scripts/example.cjs": 0,
      "src/example.cjs": 0,
      "src/example.cts": 0,
      "src/example.d.cts": 0,
      "src/example.test.cts": 0,
    };

    expect(
      await describeByPath(
        eslint,
        Object.keys(expected),
        (config) => Object.keys(config?.rules ?? {}).length,
      ),
    ).toEqual(expected);
  });

  it("leave the ES module sources linted as modules", async () => {
    const eslint = await createEslint(allFeatures);
    const expected = {
      "src/example.d.mts": "module",
      "src/example.d.ts": "module",
      "src/example.js": "module",
      "src/example.jsx": "module",
      "src/example.mjs": "module",
      "src/example.mts": "module",
      "src/example.ts": "module",
      "src/example.tsx": "module",
    };

    expect(
      await describeByPath(
        eslint,
        Object.keys(expected),
        (config) => config?.languageOptions?.sourceType,
      ),
    ).toEqual(expected);
  });
});
