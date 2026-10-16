import type { Linter } from "eslint";

import process from "node:process";

import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;
type RulePlugin = {
  readonly rules?: Readonly<
    Record<
      string,
      { readonly meta?: { readonly languages?: readonly string[] } }
    >
  >;
};
type UnknownRecord = Readonly<Record<string, unknown>>;

const rootDirectory = process.cwd();
const filePaths = [
  "data.json",
  "data.json5",
  "data.jsonc",
  "index.html",
  "package.json",
  "README.md",
  "src/Component.svelte",
  "src/example.js",
  "src/example.jsx",
  "src/example.ts",
  "src/example.tsx",
  "src/state.svelte.ts",
] as const;

// This selects an option form; ESLint performs the full schema validation below.
function isMatchingOptionShape(schema: unknown, value: unknown): boolean {
  if (value === undefined || !isRecord(schema)) return true;
  if (isUnknownArray(schema.enum) && !schema.enum.includes(value)) return false;
  if (Object.hasOwn(schema, "const") && schema.const !== value) return false;
  if (schema.type === "object" && !isRecord(value)) return false;
  if (typeof value !== "string" && schema.type === "string") return false;
  return (
    !isRecord(value) ||
    !isRecord(schema.properties) ||
    Object.keys(value).every((key) =>
      Object.hasOwn(schema.properties ?? {}, key),
    )
  );
}
function isObjectOptionExplicit(
  schema: UnknownRecord,
  value: UnknownRecord,
): boolean {
  const properties = isRecord(schema.properties) ? schema.properties : {};
  return (
    (schema.additionalProperties !== false ||
      Object.keys(value).every((key) => Object.hasOwn(properties, key))) &&
    Object.keys(properties).every((key) => Object.hasOwn(value, key))
  );
}
function isOptionExplicit(
  schema: unknown,
  options: readonly unknown[],
  index: number,
): boolean {
  const objects = objectSchemas(schema);
  const value: unknown = options.at(index);
  return (
    Object.hasOwn(options, index) &&
    (!isRecord(value) ||
      objects.length === 0 ||
      objects.some((object) => isObjectOptionExplicit(object, value)))
  );
}
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
function missingOptions(
  id: string,
  rule: unknown,
  declarations: ReadonlyArray<readonly [string, unknown]>,
): readonly string[] {
  if (!isRecord(rule) || !isRecord(rule.meta)) return [];
  const candidates = declarations
    .filter(([ruleId]) => ruleId === id)
    .map(([, value]) => (isUnknownArray(value) ? value.slice(1) : []));
  if (candidates.length === 0) return [];
  // Its schema requires an active export check whenever options are supplied.
  if (id === "import-x/no-unused-modules") return [];
  const schemas = optionSchemas(rule.meta.schema);
  const missing = candidates.flatMap((options) =>
    schemas
      .filter(
        (form) =>
          form.length === 0 ||
          options.every(
            (value, index) =>
              index < form.length &&
              isMatchingOptionShape(form.at(index), value),
          ),
      )
      .map((form) =>
        form.flatMap((schema, index) =>
          isOptionExplicit(schema, options, index)
            ? []
            : [`${id} option ${String(index + 1)}`],
        ),
      ),
  );
  return missing.some((entries) => entries.length === 0)
    ? []
    : (missing.at(0) ?? [`${id} option form`]);
}
function objectSchemas(schema: unknown): readonly UnknownRecord[] {
  if (!isRecord(schema)) return [];
  const alternatives = schema.oneOf ?? schema.anyOf;
  if (isUnknownArray(alternatives))
    return alternatives.flatMap((alternative) =>
      objectSchemas(alternative ?? false),
    );
  return schema.type === "object" || isRecord(schema.properties)
    ? [schema]
    : [];
}
function optionSchemas(schema: unknown): ReadonlyArray<readonly unknown[]> {
  if (isUnknownArray(schema)) return [schema];
  if (!isRecord(schema)) return [[]];
  const alternatives = schema.oneOf ?? schema.anyOf;
  if (isUnknownArray(alternatives))
    return alternatives.flatMap((alternative) =>
      optionSchemas(alternative ?? false),
    );
  if (isUnknownArray(schema.items)) return [schema.items];
  // Variadic lists hold user-selected matches or sorting configurations. They
  // can deliberately have no entries, such as require-attrs and no-restricted-syntax.
  return [[]];
}

describe("explicit rule options", () => {
  it("declares every option in the selected form or explicitly leaves it unset", async () => {
    const config = await createConfig({
      express: true,
      react: { refresh: "generic" },
      svelte: true,
      typescript: { tsconfigRootDir: rootDirectory, typeChecked: true },
    });
    const plugins = new Map(
      config.flatMap((entry) => Object.entries(entry.plugins ?? {})),
    );
    const definitions = [
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Audit the installed core rule schemas as well as plugins.
      [...builtinRules],
      [...plugins].flatMap(([prefix, plugin]) =>
        Object.entries(plugin.rules ?? {}).map(
          ([name, rule]): readonly [string, unknown] => [
            `${prefix}/${name}`,
            rule,
          ],
        ),
      ),
    ].flat();
    const declarations = config.flatMap((entry) =>
      Object.entries(entry.rules ?? {}),
    );
    const missing = definitions.flatMap(([id, rule]) =>
      missingOptions(id, rule, declarations),
    );

    expect(
      missing.toSorted((left, right) => left.localeCompare(right)),
    ).toEqual([]);
  });
});

async function getOffRuleIds(
  eslint: ESLint,
  filePath: string,
): Promise<readonly string[]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    | {
        readonly toJSON: () => { readonly language?: string };

        readonly plugins?: Readonly<Record<string, RulePlugin>>;
        readonly rules?: RuleEntries;
      }
    | undefined;
  const language = config?.toJSON().language;
  const unsupported = new Set(
    Object.entries(config?.plugins ?? {}).flatMap(([prefix, plugin]) =>
      Object.entries(plugin.rules ?? {})
        .filter(([, rule]) => {
          const languages = rule.meta?.languages;
          return (
            language !== undefined &&
            languages !== undefined &&
            !languages.includes("*") &&
            !languages.includes(language)
          );
        })
        .map(([name]) => `${prefix}/${name}`),
    ),
  );
  return Object.entries(config?.rules ?? {})
    .filter(([id, entry]) => entry[0] === 0 && !unsupported.has(id))
    .map(([ruleId]) => ruleId);
}

/*
ESLint validates rule options only while a rule is enabled, and a later config
that enables a rule with a bare severity keeps the options configured before.
A rule that is off must therefore still carry options that its schema accepts.
*/
describe.each([false, true])(
  "rule options with typed linting %s",
  (typeChecked) => {
    it.each(filePaths)(
      "stay valid when a later config enables an off rule in %s",
      async (filePath) => {
        const config = await createConfig({
          express: true,
          projectRootDirectory: rootDirectory,
          react: { refresh: "generic" },
          svelte: true,
          typescript: { tsconfigRootDir: rootDirectory, typeChecked },
        });
        const offRuleIds = await getOffRuleIds(
          new ESLint({ overrideConfig: config, overrideConfigFile: true }),
          filePath,
        );
        const enableOffRules: Linter.Config = {
          files: ["**/*"],
          name: "test/enable-off-rules",
          rules: Object.fromEntries(
            offRuleIds.map((ruleId) => [ruleId, "error"]),
          ),
        };
        const eslint = new ESLint({
          overrideConfig: [...config, enableOffRules],
          overrideConfigFile: true,
        });

        await expect(
          eslint.calculateConfigForFile(filePath),
        ).resolves.toBeDefined();
      },
    );
  },
);
