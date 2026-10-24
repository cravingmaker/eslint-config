import type { Context } from "../../../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { core } from "../../../../src/configs/core/index.js";
import { typescript } from "../../../../src/configs/plugins/typescript/index.js";
import { defaultContext } from "../../../../src/context.js";
import { getResolvedConfig as getEffectiveConfig } from "../../../support/resolved-config.js";

const typedContext: Context = {
  ...defaultContext,
  tsconfigRootDir: "/project",
  typeAware: ["**/*.ts"],
};
const untypedContext: Context = { ...defaultContext, typeAware: undefined };

describe("typescript feature", () => {
  it.each([false, true])(
    "keeps native unused-variable checks off after a core override and preserves inherited options with typed linting %s",
    async (typeChecked) => {
      const context = typeChecked ? defaultContext : untypedContext;
      const eslint = new ESLint({
        overrideConfig: [
          {
            rules: {
              "no-unused-vars": [
                "error",
                { args: "none", vars: "local", varsIgnorePattern: "^saved" },
              ],
            },
          },
          ...core({ overrides: { "no-unused-vars": "warn" } }),
          ...(await typescript({}, context)),
        ],
        overrideConfigFile: true,
      });
      const javascript = await getEffectiveConfig(eslint, "src/example.js");
      const typed = await getEffectiveConfig(eslint, "tests/support/lint.ts");
      const inheritedOptions = {
        args: "none",
        vars: "local",
        varsIgnorePattern: "^saved",
      };
      const javascriptEntry = javascript?.rules?.["no-unused-vars"];
      const typedEntry = typed?.rules?.["no-unused-vars"];
      expect(javascriptEntry).toEqual([
        1,
        expect.objectContaining(inheritedOptions),
      ]);
      expect(typedEntry).toEqual([
        0,
        expect.objectContaining(inheritedOptions),
      ]);
      expect(typedEntry?.slice(1)).toEqual(javascriptEntry?.slice(1));
      const results = await Promise.all(
        ["src/example.js", "tests/support/lint.ts"].map(async (filePath) => {
          return await eslint.lintText("const unused = 1;\n", { filePath });
        }),
      );
      const messages = results.map((entries) => {
        return entries.flatMap((result) => {
          return result.messages;
        });
      });
      expect(
        messages.flat().some((message) => {
          return message.fatal === true;
        }),
      ).toBe(false);
      expect(
        messages.map((entries) => {
          return entries
            .filter((message) => {
              return message.ruleId === "no-unused-vars";
            })
            .map((message) => {
              return message.severity;
            });
        }),
      ).toEqual([[1], []]);
    },
  );

  it("parses TypeScript files in a parser block and sets its rules in a rules block, with type information by default", async () => {
    const configs = await typescript();

    expect(
      configs.map((config) => {
        return config.name;
      }),
    ).toEqual([
      "@cravingmaker/eslint-config/typescript/parser",
      "@cravingmaker/eslint-config/typescript/parser-type-aware",
      "@cravingmaker/eslint-config/typescript/rules",
      "@cravingmaker/eslint-config/typescript/rules-type-aware",
      "@cravingmaker/eslint-config/typescript/rules-type-aware-tsx",
    ]);
    expect(Object.keys(configs[0]?.plugins ?? {})).toEqual([
      "@typescript-eslint",
    ]);
  });

  it("turns off the rules that need type information without it", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript({}, untypedContext),
      overrideConfigFile: true,
    });
    const config = await getEffectiveConfig(eslint, "src/example.ts");

    expect(config?.languageOptions?.parserOptions).toEqual({});
    expect(config?.rules?.["@typescript-eslint/no-floating-promises"]).toEqual([
      0,
    ]);
    expect(config?.rules?.["require-await"]).toBeUndefined();
  });

  it("turns on the rules that need type information with typed linting", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript({}, typedContext),
      overrideConfigFile: true,
    });
    const config = await getEffectiveConfig(eslint, "src/example.ts");

    expect(config?.languageOptions?.parserOptions).toEqual({
      projectService: true,
      tsconfigRootDir: "/project",
    });
    expect(
      config?.rules?.["@typescript-eslint/no-floating-promises"]?.[0],
    ).toBe(2);
    expect(config?.rules?.["require-await"]).toEqual([0]);
  });

  it("reads type information only in the type-aware scope", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        {},
        {
          ...typedContext,
          typeAware: [["src/**/*.ts", "!src/legacy/**"]],
        },
      ),
      overrideConfigFile: true,
    });
    const configs = await Promise.all(
      ["src/example.ts", "src/legacy/example.ts", "scripts/example.ts"].map(
        async (filePath) => {
          return await getEffectiveConfig(eslint, filePath);
        },
      ),
    );

    expect(
      configs.map((config) => {
        return config?.languageOptions?.parserOptions;
      }),
    ).toEqual([{ projectService: true, tsconfigRootDir: "/project" }, {}, {}]);
  });

  it("lints the Svelte components of the context without type information", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        {},
        { ...typedContext, svelteComponents: ["**/*.svelte"] },
      ),
      overrideConfigFile: true,
    });
    const component = await getEffectiveConfig(eslint, "src/Component.svelte");

    expect(component?.languageOptions?.parserOptions).toEqual({});
    expect(component?.rules?.["@typescript-eslint/no-explicit-any"]?.[0]).toBe(
      2,
    );
    expect(
      component?.rules?.["@typescript-eslint/no-floating-promises"],
    ).toEqual([0]);
  });

  it("keeps files, ignores, and overrides local to the feature", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        {
          files: ["app/**/*.ts"],
          ignores: ["**/*.generated.ts"],
          overrides: { "@typescript-eslint/no-explicit-any": "off" },
        },
        untypedContext,
      ),
      overrideConfigFile: true,
    });
    const [included, excluded, outside] = await Promise.all([
      getEffectiveConfig(eslint, "app/example.ts"),
      getEffectiveConfig(eslint, "app/example.generated.ts"),
      getEffectiveConfig(eslint, "scripts/example.ts"),
    ]);

    expect(included?.rules?.["@typescript-eslint/no-explicit-any"]?.[0]).toBe(
      0,
    );
    expect(excluded).toBeUndefined();
    expect(outside).toBeUndefined();
  });

  it("keeps to TypeScript files and the Svelte components of the context within a directory that is its files", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        { files: ["app/**"] },
        { ...untypedContext, svelteComponents: ["**/*.svelte"] },
      ),
      overrideConfigFile: true,
    });
    const [source, component, script, ...others] = await Promise.all(
      [
        "app/example.ts",
        "app/Component.svelte",
        "app/example.js",
        "app/data.json",
        "lib/example.ts",
        "lib/Component.svelte",
      ].map(async (filePath) => {
        return await getEffectiveConfig(eslint, filePath);
      }),
    );

    expect(source?.rules?.["@typescript-eslint/no-explicit-any"]?.[0]).toBe(2);
    expect(component?.rules?.["@typescript-eslint/no-explicit-any"]?.[0]).toBe(
      2,
    );
    // ESLint's own configuration matches a JavaScript file, which gets no rule of the feature.
    expect(Object.keys(script?.rules ?? {})).toEqual([]);
    expect(others).toEqual([undefined, undefined, undefined]);
  });

  it("sets the rules that need type information in a type-aware block after the overrides", async () => {
    const configs = await typescript(
      {
        overrides: { "@typescript-eslint/no-floating-promises": "warn" },
        overridesTypeAware: { "@typescript-eslint/await-thenable": "warn" },
      },
      { ...typedContext, typeAware: ["src/**"] },
    );
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    const [inside, outside] = await Promise.all([
      getEffectiveConfig(eslint, "src/example.ts"),
      getEffectiveConfig(eslint, "scripts/example.ts"),
    ]);

    expect(
      configs.map((config) => {
        return config.name;
      }),
    ).toEqual([
      "@cravingmaker/eslint-config/typescript/parser",
      "@cravingmaker/eslint-config/typescript/parser-type-aware",
      "@cravingmaker/eslint-config/typescript/rules",
      "@cravingmaker/eslint-config/typescript/rules-type-aware",
      "@cravingmaker/eslint-config/typescript/rules-type-aware-tsx",
    ]);
    expect(
      inside?.rules?.["@typescript-eslint/no-floating-promises"]?.[0],
    ).toBe(1);
    expect(inside?.rules?.["@typescript-eslint/await-thenable"]).toEqual([1]);
    expect(outside?.rules?.["@typescript-eslint/await-thenable"]).toEqual([0]);
  });

  it("applies an override that turns on a rule that needs type information in the type-aware scope only", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        {
          overrides: {
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-floating-promises": [
              "error",
              { ignoreVoid: false },
            ],
          },
        },
        {
          ...typedContext,
          svelteComponents: ["**/*.svelte"],
          typeAware: ["src/**/*.ts"],
        },
      ),
      overrideConfigFile: true,
    });
    const [inside, outside, component] = await Promise.all([
      getEffectiveConfig(eslint, "src/example.ts"),
      getEffectiveConfig(eslint, "scripts/example.ts"),
      getEffectiveConfig(eslint, "src/Component.svelte"),
    ]);

    expect(inside).toMatchObject({
      rules: {
        "@typescript-eslint/no-floating-promises": [2, { ignoreVoid: false }],
      },
    });
    // An override of a rule that needs no type information applies in every file.
    expect(
      [outside, component].map((config) => {
        return [
          config?.rules?.["@typescript-eslint/no-explicit-any"]?.[0],
          config?.rules?.["@typescript-eslint/no-floating-promises"]?.[0],
        ];
      }),
    ).toEqual([
      [1, 0],
      [1, 0],
    ]);
  });

  it("does not apply such an override without typed linting", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        { overrides: { "@typescript-eslint/no-floating-promises": "warn" } },
        untypedContext,
      ),
      overrideConfigFile: true,
    });
    const config = await getEffectiveConfig(eslint, "src/example.ts");

    expect(config?.rules?.["@typescript-eslint/no-floating-promises"]).toEqual([
      0,
    ]);
  });

  it("applies an override that turns such a rule off in every file, and overridesTypeAware after it", async () => {
    const eslint = new ESLint({
      overrideConfig: await typescript(
        {
          overrides: {
            "@typescript-eslint/await-thenable": "off",
            "@typescript-eslint/no-floating-promises": "off",
          },
          overridesTypeAware: {
            "@typescript-eslint/no-floating-promises": "warn",
          },
        },
        { ...typedContext, typeAware: ["src/**"] },
      ),
      overrideConfigFile: true,
    });
    const [inside, outside] = await Promise.all([
      getEffectiveConfig(eslint, "src/example.ts"),
      getEffectiveConfig(eslint, "scripts/example.ts"),
    ]);

    expect(inside?.rules?.["@typescript-eslint/await-thenable"]).toEqual([0]);
    expect(
      inside?.rules?.["@typescript-eslint/no-floating-promises"]?.[0],
    ).toBe(1);
    expect(outside?.rules?.["@typescript-eslint/no-floating-promises"]).toEqual(
      [0],
    );
  });
});
