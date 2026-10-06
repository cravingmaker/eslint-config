/* eslint-disable functional/no-return-void -- Vitest suites are side-effect driven */

import type { Linter } from "eslint";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

const rootDirectory = process.cwd();
const filePaths = [
  "data.json",
  "data.json5",
  "data.jsonc",
  "index.html",
  "package.json",
  "README.md",
  "src/Component.svelte",
  "src/example.js",
  "src/example.jsx",
  "src/example.ts",
  "src/example.tsx",
  "src/state.svelte.ts",
] as const;

async function getOffRuleIds(
  eslint: ESLint,
  filePath: string,
): Promise<readonly string[]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return Object.entries(config?.rules ?? {})
    .filter(([, entry]) => entry[0] === 0)
    .map(([ruleId]) => ruleId);
}

/*
ESLint validates rule options only while a rule is enabled, and a later config
that enables a rule with a bare severity keeps the options configured before.
A rule that is off must therefore still carry options that its schema accepts.
*/
describe.each([false, true])(
  "rule options with typed linting %s",
  (typeChecked) => {
    it.each(filePaths)(
      "stay valid when a later config enables an off rule in %s",
      async (filePath) => {
        const config = await createConfig({
          express: true,
          projectRootDirectory: rootDirectory,
          react: { refresh: "generic" },
          svelte: true,
          typescript: { tsconfigRootDir: rootDirectory, typeChecked },
        });
        const offRuleIds = await getOffRuleIds(
          new ESLint({ overrideConfig: config, overrideConfigFile: true }),
          filePath,
        );
        const enableOffRules: Linter.Config = {
          files: ["**/*"],
          name: "test/enable-off-rules",
          rules: Object.fromEntries(
            offRuleIds.map((ruleId) => [ruleId, "error"]),
          ),
        };
        const eslint = new ESLint({
          overrideConfig: [...config, enableOffRules],
          overrideConfigFile: true,
        });

        await expect(
          eslint.calculateConfigForFile(filePath),
        ).resolves.toBeDefined();
      },
    );
  },
);
