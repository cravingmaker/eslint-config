import type { Linter } from "eslint";

import process from "node:process";

import { ESLint } from "eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type PluginRule = {
  readonly meta?: {
    readonly deprecated?: unknown;
    readonly docs?: { readonly category?: unknown };
    readonly type?: unknown;
  };
};
type RuleEntries = Readonly<Record<string, readonly unknown[]>>;
type TemplateIndentOptions = {
  readonly comments: readonly string[];
  readonly tags: readonly string[];
};

const rootDirectory = process.cwd();
// One file of each kind that the configuration lints.
const filePaths = [
  "data.json",
  "data.json5",
  "data.jsonc",
  "eslint.config.js",
  "index.html",
  "package.json",
  "README.md",
  "src/Component.svelte",
  "src/example.d.ts",
  "src/example.js",
  "src/example.jsx",
  "src/example.mjs",
  "src/example.mts",
  "src/example.test.ts",
  "src/example.ts",
  "src/example.tsx",
  "src/state.svelte.js",
  "src/state.svelte.ts",
  "tsconfig.json",
] as const;

/*
Prettier formats, and the configuration leaves layout to it. eslint-config-prettier turns off the
rules that are unnecessary or might conflict with Prettier: none of them may be on, apart from
these exceptions, each with the reason that it is safe. Its `eslint-config-prettier/prettier`
entry point lists rules that conflict only with eslint-plugin-prettier, which is not used here.
*/
const exceptions = new Map([
  [
    "unicorn/template-indent",
    "its tags and comments leave out the templates whose content Prettier formats",
  ],
]);
/*
The tags and comments that mark templates whose content Prettier formats, as the CLI of
eslint-config-prettier checks them for `unicorn/template-indent`. The rule matches comments
without regard to case.
*/
const prettierTemplateTags: ReadonlySet<string> = new Set([
  "css",
  "gql",
  "graphql",
  "html",
  "markdown",
  "md",
]);
const prettierTemplateComments: ReadonlySet<string> = new Set([
  "graphql",
  "html",
]);

/*
The @html-eslint plugins are outside the coverage of eslint-config-prettier, so their style rules
are decided by hand. These check only whitespace, line breaks, indentation, or attribute quotes,
which Prettier decides when it formats HTML, so they are off.
*/
const htmlLayoutRules = [
  "@html-eslint/attrs-newline",
  "@html-eslint/class-spacing",
  "@html-eslint/element-newline",
  "@html-eslint/indent",
  "@html-eslint/no-extra-spacing-tags",
  "@html-eslint/no-extra-spacing-text",
  "@html-eslint/no-multiple-empty-lines",
  "@html-eslint/no-trailing-spaces",
  "@html-eslint/quotes",
] as const;
// The other style rules of the @html-eslint plugins stay on, each for the reason given.
const keptHtmlStyleRules = new Map([
  ["@html-eslint/id-naming-convention", "it checks names, not layout"],
  [
    "@html-eslint/lowercase",
    "Prettier keeps the case of custom elements and their attributes",
  ],
  [
    "@html-eslint/react/classname-spacing",
    "Prettier leaves the content of JSX strings alone",
  ],
  ["@html-eslint/sort-attrs", "Prettier keeps the order of attributes"],
  [
    "@html-eslint/svelte/class-spacing",
    "prettier-plugin-svelte keeps leading spaces in class names and does not undo the fix",
  ],
]);
// A file that each @html-eslint plugin lints.
const htmlPluginFiles = new Map([
  ["@html-eslint", "index.html"],
  ["@html-eslint/react", "src/example.tsx"],
  ["@html-eslint/svelte", "src/Component.svelte"],
]);

function compareText(left: string, right: string): number {
  return left.localeCompare(right);
}
async function createEslint(isTypeChecked: boolean): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createFullConfig(isTypeChecked),
    overrideConfigFile: true,
  });
}
// Every feature and framework is on, so that every rule the configuration sets is checked.
async function createFullConfig(
  isTypeChecked: boolean,
): Promise<Linter.Config[]> {
  return await createConfig({
    express: true,
    projectRootDirectory: rootDirectory,
    react: { refresh: "vite" },
    svelte: true,
    typescript: { tsconfigRootDir: rootDirectory, typeChecked: isTypeChecked },
  });
}
// The rules that are on in at least one of `filePaths`.
async function getEnabledRuleIds(eslint: ESLint): Promise<ReadonlySet<string>> {
  const resolved = await Promise.all(
    filePaths.map(async (filePath) => await getRules(eslint, filePath)),
  );
  return new Set(
    resolved.flatMap((rules) =>
      [...rules]
        .filter(([, [severity]]) => severity !== 0)
        .map(([ruleId]) => ruleId),
    ),
  );
}
// The plugin prefix of `ruleId`.
function getPluginName(ruleId: string): string {
  return ruleId.slice(0, ruleId.lastIndexOf("/"));
}
// The rules that ESLint resolves for `filePath`.
async function getRules(
  eslint: ESLint,
  filePath: string,
): Promise<ReadonlyMap<string, readonly unknown[]>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return new Map(Object.entries(config?.rules ?? {}));
}
function isDeprecated(rule: PluginRule): boolean {
  return rule.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}
function isPluginRule(value: unknown): value is PluginRule {
  return typeof value === "object" && value !== null;
}
// Whether the plugin files `rule` under style, or its type is `layout`.
function isStyleRule(rule: PluginRule): boolean {
  const category = rule.meta?.docs?.category;
  return (
    rule.meta?.type === "layout" ||
    category === "Style" ||
    category === "Stylistic Issues"
  );
}

describe.each([false, true])(
  "rules that eslint-config-prettier turns off, with typed linting %s",
  (typeChecked) => {
    const eslint = createEslint(typeChecked);

    it("are off, apart from the exceptions", async () => {
      const enabledRuleIds = await getEnabledRuleIds(await eslint);

      expect(
        [...enabledRuleIds]
          .filter(
            (ruleId) =>
              Object.hasOwn(eslintConfigPrettier.rules, ruleId) &&
              !exceptions.has(ruleId),
          )
          .toSorted(compareText),
      ).toEqual([]);
    });

    it.each([...exceptions])(
      "are off apart from %s, which stays on because %s",
      async (ruleId) => {
        const enabledRuleIds = await getEnabledRuleIds(await eslint);

        expect(Object.hasOwn(eslintConfigPrettier.rules, ruleId)).toBe(true);
        expect(enabledRuleIds.has(ruleId)).toBe(true);
      },
    );
  },
);

describe("unicorn/template-indent", () => {
  it("leaves out the templates whose content Prettier formats", async () => {
    const eslint = await createEslint(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
    const config = (await eslint.calculateConfigForFile("src/example.js")) as {
      readonly rules: Readonly<
        Record<
          "unicorn/template-indent",
          readonly [number, TemplateIndentOptions]
        >
      >;
    };
    const [severity, { comments, tags }] =
      config.rules["unicorn/template-indent"];

    expect(severity).toBe(2);
    expect({
      comments: comments.filter((comment) =>
        prettierTemplateComments.has(comment.toLowerCase()),
      ),
      tags: tags.filter((tag) => prettierTemplateTags.has(tag)),
    }).toEqual({ comments: [], tags: [] });
  });
});

describe("@html-eslint style rules", () => {
  it("are off in HTML files where they check layout", async () => {
    const rules = await getRules(await createEslint(false), "index.html");

    expect(
      htmlLayoutRules.filter((ruleId) => rules.get(ruleId)?.[0] !== 0),
    ).toEqual([]);
  });

  it.each([...keptHtmlStyleRules])("keep %s on, because %s", async (ruleId) => {
    const filePath = htmlPluginFiles.get(getPluginName(ruleId)) ?? "";
    const rules = await getRules(await createEslint(false), filePath);

    expect(rules.get(ruleId)?.[0]).toBeOneOf([1, 2]);
  });

  it("are each either off as layout or kept with a reason", async () => {
    const config = await createFullConfig(false);
    const plugins = new Map(
      config.flatMap(({ plugins: registered = {} }) =>
        Object.entries(registered).filter(([name]) =>
          htmlPluginFiles.has(name),
        ),
      ),
    );
    const styleRuleIds = [...plugins].flatMap(([pluginName, plugin]) =>
      Object.entries(plugin.rules ?? {})
        .filter(
          ([, rule]) =>
            isPluginRule(rule) && !isDeprecated(rule) && isStyleRule(rule),
        )
        .map(([ruleName]) => `${pluginName}/${ruleName}`),
    );

    expect(plugins.size).toBe(htmlPluginFiles.size);
    expect(styleRuleIds.toSorted(compareText)).toEqual(
      [...htmlLayoutRules, ...keptHtmlStyleRules.keys()].toSorted(compareText),
    );
  });
});
