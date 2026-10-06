/* eslint-disable functional/no-expression-statements, functional/no-return-void, security/detect-non-literal-fs-filename -- Vitest suites are side-effect driven, and the fixtures are written to a temporary directory. */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it } from "vitest";

import {
  createContext,
  defaultContext,
  detectReactRefreshVariant,
} from "../../src/context.js";

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-context-"),
);

async function createDirectory(name: string): Promise<string> {
  const directory = path.join(temporaryDirectory, name);
  await mkdir(directory);
  return directory;
}
async function createProject(name: string, manifest: string): Promise<string> {
  const directory = await createDirectory(name);
  await writeFile(path.join(directory, "package.json"), manifest, "utf8");
  return directory;
}

describe("createContext", () => {
  afterAll(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it("reads the dependencies declared in the manifest at the project root", async () => {
    const projectRootDirectory = await createProject(
      "declared",
      JSON.stringify({
        dependencies: { react: "19.0.0" },
        devDependencies: { vite: "7.0.0" },
        optionalDependencies: { fsevents: "2.0.0" },
        peerDependencies: { eslint: "10.0.0" },
      }),
    );
    const { dependencies } = await createContext({ projectRootDirectory });

    expect(
      [...dependencies].toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(["eslint", "react", "vite"]);
  });

  it("declares no dependencies when the manifest is missing or invalid", async () => {
    const missing = await createContext({
      projectRootDirectory: await createDirectory("missing"),
    });
    const invalid = await createContext({
      projectRootDirectory: await createProject("invalid", "{"),
    });

    expect(missing.dependencies.size).toBe(0);
    expect(invalid.dependencies.size).toBe(0);
  });

  it("carries the project root, the resolved globals, and the type-aware scope", async () => {
    const projectRootDirectory = await createProject("context", "{}");
    const context = await createContext({
      environments: ["node"],
      projectRootDirectory,
      typescript: { filesTypeAware: ["src/**/*.ts"], typeChecked: true },
    });

    expect(context.projectRootDirectory).toBe(projectRootDirectory);
    expect(context.globals.process).toBe(false);
    expect(context.tsconfigRootDir).toBe(projectRootDirectory);
    expect(context.typeAware).toEqual({ files: ["src/**/*.ts"], ignores: [] });
  });

  it("uses the tsconfig directory of the TypeScript options when it is set", async () => {
    const projectRootDirectory = await createProject("tsconfig", "{}");
    const tsconfigRootDir = path.join(projectRootDirectory, "packages", "app");

    const configured = await createContext({
      projectRootDirectory,
      typescript: { tsconfigRootDir },
    });
    const withoutTypeScript = await createContext({
      projectRootDirectory,
      typescript: false,
    });

    expect(configured.tsconfigRootDir).toBe(tsconfigRootDir);
    expect(withoutTypeScript.tsconfigRootDir).toBe(projectRootDirectory);
  });

  it("uses the working directory as the default project root", async () => {
    const context = await createContext();

    expect(context.projectRootDirectory).toBe(process.cwd());
    expect(context.tsconfigRootDir).toBe(process.cwd());
    expect(context.typeAware).toBeUndefined();
  });
});

describe("defaultContext", () => {
  it("describes createConfig without options in a project without dependencies", async () => {
    const context = await createContext();

    expect(defaultContext).toEqual({ ...context, dependencies: new Set() });
  });
});

describe("detectReactRefreshVariant", () => {
  it.each([
    [["next", "vite"], "next"],
    [["vite"], "vite"],
    [["react"], "generic"],
  ])("detects the variant for %j as %s", (dependencies, variant) => {
    expect(detectReactRefreshVariant(new Set(dependencies))).toBe(variant);
  });
});
