/* eslint-disable security/detect-non-literal-fs-filename -- The consumers are created in a temporary directory. */

import { execFile } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

type CommandResult = {
  readonly exitCode: number;
  readonly stderr: string;
  readonly stdout: string;
};
type Manifest = {
  readonly devDependencies: Readonly<Record<string, string>>;
  readonly peerDependencies: Readonly<Record<string, string>>;
};

// eslint-disable-next-line @typescript-eslint/strict-void-return -- promisify takes the callback form of execFile, which also returns its child process.
const execute = promisify(execFile);
const projectDirectory = fileURLToPath(new URL("../..", import.meta.url));
const fixturesDirectory = fileURLToPath(
  new URL("../fixtures", import.meta.url),
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This repository's manifest has this shape.
const manifest = JSON.parse(
  await readFile(path.join(projectDirectory, "package.json"), "utf8"),
) as Manifest;
// ESLint and the peers are the versions that this repository tests with.
const testedVersions = new Map(Object.entries(manifest.devDependencies));

/*
A project in `parentDirectory` that installs the packed package, ESLint, and `peers` from the
registry, as a consumer does, with this repository's install policy: no install scripts, and no
version less than seven days old. The fixtures are copied into `fixtures/`.
*/
async function createConsumer(
  parentDirectory: string,
  name: string,
  tarball: string,
  peers: readonly string[],
): Promise<string> {
  const directory = path.join(parentDirectory, name);
  await mkdir(directory);
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ name: `consumer-${name}`, private: true, type: "module" }),
  );
  await writeFile(
    path.join(directory, ".npmrc"),
    "audit=false\nfund=false\nignore-scripts=true\nmin-release-age=7\n",
  );
  // eslint-disable-next-line functional/no-expression-statements -- The install resolves or rejects; what it prints is not needed.
  await execute(
    "npm",
    [
      "install",
      "--prefer-offline",
      "--save-exact",
      tarball,
      ...["eslint", ...peers].map(
        (packageName) =>
          `${packageName}@${testedVersions.get(packageName) ?? "missing"}`,
      ),
    ],
    { cwd: directory },
  );
  await cp(fixturesDirectory, path.join(directory, "fixtures"), {
    recursive: true,
  });
  return directory;
}
// The package as published: `npm pack` of the current build, in `destination`.
async function createTarball(destination: string): Promise<string> {
  const { stdout } = await execute(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", destination],
    { cwd: projectDirectory },
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- `npm pack --json` prints this shape.
  const [{ filename }] = JSON.parse(stdout) as readonly [
    { readonly filename: string },
  ];
  return path.join(destination, filename);
}
/*
Runs a command and returns what it prints, also when it exits with an error, as ESLint does when
it reports a problem and TypeScript does when it finds one.
*/
async function getOutput(
  command: string,
  commandArguments: readonly string[],
  directory: string,
): Promise<string> {
  try {
    const { stdout } = await execute(command, [...commandArguments], {
      cwd: directory,
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    return typeof error === "object" &&
      error !== null &&
      "stdout" in error &&
      typeof error.stdout === "string"
      ? error.stdout
      : String(error);
  }
}
/*
Runs a command and returns its exit code and what it prints. A command that cannot start, or
that a signal stops, has no exit code, which reads as `NaN`.
*/
async function runCommand(
  command: string,
  commandArguments: readonly string[],
  directory: string,
): Promise<CommandResult> {
  try {
    const { stderr, stdout } = await execute(command, [...commandArguments], {
      cwd: directory,
      maxBuffer: 16 * 1024 * 1024,
    });
    return { exitCode: 0, stderr, stdout };
  } catch (error) {
    // The error of a command that ran holds its exit code and output as own properties.
    const failure: Readonly<Record<string, unknown>> =
      typeof error === "object" && error !== null ? { ...error } : {};
    return {
      exitCode: typeof failure.code === "number" ? failure.code : NaN,
      stderr:
        typeof failure.stderr === "string" ? failure.stderr : String(error),
      stdout: typeof failure.stdout === "string" ? failure.stdout : "",
    };
  }
}

export {
  createConsumer,
  createTarball,
  execute,
  fixturesDirectory,
  getOutput,
  manifest,
  runCommand,
};
