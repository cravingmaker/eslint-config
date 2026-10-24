import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it, vi } from "vitest";

import {
  createContext,
  defaultContext,
  detectFeatures,
  detectReactRefreshVariant,
  prepareConfig,
} from "../../src/context.js";
import { createConfig } from "../../src/factory.js";
import { typescriptFiles } from "../../src/globs.js";

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-context-"),
);

const createDirectory = async (name: string): Promise<string> => {
  const directory = path.join(temporaryDirectory, name);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Names come from this file's fixed fixture cases under the owned temporary directory.
  await mkdir(directory);
  return directory;
};

const createProject = async (
  name: string,
  manifest: string,
): Promise<string> => {
  const directory = await createDirectory(name);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only package.json in the fixture directory created above.
  await writeFile(path.join(directory, "package.json"), manifest, "utf8");
  return directory;
};

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

describe("createContext", () => {
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
      [...dependencies].toSorted((left, right) => {
        return left.localeCompare(right);
      }),
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
    expect(context.typeAware).toEqual([
      [...typescriptFiles, "!**/*.svelte", "src/**/*.ts"],
    ]);
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

  it("carries the Svelte components and JavaScript rune modules while the Svelte feature is on", async () => {
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

    expect(
      contexts.map(({ svelteComponents }) => {
        return svelteComponents;
      }),
    ).toEqual([["**/*.svelte"], [], [], ["**/*.svelte"]]);
    expect(
      contexts.map(({ javascriptRuneModules }) => {
        return javascriptRuneModules;
      }),
    ).toEqual([["**/*.svelte.js"], [], [], ["**/*.svelte.js"]]);
  });

  it("uses the working directory as the default project root", async () => {
    const context = await createContext();

    expect(context.projectRootDirectory).toBe(process.cwd());
    expect(context.tsconfigRootDir).toBe(process.cwd());
    expect(context.typeAware).toEqual([[...typescriptFiles, "!**/*.svelte"]]);
  });
});

describe("prepareConfig", () => {
  it("derives context from the same completed options that the factory receives", async () => {
    const projectRootDirectory = await createProject(
      "prepared",
      JSON.stringify({
        dependencies: { react: "19.0.0", svelte: "5.0.0" },
        devDependencies: { next: "1.0.0", vite: "1.0.0" },
      }),
    );
    const { context, resolved } = await prepareConfig({
      environments: ["browser"],
      globals: { window: "off" },
      projectRootDirectory: path.relative(process.cwd(), projectRootDirectory),
      svelte: { files: ["app/**"], ignores: ["app/legacy/**"] },
      typescript: {
        filesTypeAware: ["app/**"],
        tsconfigRootDir: "packages/app",
        typeChecked: true,
      },
    });

    expect(context.dependencies).toEqual(
      new Set(["next", "react", "svelte", "vite"]),
    );
    expect(resolved.react?.refresh).toBe("next");
    expect(resolved.projectRootDirectory).toBe(projectRootDirectory);
    expect(context.projectRootDirectory).toBe(resolved.projectRootDirectory);
    expect(context.globals).toBe(resolved.globals);
    expect(context.svelteComponents).toBe(resolved.svelteComponents);
    expect(context.svelteComponents).toEqual([
      ["**/*.svelte", "app/**", "!app/legacy/**"],
    ]);
    expect(context.javascriptRuneModules).toBe(resolved.javascriptRuneModules);
    expect(context.javascriptRuneModules).toEqual([
      ["**/*.svelte.js", "app/**", "!app/legacy/**"],
    ]);
    expect(context.typeAware).toBe(resolved.typeAware);
    expect(context.typeAware).toEqual([
      [...typescriptFiles, "!**/*.svelte", "app/**"],
    ]);
    expect(context.tsconfigRootDir).toBe(resolved.typescript?.tsconfigRootDir);
    expect(context.tsconfigRootDir).toBe(
      path.join(process.cwd(), "packages", "app"),
    );
  });

  it("resolves options once per public factory call", async () => {
    const projectRootDirectory = await createProject(
      "single-resolution",
      JSON.stringify({ devDependencies: { svelte: "5.0.0" } }),
    );
    // The module's no-dependency fallback has already been initialized before this spy.
    const optionResolution = await import("../../src/options.js");
    const resolve = vi.spyOn(optionResolution, "resolveOptions");

    await createConfig({ projectRootDirectory });
    expect(resolve).toHaveBeenCalledTimes(1);

    resolve.mockClear();
    await createConfig({
      projectRootDirectory,
      svelte: false,
      typescript: false,
    });
    expect(resolve).toHaveBeenCalledTimes(1);
  });
});

describe("defaultContext", () => {
  it("describes createConfig without options in a project without dependencies", async () => {
    const context = await createContext();

    // This repository's manifest declares Svelte, which a project without dependencies does not.
    expect(defaultContext).toEqual({
      ...context,
      dependencies: new Set(),
      javascriptRuneModules: [],
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
