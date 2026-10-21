import type { Linter } from "eslint";
import type {
  FixTrace,
  ReportOverlap,
  traceFixCycles,
} from "./fix-convergence.js";

import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

import { beforeAll, describe, expect, it } from "vitest";

import { convergenceProblems, reportOverlaps } from "./fix-convergence.js";

type ApprovedOverlap = {
  readonly concern: string;
  readonly rules: readonly string[];
  readonly sample: string;
};
type Sample = {
  readonly fileName: string;
  readonly name: string;
  readonly text: string;
};
type SampleResult = {
  readonly name: string;
  readonly trace: Awaited<ReturnType<typeof traceFixCycles>>;
};

const escapeSource = `${String.raw`export const pattern = /\u{e9}/u;`}\n`;
const importSource = [
  "// First section.",
  'import path from "node:path";',
  "// Second section.",
  'import os from "node:os";',
  "",
  'export const directories = [os.tmpdir(), path.resolve(".")];',
  "",
].join("\n");
const moduleSource = [
  "function first() { return 1; }",
  "",
  "/**",
  " * Describe the second function.",
  " *",
  " * Explain a detail.",
  " */",
  "function second() { return 2; }",
  "",
  "export { first, second };",
  "",
].join("\n");
const stableSource = [
  "export const values = [3, 1, 2].toSorted((left, right) => {",
  "  return left - right;",
  "});",
  "",
].join("\n");
const sources = new Map([
  [
    "awaits",
    "export const load = (task) => { return task.then((value) => { return value; }); };\n",
  ],
  ["D1-D2-D3-Stages-2-3", `${importSource}\n${escapeSource}\n${moduleSource}`],
  ["D1-Stage-2", escapeSource],
  ["D2-Stage-2", importSource],
  ["D3-Stage-3", moduleSource],
  ["escapes", `${String.raw`export const pattern = /\a/;`}\n`],
  [
    "exports",
    "export const first = 1;\nconst second = 2;\nexport { second };\n",
  ],
  ["fix-and-format", "export const options={zeta:1,alpha:2}\n"],
  ["redos", "export const pattern = /(?:a+)+$/u;\n"],
  ["sort", "export const values = [10, 2, 1].toSorted();\n"],
  ["stable", stableSource],
  [
    "switch",
    'export const describe = (value: number): string => { switch (value) { case 1: return "one"; } };\n',
  ],
  [
    "unapproved-equality",
    "export const isMissing = (value) => { return value == null; };\n",
  ],
  ["unicode", `${String.raw`export const pattern = /\p{L}/;`}\n`],
]);
/*
Every exception is limited to a named sample and individual rule IDs. The D8 decisions retain these checks for distinct coverage, even when both reports refer to intersecting source ranges.
*/
const approvedOverlaps: readonly ApprovedOverlap[] = [
  {
    concern:
      "D8.4: core checks strings/templates; RegExp also checks constructor patterns",
    rules: ["no-useless-escape", "regexp/no-useless-escape"],
    sample: "escapes",
  },
  {
    concern:
      "D8.6: backtracking paths, repeated starting positions, and heuristic risk warnings",
    rules: [
      "regexp/no-super-linear-backtracking",
      "regexp/no-super-linear-move",
      "security/detect-unsafe-regex",
    ],
    sample: "redos",
  },
  {
    concern:
      "D8.8: Promise covers discarded chains; Unicorn additionally covers awaited/top-level chains",
    rules: ["promise/prefer-await-to-then", "unicorn/prefer-await"],
    sample: "awaits",
  },
  {
    concern:
      "D8.9: typed computed/optional calls complement untyped and string-array checks",
    rules: [
      "@typescript-eslint/require-array-sort-compare",
      "unicorn/require-array-sort-compare",
    ],
    sample: "sort",
  },
  {
    concern:
      "D8.11: general mode requirements complement typed implicit string patterns",
    rules: ["require-unicode-regexp", "sonarjs/unicode-aware-regex"],
    sample: "unicode",
  },
  {
    concern:
      "D8.12: untyped default enforcement complements typed exhaustiveness and stricter omission markers",
    rules: ["default-case", "@typescript-eslint/switch-exhaustiveness-check"],
    sample: "switch",
  },
  {
    concern:
      "existing owners: export placement and consolidation of separate exports",
    rules: ["import-x/exports-last", "import-x/group-exports"],
    sample: "exports",
  },
];
const samples: readonly Sample[] = [
  ...["js", "ts"].flatMap((extension) => {
    return [...sources]
      .filter(([name]) => {
        return name !== "switch" || extension === "ts";
      })
      .map(([name, text]) => {
        return {
          fileName: `${name.toLowerCase()}.${extension}`,
          name: `${name}.${extension}`,
          text:
            extension === "ts" && name === "awaits"
              ? text.replace("(task)", "(task: Promise<string>)")
              : text,
        };
      });
  }),
  {
    fileName: "stable-component.jsx",
    name: "stable.jsx",
    text: "export const Greeting = () => { return <p>Hello</p>; };\n",
  },
  {
    fileName: "stable-component.tsx",
    name: "stable.tsx",
    text: "export const Greeting = () => { return <p>Hello</p>; };\n",
  },
  ...["js", "ts"].flatMap((language) => {
    return [
      {
        fileName: `escape-${language}.svelte`,
        name: `D1-Stage-2.${language}.svelte`,
        text: [
          `<script${language === "ts" ? ' lang="ts"' : ""}>`,
          String.raw`const pattern = /\u{e9}/u;`,
          "</script>",
          "<p>{pattern.source}</p>",
          "",
        ].join("\n"),
      },
      {
        fileName: `stable-${language}.svelte`,
        name: `stable.${language}.svelte`,
        text: [
          `<script${language === "ts" ? ' lang="ts"' : ""}>`,
          'const label = "Hello";',
          "</script>",
          "<p>{label}</p>",
          "",
        ].join("\n"),
      },
    ];
  }),
  {
    fileName: "warning-control.js",
    name: "warning-control",
    text: stableSource,
  },
];
/*
Only the child process installs warning listeners. A real temporary project lets the project service lint .ts/.tsx files; the public built factory supplies the full composed policy.
*/
const runner = `
import { mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { setImmediate } from "node:timers/promises";
import { ESLint } from "eslint";
import { createConfig } from "./dist/index.mjs";
import { traceFixCycles } from "./tests/policy/fix-convergence.ts";

const samples = JSON.parse(process.argv[1]);
const directory = await realpath(await mkdtemp(path.join(os.tmpdir(), "eslint-config-convergence-")));
const listenerCount = process.listenerCount("warning");
const warnings = [];
const capture = (warning) => { warnings.push(warning.name); };
process.on("warning", capture);
try {
  await writeFile(path.join(directory, "package.json"), JSON.stringify({ type: "module", engines: { node: ">=24.15.0" } }));
  await writeFile(path.join(directory, "tsconfig.json"), JSON.stringify({
    compilerOptions: { allowUnreachableCode: false, jsx: "react-jsx", module: "nodenext", noEmit: true, noImplicitReturns: true, skipLibCheck: true, strict: true, target: "esnext", types: ["node"] },
    include: ["*.ts", "*.tsx"],
  }));
  await symlink(path.join(process.cwd(), "node_modules"), path.join(directory, "node_modules"), "junction");
  await Promise.all(samples.map(({ fileName, text }) => writeFile(path.join(directory, fileName), text)));
  const config = await createConfig({
    express: false, projectRootDirectory: directory, react: { refresh: "generic" }, svelte: true,
    typescript: { tsconfigRootDir: directory },
  }, {
    files: ["warning-control.js"],
    plugins: { control: { rules: { warning: {
      meta: { schema: [] },
      create() { process.emitWarning("Harness control", { type: "ConvergenceControlWarning", code: "HARNESS_CONTROL" }); return {}; },
    } } } },
    rules: { "control/warning": "error" },
  });
  const engines = {
    fixer: new ESLint({ cwd: directory, fix: true, overrideConfig: config, overrideConfigFile: true }),
    reporter: new ESLint({ cwd: directory, overrideConfig: config, overrideConfigFile: true }),
  };
  const results = [];
  for (const { fileName, name, text } of samples) {
    results.push({ name, trace: await traceFixCycles(engines, text, path.join(directory, fileName)) });
  }
  await setImmediate();
  const assignedWarnings = results.flatMap(({ trace }) => trace.flatMap(({ warnings }) => warnings.map(({ name }) => name)));
  if (JSON.stringify(warnings) !== JSON.stringify(assignedWarnings)) {
    throw new Error("Unexpected warnings outside fix cycles: " + JSON.stringify(warnings));
  }
  process.stdout.write(JSON.stringify(results));
} finally {
  process.off("warning", capture);
  await rm(directory, { force: true, recursive: true });
  if (process.listenerCount("warning") !== listenerCount) {
    throw new Error("The harness leaked a warning listener.");
  }
}
`;
// eslint-disable-next-line @typescript-eslint/strict-void-return -- promisify takes execFile's callback form, which also returns its child process.
const execute = promisify(execFile);
const runSamples = async (
  cases: readonly Sample[],
): Promise<readonly SampleResult[]> => {
  const { stderr, stdout } = await execute(
    process.execPath,
    [
      "--no-warnings",
      "--input-type=module",
      "--eval",
      runner,
      JSON.stringify(cases),
    ],
    { cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024, timeout: 90_000 },
  );
  expect(stderr).toBe("");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The isolated runner serializes SampleResult entries.
  return JSON.parse(stdout) as readonly SampleResult[];
};
const results: SampleResult[] = [];
beforeAll(async () => {
  // eslint-disable-next-line functional/immutable-data -- The suite stores its isolated runner's results once during setup.
  results.push(...(await runSamples(samples)));
}, 120_000);
const getTrace = (name: string): FixTrace => {
  return (
    results.find((result) => {
      return result.name === name;
    })?.trace ?? expect.fail(`Missing sample ${name}`)
  );
};
const selectReports = (
  trace: FixTrace,
  rules: readonly string[],
): readonly Linter.LintMessage[] => {
  return trace[0].before.messages.filter(({ ruleId }) => {
    return typeof ruleId === "string" && rules.includes(ruleId);
  });
};
const unapprovedOverlaps = (
  sample: string,
  overlaps: readonly ReportOverlap[],
): readonly ReportOverlap[] => {
  return overlaps.filter(({ rules }) => {
    return approvedOverlaps.every((entry) => {
      return !(
        entry.sample === sample &&
        rules.every((ruleId) => {
          return entry.rules.includes(ruleId);
        })
      );
    });
  });
};

describe("combined ESLint fixes and the package formatter", () => {
  it.each(["js", "ts"])(
    "applies real fixes and formatting before converging in %s",
    (extension) => {
      const trace = getTrace(`fix-and-format.${extension}`);
      expect(
        trace[0].before.messages.map(({ ruleId }) => {
          return ruleId;
        }),
      ).toContain("perfectionist/sort-objects");
      expect(trace[0].fixed.text).not.toBe(trace[0].before.text);
      expect(trace[0].formatted.text).toBe(
        "export const options = { alpha: 2, zeta: 1 };\n",
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts", "jsx", "tsx", "js.svelte", "ts.svelte"])(
    "converges on the stable %s control after two complete cycles",
    (extension) => {
      expect(convergenceProblems(getTrace(`stable.${extension}`))).toEqual([]);
    },
  );
  it("actually enables TypeScript's type-aware rules", () => {
    const rule = "@typescript-eslint/require-array-sort-compare";
    expect(selectReports(getTrace("sort.ts"), [rule])).toHaveLength(1);
    expect(selectReports(getTrace("sort.js"), [rule])).toEqual([]);
  });
  it.each(["js", "ts"])(
    "D1 / Stage 2: characterizes the escape-case loop in %s",
    (extension) => {
      const trace = getTrace(`D1-Stage-2.${extension}`);
      expect(
        trace.map(({ fixed, formatted, warnings }) => {
          return { fixed: fixed.text, formatted: formatted.text, warnings };
        }),
      ).toEqual(
        [0, 1].map(() => {
          return {
            fixed: escapeSource,
            formatted: escapeSource,
            warnings: [{ name: "ESLintCircularFixesWarning" }],
          };
        }),
      );
      expect(
        trace[1].formatted.messages.map(({ fix, ruleId }) => {
          return { fix, ruleId };
        }),
      ).toEqual([
        {
          fix: { range: [23, 32], text: String.raw`/\u{E9}/u` },
          ruleId: "unicorn/escape-case",
        },
      ]);
      expect(convergenceProblems(trace)).toEqual([
        "warning:ESLintCircularFixesWarning",
        "warning:ESLintCircularFixesWarning",
        "fixable-reports",
      ]);
    },
  );
  it.each(["js", "ts"])(
    "D2 / Stage 2: characterizes the import-comment loop in %s",
    (extension) => {
      const trace = getTrace(`D2-Stage-2.${extension}`);
      const output = [
        "// Second section.",
        'import os from "node:os";',
        "// First section.",
        'import path from "node:path";',
        "",
        'export const directories = [os.tmpdir(), path.resolve(".")];',
        "",
      ].join("\n");
      expect(
        trace.map(({ fixed, formatted, warnings }) => {
          return { fixed: fixed.text, formatted: formatted.text, warnings };
        }),
      ).toEqual(
        [0, 1].map(() => {
          return {
            fixed: output,
            formatted: output,
            warnings: [{ name: "ESLintCircularFixesWarning" }],
          };
        }),
      );
      expect(
        trace[1].formatted.messages.map(({ ruleId }) => {
          return ruleId;
        }),
      ).toEqual(["import-x/newline-after-import"]);
      expect(convergenceProblems(trace)).toEqual([
        "warning:ESLintCircularFixesWarning",
        "warning:ESLintCircularFixesWarning",
        "fixable-reports",
      ]);
    },
  );
  it.each(["js", "ts"])(
    "D3 / Stage 3: characterizes the module-spacing loop in %s",
    (extension) => {
      const trace = getTrace(`D3-Stage-3.${extension}`);
      const output = [
        "function first() {",
        "  return 1;",
        "}",
        "/**",
        "Describe the second function.",
        "",
        "Explain a detail.",
        "*/",
        "function second() {",
        "  return 2;",
        "}",
        "",
        "export { first, second };",
        "",
      ].join("\n");
      expect(
        trace.map(({ formatted, warnings }) => {
          return { text: formatted.text, warnings };
        }),
      ).toEqual(
        [0, 1].map(() => {
          return {
            text: output,
            warnings: [{ name: "ESLintCircularFixesWarning" }],
          };
        }),
      );
      expect(trace[1].formatted).toEqual(trace[0].formatted);
      expect(
        trace[1].formatted.messages
          .filter(({ fix }) => {
            return typeof fix !== "undefined";
          })
          .map(({ fix, ruleId }) => {
            return { fix, ruleId };
          }),
      ).toEqual([
        {
          fix: { range: [32, 33], text: "\n" },
          ruleId: "perfectionist/sort-modules",
        },
      ]);
      expect(convergenceProblems(trace)).toEqual([
        "warning:ESLintCircularFixesWarning",
        "warning:ESLintCircularFixesWarning",
        "fixable-reports",
      ]);
    },
  );
  it.each(["js", "ts"])(
    "D1-D3 / Stages 2-3: detects interacting loops in mixed %s",
    (extension) => {
      const trace = getTrace(`D1-D2-D3-Stages-2-3.${extension}`);
      expect(trace[1].formatted).toEqual(trace[0].formatted);
      expect(
        trace.map(({ warnings }) => {
          return warnings;
        }),
      ).toEqual([
        [{ name: "ESLintCircularFixesWarning" }],
        [{ name: "ESLintCircularFixesWarning" }],
      ]);
      expect(
        trace[1].formatted.messages
          .filter(({ fix }) => {
            return typeof fix !== "undefined";
          })
          .map(({ ruleId }) => {
            return ruleId;
          }),
      ).toEqual([
        "perfectionist/sort-imports",
        "unicorn/escape-case",
        "perfectionist/sort-modules",
      ]);
      expect(convergenceProblems(trace)).toContain("fixable-reports");
    },
  );
  it.each(["js", "ts"])(
    "D1 / Stage 2: detects the loop in a Svelte %s script",
    (language) => {
      const trace = getTrace(`D1-Stage-2.${language}.svelte`);
      expect(trace[1].formatted).toEqual(trace[0].formatted);
      expect(
        trace.map(({ warnings }) => {
          return warnings;
        }),
      ).toEqual([
        [{ name: "ESLintCircularFixesWarning" }],
        [{ name: "ESLintCircularFixesWarning" }],
      ]);
      expect(
        trace[1].formatted.messages.map(({ ruleId }) => {
          return ruleId;
        }),
      ).toEqual(["unicorn/escape-case"]);
      expect(convergenceProblems(trace)).toContain("fixable-reports");
    },
  );
});

describe("harness controls", () => {
  it("detects a second-cycle fix even when formatting undoes it", () => {
    const [first, second] = getTrace("stable.js");
    expect(
      convergenceProblems([
        first,
        {
          ...second,
          fixed: { ...second.fixed, text: `${second.fixed.text}\n` },
        },
      ]),
    ).toEqual(["second-fix", "second-format"]);
  });
  it("detects changed diagnostics even when the text stays the same", () => {
    const [first, second] = getTrace("stable.js");
    const { messages } = getTrace("unapproved-equality.js")[0].before;
    expect(
      convergenceProblems([
        first,
        { ...second, formatted: { ...second.formatted, messages } },
      ]),
    ).toContain("diagnostics");
  });
  it("captures real unexpected process warnings by type and code", () => {
    expect(convergenceProblems(getTrace("warning-control"))).toEqual(
      Array.from({ length: 6 }, () => {
        return "warning:ConvergenceControlWarning:HARNESS_CONTROL";
      }),
    );
  });
  it.each([
    { fileName: "invalid.js", name: "invalid", text: "export const = ;" },
    { fileName: "ignored.txt", name: "ignored", text: "Ignored text." },
  ])(
    "rejects $name input",
    async (sample) => {
      await expect(runSamples([sample])).rejects.toThrow(
        "Expected ESLint to lint and parse",
      );
    },
    30_000,
  );
  it("D8.1 / Stage 5: detects unapproved equality reports with nested, unequal ranges", () => {
    const messages = selectReports(getTrace("unapproved-equality.js"), [
      "eqeqeq",
      "no-eq-null",
    ]);
    const overlaps = reportOverlaps(messages);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.ranges[0]).not.toEqual(overlaps[0]?.ranges[1]);
    expect(unapprovedOverlaps("unapproved-equality", overlaps)).toEqual(
      overlaps,
    );
  });
  it("does not treat adjacent ranges or repeated reports from one rule as rule conflicts", () => {
    const messages = selectReports(getTrace("escapes.js"), [
      "no-useless-escape",
      "regexp/no-useless-escape",
    ]);
    const [first, second] = messages;
    expect(messages).toHaveLength(2);
    const endColumn =
      first.endColumn ?? expect.fail("Expected a complete report range");
    expect(
      reportOverlaps([
        first,
        {
          ...second,
          column: endColumn,
          endColumn: endColumn + 1,
        },
      ]),
    ).toEqual([]);
    expect(
      reportOverlaps([first, { ...second, ruleId: first.ruleId }]),
    ).toEqual([]);
  });
});

describe("approved complementary reports", () => {
  it.each(approvedOverlaps)("$sample: $concern", ({ rules, sample }) => {
    const messages = selectReports(getTrace(`${sample}.ts`), rules);
    expect(
      new Set(
        messages.map(({ ruleId }) => {
          return ruleId;
        }),
      ),
    ).toEqual(new Set(rules));
    const overlaps = reportOverlaps(messages);
    expect(overlaps.length).toBeGreaterThan(0);
    expect(unapprovedOverlaps(sample, overlaps)).toEqual([]);
    // The same rule IDs in another sample do not receive an automatic exception.
    expect(unapprovedOverlaps("unreviewed", overlaps)).toEqual(overlaps);
    expect(
      unapprovedOverlaps(
        sample,
        overlaps.map((overlap) => {
          return {
            ...overlap,
            rules: [overlap.rules[0], `${overlap.rules[1]}-unreviewed`],
          };
        }),
      ),
    ).toHaveLength(overlaps.length);
  });
});
