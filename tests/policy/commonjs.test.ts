import type { Options } from "../../src/types.js";
import type { ResolvedConfig as EffectiveConfig } from "../support/resolved-config.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";
import { getResolvedConfig } from "../support/resolved-config.js";

// Every feature on, typed linting included, so that a block of any feature that still matched
// CommonJS files would show.
const allFeatures = {
  express: true,
  projectRootDirectory: process.cwd(),
  react: true,
  svelte: true,
  typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
} as const satisfies Options;
// Files of a feature that name the CommonJS extensions next to those of ES modules.
const withCommonJs = { files: ["**/*.{js,cjs,ts,cts}"] } as const;

const createEslint = async (options: Options): Promise<ESLint> => {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
};

// What `select` reads from the configuration for each of `filePaths`, by path. The
// configuration is `undefined` for a file that no block's `files` matches.
const describeByPath = async <Value>(
  eslint: ESLint,
  filePaths: readonly string[],
  select: (config: EffectiveConfig | undefined) => Value,
): Promise<Readonly<Record<string, Value>>> => {
  return Object.fromEntries(
    await Promise.all(
      filePaths.map(async (filePath): Promise<readonly [string, Value]> => {
        const config = await getResolvedConfig(eslint, filePath);
        return [filePath, select(config)];
      }),
    ),
  );
};

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
      await describeByPath(eslint, Object.keys(expected), (config) => {
        return Object.keys(config?.rules ?? {}).length;
      }),
    ).toEqual(expected);
  });

  // `files` limits a feature to some of its default files, which hold no CommonJS file.
  it("get no rules from a feature whose files name them", async () => {
    const eslint = await createEslint({
      ...allFeatures,
      comments: withCommonJs,
      express: withCommonJs,
      functional: withCommonJs,
      imports: withCommonJs,
      javascript: withCommonJs,
      node: withCommonJs,
      perfectionist: withCommonJs,
      promise: withCommonJs,
      react: withCommonJs,
      regexp: withCommonJs,
      security: withCommonJs,
      typescript: { ...allFeatures.typescript, ...withCommonJs },
      unicorn: withCommonJs,
      unusedImports: withCommonJs,
    });
    const expected = {
      "eslint.config.cjs": false,
      "src/example.cjs": false,
      "src/example.cts": false,
      "src/example.d.cts": false,
      "src/example.js": true,
      "src/example.test.cts": false,
      "src/example.ts": true,
    };

    expect(
      await describeByPath(eslint, Object.keys(expected), (config) => {
        return Object.keys(config?.rules ?? {}).length > 0;
      }),
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
      await describeByPath(eslint, Object.keys(expected), (config) => {
        return config?.languageOptions?.sourceType;
      }),
    ).toEqual(expected);
  });
});
