/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { express } from "../../src/configs/express.js";
import { react } from "../../src/configs/react.js";
import { svelte } from "../../src/configs/svelte.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parser?: { readonly meta?: { readonly name?: string } };
    readonly parserOptions?: {
      readonly parser?: { readonly meta?: { readonly name?: string } };
    };
  };
  readonly plugins?: Readonly<Record<string, unknown>>;
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};

async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}

describe("react feature", () => {
  it("adds one block per installed React plugin for component files", async () => {
    const configs = await react();
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const [component, module] = await Promise.all([
      getEffectiveConfig(eslint, "src/Component.tsx"),
      getEffectiveConfig(eslint, "src/module.ts"),
    ]);

    expect(configs.map((config) => config.name)).toEqual([
      "@cravingmaker/eslint-config/react/html",
      "@cravingmaker/eslint-config/react/hooks",
      "@cravingmaker/eslint-config/react/refresh",
    ]);
    expect(
      Object.keys(component?.plugins ?? {}).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(["@", "@html-eslint/react", "react-hooks", "react-refresh"]);
    expect(component?.rules?.["react-hooks/rules-of-hooks"]).toEqual([2]);
    expect(module?.rules).toBeUndefined();
  });

  it.each([
    ["generic", false],
    ["next", false],
    ["vite", true],
  ] as const)(
    "configures React Refresh for the %s variant",
    async (refresh, allowConstantExport) => {
      const eslint = new ESLint({
        overrideConfig: await react({ refresh }),
        overrideConfigFile: true,
      });
      const config = await getEffectiveConfig(eslint, "src/Component.jsx");

      expect(
        config?.rules?.["react-refresh/only-export-components"],
      ).toMatchObject([1, { allowConstantExport }]);
    },
  );

  it("leaves React Refresh out when it is off", async () => {
    const configs = await react({ refresh: false });

    expect(configs.map((config) => config.name)).not.toContain(
      "@cravingmaker/eslint-config/react/refresh",
    );
  });
});

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

describe("express feature", () => {
  it("lints ES module sources with eslint-plugin-express-security", async () => {
    const eslint = new ESLint({
      overrideConfig: await express({
        overrides: { "express-security/require-helmet": "off" },
      }),
      overrideConfigFile: true,
    });
    const [server, component] = await Promise.all([
      getEffectiveConfig(eslint, "src/server.ts"),
      getEffectiveConfig(eslint, "src/Component.tsx"),
    ]);

    expect(server?.rules?.["express-security/require-helmet"]).toEqual([0]);
    expect(server?.rules?.["express-security/require-rate-limiting"]).toEqual([
      2,
    ]);
    expect(component).toBeUndefined();
  });
});
