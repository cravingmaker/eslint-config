import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

// A rule's settings as ESLint resolves them: the severity as a number, then the options.
type RuleEntries = Readonly<Record<string, readonly [number, ...unknown[]]>>;

const rootDirectory = process.cwd();
// Files of the languages other than JavaScript and TypeScript, and the plugins of their rules.
const otherLanguages = [
  { filePath: "data.json5", plugins: ["json"] },
  { filePath: "data.json", plugins: ["json"] },
  { filePath: "docs/guide.md", plugins: ["markdown"] },
  { filePath: "index.html", plugins: ["@html-eslint"] },
  {
    filePath: "package.json",
    plugins: ["enforce-package-type", "package-json"],
  },
  {
    filePath: "packages/app/package.json",
    plugins: ["enforce-package-type", "package-json"],
  },
  { filePath: "README.md", plugins: ["markdown"] },
  { filePath: "settings.jsonc", plugins: ["json"] },
  { filePath: "tsconfig.json", plugins: ["json"] },
] as const;
// Files of the JSONC and JSON5 languages. The pattern of JSON files, `**/*.json`, also matches
// those that are JSONC by their name or their folder.
const otherJsonLanguages = [
  { filePath: ".devcontainer/devcontainer.json", language: "json/jsonc" },
  { filePath: ".vscode/settings.json", language: "json/jsonc" },
  { filePath: "data.json5", language: "json/json5" },
  { filePath: "notes.jsonc", language: "json/jsonc" },
  { filePath: "tsconfig.audit.json", language: "json/jsonc" },
] as const;
// An object whose key is a precomposed "é" (U+00E9). The key is normalized as NFC, the default
// form of `json/no-unnormalized-keys`, and not as NFD.
const precomposedKey = '{"\u{E9}":1}';

async function createEslint(
  options: Parameters<typeof createConfig>[0],
): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
}
// The language that ESLint resolves for `filePath`, such as "json/jsonc".
async function getLanguage(eslint: ESLint, filePath: string): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly toJSON: () => { readonly language?: unknown } } | undefined;
  return config?.toJSON().language;
}
// The plugin of each rule in `rules`, or "core" for ESLint's own rules, without repeats.
function getRulePlugins(rules: RuleEntries): readonly string[] {
  return [
    ...new Set(
      Object.keys(rules).map((ruleId) =>
        ruleId.includes("/")
          ? ruleId.slice(0, ruleId.lastIndexOf("/"))
          : "core",
      ),
    ),
  ].toSorted((left, right) => left.localeCompare(right));
}
// The rules that ESLint resolves for `filePath`.
async function getRules(
  eslint: ESLint,
  filePath: string,
): Promise<RuleEntries> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return config?.rules ?? {};
}
// The ID of the rule behind each message that ESLint reports for `code`, linted as `filePath`.
async function lintRuleIds(
  eslint: ESLint,
  filePath: string,
  code: string,
): Promise<ReadonlyArray<string | null>> {
  const results = await eslint.lintText(code, { filePath });
  return results.flatMap((result) =>
    result.messages.map((message) => message.ruleId),
  );
}

describe.each([false, true])(
  "languages with typed linting %s",
  (isTypeChecked) => {
    // Every feature and framework is on, so that a block that reached these files would show.
    const eslint = createEslint({
      express: true,
      projectRootDirectory: rootDirectory,
      react: { refresh: "vite" },
      svelte: true,
      typescript: {
        tsconfigRootDir: rootDirectory,
        typeChecked: isTypeChecked,
      },
    });

    it.each(otherLanguages)(
      "$filePath gets only the rules of its own language",
      async ({ filePath, plugins }) => {
        const rules = await getRules(await eslint, filePath);

        expect(getRulePlugins(rules)).toEqual(plugins);
      },
    );
  },
);

describe("the overrides of each JSON language", () => {
  it("stay in the files of that language", async () => {
    const eslint = await createEslint({
      json: {
        overrides: { "json/no-empty-keys": "warn" },
        overridesJson5: { "json/no-duplicate-keys": "warn" },
        overridesJsonc: { "json/sort-keys": "off" },
      },
      projectRootDirectory: rootDirectory,
    });
    const ruleIds = [
      "json/no-duplicate-keys",
      "json/no-empty-keys",
      "json/sort-keys",
    ];
    const severities = await Promise.all(
      ["data.json", "settings.jsonc", "tsconfig.json", "data.json5"].map(
        async (filePath) => {
          const rules = new Map(
            Object.entries(await getRules(eslint, filePath)),
          );
          return ruleIds.map((ruleId) => rules.get(ruleId)?.[0]);
        },
      ),
    );

    expect(severities).toEqual([
      [2, 1, 2],
      [2, 2, 0],
      [2, 2, 0],
      [1, 2, 2],
    ]);
  });
});

describe("the options that json.overrides give a rule", () => {
  // Every JSON block turns `json/no-unnormalized-keys` on with a severity alone, which keeps the
  // options of an earlier block. A file of two blocks would take them from the first one.
  const overridden = createEslint({
    json: {
      overrides: { "json/no-unnormalized-keys": ["error", { form: "NFD" }] },
    },
    projectRootDirectory: rootDirectory,
  });
  const defaults = createEslint({ projectRootDirectory: rootDirectory });

  it("apply in a JSON file", async () => {
    const eslint = await overridden;
    const rules = new Map(Object.entries(await getRules(eslint, "data.json")));

    expect(await getLanguage(eslint, "data.json")).toBe("json/json");
    expect(rules.get("json/no-unnormalized-keys")).toEqual([
      2,
      { form: "NFD" },
    ]);
  });

  it.each(otherJsonLanguages)(
    "stay out of $filePath, which is $language",
    async ({ filePath, language }) => {
      const eslint = await overridden;

      expect(await getLanguage(eslint, filePath)).toBe(language);
      expect(await getRules(eslint, filePath)).toStrictEqual(
        await getRules(await defaults, filePath),
      );
    },
  );

  it("change what ESLint reports in a JSON file only", async () => {
    const otherFilePaths = otherJsonLanguages.map(({ filePath }) => filePath);
    const unreported = Object.fromEntries(
      otherFilePaths.map((filePath): readonly [string, readonly string[]] => [
        filePath,
        [],
      ]),
    );
    const [withDefaults, withOverrides] = await Promise.all(
      [await defaults, await overridden].map(async (eslint) =>
        Object.fromEntries(
          await Promise.all(
            ["data.json", ...otherFilePaths].map(
              async (filePath): Promise<readonly [string, unknown]> => [
                filePath,
                await lintRuleIds(eslint, filePath, precomposedKey),
              ],
            ),
          ),
        ),
      ),
    );

    expect(withDefaults).toEqual({ ...unreported, "data.json": [] });
    expect(withOverrides).toEqual({
      ...unreported,
      "data.json": ["json/no-unnormalized-keys"],
    });
  });
});

describe("a negated pattern in json.ignores", () => {
  // The pattern brings back every file of `vendor/ours`, also those that the JSON block leaves
  // out by itself. The overrides show that block in a JSONC file, which has the same rules.
  const negated = createEslint({
    json: {
      ignores: ["vendor/**", "!vendor/ours/**"],
      overrides: { "json/no-unnormalized-keys": ["error", { form: "NFD" }] },
    },
    projectRootDirectory: rootDirectory,
  });
  const defaults = createEslint({ projectRootDirectory: rootDirectory });

  it("brings back the JSON files that the patterns before it left out", async () => {
    const eslint = await negated;

    expect(
      await Promise.all(
        ["vendor/ours/data.json", "vendor/theirs/data.json"].map(
          async (filePath) => await getLanguage(eslint, filePath),
        ),
      ),
    ).toEqual(["json/json", undefined]);
  });

  it.each([
    "vendor/ours/package-lock.json",
    "vendor/ours/package.json",
    "vendor/ours/tsconfig.json",
  ])(
    "does not bring the JSON block to %s, which that block leaves out",
    async (filePath) => {
      const eslint = await negated;

      expect(await getLanguage(eslint, filePath)).toBe(
        await getLanguage(await defaults, filePath),
      );
      expect(await getRules(eslint, filePath)).toStrictEqual(
        await getRules(await defaults, filePath),
      );
    },
  );
});
