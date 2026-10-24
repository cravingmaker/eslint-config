import { execFile } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/strict-void-return -- promisify takes the callback form of execFile, which also returns its child process.
const execute = promisify(execFile);
const directory = fileURLToPath(new URL("../..", import.meta.url));
const scripts = [
  "actionlint.mjs",
  "actionlint-reference.json",
  "check-workflows.mjs",
];

const referencePath = path.join(directory, "scripts/actionlint-reference.json");
// eslint-disable-next-line security/detect-non-literal-fs-filename -- The pinned reference has a fixed path in this repository.
const referenceText = await readFile(referencePath, "utf8");
const hasVersion = (value: unknown): value is { readonly version: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof value.version === "string"
  );
};

const reference: unknown = JSON.parse(referenceText);
const version = hasVersion(reference) ? reference.version : undefined;

// Runs the workflow check from `root`, which holds the scripts and receives the `.tools/` cache.
const checkWorkflows = async (
  root: string,
  commandArguments: readonly string[],
): Promise<{ readonly stderr: string; readonly stdout: string }> => {
  return await execute(
    process.execPath,
    [path.join(root, "scripts/check-workflows.mjs"), ...commandArguments],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 60_000,
    },
  );
};

describe("pinned workflow tool", () => {
  it("uses the pinned binary instead of a global installation", async () => {
    const { stdout } = await checkWorkflows(directory, ["-version"]);

    expect(version).toBeTypeOf("string");
    expect(stdout.split("\n", 1)[0]).toBe(version);
  }, 70_000);

  it.each(["imaginary.field", "needs.absent.outputs.value"])(
    "rejects an invalid workflow expression: %s",
    async (expression) => {
      const workspace = await mkdtemp(
        path.join(os.tmpdir(), "eslint-config-workflow-"),
      );
      try {
        const filename = path.join(workspace, "invalid.yml");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- The file is written inside the temporary directory just created.
        await writeFile(
          filename,
          `name: invalid\non: push\njobs:\n  invalid:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo \${{ ${expression} }}\n`,
        );

        await expect(
          checkWorkflows(directory, [filename]),
        ).rejects.toMatchObject({
          code: 1,
          stdout: expect.stringContaining(expression) as unknown,
        });
      } finally {
        await rm(workspace, { force: true, recursive: true });
      }
    },
    70_000,
  );

  it("refuses altered cached tooling without replacing user content", async () => {
    const workspace = await mkdtemp(
      path.join(os.tmpdir(), "eslint-config-workflow-cache-"),
    );
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The scripts directory is created inside the temporary workspace.
      await mkdir(path.join(workspace, "scripts"));
      await Promise.all(
        scripts.map(async (script) => {
          await cp(
            path.join(directory, "scripts", script),
            path.join(workspace, "scripts", script),
          );
        }),
      );
      const cache = path.join(
        workspace,
        ".tools",
        `actionlint-${String(version)}-${process.platform}-${process.arch}`,
      );
      const binary = path.join(cache, "actionlint");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The cache directory is created inside the temporary workspace.
      await mkdir(cache, { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The cached binary is written inside the temporary workspace.
      await writeFile(binary, "altered cached binary");

      await expect(
        checkWorkflows(workspace, ["-version"]),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining(
          "does not match the pinned binary",
        ) as unknown,
      });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The cached binary is read back from the temporary workspace.
      expect(await readFile(binary, "utf8")).toBe("altered cached binary");
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The tool cache is listed inside the temporary workspace.
      expect(await readdir(path.join(workspace, ".tools"))).toEqual([
        path.basename(cache),
      ]);
    } finally {
      await rm(workspace, { force: true, recursive: true });
    }
  });
});
