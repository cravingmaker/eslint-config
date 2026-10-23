import {
  access,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import { createTemporaryDirectory, execute } from "../../package/consumers.js";
import {
  createEslint,
  describeSnapshot,
  effectiveScenarios,
} from "../../policy/effective-scenarios.js";
import {
  compareSnapshots,
  compareText,
} from "../../../scripts/policy-diff/compare.js";
import {
  compareLockedPackages,
  describeCurrentSnapshots,
  findInstallMismatches,
  formatResults,
  readBaseline,
  readLockedPackages,
  resolveCommit,
  withoutGitVariables,
} from "../../../scripts/policy-diff/report.js";

const snapshotDirectory = "tests/policy/__snapshots__/effective-rules";
const lockfile = `${JSON.stringify({
  lockfileVersion: 3,
  packages: {
    "": { version: "0.1.0" },
    "node_modules/eslint": { version: "10.11.0" },
  },
})}\n`;
const snapshots = {
  "default/src__example.ts.txt":
    "path: src/example.ts\nignored: true\nconfig: none\n",
  "react-refresh/generic.tsx.txt":
    'react-refresh/only-export-components: warn [{"checkJS":false}]\n',
} as const;
const exampleProject = await createTemporaryDirectory(
  "eslint-config-policy-diff-",
);
/**
 * Runs Git in the example project, without the variables of a Git hook, which would point it to this repository while the pre-push hook runs the tests, and without the hooks and signing that the user's configuration may set.
 */
const git = async (gitArguments: readonly string[]): Promise<string> => {
  const { stdout } = await execute(
    "git",
    [
      "-c",
      "commit.gpgSign=false",
      "-c",
      `core.hooksPath=${path.join(exampleProject, "no-hooks")}`,
      "-c",
      "tag.gpgSign=false",
      "-c",
      "user.email=policy-diff@example.com",
      "-c",
      "user.name=Policy Diff",
      ...gitArguments,
    ],
    // eslint-disable-next-line n/no-process-env -- Git runs with the environment of the tests, without the variables of a hook.
    { cwd: exampleProject, env: withoutGitVariables(process.env) },
  );
  return stdout.trim();
};

/*
A Git repository with three commits, each tagged: one without snapshots, one with snapshots and without a lockfile, and one with both.
*/
await git(["init", "--quiet", "--initial-branch=main"]);
// eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only README.md in this suite's owned temporary repository.
await writeFile(path.join(exampleProject, "README.md"), "# Example\n");
const commit = async (tag: string): Promise<void> => {
  await git(["add", "--all"]);
  await git(["commit", "--quiet", "--message", tag]);
  await git(["tag", tag]);
};

await commit("without-snapshots");
await Promise.all(
  Object.entries(snapshots).map(async ([file, text]) => {
    const snapshotPath = path.join(exampleProject, snapshotDirectory, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The parent path comes from the fixed snapshot keys beneath the owned repository snapshot root.
    await mkdir(path.dirname(snapshotPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path comes from the fixed snapshot keys beneath the owned repository snapshot root.
    await writeFile(snapshotPath, text);
  }),
);
await commit("without-lockfile");
// eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only package-lock.json in this suite's owned temporary repository.
await writeFile(path.join(exampleProject, "package-lock.json"), lockfile);
await commit("complete");
afterAll(async () => {
  await rm(exampleProject, { force: true, recursive: true });
});
describe("resolveCommit", () => {
  it("resolves a revision to the commit that it names", async () => {
    await expect(resolveCommit("complete", exampleProject)).resolves.toBe(
      await git(["rev-parse", "complete^{commit}"]),
    );
    await expect(resolveCommit("HEAD~2", exampleProject)).resolves.toBe(
      await git(["rev-parse", "without-snapshots^{commit}"]),
    );
  });
  it.each(["missing", "complete^{tree}", ""])(
    "rejects %j, which names no commit",
    async (revision) => {
      await expect(resolveCommit(revision, exampleProject)).rejects.toThrow(
        `The base is not a commit of this project: ${revision}`,
      );
    },
  );
  it("reads a revision that starts with a dash as a revision, not an option", async () => {
    const output = path.join(exampleProject, "output.txt");
    await expect(
      resolveCommit(`--output=${output}`, exampleProject),
    ).rejects.toThrow("The base is not a commit of this project");
    await expect(access(output)).rejects.toThrow("ENOENT");
  });
});
describe("readBaseline", () => {
  it("reads the snapshots and the lockfile of a commit", async () => {
    const commitId = await git(["rev-parse", "complete^{commit}"]);
    const baseline = await readBaseline(commitId, exampleProject);
    expect(baseline).toEqual({
      commit: commitId,
      lockfile,
      snapshots: new Map(Object.entries(snapshots)),
      subject: "complete",
      tree: await git(["rev-parse", `complete:${snapshotDirectory}`]),
    });
  });
  it("reads a commit without a lockfile", async () => {
    const baseline = await readBaseline(
      await git(["rev-parse", "without-lockfile^{commit}"]),
      exampleProject,
    );
    expect(baseline.lockfile).toBeUndefined();
    expect(baseline.snapshots.size).toBe(2);
  });
  it("rejects a commit without snapshots", async () => {
    const commitId = await git(["rev-parse", "without-snapshots^{commit}"]);
    await expect(readBaseline(commitId, exampleProject)).rejects.toThrow(
      `The baseline ${commitId} has no snapshots in ${snapshotDirectory}/.`,
    );
  });
});
describe("dependencies", () => {
  it("lists the packages whose locked version changed, without the project", () => {
    const before = readLockedPackages(
      JSON.stringify({
        packages: {
          "": { version: "0.1.0" },
          "node_modules/a": { version: "1.0.0" },
          "node_modules/b": { version: "1.0.0" },
          "node_modules/b/node_modules/c": { version: "2.0.0" },
        },
      }),
    );
    const after = readLockedPackages(
      JSON.stringify({
        packages: {
          "": { version: "0.2.0" },
          "node_modules/a": { version: "1.1.0" },
          "node_modules/b/node_modules/c": { version: "2.0.0" },
          "node_modules/d": { optional: true, version: "3.0.0" },
        },
      }),
    );
    expect(compareLockedPackages(before, before)).toEqual([]);
    expect(compareLockedPackages(before, after)).toEqual([
      "~ a: 1.0.0 → 1.1.0",
      "- b: 1.0.0",
      "+ d: 3.0.0",
    ]);
  });
  it("finds the packages that are not installed with their locked version", async () => {
    const project = await createTemporaryDirectory("eslint-config-installed-");
    const install = async (name: string, version: string): Promise<void> => {
      const directory = path.join(project, "node_modules", name);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Package names come from the same/other fixture calls under this test's temporary node_modules.
      await mkdir(directory, { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only package.json inside the package fixture directory created above.
      await writeFile(
        path.join(directory, "package.json"),
        JSON.stringify({ name, version }),
      );
    };

    await install("same", "1.0.0");
    await install("other", "0.9.0");
    const mismatches = await findInstallMismatches(
      readLockedPackages(
        JSON.stringify({
          packages: {
            "node_modules/missing": { version: "2.0.0" },
            "node_modules/optional": { optional: true, version: "3.0.0" },
            "node_modules/other": { version: "1.0.0" },
            "node_modules/same": { version: "1.0.0" },
          },
        }),
      ),
      project,
    );
    await rm(project, { force: true, recursive: true });
    expect(mismatches).toEqual([
      "node_modules/missing: 2.0.0 is not installed",
      "node_modules/other: 0.9.0 is installed, the lockfile has 1.0.0",
    ]);
  });
});
describe("formatResults", () => {
  it("says that the policy is unchanged only when every snapshot is", () => {
    expect(
      formatResults([
        {
          label: "default: src/a.ts",
          outcome: { status: "unchanged" },
          path: "default/src__a.ts.txt",
        },
        {
          label: "default: src/b.ts",
          outcome: { status: "unchanged" },
          path: "default/src__b.ts.txt",
        },
      ]),
    ).toEqual(["Unchanged: all 2 snapshots match the baseline."]);
  });
  it("lists the snapshots by outcome, and counts them", () => {
    expect(
      formatResults([
        {
          label: "default: src/a.ts",
          outcome: {
            changes: [
              {
                after: { options: "", severity: "warn" },
                before: { options: "", severity: "off" },
                kind: "rule",
                name: "no-console",
              },
            ],
            status: "changed",
          },
          path: "default/src__a.ts.txt",
        },
        {
          label: "default: src/b.ts",
          outcome: { status: "new" },
          path: "default/src__b.ts.txt",
        },
        {
          label: "default/src__c.ts.txt",
          outcome: { status: "removed" },
          path: "default/src__c.ts.txt",
        },
        {
          label: "default: src/d.ts",
          outcome: { reason: "First line\n- second line", status: "failed" },
          path: "default/src__d.ts.txt",
        },
        {
          label: "default: src/e.ts",
          outcome: { status: "unchanged" },
          path: "default/src__e.ts.txt",
        },
      ]),
    ).toEqual([
      "Changed snapshots (+ added, - removed, ~ changed):",
      "",
      "default: src/a.ts (default/src__a.ts.txt)",
      "  ~ no-console: off → warn",
      "",
      "New snapshots, without a baseline to compare with:",
      "  default: src/b.ts (default/src__b.ts.txt)",
      "",
      "Baseline snapshots that no scenario describes:",
      "  default/src__c.ts.txt",
      "",
      "Snapshots that could not be compared:",
      "  default: src/d.ts (default/src__d.ts.txt): First line",
      "    - second line",
      "",
      "Summary: 1 changed, 1 new, 1 removed, 1 failed, 1 unchanged.",
    ]);
  });
});
describe("withoutGitVariables", () => {
  it("leaves out the variables whose names start with GIT_", () => {
    const environment = Object.fromEntries([
      ["GIT_DIR", "/project/.git"],
      ["GIT_INDEX_FILE", "/project/.git/index"],
      ["HOME", "/home/user"],
      ["PATH", "/usr/bin"],
    ]);
    expect(withoutGitVariables(environment)).toEqual(
      Object.fromEntries([
        ["HOME", "/home/user"],
        ["PATH", "/usr/bin"],
      ]),
    );
  });
});
describe("the current scenarios", () => {
  it("describe every snapshot of the working tree, which compares as unchanged", async () => {
    const directory = fileURLToPath(
      new URL(`../../../${snapshotDirectory}`, import.meta.url),
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Read the fixed repository effective-snapshot directory resolved relative to this module.
    const files = await readdir(directory, { recursive: true });
    const workingTree = new Map(
      await Promise.all(
        files
          .filter((file) => {
            return file.endsWith(".txt");
          })
          .map(async (file): Promise<readonly [string, string]> => {
            return [
              file.split(path.sep).join("/"),
              // eslint-disable-next-line security/detect-non-literal-fs-filename -- Filenames come from readdir of the repository snapshot directory and are read beneath that root.
              await readFile(path.join(directory, file), "utf8"),
            ];
          }),
      ),
    );
    const results = compareSnapshots(
      workingTree,
      await describeCurrentSnapshots(effectiveScenarios, {
        createEslint,
        describeSnapshot,
      }),
    );
    expect(
      results
        .map(({ path: snapshotPath }) => {
          return snapshotPath;
        })
        .toSorted(compareText),
    ).toEqual(workingTree.keys().toArray().toSorted(compareText));
    expect(
      results.filter(({ outcome }) => {
        return outcome.status !== "unchanged";
      }),
    ).toEqual([]);
  });
});
