import process from "node:process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { runCommand } from "../package/consumers.js";

const projectDirectory = fileURLToPath(new URL("../..", import.meta.url));

/*
Runs the report as `npm run policy:diff` does after its build: Node.js runs the TypeScript entry
point, which loads the test modules that describe the scenarios.
*/
async function runReport(
  commandLine: readonly string[],
): ReturnType<typeof runCommand> {
  return await runCommand(
    process.execPath,
    ["scripts/policy-diff.ts", ...commandLine],
    projectDirectory,
  );
}

describe("scripts/policy-diff.ts", () => {
  it("compares the working tree with HEAD by default", async () => {
    const { exitCode, stdout } = await runReport([]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(
      /^Effective policy of the working tree compared with HEAD\n{2}Baseline: {5}HEAD, [\da-f]{12} /u,
    );
    expect(stdout).toMatch(
      /\n(?:Unchanged: all \d+ snapshots match the baseline\.|Summary: \d+ changed, \d+ new, \d+ removed, 0 failed, \d+ unchanged\.)\n$/u,
    );
  }, 60_000);

  it("prints its usage", async () => {
    const { exitCode, stdout } = await runReport(["--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(
      /^Usage: npm run policy:diff -- \[--base <git-ref>\]\n/u,
    );
  });

  it.each([
    {
      commandLine: ["--base", "refs/heads/missing-branch"],
      message:
        "policy:diff: The base is not a commit of this project: refs/heads/missing-branch",
    },
    {
      commandLine: ["--base"],
      message: "policy:diff: Option '--base <value>' argument missing",
    },
    {
      commandLine: ["--unknown"],
      message: "policy:diff: Unknown option '--unknown'",
    },
  ])(
    "fails without a report for $commandLine",
    async ({ commandLine, message }) => {
      const { exitCode, stderr, stdout } = await runReport(commandLine);

      expect(exitCode).toBe(1);
      expect(stdout).toBe("");
      expect(stderr).toContain(message);
    },
  );
});
