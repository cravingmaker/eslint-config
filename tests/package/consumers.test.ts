/* eslint-disable security/detect-non-literal-fs-filename -- The directories are created in a temporary directory. */

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
await mkdir(path.join(parentDirectory, "real"));
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
    expect(path.dirname(directory)).toBe(await realpath(linkedDirectory));
  });
});
