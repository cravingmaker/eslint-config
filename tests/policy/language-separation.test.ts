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

async function createEslint(
  options: Parameters<typeof createConfig>[0],
): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
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
