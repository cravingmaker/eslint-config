import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";
import { svelte } from "../../../../src/configs/plugins/svelte/index.js";
import { expectLintError } from "../../../support/lint.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parser?: {
      readonly meta?: { readonly name?: string };
      readonly name?: string;
    };
    readonly parserOptions?: {
      readonly parser?: { readonly meta?: { readonly name?: string } };
    };
  };
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};

const svelteOptions = { filePath: "component.svelte" } as const;

const getEffectiveConfig = async (
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
};

const parserName = (
  config: EffectiveConfig | undefined,
): string | undefined => {
  const parser = config?.languageOptions?.parser;
  return parser?.meta?.name ?? parser?.name;
};

describe("svelte feature", () => {
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
