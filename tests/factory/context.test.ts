/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it } from "vitest";

import {
  createContext,
  defaultContext,
  detectFeatures,
  detectReactRefreshVariant,
} from "../../src/context.js";
import { typescriptFiles } from "../../src/globs.js";

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
    expect(context.typeAware).toEqual({
      files: [["src/**/*.ts", ...typescriptFiles]],
      ignores: [],
    });
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

  it("carries the Svelte components while the Svelte feature is on", async () => {
    const declared = await createProject(
      "svelte",
      JSON.stringify({ devDependencies: { svelte: "5.0.0" } }),
    );
    const undeclared = await createProject("without-svelte", "{}");
    const contexts = await Promise.all([
      createContext({ projectRootDirectory: declared }),
      createContext({ projectRootDirectory: declared, svelte: false }),
      createContext({ projectRootDirectory: undeclared }),
      createContext({ projectRootDirectory: undeclared, svelte: true }),
    ]);

    expect(contexts.map(({ svelteComponents }) => svelteComponents)).toEqual([
      ["**/*.svelte"],
      [],
      [],
      ["**/*.svelte"],
    ]);
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

    // This repository's manifest declares Svelte, which a project without dependencies does not.
    expect(defaultContext).toEqual({
      ...context,
      dependencies: new Set(),
      svelteComponents: [],
    });
  });
});

describe("detectReactRefreshVariant", () => {
  it.each([
    [["next", "vite"], "next"],
    [["vite"], "vite"],
    [["react"], false],
    [[], false],
  ])("detects the variant for %j as %s", (dependencies, variant) => {
    expect(detectReactRefreshVariant(new Set(dependencies))).toBe(variant);
  });
});

describe("detectFeatures", () => {
  it("detects the frameworks that the project declares and the React Refresh variant", () => {
    expect(
      detectFeatures(new Set(["express", "react", "svelte", "vite"])),
    ).toEqual({
      express: true,
      react: true,
      reactRefresh: "vite",
      svelte: true,
    });
  });

  it.each(["express", "react", "svelte"])(
    "detects %s on its own",
    (framework) => {
      expect(detectFeatures(new Set([framework]))).toEqual({
        express: framework === "express",
        react: framework === "react",
        reactRefresh: false,
        svelte: framework === "svelte",
      });
    },
  );

  it("detects no framework from its plugins, installed or declared", () => {
    const undetected = {
      express: false,
      react: false,
      reactRefresh: false,
      svelte: false,
    };

    // Every optional peer is installed in this repository.
    expect(detectFeatures(new Set())).toEqual(undetected);
    expect(
      detectFeatures(
        new Set([
          "eslint-plugin-express-security",
          "eslint-plugin-react-hooks",
          "eslint-plugin-react-refresh",
          "@html-eslint/eslint-plugin-react",
          "@html-eslint/eslint-plugin-svelte",
          "svelte-eslint-parser",
        ]),
      ),
    ).toEqual(undetected);
  });
});
