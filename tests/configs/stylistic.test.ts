import type { Options as PrettierOptions } from "prettier";

import repositoryPrettierConfig from "@cravingmaker/prettier-config";
import { ESLint } from "eslint";
import { format } from "prettier";
import pluginStylistic from "@stylistic/eslint-plugin";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { expectLintError, expectNoLintError } from "../utilities.js";

const diagnostics = [
  {
    code: "//Readable comment.\nexport const value = 1;\n",
    filePath: "src/example.js",
    rule: "@stylistic/spaced-comment",
  },
  {
    code: "export class Example {\n  first() {}\n  second() {}\n}\n",
    filePath: "src/example.ts",
    rule: "@stylistic/lines-between-class-members",
  },
  {
    code: "export const allowed = first && second || third;\n",
    filePath: "src/example.js",
    rule: "@stylistic/no-mixed-operators",
  },
  {
    code: "export const content = <MY_COMPONENT />;\n",
    filePath: "src/example.jsx",
    rule: "@stylistic/jsx-pascal-case",
  },
  {
    code: "export const content = <Panel></Panel>;\n",
    filePath: "src/example.tsx",
    rule: "@stylistic/jsx-self-closing-comp",
  },
  {
    code: "export const value:number = 1;\n",
    filePath: "src/example.ts",
    rule: "@stylistic/type-annotation-spacing",
  },
  {
    code: "export const value = source .property;\n",
    filePath: "src/example.js",
    rule: "@stylistic/no-whitespace-before-property",
  },
  {
    code: "export type Values = Array< string >;\n",
    filePath: "src/example.ts",
    rule: "@stylistic/type-generic-spacing",
  },
  {
    code: 'export const content = <Panel label={"Message"} />;\n',
    filePath: "src/example.jsx",
    rule: "@stylistic/jsx-curly-brace-presence",
  },
] as const;
const eslint = new ESLint({
  fix: (message) => {
    return message.ruleId?.startsWith("@stylistic/") === true;
  },
  overrideConfig: await createConfig({
    express: false,
    react: false,
    svelte: false,
  }),
  overrideConfigFile: true,
});
const snippets = [
  {
    code: 'export const content = <Panel label={"Message"} child={<Thing></Thing>} options={{first:1}}>{item}{" "}{text}</Panel>;\n',
    filePath: "src/example.tsx",
  },
  {
    code: [
      "export function* values () {yield * [1,2];}",
      "export const methods = {*values(){yield * [1,2];}, async *changes(){yield * [3];}};",
      "export class Example {\n*values(){yield* [1];}\nstatic async *changes(){yield* [2];}\n}",
      "export const amount = first + second * third;",
      "export const flags = (first & second) | third;",
      "export const allowed = (first && second) || third;",
      "//Readable comment.",
      "/*!License.*/",
      "export const created = /*#__PURE__*/ createValue();",
      "",
    ].join("\n"),
    filePath: "src/example.js",
  },
  {
    code: [
      '/// <reference types="node" />',
      "export interface Example {readonly name:string;call(value:number):void;}",
      "export type Result< Value > = [name :Value, count :number];",
      "export type Callback = (value :number)=>void;",
      "",
    ].join("\n"),
    filePath: "src/example.ts",
  },
] as const;
const prettierConfigs = new Map<string, PrettierOptions>([
  [
    "compact JSX",
    {
      arrowParens: "avoid",
      bracketSameLine: true,
      bracketSpacing: false,
      jsxSingleQuote: true,
      printWidth: 60,
    },
  ],
  [
    "consistent property quotes and CRLF",
    {
      endOfLine: "crlf",
      quoteProps: "consistent",
      singleAttributePerLine: true,
      trailingComma: "none",
    },
  ],
  ["defaults", {}],
  ["single quotes without semicolons", { semi: false, singleQuote: true }],
  ["tabs and 120 columns", { printWidth: 120, tabWidth: 4, useTabs: true }],
  ["the repository configuration", repositoryPrettierConfig],
]);

describe("stylistic rules", () => {
  it("explicitly classifies every bundled rule, including deprecated and experimental rules", async () => {
    const config = await createConfig();
    const rules = config.find((entry) => {
      return entry.name === "@cravingmaker/eslint-config/stylistic/rules";
    })?.rules;
    const entries = Object.entries(rules ?? {});
    expect(
      new Set(
        entries.map(([id]) => {
          return id;
        }),
      ),
    ).toEqual(
      new Set(
        Object.keys(pluginStylistic.rules).map((name) => {
          return `@stylistic/${name}`;
        }),
      ),
    );
    expect(entries).not.toHaveLength(0);
    expect(
      entries.every(([, entry]) => {
        const severity: unknown = Array.isArray(entry) ? entry[0] : entry;
        return (
          typeof severity === "string" &&
          ["error", "off", "warn"].includes(severity)
        );
      }),
    ).toBe(true);
    expect(rules).toMatchObject({
      "@stylistic/exp-jsx-props-style": "off",
      "@stylistic/exp-list-style": "off",
      "@stylistic/jsx-indent": "off",
      "@stylistic/jsx-props-no-multi-spaces": "off",
      "@stylistic/jsx-sort-props": "off",
    });
  });

  it.each(diagnostics)(
    "$rule reports its configured policy in $filePath",
    async ({ code, filePath, rule }) => {
      await expectLintError(code, rule, { filePath });
    },
  );

  it("leaves ordinary arithmetic precedence unrestricted", async () => {
    await expectNoLintError(
      "export const amount = first + second * third;\n",
      "@stylistic/no-mixed-operators",
      { filePath: "src/example.js" },
    );
  });

  it("fixes comment spacing and preserves TypeScript triple-slash directives", async () => {
    const [result] = await eslint.lintText(
      '/// <reference types="node" />\n//Readable comment.\nexport const value = 1;\n',
      { filePath: "src/example.ts" },
    );
    expect(result.output).toBe(
      '/// <reference types="node" />\n// Readable comment.\nexport const value = 1;\n',
    );
  });

  it("fixes unnecessary JSX braces and empty closing tags", async () => {
    const [result] = await eslint.lintText(
      'export const content = <Panel label={"Message"}></Panel>;\n',
      { filePath: "src/example.tsx" },
    );
    expect(result.output).toBe(
      'export const content = <Panel label="Message" />;\n',
    );
  });
});

describe.each([...prettierConfigs])(
  "Stylistic with Prettier using %s",
  (_name, options) => {
    it.each(snippets)(
      "reaches a stable result for $filePath",
      async ({ code, filePath }) => {
        const [first] = await eslint.lintText(code, { filePath });
        const formatted = await format(first.output ?? code, {
          ...options,
          filepath: filePath,
        });
        const [second] = await eslint.lintText(formatted, { filePath });
        expect(
          second.messages.filter((message) => {
            return (
              message.fatal === true ||
              message.ruleId?.startsWith("@stylistic/") === true
            );
          }),
        ).toEqual([]);
        expect(second.output ?? formatted).toBe(formatted);
        expect(
          await format(second.output ?? formatted, {
            ...options,
            filepath: filePath,
          }),
        ).toBe(formatted);
      },
    );
  },
);
