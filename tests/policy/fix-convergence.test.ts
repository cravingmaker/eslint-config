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

  readonly typeChecked?: boolean;
};
type SampleResult = {
  readonly name: string;
  readonly trace: Awaited<ReturnType<typeof traceFixCycles>>;
};
type Source = {
  readonly name: string;
  readonly text: string;

  readonly functionLayout?: boolean;
  readonly typescriptOnly?: boolean;
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
const sources: readonly Source[] = [
  {
    name: "annotation-spacing",
    text: "export type Mapper = (value: number) => number;\n",
    typescriptOnly: true,
  },
  {
    name: "awaits",
    text: "export const load = (task) => { return task.then((value) => { return value; }); };\n",
  },
  { name: "commented-imports", text: importSource },
  { name: "escapes", text: `${String.raw`export const pattern = /\a/;`}\n` },
  {
    name: "escapes-and-imports",
    text: `${importSource.replace("export const", "const")}\n${escapeSource.replace("export const", "const")}\nexport { directories, pattern };\n`,
  },
  {
    functionLayout: true,
    name: "escapes-imports-and-functions",
    text: `${importSource.replace("export const", "const")}\n${escapeSource.replace("export const", "const")}\n${moduleSource.replace("export { first, second };", "export { directories, first, pattern, second };")}`,
  },
  {
    name: "explicit-updates",
    text: "export const counter = { value: 1 };\ncounter.value++;\ncounter.value += 2;\n",
  },
  {
    name: "exports",
    text: "export const first = 1;\nconst second = 2;\nexport { second };\n",
  },
  { name: "fix-and-format", text: "export const options={zeta:1,alpha:2}\n" },
  {
    functionLayout: true,
    name: "function-declarations",
    text: moduleSource
      .replace("const first = () =>", "function first()")
      .replace("const second = () =>", "function second()")
      .replaceAll("};", "}"),
  },
  { functionLayout: true, name: "function-variables", text: moduleSource },
  {
    name: "import-then-comment",
    text: [
      'import os from "node:os";',
      "// Read the temporary directory.",
      "export const directory = os.tmpdir();",
      "",
    ].join("\n"),
  },
  {
    name: "import-then-documentation",
    text: [
      'import os from "node:os";',
      "",
      "/**",
      " * Read the temporary directory.",
      " */",
      "export const directory = os.tmpdir();",
      "",
    ].join("\n"),
  },
  {
    name: "import-then-statement",
    text: [
      'import os from "node:os";',
      "export const directory = os.tmpdir();",
      "",
    ].join("\n"),
  },
  { name: "redos", text: "export const pattern = /(?:a+)+$/u;\n" },
  { name: "regex-escapes", text: escapeSource },
  { name: "sort", text: "export const values = [10, 2, 1].toSorted();\n" },
  { name: "stable", text: stableSource },
  { name: "string-escapes", text: stringEscapeSource },
  {
    name: "switch",
    text: 'export const describe = (value: number): string => { switch (value) { case 1: return "one"; } };\n',
    typescriptOnly: true,
  },
  {
    name: "unapproved-equality",
    text: "export const isMissing = (value) => { return value == null; };\n",
  },
  { name: "unicode", text: `${String.raw`export const pattern = /\p{L}/;`}\n` },
  {
    functionLayout: true,
    name: "unstarred-function-declarations",
    text: moduleSource
      .replace("const first = () =>", "function first()")
      .replace("const second = () =>", "function second()")
      .replaceAll("};", "}")
      .replaceAll(" * ", "")
      .replace(" *\n", "\n")
      .replace(" */", "*/"),
  },
];
/*
Every exception is limited to a named sample and individual rule IDs. Each pair keeps both rules because they cover distinct cases, even when both reports refer to intersecting source ranges.
*/
const approvedOverlaps: readonly ApprovedOverlap[] = [
  {
    concern:
      "core checks strings/templates; RegExp also checks constructor patterns",
    rules: ["no-useless-escape", "regexp/no-useless-escape"],
    sample: "escapes",
  },
  {
    concern:
      "backtracking paths, repeated starting positions, and heuristic risk warnings",
    rules: [
      "regexp/no-super-linear-backtracking",
      "regexp/no-super-linear-move",
      "security/detect-unsafe-regex",
    ],
    sample: "redos",
  },
  {
    concern:
      "Promise covers discarded chains; Unicorn additionally covers awaited/top-level chains",
    rules: ["promise/prefer-await-to-then", "unicorn/prefer-await"],
    sample: "awaits",
  },
  {
    concern:
      "typed computed/optional calls complement untyped and string-array checks",
    rules: [
      "@typescript-eslint/require-array-sort-compare",
      "unicorn/require-array-sort-compare",
    ],
    sample: "sort",
  },
  {
    concern:
      "general mode requirements complement typed implicit string patterns",
    rules: ["require-unicode-regexp", "sonarjs/unicode-aware-regex"],
    sample: "unicode",
  },
  {
    concern:
      "untyped default enforcement complements typed exhaustiveness and stricter omission markers",
    rules: ["default-case", "@typescript-eslint/switch-exhaustiveness-check"],
    sample: "switch",
  },
  {
    concern: "export placement and consolidation of separate exports",
    rules: ["import-x/exports-last", "import-x/group-exports"],
    sample: "exports",
  },
];
const sampleText = (
  { functionLayout = false, name, text }: Source,
  extension: string,
): string => {
  if (extension !== "ts") {
    return text;
  }
  if (functionLayout) {
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
    return sources
      .filter(({ typescriptOnly = false }) => {
        return !typescriptOnly || extension === "ts";
      })
      .map((source) => {
        return {
          fileName: `${source.name}.${extension}`,
          name: `${source.name}.${extension}`,
          text: sampleText(source, extension),
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
        name: `function-variables.${language}.svelte`,
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
        name: `regex-escapes.${language}.svelte`,
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
  ...sources.map((source) => {
    return {
      fileName: `${source.name}.untyped.ts`,
      name: `${source.name}.untyped.ts`,
      text: sampleText(source, "ts"),
      typeChecked: false,
    };
  }),
  ...["js", "ts"].map((extension) => {
    return {
      fileName: `state.svelte.${extension}`,
      name: `rune.svelte.${extension}`,
      text: "export const state = $state({ value: 1 });\n",
    };
  }),
  ...["mjs", "mts"].map((extension) => {
    return {
      fileName: `ordinary.svelte.${extension}`,
      name: `ordinary.svelte.${extension}`,
      text: stableSource,
    };
  }),
  {
    fileName: "index.html",
    name: "custom-element.html",
    text: "<my-element></my-element><br>\n",
  },
  {
    fileName: "README.md",
    name: "autolink.md",
    text: "# Example\n\n[https://example.com]\n\n![](image.png)\n",
  },
  ...["json", "jsonc", "json5"].map((extension) => {
    return {
      fileName: `data.${extension}`,
      name: `sort.${extension}`,
      text: `${extension === "json" ? "" : "// Keep this comment.\n"}{"zeta":1,"alpha":2}\n`,
    };
  }),
  {
    fileName: "package.json",
    name: "manifest.json",
    text: JSON.stringify({
      author: "cravingmaker",
      description: "Combined-rule convergence consumer",
      devDependencies: { eslint: "10.12.0" },
      devEngines: { runtime: { name: "node", version: ">=24.15.0" } },
      engines: { node: ">=24.15.0" },
      name: "convergence-consumer",
      peerDependencies: { eslint: ">=10.4.0 <11" },
      peerDependenciesMeta: { eslint: { optional: false } },
      private: true,
      scripts: { lint: "eslint ." },
      type: "module",
      version: "0.0.0",
    }),
  },
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
    include: ["*.ts", "*.tsx", "*.mts"],
  }));
  await symlink(path.join(process.cwd(), "node_modules"), path.join(directory, "node_modules"), "junction");
  await Promise.all(samples.map(({ fileName, text }) => writeFile(path.join(directory, fileName), text)));
  const warningConfig = {
    files: ["warning-control.js"],
    plugins: { control: { rules: { warning: {
      meta: { schema: [] },
      create() { process.emitWarning("Harness control", { type: "ConvergenceControlWarning", code: "HARNESS_CONTROL" }); return {}; },
    } } } },
    rules: { "control/warning": "error" },
  };
  const createEngines = async (typeChecked) => {
    const config = await createConfig({
      express: false, projectRootDirectory: directory, react: { refresh: "generic" }, svelte: true,
      typescript: { tsconfigRootDir: directory, typeChecked },
    }, warningConfig);
    return {
      fixer: new ESLint({ cwd: directory, fix: true, overrideConfig: config, overrideConfigFile: true }),
      reporter: new ESLint({ cwd: directory, overrideConfig: config, overrideConfigFile: true }),
    };
  };
  const typedEngines = await createEngines(true);
  const untypedEngines = await createEngines(false);
  const results = [];
  for (const { fileName, name, text, typeChecked } of samples) {
    results.push({ name, trace: await traceFixCycles(typeChecked === false ? untypedEngines : typedEngines, text, path.join(directory, fileName)) });
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
  it.each(
    samples.filter(({ name }) => {
      return name !== "warning-control";
    }),
  )("converges without warnings or remaining fixes in $name", ({ name }) => {
    expect(convergenceProblems(getTrace(name))).toEqual([]);
  });
  it("keeps type-aware comparator checks out of untyped TypeScript", () => {
    const trace = getTrace("sort.untyped.ts");
    expect(
      selectReports(trace, ["@typescript-eslint/require-array-sort-compare"]),
    ).toEqual([]);
    expect(
      selectReports(trace, ["unicorn/require-array-sort-compare"]),
    ).toHaveLength(1);
  });
  it("preserves custom-element boundaries while fixing void elements", () => {
    const trace = getTrace("custom-element.html");
    const reports = selectReports(trace, ["@html-eslint/require-closing-tags"]);
    expect(reports).toEqual([
      expect.objectContaining({ messageId: "missingSelf" }),
    ]);
    expect(reports[0]?.fix).toBeDefined();
    expect(trace[1].formatted.text).toContain("<my-element></my-element>");
    expect(trace[1].formatted.text).toContain("<br />");
    expect(
      trace[1].formatted.messages.filter(({ ruleId }) => {
        return ruleId === "@html-eslint/require-closing-tags";
      }),
    ).toEqual([]);
  });
  it("retains independent Markdown diagnostics alongside GFM autolinks", () => {
    const trace = getTrace("autolink.md");
    expect(trace[1].formatted.text).toContain("https://example.com");
    expect(trace[1].formatted.messages).toEqual([
      expect.objectContaining({ ruleId: "markdown/require-alt-text" }),
    ]);
  });
  it.each(["json", "jsonc", "json5"])(
    "fixes and formats sorted keys without crossing the %s language boundary",
    (extension) => {
      const trace = getTrace(`sort.${extension}`);
      expect(selectReports(trace, ["json/sort-keys"])).not.toHaveLength(0);
      expect(trace[0].fixed.text).not.toBe(trace[0].before.text);
      expect(trace[1].formatted.text.indexOf("alpha")).toBeLessThan(
        trace[1].formatted.text.indexOf("zeta"),
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(trace[1].formatted.text.includes("// Keep this comment.")).toBe(
        extension !== "json",
      );
    },
  );
  it("sorts manifests while preserving explicit conditional peer metadata", () => {
    const trace = getTrace("manifest.json");
    expect(
      selectReports(trace, ["package-json/order-properties"]),
    ).not.toHaveLength(0);
    expect(trace[0].fixed.text).not.toBe(trace[0].before.text);
    expect(trace[1].formatted.text).toContain('"optional": false');
    expect(trace[1].formatted.messages).toEqual([]);
  });
  it("preserves the annotation-spacing arrow compatibility guard", () => {
    const trace = getTrace("annotation-spacing.ts");
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
    "keeps explicit assignments stable and leaves ++ for manual review in %s",
    (extension) => {
      const trace = getTrace(`explicit-updates.${extension}`);
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
    "converges on function padding and documentation in a Svelte %s script",
    (language) => {
      const trace = getTrace(`function-variables.${language}.svelte`);
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
    "converges on uppercase regex escapes in %s",
    (extension) => {
      const trace = getTrace(`regex-escapes.${extension}`);
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
    "converges on uppercase hexadecimal and Unicode string escapes in %s",
    (extension) => {
      const trace = getTrace(`string-escapes.${extension}`);
      expect(trace[1].formatted.text).toBe(
        `${String.raw`export const characters = ["\u{AB}", "\u{E9}", "\u{E9}"];`}\n`,
      );
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "sorts imports across interleaved comments and converges in %s",
    (extension) => {
      const trace = getTrace(`commented-imports.${extension}`);
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
    "permits a following comment without inserting a blank line in %s",
    (extension) => {
      const trace = getTrace(`import-then-comment.${extension}`);
      expect(trace[1].formatted.text).toBe(trace[0].before.text);
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "retains a blank line before an ordinary statement in %s",
    (extension) => {
      const trace = getTrace(`import-then-statement.${extension}`);
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
    "preserves multiline documentation after the final import in %s",
    (extension) => {
      const trace = getTrace(`import-then-documentation.${extension}`);
      expect(trace[0].before.messages).toEqual([]);
      expect(trace[1].formatted.text).toBe(trace[0].before.text);
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "converges on combined escapes and commented imports in %s",
    (extension) => {
      const trace = getTrace(`escapes-and-imports.${extension}`);
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
    "converges on arrow variables and starred documentation in %s",
    (extension) => {
      const trace = getTrace(`function-variables.${extension}`);
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
      return ["function-declarations", "unstarred-function-declarations"].map(
        (name) => {
          return { extension, name };
        },
      );
    }),
  )(
    "converges on function declarations and leaves them for manual review in $name.$extension",
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
    "converges on mixed escapes, imports, arrows and documentation in %s",
    (extension) => {
      const trace = getTrace(`escapes-imports-and-functions.${extension}`);
      expect(trace[1].formatted.text).toContain(String.raw`/\u{E9}/u`);
      expect(trace[1].formatted.text).toContain(" * Explain a detail.");
      expect(trace[1].formatted.messages).toEqual([]);
      expect(convergenceProblems(trace)).toEqual([]);
    },
  );
  it.each(["js", "ts"])(
    "converges on uppercase escapes in a Svelte %s script",
    (language) => {
      const trace = getTrace(`regex-escapes.${language}.svelte`);
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
  it("gives strict null comparisons one diagnostic owner", () => {
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
