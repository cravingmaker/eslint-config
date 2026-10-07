import type { Linter } from "eslint";
import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { imports } from "../../src/configs/imports.js";
import { defaultContext } from "../../src/context.js";
import { expectLintError } from "../utilities.js";

const svelteContext: Context = {
  ...defaultContext,
  svelteComponents: [["**/*.svelte", "!**/generated/**"]],
};

async function getSettings(
  eslint: ESLint,
  filePath: string,
): Promise<Linter.Config["settings"]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    Pick<Linter.Config, "settings"> | undefined;
  return config?.settings;
}

describe("imports feature", () => {
  it("resolves imports in TypeScript files through the TypeScript resolver", async () => {
    const eslint = new ESLint({
      overrideConfig: imports(),
      overrideConfigFile: true,
    });
    const [typescriptSettings, javascriptSettings] = await Promise.all([
      getSettings(eslint, "src/example.ts"),
      getSettings(eslint, "src/example.js"),
    ]);

    expect(typescriptSettings?.["import-x/resolver-next"]).toEqual([
      expect.objectContaining({ name: "eslint-import-resolver-typescript" }),
      expect.objectContaining({ name: "eslint-plugin-import-x:node" }),
    ]);
    expect(javascriptSettings?.["import-x/resolver-next"]).toBeUndefined();
  });

  it("resolves imports in Svelte components through the TypeScript resolver", async () => {
    const eslint = new ESLint({
      overrideConfig: imports({}, svelteContext),
      overrideConfigFile: true,
    });
    const settings = await getSettings(eslint, "src/Component.svelte");

    expect(settings?.["import-x/resolver-next"]).toEqual([
      expect.objectContaining({ name: "eslint-import-resolver-typescript" }),
      expect.objectContaining({ name: "eslint-plugin-import-x:node" }),
    ]);
  });
});

describe("import-x rules", () => {
  it("import-x/extensions: requires explicit JavaScript file extensions for relative imports", async () => {
    await expectLintError(
      `import { value } from './fixture';\nconsole.log(value);\n`,
      "import-x/extensions",
      {
        filePath: "test.js",
      },
    );
  });
});
