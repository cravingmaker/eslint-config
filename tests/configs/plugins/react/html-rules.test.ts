import type { ReactOptions } from "../../../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";

const ruleIds = new Set([
  "@html-eslint/react/id-naming-convention",
  "@html-eslint/react/no-restricted-tags",
  "@html-eslint/react/require-li-container",
]);
const code =
  'export const Example = () => <div id="mainPanel"><b><li>Item</li></b></div>;';
const lintNewRules = async (
  filePath: string,
  options: Readonly<ReactOptions>,
  source: string = code,
) => {
  const eslint = new ESLint({
    overrideConfig: await createConfig({
      express: false,
      react: { ...options, refresh: false },
      svelte: false,
      typescript: { typeChecked: false },
      vitest: false,
    }),
    overrideConfigFile: true,
  });
  const results = await eslint.lintText(source, { filePath });
  const messages = results.flatMap((result) => {
    return result.messages;
  });
  expect(
    messages.filter((message) => {
      return message.fatal === true;
    }),
  ).toEqual([]);
  return messages
    .filter((message) => {
      return ruleIds.has(message.ruleId ?? "");
    })
    .map(({ ruleId, severity }) => {
      return { ruleId, severity };
    });
};

describe.each(["src/Example.jsx", "src/Example.tsx"])(
  "HTML React policy in %s",
  (filePath) => {
    it("uses the HTML naming, semantic-tag warning, and list-container policies", async () => {
      expect(await lintNewRules(filePath, {})).toEqual([
        { ruleId: "@html-eslint/react/id-naming-convention", severity: 2 },
        { ruleId: "@html-eslint/react/no-restricted-tags", severity: 1 },
        { ruleId: "@html-eslint/react/require-li-container", severity: 2 },
      ]);
      expect(
        await lintNewRules(
          filePath,
          {},
          'export const Example = () => <ul id="main-panel"><li><strong>Item</strong></li></ul>;',
        ),
      ).toEqual([]);
    });

    it("keeps the new rules within the feature's files and ignores", async () => {
      expect(await lintNewRules(filePath, { files: ["app/**"] })).toEqual([]);
      expect(await lintNewRules(filePath, { ignores: ["src/**"] })).toEqual([]);
    });

    it("accepts feature overrides for the naming, restricted tags, and severity", async () => {
      expect(
        await lintNewRules(filePath, {
          overrides: {
            "@html-eslint/react/id-naming-convention": ["error", "camelCase"],
            "@html-eslint/react/no-restricted-tags": [
              "warn",
              { tagPatterns: ["^em$"] },
            ],
            "@html-eslint/react/require-li-container": "off",
          },
        }),
      ).toEqual([]);
    });
  },
);
