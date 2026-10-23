import { mkdir, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it, vi } from "vitest";

import { createTemporaryDirectory, execute } from "./consumers.js";

// The directory of this test, created without the helper that the test checks.
const parentDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-consumers-"),
);
// A temporary directory that is a symbolic link, as the one of macOS is.
const linkedDirectory = path.join(parentDirectory, "linked");
// eslint-disable-next-line security/detect-non-literal-fs-filename -- Create the fixed real child inside this suite's newly created temporary directory.
await mkdir(path.join(parentDirectory, "real"));
// eslint-disable-next-line security/detect-non-literal-fs-filename -- Both the real target and linked destination are fixed children of the owned temporary root.
await symlink(path.join(parentDirectory, "real"), linkedDirectory, "junction");

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(parentDirectory, { force: true, recursive: true });
});

describe("a temporary directory of the package tests", () => {
  it("is the working directory that a child process reports, also when the system's temporary directory is a symbolic link", async () => {
    vi.stubEnv("TMPDIR", linkedDirectory);

    const directory = await createTemporaryDirectory("consumer-");
    const { stdout: workingDirectory } = await execute(
      process.execPath,
      ["--eval", "process.stdout.write(process.cwd())"],
      { cwd: directory },
    );

    expect(directory).toBe(workingDirectory);
    // The directory is in the temporary directory that the test set, so it went through the link.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Resolve only the linked child created above inside this suite's temporary root.
    expect(path.dirname(directory)).toBe(await realpath(linkedDirectory));
  });
});
