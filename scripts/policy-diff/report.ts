import type { CurrentSnapshot, SnapshotResult } from "./compare.js";
import type {
  createEslint,
  describeSnapshot,
  EffectiveScenario,
  EffectiveSnapshot,
} from "../../tests/policy/effective-scenarios.js";

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs, promisify } from "node:util";

import { ESLint } from "eslint";

import {
  compareSnapshots,
  compareText,
  formatChanges,
  isRecord,
  unionOfKeys,
} from "./compare.js";

/**
What the baseline commit holds: its snapshots by path below the snapshot directory, and its lockfile, which an old commit may not have.
*/
type Baseline = {
  readonly commit: string;
  readonly snapshots: ReadonlyMap<string, string>;
  readonly subject: string;
  readonly tree: string;

  readonly lockfile?: string;
};
/**
A package of a lockfile, by its path below the project, such as `node_modules/eslint`.
*/
type LockedPackage = {
  readonly isOptional: boolean;
  readonly version: string;
};
/**
The report and whether every snapshot could be compared.
*/
type Report = {
  readonly isComplete: boolean;
  readonly text: string;
};
/**
The functions that describe the snapshots of a scenario.
*/
type SnapshotDescriber = {
  readonly createEslint: typeof createEslint;
  readonly describeSnapshot: typeof describeSnapshot;
};
// eslint-disable-next-line @typescript-eslint/strict-void-return -- promisify takes the callback form of execFile, which also returns its child process.
const execute = promisify(execFile);
const projectDirectory = path.resolve(
  fileURLToPath(new URL("../..", import.meta.url)),
);
const snapshotDirectory = "tests/policy/__snapshots__/effective-rules";
// Git's suffix that resolves a revision to the commit that it names.
const commitSuffix = "^{commit}";
const usage = `Usage: npm run policy:diff -- [--base <git-ref>]

Compares the effective configuration of the working tree, built with
\`npm run build\`, with the snapshots in ${snapshotDirectory}/
at <git-ref>, HEAD by default.`;
/**
Lists the packages whose locked version differs between two lockfiles, by path, with the
`node_modules/` prefix left out.
*/
const compareLockedPackages = (
  before: ReadonlyMap<string, LockedPackage>,
  after: ReadonlyMap<string, LockedPackage>,
): readonly string[] => {
  return unionOfKeys(before, after)
    .toSorted(compareText)
    .flatMap((key) => {
      const name = key.replace(/^node_modules\//u, "");
      const previous = before.get(key)?.version;
      const next = after.get(key)?.version;
      if (previous === next) {
        return [];
      }
      if (typeof previous === "undefined") {
        return `+ ${name}: ${String(next)}`;
      }
      return typeof next === "undefined"
        ? `- ${name}: ${previous}`
        : `~ ${name}: ${previous} → ${next}`;
    });
};
/**
Fails with a message for the person who runs the report.
*/
const fail = (message: string): never => {
  // eslint-disable-next-line functional/no-throw-statements -- The report must not look complete when its inputs are not.
  throw new Error(message);
};
const getMessage = (error: unknown): string => {
  return Error.isError(error) ? error.message : String(error);
};
const describeScenario = async (
  { name, options, snapshots }: EffectiveScenario,
  { createEslint: create, describeSnapshot: describe }: SnapshotDescriber,
): Promise<readonly CurrentSnapshot[]> => {
  const toCurrent = (
    { filePath, path: snapshotPath, ruleIdPrefix }: EffectiveSnapshot,
    description: CurrentSnapshot["description"],
  ): CurrentSnapshot => {
    return {
      description,
      filePath,
      path: snapshotPath,
      ruleIdPrefix,
      scenario: name,
    };
  };
  try {
    const eslint = await create(options);
    return await Promise.all(
      snapshots.map(async (snapshot) => {
        try {
          return toCurrent(snapshot, {
            text: await describe(eslint, snapshot),
          });
        } catch (error) {
          return toCurrent(snapshot, { error: getMessage(error) });
        }
      }),
    );
  } catch (error) {
    return snapshots.map((snapshot) => {
      return toCurrent(snapshot, { error: getMessage(error) });
    });
  }
};
/**
Describes every snapshot of `scenarios` with the built package. A failure is kept with the
snapshot that it belongs to, so that the report can still list the others.
*/
const describeCurrentSnapshots = async (
  scenarios: readonly EffectiveScenario[],
  describer: SnapshotDescriber,
): Promise<readonly CurrentSnapshot[]> => {
  const described = await Promise.all(
    scenarios.map(async (scenario) => {
      return await describeScenario(scenario, describer);
    }),
  );
  return described.flat();
};
/**
Lists the snapshots with `status` under `title`, or nothing when there are none.
*/
const listResults = (
  results: readonly SnapshotResult[],
  status: SnapshotResult["outcome"]["status"],
  title: string,
): readonly string[] => {
  const lines = results.flatMap(({ label, outcome, path: snapshotPath }) => {
    if (outcome.status !== status) {
      return [];
    }
    const line =
      label === snapshotPath ? `  ${label}` : `  ${label} (${snapshotPath})`;
    if (outcome.status !== "failed") {
      return line;
    }
    // The lines that follow the first line of a reason stay indented below it.
    const [firstLine, ...otherLines] = outcome.reason.split("\n");
    return [
      `${line}: ${firstLine}`,
      ...otherLines.map((reasonLine) => {
        return `    ${reasonLine}`;
      }),
    ];
  });
  return lines.length === 0 ? [] : [title, ...lines, ""];
};
/**
Reads the command line: `--base <git-ref>`, HEAD by default, and `--help`.
*/
const parseCommandLine = (
  commandLine: readonly string[],
):
  | {
      readonly base: string;
    }
  | {
      readonly help: true;
    } => {
  const { values } = parseArgs({
    args: [...commandLine],
    options: {
      base: { default: "HEAD", type: "string" },
      help: { default: false, type: "boolean" },
    },
    strict: true,
  });
  return values.help ? { help: true } : { base: values.base };
};
const readInstalledVersion = async (
  key: string,
  directory: string,
): Promise<string | undefined> => {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path is a package of the lockfile, below the project.
    const text = await readFile(
      path.join(directory, key, "package.json"),
      "utf8",
    );
    const manifest: unknown = JSON.parse(text);
    if (isRecord(manifest) && typeof manifest.version === "string") {
      return manifest.version;
    }
  } catch {
    // Uninstalled packages and unreadable manifests are reported as dependency mismatches.
  }
};
/**
Lists the packages of the lockfile that are not installed in `directory` with their locked
version. An optional package, such as one for another platform, may be missing.
*/
const findInstallMismatches = async (
  packages: ReadonlyMap<string, LockedPackage>,
  directory: string,
): Promise<readonly string[]> => {
  const mismatches = await Promise.all(
    packages.entries().map(async ([key, { isOptional, version }]) => {
      const installed = await readInstalledVersion(key, directory);
      if (typeof installed === "undefined") {
        return isOptional ? [] : [`${key}: ${version} is not installed`];
      }
      return installed === version
        ? []
        : [`${key}: ${installed} is installed, the lockfile has ${version}`];
    }),
  );
  return mismatches.flat();
};
/**
Describes the packages of the working tree's lockfile against those of the baseline. The report calculates the configuration with the installed packages, so they must be those of the lockfile.
*/
const describeDependencies = async (
  previous?: ReadonlyMap<string, LockedPackage>,
  current?: ReadonlyMap<string, LockedPackage>,
): Promise<readonly string[]> => {
  if (typeof current === "undefined") {
    return ["Dependencies: the working tree has no readable package-lock.json"];
  }
  const mismatches = await findInstallMismatches(current, projectDirectory);
  if (mismatches.length > 0) {
    return fail(
      [
        "The installed packages differ from package-lock.json, so the report would not describe the working tree:",
        ...mismatches.map((mismatch) => {
          return `  ${mismatch}`;
        }),
        "Run npm ci, then the report again.",
      ].join("\n"),
    );
  }
  if (typeof previous === "undefined") {
    return ["Dependencies: the baseline has no readable package-lock.json"];
  }
  const changes = compareLockedPackages(previous, current);
  return changes.length === 0
    ? [
        "Dependencies: package-lock.json locks the same packages as the baseline",
      ]
    : [
        `Dependencies: package-lock.json differs from the baseline in ${String(changes.length)} packages:`,
        ...changes.map((change) => {
          return `  ${change}`;
        }),
      ];
};
/**
Reads the packages of a lockfile, without the project itself.
*/
const readLockedPackages = (
  text: string,
): ReadonlyMap<string, LockedPackage> => {
  const lockfile: unknown = JSON.parse(text);
  const packages =
    isRecord(lockfile) && isRecord(lockfile.packages) ? lockfile.packages : {};
  return new Map(
    Object.entries(packages).flatMap(
      ([key, entry]): ReadonlyArray<readonly [string, LockedPackage]> => {
        return key !== "" &&
          isRecord(entry) &&
          typeof entry.version === "string"
          ? [
              [
                key,
                {
                  isOptional:
                    entry.optional === true || entry.devOptional === true,
                  version: entry.version,
                },
              ],
            ]
          : [];
      },
    ),
  );
};
/**
Reads the packages of a lockfile like `readLockedPackages`, or nothing without a lockfile or
when it is not JSON.
*/
const readLockedPackagesIfValid = (
  text?: string,
): ReadonlyMap<string, LockedPackage> | undefined => {
  if (typeof text === "undefined") {
    return;
  }
  try {
    return readLockedPackages(text);
  } catch {
    // A malformed optional lockfile contributes no dependency comparison.
  }
};
const readLockfile = async (file: string): Promise<string | undefined> => {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The lockfile of the project.
    return await readFile(file, "utf8");
  } catch {
    // A project can legitimately have no lockfile.
  }
};
const summarize = (results: readonly SnapshotResult[]): string => {
  const count = (status: SnapshotResult["outcome"]["status"]): string => {
    return String(
      results.filter(({ outcome }) => {
        return outcome.status === status;
      }).length,
    );
  };
  if (
    results.every(({ outcome }) => {
      return outcome.status === "unchanged";
    })
  ) {
    return `Unchanged: all ${String(results.length)} snapshots match the baseline.`;
  }
  return `Summary: ${count("changed")} changed, ${count("new")} new, ${count("removed")} removed, ${count("failed")} failed, ${count("unchanged")} unchanged.`;
};
/**
Formats the results: the changes of each changed snapshot, the lists of new, removed, and failed snapshots, and a summary, which says that the policy is unchanged only when every snapshot is.
*/
const formatResults = (
  results: readonly SnapshotResult[],
): readonly string[] => {
  const changed = results.flatMap(({ label, outcome, path: snapshotPath }) => {
    return outcome.status === "changed"
      ? [
          `${label} (${snapshotPath})`,
          ...formatChanges(outcome.changes).map((line) => {
            return `  ${line}`;
          }),
          "",
        ]
      : [];
  });
  return [
    ...(changed.length === 0
      ? []
      : ["Changed snapshots (+ added, - removed, ~ changed):", "", ...changed]),
    ...listResults(
      results,
      "new",
      "New snapshots, without a baseline to compare with:",
    ),
    ...listResults(
      results,
      "removed",
      "Baseline snapshots that no scenario describes:",
    ),
    ...listResults(results, "failed", "Snapshots that could not be compared:"),
    summarize(results),
  ];
};
/**
The environment without the variables that Git reads, whose names start with `GIT_`.
*/
const withoutGitVariables = (
  environment: Readonly<NodeJS.ProcessEnv>,
): NodeJS.ProcessEnv => {
  return Object.fromEntries(
    Object.entries(environment).filter(([name]) => {
      return !name.startsWith("GIT_");
    }),
  );
};
/**
Runs Git in `directory` with `gitArguments`, without a shell, and returns its output. Git finds
the repository from `directory`: a Git hook, such as the pre-push hook that runs the tests, sets
`GIT_DIR` and other variables that would point it to the repository of the hook.
*/
const git = async (
  gitArguments: readonly string[],
  directory: string,
): Promise<string> => {
  const { stdout } = await execute("git", [...gitArguments], {
    cwd: directory,
    encoding: "utf8",
    // eslint-disable-next-line n/no-process-env -- Git runs with the environment of the report, without the variables of a hook.
    env: withoutGitVariables(process.env),
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
};
/**
Runs Git like `git` for a command that prints one line, and returns that line.
*/
const gitLine = async (
  gitArguments: readonly string[],
  directory: string,
): Promise<string> => {
  const output = await git(gitArguments, directory);
  return output.trim();
};
/**
Resolves `object` to the name of a Git object in `directory`, or nothing when it names none.
Git reads it as a revision even when it starts with a dash, so it cannot pass an option.
*/
const readGitObject = async (
  object: string,
  directory: string,
): Promise<string | undefined> => {
  try {
    return await gitLine(
      ["rev-parse", "--verify", "--quiet", "--end-of-options", object],
      directory,
    );
  } catch {
    // A baseline can legitimately omit the requested Git object.
  }
};
/**
Reads the snapshots and the lockfile of `commit` through Git in `directory`. A commit without
snapshots cannot be a baseline.
*/
const readGitFile = async (
  object: string,
  directory: string,
): Promise<string | undefined> => {
  const blob = await readGitObject(object, directory);
  if (typeof blob === "string") {
    return await git(["cat-file", "blob", blob], directory);
  }
};
const readBaseline = async (
  commit: string,
  directory: string,
): Promise<Baseline> => {
  const tree = await readGitObject(`${commit}:${snapshotDirectory}`, directory);
  if (typeof tree === "undefined") {
    return fail(
      `The baseline ${commit} has no snapshots in ${snapshotDirectory}/.`,
    );
  }
  const files = await git(
    [
      "ls-tree",
      "-r",
      "-z",
      "--name-only",
      commit,
      "--",
      `${snapshotDirectory}/`,
    ],
    directory,
  );
  const snapshots = await Promise.all(
    files
      .split("\0")
      .filter((file) => {
        return file !== "";
      })
      .map(async (file): Promise<readonly [string, string]> => {
        const text = await git(
          ["cat-file", "blob", `${commit}:${file}`],
          directory,
        );
        return [file.slice(snapshotDirectory.length + 1), text];
      }),
  );
  const lockfile = await readGitFile(`${commit}:package-lock.json`, directory);
  return {
    commit,
    lockfile,
    snapshots: new Map(snapshots),
    subject: await gitLine(["log", "-1", "--format=%s", commit], directory),
    tree,
  };
};
/**
Resolves `revision` to the commit that it names in `directory`, or fails.
*/
const resolveCommit = async (
  revision: string,
  directory: string,
): Promise<string> => {
  const commit = await readGitObject(`${revision}${commitSuffix}`, directory);
  return (
    commit ?? fail(`The base is not a commit of this project: ${revision}`)
  );
};
/**
Builds the report for `base`: the context that tells a refactor from a dependency update, then
the differences of each snapshot, then a summary. Fails when the baseline cannot be read or the
installed packages are not those of the lockfile.
*/
const createReport = async (base: string): Promise<Report> => {
  if (process.cwd() !== projectDirectory) {
    return fail(
      `Run the report from ${projectDirectory}, as npm run policy:diff does.`,
    );
  }
  const baseline = await readBaseline(
    await resolveCommit(base, projectDirectory),
    projectDirectory,
  );
  const lockfile = await readLockfile(
    path.join(projectDirectory, "package-lock.json"),
  );
  const dependencies = await describeDependencies(
    readLockedPackagesIfValid(baseline.lockfile),
    readLockedPackagesIfValid(lockfile),
  );
  const head = await gitLine(["rev-parse", "HEAD"], projectDirectory);
  const status = await git(
    ["--no-optional-locks", "status", "--porcelain", "-z"],
    projectDirectory,
  );
  const { createEslint, describeSnapshot, effectiveScenarios } =
    await import("../../tests/policy/effective-scenarios.js");
  const results = compareSnapshots(
    baseline.snapshots,
    await describeCurrentSnapshots(effectiveScenarios, {
      createEslint,
      describeSnapshot,
    }),
  );
  return {
    isComplete: results.every(({ outcome }) => {
      return outcome.status !== "failed";
    }),
    text: [
      `Effective policy of the working tree compared with ${base}`,
      "",
      `Baseline:     ${base}, ${baseline.commit.slice(0, 12)} ${baseline.subject}`,
      `Snapshots:    ${String(baseline.snapshots.size)} files in ${snapshotDirectory}/, tree ${baseline.tree.slice(0, 12)}`,
      `Current:      the working tree at ${head.slice(0, 12)}${status === "" ? "" : ", with uncommitted changes"}`,
      `Toolchain:    Node.js ${process.version}, ESLint ${ESLint.version}`,
      ...dependencies,
      "",
      ...formatResults(results),
    ].join("\n"),
  };
};
/**
Runs the report for the command line, prints it, and returns the exit status: 0 for a report, also one with differences, and 1 when the report cannot be made or is incomplete.
*/
const runPolicyDiff = async (
  commandLine: readonly string[],
): Promise<number> => {
  try {
    const parsed = parseCommandLine(commandLine);
    if ("help" in parsed) {
      console.log(usage);
      return 0;
    }
    const { isComplete, text } = await createReport(parsed.base);
    console.log(text);
    if (isComplete) {
      return 0;
    }
    console.error("policy:diff: some snapshots could not be compared.");
    return 1;
  } catch (error) {
    console.error(`policy:diff: ${getMessage(error)}`);
    return 1;
  }
};
export {
  compareLockedPackages,
  describeCurrentSnapshots,
  findInstallMismatches,
  formatResults,
  readBaseline,
  readLockedPackages,
  resolveCommit,
  runPolicyDiff,
  withoutGitVariables,
};
