import type { ESLint, Linter } from "eslint";

import path from "node:path";
import process from "node:process";
import { setImmediate } from "node:timers/promises";

import { format, resolveConfig } from "prettier";

type CapturedWarning = {
  readonly code: string | undefined;
  readonly name: string;
};
type FixCycle = {
  readonly before: LintState;
  readonly fixed: LintState;
  readonly formatted: LintState;
  readonly warnings: readonly CapturedWarning[];
};
type FixTrace = readonly [FixCycle, FixCycle];
type LintEngines = {
  readonly fixer: ESLint;
  readonly reporter: ESLint;
};
type LintState = {
  readonly messages: readonly Linter.LintMessage[];
  readonly text: string;
};
type ReportOverlap = {
  readonly ranges: readonly [ReportRange, ReportRange];
  readonly rules: readonly [string, string];
};
type ReportRange = readonly [number, number, number, number];

// Reject ignored files and parser failures before a negative diagnostic assertion can pass.
const lint = async (
  eslint: ESLint,
  text: string,
  filePath: string,
): Promise<LintState> => {
  const results = await eslint.lintText(text, { filePath });
  const [result] = results;
  if (
    typeof result === "undefined" ||
    results.length !== 1 ||
    result.messages.some(({ fatal, ruleId }) => {
      return fatal === true || typeof ruleId !== "string";
    })
  ) {
    // eslint-disable-next-line functional/no-promise-reject, functional/no-throw-statements -- A skipped or unparseable sample must fail the harness.
    throw new Error(
      `Expected ESLint to lint and parse ${filePath}: ${JSON.stringify(results)}.`,
    );
  }
  return { messages: result.messages, text: result.output ?? text };
};
/*
Called in an isolated Node process. Waiting for the warning event before removing its listener captures ESLint's asynchronous circular-fix warnings without depending on their message text.
*/
const runFixCycle = async (
  { fixer, reporter }: LintEngines,
  text: string,
  filePath: string,
): Promise<FixCycle> => {
  const warnings: CapturedWarning[] = [];
  /* eslint-disable functional/no-expression-statements, functional/no-return-void -- Node's warning event requires a side-effect-only callback. */
  const capture = (warning: {
    readonly name: string;

    readonly code?: string;
  }): void => {
    // eslint-disable-next-line functional/immutable-data -- Node delivers warnings through a callback during this cycle only.
    warnings.push({ code: warning.code, name: warning.name });
  };
  /* eslint-enable functional/no-expression-statements, functional/no-return-void -- Restore the guards after the event callback. */
  // eslint-disable-next-line functional/no-expression-statements -- The listener is removed in finally, including on lint or formatter failure.
  process.on("warning", capture);
  try {
    const before = await lint(reporter, text, filePath);
    const fixed = await lint(fixer, text, filePath);
    // Resolve the package's formatter, including its extension-specific parser overrides.
    const options = await resolveConfig(
      path.join(process.cwd(), "tests/policy", path.basename(filePath)),
    );
    const formatted = await lint(
      reporter,
      await format(fixed.text, { ...options, filepath: filePath }),
      filePath,
    );
    await setImmediate();
    return { before, fixed, formatted, warnings };
  } finally {
    // eslint-disable-next-line functional/no-expression-statements -- Never leave a process warning listener installed after a cycle.
    process.off("warning", capture);
  }
};
const traceFixCycles = async (
  engines: LintEngines,
  text: string,
  filePath: string,
): Promise<FixTrace> => {
  const first = await runFixCycle(engines, text, filePath);
  const second = await runFixCycle(engines, first.formatted.text, filePath);
  return [first, second];
};
/*
A formatter can undo an ESLint fix and leave the final text unchanged. Check both transitions in the second cycle as well as final diagnostics, warnings, and remaining fixable reports.
*/
const convergenceProblems = ([first, second]: FixTrace): readonly string[] => {
  return [
    ...(first.formatted.text === second.fixed.text ? [] : ["second-fix"]),
    ...(second.fixed.text === second.formatted.text ? [] : ["second-format"]),
    ...(JSON.stringify(first.formatted.messages) ===
    JSON.stringify(second.formatted.messages)
      ? []
      : ["diagnostics"]),
    ...[first, second].flatMap(({ warnings }) => {
      return warnings.map(({ code, name }) => {
        return `warning:${name}${typeof code === "string" ? `:${code}` : ""}`;
      });
    }),
    ...(second.formatted.messages.some(({ fix }) => {
      return typeof fix !== "undefined";
    })
      ? ["fixable-reports"]
      : []),
  ];
};
const reportRange = ({
  column,
  endColumn,
  endLine,
  line,
}: Readonly<
  Pick<Linter.LintMessage, "column" | "endColumn" | "endLine" | "line">
>): ReportRange | undefined => {
  if (typeof endLine === "number" && typeof endColumn === "number") {
    return [line, column, endLine, endColumn];
  }
  return;
};
// Diagnostic ends are exclusive: adjacent ranges are not overlapping reports.
const isRangeBeforeEnd = (left: ReportRange, right: ReportRange): boolean => {
  return left[0] < right[2] || (left[0] === right[2] && left[1] < right[3]);
};
/*
Compare selected rule reports by their complete ranges, including containment. Callers review specific sample/rule pairs; an intersection alone is not evidence of a redundant concern.
*/
const reportOverlaps = (
  messages: readonly Linter.LintMessage[],
): readonly ReportOverlap[] => {
  const reports = messages.flatMap((message) => {
    const range = reportRange(message);
    return typeof range === "undefined" || typeof message.ruleId !== "string"
      ? []
      : { range, ruleId: message.ruleId };
  });
  return reports.flatMap((left, index) => {
    return reports
      .slice(index + 1)
      .filter((right) => {
        return (
          left.ruleId !== right.ruleId &&
          isRangeBeforeEnd(left.range, right.range) &&
          isRangeBeforeEnd(right.range, left.range)
        );
      })
      .map((right): ReportOverlap => {
        return {
          ranges: [left.range, right.range],
          rules: [left.ruleId, right.ruleId],
        };
      });
  });
};

export type { FixTrace, ReportOverlap };
export { convergenceProblems, reportOverlaps, traceFixCycles };
