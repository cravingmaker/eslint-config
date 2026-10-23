import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { createConfig } from "../../dist/index.mjs";
import { describeEffectiveConfig } from "../policy/effective-config.js";
import { getResolvedConfig, getResolvedRules } from "./resolved-config.js";

describe("resolved configuration boundary", () => {
  it("preserves normalized severities, options, and plugin identity", async () => {
    const plugin = { rules: {} };
    const eslint = new ESLint({
      overrideConfig: {
        linterOptions: { reportUnusedDisableDirectives: "error" },
        plugins: { example: plugin },
        rules: {
          eqeqeq: ["warn", "always"],
          "no-alert": "off",
          "no-debugger": "error",
        },
        settings: { example: { enabled: true } },
      },
      overrideConfigFile: true,
    });
    const config = await getResolvedConfig(eslint, "example.js");
    expect(config?.plugins?.example).toBe(plugin);
    expect(config?.rules).toEqual({
      eqeqeq: [1, "always"],
      "no-alert": [0],
      "no-debugger": [2],
    });
    expect(await getResolvedRules(eslint, "example.js")).toBe(config?.rules);
    expect(config?.toJSON().language).toBe("@/js");
    expect(config?.languageOptions?.sourceType).toBe("module");
    expect(config?.settings).toEqual({ example: { enabled: true } });
    expect(config?.linterOptions).toMatchObject({
      reportUnusedDisableDirectives: 2,
    });
  });

  it("keeps a matched configuration without rule entries distinct from an ignored file", async () => {
    const eslint = new ESLint({ overrideConfigFile: true });
    expect(await getResolvedConfig(eslint, "example.js")).toBeDefined();
    expect(await getResolvedRules(eslint, "example.js")).toBeUndefined();
  });

  it.each(["dist/example.js", "example.cts"])(
    "keeps absent configurations visible for %s",
    async (filePath) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig(),
        overrideConfigFile: true,
      });
      expect(await getResolvedConfig(eslint, filePath)).toBeUndefined();
      expect(await getResolvedRules(eslint, filePath)).toBeUndefined();
      expect(await describeFile(eslint, filePath, "no-debugger")).toEqual({
        language: undefined,
        plugins: [],
        severity: undefined,
      });
      expect(await describeEffectiveConfig(eslint, filePath, "/root")).toBe(
        `path: ${filePath}\nignored: true\nconfig: none\n`,
      );
    },
  );

  it.each([
    ["example.js", "@/js"],
    ["data.json", "json/json"],
    ["README.md", "markdown/gfm"],
    ["page.html", "@/js"],
  ])("shares language and rule access for %s", async (filePath, language) => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });
    const config = await getResolvedConfig(eslint, filePath);
    expect(config?.toJSON().language).toBe(language);
    expect(await describeFile(eslint, filePath, "no-debugger")).toMatchObject({
      language,
      severity: config?.rules?.["no-debugger"]?.[0],
    });
    expect(await describeEffectiveConfig(eslint, filePath, "/root")).toContain(
      `language: ${language}\n`,
    );
  });

  it("propagates invalid configurations instead of returning an empty rule map", async () => {
    const eslint = new ESLint({
      overrideConfig: { rules: { "missing/rule": "error" } },
      overrideConfigFile: true,
    });
    await expect(getResolvedConfig(eslint, "example.js")).rejects.toThrow();
    await expect(getResolvedRules(eslint, "example.js")).rejects.toThrow();
  });
});
