import type { FeatureOptions } from "../../../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";

const ruleIds = new Set([
  "@html-eslint/svelte/id-naming-convention",
  "@html-eslint/svelte/no-restricted-tags",
  "@html-eslint/svelte/require-li-container",
]);
const code = '<div id="mainPanel"><b><li>Item</li></b></div>';
const lintNewRules = async (
  options: Readonly<FeatureOptions>,
  source: string = code,
) => {
  const eslint = new ESLint({
    overrideConfig: await createConfig({
      express: false,
      react: false,
      svelte: options,
      typescript: { typeChecked: false },
      vitest: false,
    }),
    overrideConfigFile: true,
  });
  const results = await eslint.lintText(source, {
    filePath: "src/Example.svelte",
  });
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

describe("HTML Svelte policy", () => {
  it.each(["", '<script lang="ts">const count: number = 1;</script>'])(
    "uses the HTML naming, semantic-tag warning, and list-container policies with %s",
    async (script) => {
      expect(await lintNewRules({}, `${script}${code}`)).toEqual([
        { ruleId: "@html-eslint/svelte/id-naming-convention", severity: 2 },
        { ruleId: "@html-eslint/svelte/no-restricted-tags", severity: 1 },
        { ruleId: "@html-eslint/svelte/require-li-container", severity: 2 },
      ]);
      expect(
        await lintNewRules(
          {},
          `${script}<ul id="main-panel"><li><strong>Item</strong></li></ul>`,
        ),
      ).toEqual([]);
    },
  );

  it("keeps the new rules within the feature's files and ignores", async () => {
    expect(await lintNewRules({ files: ["app/**"] })).toEqual([]);
    expect(await lintNewRules({ ignores: ["src/**"] })).toEqual([]);
  });

  it("accepts feature overrides for the naming, restricted tags, and severity", async () => {
    expect(
      await lintNewRules({
        overrides: {
          "@html-eslint/svelte/id-naming-convention": ["error", "camelCase"],
          "@html-eslint/svelte/no-restricted-tags": [
            "warn",
            { tagPatterns: ["^em$"] },
          ],
          "@html-eslint/svelte/require-li-container": "off",
        },
      }),
    ).toEqual([]);
  });
});
