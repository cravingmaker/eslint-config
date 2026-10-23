import type { Linter } from "eslint";

import { glob } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { refreshRules } from "../../src/configs/plugins/react/rules.js";
import { isRecord } from "../../src/utilities/is-record.js";
import { supportedPluginPolicy } from "../../src/utilities/plugin-policy.js";
import { getResolvedConfig } from "../support/resolved-config.js";

type RuleDefinition = {
  readonly meta?: { readonly deprecated?: unknown };
};
// Read the authored maps themselves: optional-peer filtering must not hide a deprecated key.
const files = await Array.fromAsync(glob("src/configs/**/*.ts"));
const authoredMaps = await Promise.all(
  files
    .filter((file) => {
      return (
        ["replacements.ts", "rules-type-aware.ts", "rules.ts"].includes(
          path.basename(file),
        ) || path.basename(path.dirname(file)) === "rules"
      );
    })
    .map(async (file) => {
      const module: unknown = await import(
        pathToFileURL(path.resolve(file)).href
      );
      expect(isRecord(module)).toBe(true);
      return Object.entries(isRecord(module) ? module : {}).flatMap(
        ([name, value]) => {
          return isRecord(value) ? { map: value, name: `${file}:${name}` } : [];
        },
      );
    }),
);
const maps = [
  ...authoredMaps.flat(),
  ...(["generic", "next", "vite"] as const).map((variant) => {
    return { map: refreshRules(variant), name: `refreshRules(${variant})` };
  }),
];
const config = await createConfig({
  express: true,
  react: { refresh: "generic" },
  svelte: true,
  typescript: { tsconfigRootDir: process.cwd() },
});
const plugins = new Map(
  config.flatMap((entry) => {
    return Object.entries(entry.plugins ?? {});
  }),
);
const pluginDefinitions = [...plugins].flatMap(([prefix, plugin]) => {
  return Object.entries(plugin.rules ?? {}).map(
    ([name, rule]): readonly [string, RuleDefinition] => {
      return [`${prefix}/${name}`, rule];
    },
  );
});
const definitions = new Map<string, RuleDefinition>(
  [
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Guard authored core IDs against the installed registry, including disabled entries.
    [...builtinRules],
    pluginDefinitions,
  ].flat(),
);
const deprecatedIds = (map: Readonly<Record<string, unknown>>) => {
  return Object.keys(map)
    .filter((id) => {
      const deprecated = definitions.get(id)?.meta?.deprecated;
      return typeof deprecated !== "undefined" && deprecated !== false;
    })
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
};

type Severity = Linter.Severity | Linter.StringSeverity;
const settings: ReadonlyArray<Severity | [Severity]> = [
  "off",
  "warn",
  "error",
  0,
  1,
  2,
  ["off"],
  ["warn"],
  ["error"],
  [0],
  [1],
  [2],
];

describe("deprecated rule handling", () => {
  it.each(maps)(
    "omits deprecated IDs at every severity in $name",
    ({ map }) => {
      expect(
        Object.keys(map).filter((id) => {
          return !definitions.has(id);
        }),
      ).toEqual([]);
      expect(deprecatedIds(map)).toEqual([]);
    },
  );

  it.each(
    settings.map((entry) => {
      return { entry };
    }),
  )(
    "detects authored deprecated keys even when a peer would filter entry $entry",
    ({ entry }) => {
      const authored = {
        "no-return-await": entry,
        "@stylistic/jsx-indent": entry,
      };
      expect(deprecatedIds(authored)).toEqual([
        "@stylistic/jsx-indent",
        "no-return-await",
      ]);
      expect(supportedPluginPolicy("@stylistic", authored, {})).toEqual({});
    },
  );

  it("does not author deprecated entries in the composed defaults", () => {
    expect(
      config.flatMap((entry) => {
        return deprecatedIds(entry.rules ?? {});
      }),
    ).toEqual([]);
  });

  it("retains an earlier consumer's deprecated await prohibition and allows a later override", async () => {
    const earlier: Linter.Config = { rules: { "no-return-await": "error" } };
    const code =
      "export const load = async (): Promise<number> => { return await Promise.resolve(1); };\n";
    const eslint = new ESLint({
      overrideConfig: [earlier, ...config],
      overrideConfigFile: true,
    });
    const filePath = "tests/support/lint.ts";
    await expect(getResolvedConfig(eslint, filePath)).resolves.toHaveProperty(
      ["rules", "@typescript-eslint/return-await"],
      [2, "always"],
    );
    const [result] = await eslint.lintText(code, { filePath });
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).toContainEqual(
      expect.objectContaining({ ruleId: "no-return-await", severity: 2 }),
    );
    expect(result.messages).not.toContainEqual(
      expect.objectContaining({ ruleId: "@typescript-eslint/return-await" }),
    );

    const overridden = new ESLint({
      overrideConfig: [
        earlier,
        ...(await createConfig({}, { rules: { "no-return-await": "off" } })),
      ],
      overrideConfigFile: true,
    });
    const [later] = await overridden.lintText(code, { filePath });
    expect(later.fatalErrorCount).toBe(0);
    expect(later.messages).not.toContainEqual(
      expect.objectContaining({ ruleId: "no-return-await" }),
    );
  });

  it.each(["sonarjs/useless-string-operation", "sonarjs/web-sql-database"])(
    "keeps explicit %s overrides inside typed scope after omitting its authored entries",
    async (id) => {
      const engine = new ESLint({
        overrideConfig: await createConfig({
          sonarjs: { overrides: { [id]: "warn" } },
        }),
        overrideConfigFile: true,
      });
      await expect(
        getResolvedConfig(engine, "tests/utilities.ts"),
      ).resolves.toHaveProperty(["rules", id, 0], 1);
      await expect(
        getResolvedConfig(engine, "example.js"),
      ).resolves.not.toHaveProperty(["rules", id]);
      const [result] = await engine.lintText("export const value = 1;\n", {
        filePath: "example.js",
      });
      expect(result.fatalErrorCount).toBe(0);

      const untyped = new ESLint({
        overrideConfig: await createConfig({
          sonarjs: { overrides: { [id]: "warn" } },
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      await expect(
        getResolvedConfig(untyped, "example.ts"),
      ).resolves.not.toHaveProperty(["rules", id]);
    },
  );
});
