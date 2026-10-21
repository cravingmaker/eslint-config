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
const stringEscapeSource = `${String.raw`export const characters = ["\xab", "\u00e9", "\u{e9}"];`}\n`;
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
  "const first = () => { return 1; };",
  "",
  "/**",
  " * Describe the second function.",
  " *",
  " * Explain a detail.",
  " */",
  "const second = () => { return 2; };",
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
  [
    "D1-D2-D3-Stages-2-3",
    `${importSource.replace("export const", "const")}\n${escapeSource.replace("export const", "const")}\n${moduleSource.replace("export { first, second };", "export { directories, first, pattern, second };")}`,
  ],
  [
    "D1-D2-Stage-2",
    `${importSource.replace("export const", "const")}\n${escapeSource.replace("export const", "const")}\nexport { directories, pattern };\n`,
  ],
  ["D1-Stage-2", escapeSource],
  ["D1-strings-Stage-2", stringEscapeSource],
  [
    "D2-following-comment-Stage-2",
    [
      'import os from "node:os";',
      "// Read the temporary directory.",
      "export const directory = os.tmpdir();",
      "",
    ].join("\n"),
  ],
  [
    "D2-following-statement-Stage-2",
    [
      'import os from "node:os";',
      "export const directory = os.tmpdir();",
      "",
    ].join("\n"),
  ],
  [
    "D2-multiline-comment-Stage-2",
    [
      'import os from "node:os";',
      "",
      "/**",
      " * Read the temporary directory.",
      " */",
      "export const directory = os.tmpdir();",
      "",
    ].join("\n"),
  ],
  ["D2-Stage-2", importSource],
  [
    "D3-original-Stage-3",
    moduleSource
      .replace("const first = () =>", "function first()")
      .replace("const second = () =>", "function second()")
      .replaceAll("};", "}"),
  ],
  ["D3-Stage-3", moduleSource],
  [
    "D3-unstarred-Stage-3",
    moduleSource
      .replace("const first = () =>", "function first()")
      .replace("const second = () =>", "function second()")
      .replaceAll("};", "}")
      .replaceAll(" * ", "")
      .replace(" *\n", "\n")
      .replace(" */", "*/"),
  ],
  ["D13.2-Stage-7", "export type Mapper = (value: number) => number;\n"],
  [
    "D19-Stage-7",
    "export const counter = { value: 1 };\ncounter.value++;\ncounter.value += 2;\n",
  ],
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
const sampleText = (name: string, text: string, extension: string): string => {
  if (extension !== "ts") {
    return text;
  }
  if (name.includes("D3")) {
    return text
      .replaceAll("= () =>", "= (value: number) =>")
      .replaceAll("function first()", "function first(value: number)")
      .replaceAll("function second()", "function second(value: number)")
      .replaceAll("return 1;", "return value;")
      .replaceAll("return 2;", "return value;");
  }
  return name === "awaits"
    ? text.replace("(task)", "(task: Promise<string>)")
    : text;
};

const samples: readonly Sample[] = [
  ...["js", "ts"].flatMap((extension) => {
    return [...sources]
      .filter(([name]) => {
        return (
          !["D13.2-Stage-7", "switch"].includes(name) || extension === "ts"
        );
      })
      .map(([name, text]) => {
        return {
          fileName: `${name.toLowerCase()}.${extension}`,
          name: `${name}.${extension}`,
          text: sampleText(name, text, extension),
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
        fileName: `functions-${language}.svelte`,
        name: `D3-Stage-3.${language}.svelte`,
        text: [
          `<script${language === "ts" ? ' lang="ts"' : ""}>`,
          `const first = (value${language === "ts" ? ": number" : ""}) => { return value; };`,
          "/**",
          "Describe the second function.",
          "",
          "Keep the paragraph.",
          "*/",
          `const second = (value${language === "ts" ? ": number" : ""}) => { return value; };`,
          "</script>",
          "<p>{first(1)} {second(2)}</p>",
          "",
        ].join("\n"),
      },
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
  it("D13.2: preserves the annotation-spacing arrow compatibility guard", () => {
    const trace = getTrace("D13.2-Stage-7.ts");
    expect(
      selectReports(trace, [
        "@stylistic/type-annotation-spacing",
        "@stylistic/arrow-spacing",
      ]),
    ).toEqual([]);
    expect(trace[1].formatted.text).toBe(
      "export type Mapper = (value: number) => number;\n",
    );
    expect(convergenceProblems(trace)).toEqual([]);
  });
  it.each(["js", "ts"])(
    "D19: keeps explicit assignments stable and leaves ++ for manual review in %s",
    (extension) => {
      const trace = getTrace(`D19-Stage-7.${extension}`);
      expect(selectReports(trace, ["no-plusplus"])).toHaveLength(1);
      expect(selectReports(trace, ["operator-assignment"])).toHaveLength(1);
      expect(trace[1].formatted.text).toContain(
        "counter.value = counter.value + 2;",
      );
      expect(trace[1].formatted.text).toContain("counter.value++;");
      expect(trace[1].formatted.messages).toContainEqual(
        expect.objectContaining({ ruleId: "no-plusplus", severity: 2 }),
      );
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D3: converges on function padding and documentation in a Svelte %s script",
    (language) => {
      const trace = getTrace(`D3-Stage-3.${language}.svelte`);
      expect(
        selectReports(trace, ["@cravingmaker/starred-documentation"]),
      ).toHaveLength(1);
      expect(
        selectReports(trace, [
          "@cravingmaker/svelte-function-variable-padding",
        ]),
      ).toHaveLength(1);
      expect(trace[1].formatted.text).toContain(" * Keep the paragraph.");
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
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
    "D1: converges on uppercase regex escapes in %s",
    (extension) => {
      const trace = getTrace(`D1-Stage-2.${extension}`);
      expect(
        trace[0].before.messages.map(({ ruleId }) => {
          return ruleId;
        }),
      ).toEqual(
        expect.arrayContaining(["regexp/letter-case", "unicorn/escape-case"]),
      );
      expect(trace[1].formatted.text).toBe(
        `${String.raw`export const pattern = /\u{E9}/u;`}\n`,
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D1: converges on uppercase hexadecimal and Unicode string escapes in %s",
    (extension) => {
      const trace = getTrace(`D1-strings-Stage-2.${extension}`);
      expect(trace[1].formatted.text).toBe(
        `${String.raw`export const characters = ["\u{AB}", "\u{E9}", "\u{E9}"];`}\n`,
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D2: sorts imports across interleaved comments and converges in %s",
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
      expect(trace[1].formatted.text).toBe(output);
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D2: permits a following comment without inserting a blank line in %s",
    (extension) => {
      const trace = getTrace(`D2-following-comment-Stage-2.${extension}`);
      expect(trace[1].formatted.text).toBe(trace[0].before.text);
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D2: retains a blank line before an ordinary statement in %s",
    (extension) => {
      const trace = getTrace(`D2-following-statement-Stage-2.${extension}`);
      expect(
        selectReports(trace, ["import-x/newline-after-import"]),
      ).toHaveLength(1);
      expect(trace[1].formatted.text).toBe(
        [
          'import os from "node:os";',
          "",
          "export const directory = os.tmpdir();",
          "",
        ].join("\n"),
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D2: preserves multiline documentation after the final import in %s",
    (extension) => {
      const trace = getTrace(`D2-multiline-comment-Stage-2.${extension}`);
      expect(trace[0].before.messages).toEqual([]);
      expect(trace[1].formatted.text).toBe(trace[0].before.text);
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D1/D2: converges on combined escapes and commented imports in %s",
    (extension) => {
      const trace = getTrace(`D1-D2-Stage-2.${extension}`);
      expect(trace[1].formatted.text).toBe(
        [
          "// Second section.",
          'import os from "node:os";',
          "// First section.",
          'import path from "node:path";',
          "",
          'const directories = [os.tmpdir(), path.resolve(".")];',
          "",
          String.raw`const pattern = /\u{E9}/u;`,
          "",
          "export { directories, pattern };",
          "",
        ].join("\n"),
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D3: converges on arrow variables and starred documentation in %s",
    (extension) => {
      const trace = getTrace(`D3-Stage-3.${extension}`);
      expect(trace[1].formatted.text).toBe(
        [
          `const first = ${extension === "ts" ? "(value: number)" : "()"} => {`,
          extension === "ts" ? "  return value;" : "  return 1;",
          "};",
          "",
          "/**",
          " * Describe the second function.",
          " *",
          " * Explain a detail.",
          " */",
          `const second = ${extension === "ts" ? "(value: number)" : "()"} => {`,
          extension === "ts" ? "  return value;" : "  return 2;",
          "};",
          "",
          "export { first, second };",
          "",
        ].join("\n"),
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(
    ["js", "ts"].flatMap((extension) => {
      return ["D3-original-Stage-3", "D3-unstarred-Stage-3"].map((name) => {
        return { extension, name };
      });
    }),
  )(
    "D3: converges on the original declaration layout in $name.$extension",
    ({ extension, name }) => {
      const trace = getTrace(`${name}.${extension}`);
      expect(trace[1].formatted.text).toContain(" * Explain a detail.");
      expect(trace[1].formatted.messages).toEqual([
        expect.objectContaining({
          ruleId: "@cravingmaker/prefer-arrow-functions",
        }),
        expect.objectContaining({
          ruleId: "@cravingmaker/prefer-arrow-functions",
        }),
      ]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D1/D2/D3: converges on mixed escapes, imports, arrows and documentation in %s",
    (extension) => {
      const trace = getTrace(`D1-D2-D3-Stages-2-3.${extension}`);
      expect(trace[1].formatted.text).toContain(String.raw`/\u{E9}/u`);
      expect(trace[1].formatted.text).toContain(" * Explain a detail.");
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "D1: converges on uppercase escapes in a Svelte %s script",
    (language) => {
      const trace = getTrace(`D1-Stage-2.${language}.svelte`);
      expect(trace[1].formatted.text).toContain(String.raw`/\u{E9}/u`);
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
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
  it("D8.1: gives strict null comparisons one diagnostic owner", () => {
    const messages = selectReports(getTrace("unapproved-equality.js"), [
      "eqeqeq",
      "no-eq-null",
    ]);
    const overlaps = reportOverlaps(messages);
    expect(messages).toEqual([expect.objectContaining({ ruleId: "eqeqeq" })]);
    expect(overlaps).toEqual([]);
    expect(convergenceProblems(getTrace("unapproved-equality.js"))).toEqual([]);
  });
  it("detects unapproved nested, unequal ranges independently of resolved ownership", () => {
    const [message] = selectReports(getTrace("unapproved-equality.js"), [
      "eqeqeq",
    ]);
    const nested = {
      ...message,
      column: message.column - 1,
      endColumn: (message.endColumn ?? message.column + 2) + 1,
      ruleId: "control/nested",
    };
    const overlaps = reportOverlaps([message, nested]);
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
