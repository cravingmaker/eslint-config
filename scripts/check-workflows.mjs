import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

import { ensureActionlint, projectDirectory } from "./actionlint.mjs";

const execute = promisify(execFile);

/**
 * Prints a failed command's findings, then the reason it failed.
 *
 * @param {unknown} error
 */
const report = (error) => {
  const failure = typeof error === "object" && error !== null ? error : {};
  if ("stdout" in failure && typeof failure.stdout === "string") {
    process.stdout.write(failure.stdout);
  }
  const message =
    "message" in failure && typeof failure.message === "string"
      ? failure.message
      : String(error);
  process.stderr.write(`${message}\n`);
};

try {
  const binary = await ensureActionlint();
  const { stderr, stdout } = await execute(binary, process.argv.slice(2), {
    cwd: projectDirectory,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 30_000,
  });
  process.stdout.write(stdout);
  process.stderr.write(stderr);
} catch (error) {
  report(error);
  process.exitCode = 1;
}
