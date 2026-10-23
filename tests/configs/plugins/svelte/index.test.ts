import type { ResolvedConfig as EffectiveConfig } from "../../../support/resolved-config.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";
import { svelte } from "../../../../src/configs/plugins/svelte/index.js";
import { expectLintError } from "../../../support/lint.js";
import { getResolvedConfig as getEffectiveConfig } from "../../../support/resolved-config.js";

const svelteOptions = { filePath: "component.svelte" } as const;
const componentScope = {
  files: ["app/**", "shared/**"],
  ignores: [
    "**/generated/**",
    "!**/generated/Kept*.svelte",
    "**/KeptIgnored.svelte",
  ],
} as const;

const restoredSeverities = {
  eqeqeq: 2,
  "@eslint-community/eslint-comments/no-unlimited-disable": 2,
  "functional/no-let": 0,
  "functional/no-return-void": 0,
  "import-x/unambiguous": 0,
  "n/no-sync": 0,
  "no-undef": 0,
  "perfectionist/sort-objects": 2,
  "promise/param-names": 2,
  "regexp/no-empty-group": 2,
  "security/detect-object-injection": 1,
  "sonarjs/no-all-duplicated-branches": 2,
  "@stylistic/spaced-comment": 2,
  "@typescript-eslint/no-explicit-any": 2,
  "unicorn/no-null": 2,
  "unicorn/no-top-level-assignment-in-function": 0,
  "unused-imports/no-unused-imports": 2,
} as const;

const parserName = (
  config: EffectiveConfig | undefined,
): string | undefined => {
  const parser = config?.languageOptions?.parser;
  return parser?.meta?.name ?? parser?.name;
};

describe("svelte feature", () => {
  it.each(["app/generated/Kept.svelte", "shared/generated/Kept.svelte"])(
    "restores source rules, component exceptions, and fixes in %s",
    async (filePath) => {
      const configs = await createConfig({ svelte: componentScope });
      const eslint = new ESLint({
        overrideConfig: configs,
        overrideConfigFile: true,
      });
      const config = await getEffectiveConfig(eslint, filePath);
      expect(parserName(config)).toBe("svelte-eslint-parser");
      expect(
        Object.fromEntries(
          Object.keys(restoredSeverities).map((ruleId) => {
            // eslint-disable-next-line security/detect-object-injection -- Rule IDs come from the fixed severity fixture and only inspect ESLint's calculated rules.
            return [ruleId, config?.rules?.[ruleId]?.[0]];
          }),
        ),
      ).toEqual(restoredSeverities);

      const source =
        '<script lang="ts">\nconst value: number = 1;\nconst same = value == 2;\n</script>\n<p>{same}</p>\n';
      const [result] = await eslint.lintText(source, { filePath });
      expect(result.fatalErrorCount).toBe(0);
      expect(result.messages).toContainEqual(
        expect.objectContaining({ ruleId: "eqeqeq", severity: 2 }),
      );

      const fixing = new ESLint({
        fix: true,
        overrideConfig: configs,
        overrideConfigFile: true,
      });
      const [restored] = await fixing.lintText(source, { filePath });
      const [ordinary] = await fixing.lintText(source, {
        filePath: "app/Kept.svelte",
      });
      expect(restored.fatalErrorCount).toBe(0);
      expect(restored.output).toBe(ordinary.output);
      expect(restored.messages).toEqual(ordinary.messages);
    },
  );

  it("keeps later exclusions, caller narrowing, and unsupported suffix routing", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        svelte: componentScope,
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });
    const excluded = [
      "app/generated/Skipped.svelte",
      "app/generated/KeptIgnored.svelte",
      "outside/generated/Kept.svelte",
    ];
    expect(
      await Promise.all(
        excluded.map(async (filePath) => {
          return await eslint.isPathIgnored(filePath);
        }),
      ),
    ).toEqual([true, true, true]);
    expect(
      parserName(
        await getEffectiveConfig(eslint, "app/generated/Kept.svelte.mjs"),
      ),
    ).toBe("espree");
    expect(
      parserName(
        await getEffectiveConfig(eslint, "app/generated/Kept.svelte.mts"),
      ),
    ).toBe("typescript-eslint/parser");
  });

  it("keeps source-feature scopes and consumer overrides on restored components", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig(
        {
          security: { ignores: ["**/generated/**"] },
          svelte: componentScope,
          unicorn: { files: ["shared/**"] },
        },
        { files: ["app/**/*.svelte"], rules: { eqeqeq: "off" } },
      ),
      overrideConfigFile: true,
    });
    const config = await getEffectiveConfig(
      eslint,
      "app/generated/Kept.svelte",
    );
    expect(config?.rules?.eqeqeq[0]).toBe(0);
    expect(config?.rules?.["security/detect-object-injection"]).toBeUndefined();
    expect(config?.rules?.["unicorn/no-null"]).toBeUndefined();
    const [result] = await eslint.lintText(
      '<script lang="ts">const value: number = 1; const same = value == 2;</script><p>{same}</p>',
      {
        filePath: "app/generated/Kept.svelte",
      },
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.some(({ ruleId }) => {
        return ruleId === "eqeqeq";
      }),
    ).toBe(false);
  });

  it.each([
    ["Component.svelte", "svelte-eslint-parser"],
    ["state.svelte.js", "svelte-eslint-parser"],
    ["state.svelte.ts", "svelte-eslint-parser"],
    ["options.svelte.mjs", "espree"],
    ["options.svelte.mts", "typescript-eslint/parser"],
  ])("selects the supported parser for %s", async (filePath, parser) => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        svelte: true,
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });
    expect(await eslint.isPathIgnored(filePath)).toBe(false);
    const config = await getEffectiveConfig(eslint, filePath);
    expect(parserName(config)).toBe(parser);
    const svelteRules = Object.keys(config?.rules ?? {}).filter((ruleId) => {
      return ruleId.startsWith("@html-eslint/svelte/");
    });
    expect(svelteRules).toHaveLength(
      parser === "svelte-eslint-parser" ? 10 : 0,
    );
  });

  it.each(["options.svelte.mjs", "options.svelte.mts"])(
    "lints ordinary module syntax and equality in %s",
    async (filePath) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig({
          svelte: true,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const [result] = await eslint.lintText(
        "export const options = { value: 1 };\nexport const check = 1 == 1;\n",
        { filePath },
      );
      expect(result.fatalErrorCount).toBe(0);
      expect(result.messages).toContainEqual(
        expect.objectContaining({ ruleId: "eqeqeq", severity: 2 }),
      );
    },
  );

  it.each(["state.svelte.js", "state.svelte.ts"])(
    "keeps rune parsing in %s",
    async (filePath) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig({
          svelte: true,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const [result] = await eslint.lintText(
        "export const state = $state({ count: 0 });\n",
        { filePath },
      );
      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.map(({ ruleId }) => {
          return ruleId;
        }),
      ).not.toContain("no-undef");
    },
  );

  it("keeps extra suffixes outside rune support", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        svelte: true,
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      "export const state = $state({ count: 0 });\n",
      { filePath: "state.svelte.mjs" },
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).toContainEqual(
      expect.objectContaining({
        message: "'$state' is not defined.",
        ruleId: "no-undef",
      }),
    );
  });

  it.each([
    false,
    { files: ["app/**"] },
    { ignores: ["**/state.svelte.js"] },
  ] as const)(
    "preserves ordinary routing when Svelte is disabled or excludes the file: %j",
    async (featureOptions) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig({
          svelte: featureOptions,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const config = await getEffectiveConfig(eslint, "state.svelte.js");
      expect(config?.languageOptions?.parser?.name).toBe("espree");
      const [result] = await eslint.lintText("export const check = 1 == 1;\n", {
        filePath: "state.svelte.js",
      });
      expect(result.fatalErrorCount).toBe(0);
      expect(result.messages).toContainEqual(
        expect.objectContaining({ ruleId: "eqeqeq" }),
      );
    },
  );

  it("parses Svelte files with svelte-eslint-parser and TypeScript script blocks", async () => {
    const eslint = new ESLint({
      overrideConfig: await svelte(),
      overrideConfigFile: true,
    });
    const configs = await Promise.all([
      getEffectiveConfig(eslint, "src/Component.svelte"),
      getEffectiveConfig(eslint, "src/state.svelte.ts"),
    ]);

    expect(
      configs.map((config) => {
        return [
          config?.languageOptions?.parser?.meta?.name,
          config?.languageOptions?.parserOptions?.parser?.meta?.name,
        ];
      }),
    ).toEqual([
      ["svelte-eslint-parser", "typescript-eslint/parser"],
      ["svelte-eslint-parser", "typescript-eslint/parser"],
    ]);
  });
});

describe("html svelte rules", () => {
  it("parses TypeScript script blocks before applying Svelte rules", async () => {
    await expectLintError(
      '<script lang="ts">\n\tconst count: number = 1;\n</script>\n<div class="stack  center">{count}</div>\n',
      "@html-eslint/svelte/class-spacing",
      svelteOptions,
    );
  });
});
