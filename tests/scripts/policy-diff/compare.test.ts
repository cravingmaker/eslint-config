import type { CurrentSnapshot } from "../../../scripts/policy-diff/compare.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeEffectiveConfig } from "../../policy/effective-config.js";
import {
  compareDescriptions,
  compareSnapshots,
  formatChanges,
  parseDescription,
} from "../../../scripts/policy-diff/compare.js";

/**
The setting lines and rule lines of a description.
*/
type Lines = {
  readonly rules: readonly string[];
  readonly settings: readonly string[];
};
// A description of a TypeScript file, as `describeEffectiveConfig` writes it.
const typescriptFile = {
  rules: [
    "import-x/order: off",
    "no-console: error",
    'unicorn/filename-case: error [{"case":"kebabCase"}]',
  ],
  settings: [
    "path: src/example.ts",
    "ignored: false",
    "language: @/js",
    "processor: none",
    "plugins: @ import-x unicorn",
    "languageOptions:",
    "  ecmaVersion: 2026",
    '  globals: "Array:false Map:false"',
    '  parser: "[Parser typescript-eslint/parser]"',
    "  parserOptions: {}",
    "linterOptions:",
    "  reportUnusedDisableDirectives: 1",
    "settings:",
    '  import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"}]',
  ],
} as const satisfies Lines;
const ignoredFile = "path: src/example.ts\nignored: true\nconfig: none\n";
/**
Formats the changes from the description `before` to the description `after`.
*/
const listChanges = (before: string, after: string): readonly string[] => {
  const changes = compareDescriptions(
    parseDescription(before),
    parseDescription(after),
  );
  return formatChanges(changes);
};
/**
Replaces `line` with `replacements`, none to remove it.
*/
const replaceLine = (
  lines: readonly string[],
  line: string,
  replacements: readonly string[],
): readonly string[] => {
  return lines.flatMap((current) => {
    return current === line ? replacements : current;
  });
};
/**
A snapshot of the default scenario with the file and the path that `name` gives.
*/
const snapshotOf = (
  name: string,
  description: CurrentSnapshot["description"],
): CurrentSnapshot => {
  return {
    description,
    filePath: `src/${name}.ts`,
    path: `default/${name}.txt`,
    scenario: "default",
  };
};
/**
Writes a description with the count of its rules between the settings and the rules, as
`describeEffectiveConfig` does.
*/
const writeDescription = ({ rules, settings }: Lines): string => {
  const count = (severity: string): string => {
    return String(
      rules.filter((rule) => {
        return rule.split(" ", 2)[1] === severity;
      }).length,
    );
  };
  return [
    ...settings,
    `rules: ${String(rules.length)} (error ${count("error")}, off ${count("off")}, warn ${count("warn")})`,
    "",
    ...rules,
    "",
  ].join("\n");
};
/**
Formats the changes from the description of the TypeScript file to the description of `lines`.
*/
const listChangesTo = (lines: Lines): readonly string[] => {
  return listChanges(writeDescription(typescriptFile), writeDescription(lines));
};
describe("parseDescription", () => {
  it("reads what describeEffectiveConfig writes", async () => {
    const eslint = new ESLint({
      overrideConfig: [
        {
          files: ["**/*.js"],
          languageOptions: { globals: { example: "readonly" } },
          rules: {
            "no-console": ["error", { allow: ["warn"] }],
            "no-debugger": "off",
            "no-restricted-globals": [
              "error",
              {
                checkGlobalObject: true,
                globalObjects: ["global"],
                globals: [
                  { message: "Use Uint8Array instead.", name: "Buffer" },
                ],
              },
            ],
          },
        },
      ],
      overrideConfigFile: true,
    });
    const linted = parseDescription(
      await describeEffectiveConfig(eslint, "src/example.js", process.cwd()),
    );
    const unmatched = parseDescription(
      await describeEffectiveConfig(eslint, "notes.txt", process.cwd()),
    );
    expect(linted.settings.get("path")).toBe("src/example.js");
    expect(linted.settings.get("ignored")).toBe("false");
    expect(linted.settings.get("languageOptions.globals")).toContain(
      "example:readonly",
    );
    expect(linted.rules?.get("no-console")).toEqual({
      options: '[{"allow":["warn"]}]',
      severity: "error",
    });
    expect(linted.rules?.get("no-debugger")).toEqual({
      options: "",
      severity: "off",
    });
    expect(linted.rules?.get("no-restricted-globals")).toEqual({
      options:
        '[{"checkGlobalObject":true,"globalObjects":["global"],"globals":[{"message":"Use Uint8Array instead.","name":"Buffer"}]}]',
      severity: "error",
    });
    expect(unmatched.settings.get("config")).toBe("none");
    expect(unmatched.rules).toBeUndefined();
  });
  it("reads a snapshot that keeps the rules of one plugin", () => {
    const description = parseDescription(
      'react-refresh/only-export-components: warn [{"checkJS":false}]\n',
      "react-refresh/",
    );
    expect(description.settings.size).toBe(0);
    expect(
      description.rules?.get("react-refresh/only-export-components"),
    ).toEqual({ options: '[{"checkJS":false}]', severity: "warn" });
    expect(parseDescription("\n", "react-refresh/").rules?.size).toBe(0);
  });
  it.each([
    {
      reason: "it does not end with a line break",
      text: writeDescription(typescriptFile).slice(0, -1),
    },
    {
      reason: "it counts 3 (error 2, off 1, warn 0), but lists 2 rules",
      text: writeDescription(typescriptFile).replace("no-console: error\n", ""),
    },
    {
      reason: "a rule is listed more than once",
      text: writeDescription({
        ...typescriptFile,
        rules: [...typescriptFile.rules, "no-console: error"],
      }),
    },
    {
      reason: "line 18 is not a rule: no-console error",
      text: writeDescription(typescriptFile).replace(
        "no-console: error",
        "no-console error",
      ),
    },
    {
      reason: "the options of unicorn/filename-case are not a JSON list",
      text: writeDescription(typescriptFile).replace(
        '[{"case":"kebabCase"}]',
        '{"case":"kebabCase"}',
      ),
    },
    {
      reason: "the value of languageOptions.parser is not JSON",
      text: writeDescription(typescriptFile).replace(
        '"[Parser typescript-eslint/parser]"',
        "[Parser typescript-eslint/parser]",
      ),
    },
    {
      reason: "line 6 is not a setting:   ecmaVersion: 2026",
      text: writeDescription(typescriptFile).replace("languageOptions:\n", ""),
    },
    {
      reason: "it does not start with the path and whether it is ignored",
      text: writeDescription({
        ...typescriptFile,
        settings: typescriptFile.settings.slice(1),
      }),
    },
    {
      reason: "it has neither rules nor `config: none`",
      text: `${typescriptFile.settings.join("\n")}\n`,
    },
    {
      reason: "a file without a configuration has rules",
      text: `${ignoredFile}\nno-console: error\n`,
    },
  ])("rejects a description where $reason", ({ reason, text }) => {
    expect(() => {
      return parseDescription(text);
    }).toThrow(`Not a description of an effective configuration: ${reason}`);
  });
  it("rejects a rule of another plugin in a snapshot that keeps the rules of one", () => {
    expect(() => {
      return parseDescription("no-console: error\n", "react-refresh/");
    }).toThrow("no-console does not start with react-refresh/");
  });
});
describe("compareDescriptions and formatChanges", () => {
  it("find no change between identical descriptions", () => {
    const description = parseDescription(writeDescription(typescriptFile));
    expect(compareDescriptions(description, description)).toEqual([]);
  });
  it("list added and removed rules with their entries", () => {
    expect(
      listChangesTo({
        ...typescriptFile,
        rules: [
          'eqeqeq: error ["always"]',
          ...replaceLine(typescriptFile.rules, "import-x/order: off", []),
        ],
      }),
    ).toEqual([
      "~ rules: 3 (error 2, off 1, warn 0) → 3 (error 3, off 0, warn 0)",
      '+ eqeqeq: error ["always"]',
      "- import-x/order: off",
    ]);
  });
  it("list a changed severity", () => {
    expect(
      listChangesTo({
        ...typescriptFile,
        rules: replaceLine(typescriptFile.rules, "no-console: error", [
          "no-console: warn",
        ]),
      }),
    ).toEqual([
      "~ rules: 3 (error 2, off 1, warn 0) → 3 (error 1, off 1, warn 1)",
      "~ no-console: error → warn",
    ]);
  });
  it.each([
    {
      after:
        'unicorn/filename-case: error [{"case":"camelCase","ignore":["^README"]}]',
      before: 'unicorn/filename-case: error [{"case":"kebabCase"}]',
      changes: [
        "~ unicorn/filename-case: error",
        '    ~ options[0].case: "kebabCase" → "camelCase"',
        '    + options[0].ignore: ["^README"]',
      ],
    },
    {
      after: "unicorn/filename-case: error",
      before: 'unicorn/filename-case: error [{"case":"kebabCase"}]',
      changes: [
        "~ unicorn/filename-case: error",
        '    ~ options: [{"case":"kebabCase"}] → []',
      ],
    },
  ])("list changed options by path: $after", ({ after, before, changes }) => {
    expect(
      listChangesTo({
        ...typescriptFile,
        rules: replaceLine(typescriptFile.rules, before, [after]),
      }),
    ).toEqual(changes);
  });
  it.each([
    {
      after: "language: json/json",
      before: "language: @/js",
      changes: ["~ language: @/js → json/json"],
    },
    {
      after: "plugins: @ import-x react-refresh",
      before: "plugins: @ import-x unicorn",
      changes: ["~ plugins: +react-refresh -unicorn"],
    },
    {
      after: '  globals: "Array:false Map:readonly Set:false"',
      before: '  globals: "Array:false Map:false"',
      changes: [
        "~ languageOptions.globals: +Map:readonly +Set:false -Map:false",
      ],
    },
    {
      after: '  parser: "[Parser espree]"',
      before: '  parser: "[Parser typescript-eslint/parser]"',
      changes: [
        '~ languageOptions.parser: "[Parser typescript-eslint/parser]" → "[Parser espree]"',
      ],
    },
    {
      after: '  parserOptions: {"projectService":true}',
      before: "  parserOptions: {}",
      changes: ["+ languageOptions.parserOptions.projectService: true"],
    },
    {
      after: "  reportUnusedDisableDirectives: 2",
      before: "  reportUnusedDisableDirectives: 1",
      changes: ["~ linterOptions.reportUnusedDisableDirectives: 1 → 2"],
    },
    {
      after:
        '  import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"},{"name":"eslint-plugin-import-x:node"}]',
      before:
        '  import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"}]',
      changes: [
        '~ settings.import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"}] → [{"name":"eslint-import-resolver-typescript"},{"name":"eslint-plugin-import-x:node"}]',
      ],
    },
  ])("list a changed setting: $after", ({ after, before, changes }) => {
    expect(
      listChangesTo({
        ...typescriptFile,
        settings: replaceLine(typescriptFile.settings, before, [after]),
      }),
    ).toEqual(changes);
  });
  it("list a section that loses its settings", () => {
    const settings = replaceLine(
      replaceLine(typescriptFile.settings, "settings:", ["settings: null"]),
      '  import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"}]',
      [],
    );
    expect(listChangesTo({ ...typescriptFile, settings })).toEqual([
      '- settings.import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"}]',
      "+ settings: null",
    ]);
  });
  it("list the settings of a file that ESLint ignores now, without its rules", () => {
    expect(listChanges(writeDescription(typescriptFile), ignoredFile)).toEqual([
      "~ ignored: false → true",
      "- language: @/js",
      "- processor: none",
      "- plugins: @ import-x unicorn",
      "- languageOptions.ecmaVersion: 2026",
      '- languageOptions.globals: "Array:false Map:false"',
      '- languageOptions.parser: "[Parser typescript-eslint/parser]"',
      "- languageOptions.parserOptions: {}",
      "- linterOptions.reportUnusedDisableDirectives: 1",
      '- settings.import-x/resolver-next: [{"name":"eslint-import-resolver-typescript"}]',
      "- rules: 3 (error 2, off 1, warn 0)",
      "+ config: none",
    ]);
  });
});
describe("compareSnapshots", () => {
  it("reports a snapshot without a valid baseline or description as anything but unchanged", () => {
    const description = writeDescription(typescriptFile);
    const changedDescription = writeDescription({
      ...typescriptFile,
      rules: replaceLine(typescriptFile.rules, "no-console: error", [
        "no-console: warn",
      ]),
    });
    const baseline = new Map([
      ["default/changed.txt", changedDescription],
      ["default/malformed.txt", description.slice(0, -1)],
      ["default/old.txt", description],
      ["default/same.txt", description],
    ]);
    const results = compareSnapshots(baseline, [
      snapshotOf("same", { text: description }),
      snapshotOf("changed", { text: description }),
      snapshotOf("malformed", { text: description }),
      snapshotOf("added", { text: description }),
      snapshotOf("failing", { error: "Could not find plugin" }),
    ]);
    expect(
      results.map(({ label, outcome, path }) => {
        return [label, path, outcome.status];
      }),
    ).toEqual([
      ["default: src/same.ts", "default/same.txt", "unchanged"],
      ["default: src/changed.ts", "default/changed.txt", "changed"],
      ["default: src/malformed.ts", "default/malformed.txt", "failed"],
      ["default: src/added.ts", "default/added.txt", "new"],
      ["default: src/failing.ts", "default/failing.txt", "failed"],
      ["default/old.txt", "default/old.txt", "removed"],
    ]);
    expect(
      results.flatMap(({ outcome }) => {
        return outcome.status === "failed" ? outcome.reason : [];
      }),
    ).toEqual([
      "Not a description of an effective configuration: it does not end with a line break",
      "Could not find plugin",
    ]);
  });
});
