import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { svelte } from "../../src/configs/svelte.js";
import { expectLintError } from "../utilities.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parser?: { readonly meta?: { readonly name?: string } };
    readonly parserOptions?: {
      readonly parser?: { readonly meta?: { readonly name?: string } };
    };
  };
};

const svelteOptions = { filePath: "component.svelte" } as const;

async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}

describe("svelte feature", () => {
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
      configs.map((config) => [
        config?.languageOptions?.parser?.meta?.name,
        config?.languageOptions?.parserOptions?.parser?.meta?.name,
      ]),
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

  it("@html-eslint/svelte/class-spacing: reports repeated spacing in class attributes", async () => {
    await expectLintError(
      `<div class="stack  center">Hello</div>\n`,
      "@html-eslint/svelte/class-spacing",
      svelteOptions,
    );
  });

  it("@html-eslint/svelte/no-duplicate-class: reports duplicate class tokens", async () => {
    await expectLintError(
      `<div class="stack stack">Hello</div>\n`,
      "@html-eslint/svelte/no-duplicate-class",
      svelteOptions,
    );
  });
});
