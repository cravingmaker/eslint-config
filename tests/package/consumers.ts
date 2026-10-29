import { execFile } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
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
// The Node.js that runs the consumer programs. CI sets it to the Node.js of its matrix and runs npm on the contributor Node.js.
// eslint-disable-next-line n/no-process-env -- CI selects the runtime of the consumer programs.
const consumerNode =
  process.env.ESLINT_CONFIG_CONSUMER_NODE ?? process.execPath;
const fixturesDirectory = fileURLToPath(
  new URL("../fixtures", import.meta.url),
);
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- This repository's manifest has this shape.
const manifest = JSON.parse(
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The package.json path is fixed relative to this repository helper.
  await readFile(path.join(projectDirectory, "package.json"), "utf8"),
) as Manifest;
// ESLint and the peers are the versions that this repository tests with.
const testedVersions = new Map(Object.entries(manifest.devDependencies));

/*
A project in `parentDirectory` that installs the packed package, ESLint, and `peers` from the
registry, as a consumer does, with this repository's install policy: no install scripts, and no
version less than seven days old. The fixtures are copied into `fixtures/`.
*/
const createConsumer = async (
  parentDirectory: string,
  name: string,
  tarball: string,
  peers: readonly string[],
): Promise<string> => {
  const directory = path.join(parentDirectory, name);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Callers supply literal consumer names beneath their owned temporary roots.
  await mkdir(directory);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only package.json inside the consumer directory just created above.
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ name: `consumer-${name}`, private: true, type: "module" }),
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only .npmrc inside the consumer directory just created above.
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
      ...["eslint", ...peers].map((packageName) => {
        return `${packageName}@${testedVersions.get(packageName) ?? "missing"}`;
      }),
    ],
    { cwd: directory },
  );
  await cp(fixturesDirectory, path.join(directory, "fixtures"), {
    recursive: true,
  });
  return directory;
};

// The package as published: `npm pack` of the current build, in `destination`.
const createTarball = async (destination: string): Promise<string> => {
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
};

/*
A new directory in the system's temporary directory, with a name that starts with `prefix`, as its
real path. The temporary directory can be a symbolic link, as it is on macOS, and a child process
reports its working directory, and the files that it resolves from it, by their real paths.
*/
const createTemporaryDirectory = async (prefix: string): Promise<string> => {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Resolve only the directory returned by the preceding mkdtemp call.
  return await realpath(directory);
};

/*
Runs a command and returns what it prints, also when it exits with an error, as ESLint does when it reports a problem and TypeScript does when it finds one.
*/
const getOutput = async (
  command: string,
  commandArguments: readonly string[],
  directory: string,
): Promise<string> => {
  try {
    const { stdout } = await execute(command, [...commandArguments], {
      cwd: directory,
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    const output =
      typeof error === "object" && error !== null && "stdout" in error
        ? error.stdout
        : error;
    return typeof output === "string" ? output : String(error);
  }
};

/*
Runs a command and returns its exit code and what it prints. A command that cannot start, or
that a signal stops, has no exit code, which reads as `NaN`.
*/
const runCommand = async (
  command: string,
  commandArguments: readonly string[],
  directory: string,
): Promise<CommandResult> => {
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
};

export {
  consumerNode,
  createConsumer,
  createTarball,
  createTemporaryDirectory,
  execute,
  fixturesDirectory,
  getOutput,
  manifest,
  runCommand,
};
