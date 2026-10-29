import path from "node:path";
import process from "node:process";

import globalVariables from "globals";
import { describe, expect, it } from "vitest";

import { typescriptFiles } from "../../src/globs.js";
import { resolveOptions } from "../../src/options.js";

const featuresOnByDefault = [
  "comments",
  "functional",
  "html",
  "imports",
  "json",
  "markdown",
  "node",
  "packageJson",
  "perfectionist",
  "promise",
  "regexp",
  "security",
  "sonarjs",
  "stylistic",
  "unicorn",
  "unusedImports",
] as const;
const allDetected = {
  express: true,
  react: true,
  reactRefresh: "vite",
  svelte: true,
  vitest: true,
} as const;
// Relative paths, each with the segments that lead to it from the working directory.
const relativeDirectories: ReadonlyArray<
  readonly [relative: string, segments: readonly string[]]
> = [
  [".", []],
  ["packages/api", ["packages", "api"]],
  ["../sibling", ["..", "sibling"]],
];

describe("resolveOptions", () => {
  it.each(featuresOnByDefault)("turns %s on by default", (feature) => {
    expect(resolveOptions()).toHaveProperty(feature, {});
  });

  it("turns a feature off with false, on with true, and on with its options", () => {
    const resolved = resolveOptions({
      comments: false,
      html: true,
      json: { overridesJsonc: { "json/no-empty-keys": "off" } },
    });

    expect(resolved.comments).toBeUndefined();
    expect(resolved.html).toEqual({});
    expect(resolved.json).toEqual({
      overridesJsonc: { "json/no-empty-keys": "off" },
    });
  });

  it("applies the defaults of the options that are not features", () => {
    const resolved = resolveOptions();

    expect(resolved.globals).toEqual(globalVariables.builtin);
    expect(resolved.ignores).toEqual([]);
    expect(resolved.javascript).toEqual({});
    expect(resolved.projectRootDirectory).toBe(process.cwd());
  });

  it("turns the auto features on only when they are detected", () => {
    const undetected = resolveOptions();
    const detected = resolveOptions({}, allDetected);

    expect(undetected.express).toBeUndefined();
    expect(undetected.react).toBeUndefined();
    expect(undetected.svelte).toBeUndefined();
    expect(undetected.vitest).toBeUndefined();
    expect(detected.express).toEqual({});
    expect(detected.react).toEqual({ refresh: "vite" });
    expect(detected.svelte).toEqual({});
    expect(detected.vitest).toEqual({});
  });

  it("lets an explicit value beat detection", () => {
    const disabled = resolveOptions(
      { express: false, react: false, svelte: false, vitest: false },
      allDetected,
    );
    const enabled = resolveOptions({
      express: true,
      react: { files: ["app/**/*.tsx"] },
      svelte: true,
      vitest: true,
    });

    expect(disabled.express).toBeUndefined();
    expect(disabled.react).toBeUndefined();
    expect(disabled.svelte).toBeUndefined();
    expect(disabled.vitest).toBeUndefined();
    expect(enabled.express).toEqual({});
    expect(enabled.react).toEqual({ files: ["app/**/*.tsx"], refresh: false });
    expect(enabled.svelte).toEqual({});
    expect(enabled.vitest).toEqual({});
  });

  it("detects the React Refresh variant unless it is set", () => {
    const detection = { ...allDetected, reactRefresh: "next" } as const;

    expect(resolveOptions({}, detection).react?.refresh).toBe("next");
    expect(
      resolveOptions({ react: { refresh: "auto" } }, detection).react?.refresh,
    ).toBe("next");
    expect(
      resolveOptions({ react: { refresh: "vite" } }, detection).react?.refresh,
    ).toBe("vite");
    expect(
      resolveOptions({ react: { refresh: false } }, detection).react?.refresh,
    ).toBe(false);
  });

  it("resolves the TypeScript defaults from the project root, with typed linting on", () => {
    const resolved = resolveOptions({ projectRootDirectory: "/project" });

    expect(resolved.typescript).toEqual({
      tsconfigRootDir: "/project",
      typeChecked: true,
    });
    expect(resolved.typeAware).toEqual([[...typescriptFiles, "!**/*.svelte"]]);
  });

  // Typescript-eslint takes an absolute `tsconfigRootDir` only, so both directories are resolved.
  it.each(relativeDirectories)(
    "resolves the relative project root %j from the working directory",
    (relative, segments) => {
      const absolute = path.join(process.cwd(), ...segments);
      const resolved = resolveOptions({ projectRootDirectory: relative });

      expect(resolved.projectRootDirectory).toBe(absolute);
      // The tsconfig directory defaults to the project root as it is resolved.
      expect(resolved.typescript?.tsconfigRootDir).toBe(absolute);
    },
  );

  it.each(relativeDirectories)(
    "resolves the relative tsconfig directory %j from the working directory",
    (relative, segments) => {
      // A relative tsconfig directory does not start from the project root, which is elsewhere.
      const projectRootDirectory = path.join(process.cwd(), "projects", "app");
      const resolved = resolveOptions({
        projectRootDirectory,
        typescript: { tsconfigRootDir: relative },
      });

      expect(resolved.typescript?.tsconfigRootDir).toBe(
        path.join(process.cwd(), ...segments),
      );
      expect(resolved.projectRootDirectory).toBe(projectRootDirectory);
    },
  );

  it("keeps absolute root directories as they are", () => {
    // Outside the working directory, on any system.
    const projectRootDirectory = path.join(
      path.parse(process.cwd()).root,
      "project",
    );
    const tsconfigRootDir = path.join(projectRootDirectory, "packages", "api");

    expect(resolveOptions({ projectRootDirectory })).toMatchObject({
      projectRootDirectory,
      typescript: { tsconfigRootDir: projectRootDirectory },
    });
    expect(
      resolveOptions({ projectRootDirectory, typescript: { tsconfigRootDir } }),
    ).toMatchObject({ projectRootDirectory, typescript: { tsconfigRootDir } });
  });

  it("scopes type-aware rules to TypeScript files when type checking is on", () => {
    expect(
      resolveOptions({ typescript: { typeChecked: true } }).typeAware,
    ).toEqual([[...typescriptFiles, "!**/*.svelte"]]);
    expect(
      resolveOptions({
        typescript: {
          filesTypeAware: ["src/**"],
          ignoresTypeAware: ["src/**/*.test.ts"],
          typeChecked: true,
        },
      }).typeAware,
    ).toEqual([
      [...typescriptFiles, "!**/*.svelte", "src/**", "!src/**/*.test.ts"],
    ]);
  });

  it("keeps the type-aware scope within the files and ignores of the TypeScript feature", () => {
    const typescript = {
      files: ["app/**/*.ts"],
      ignores: ["**/*.generated.ts"],
      typeChecked: true,
    } as const;

    expect(resolveOptions({ typescript }).typeAware).toEqual([
      [...typescriptFiles, "app/**/*.ts", "!**/*.svelte", "!**/*.generated.ts"],
    ]);
    expect(
      resolveOptions({
        typescript: {
          ...typescript,
          filesTypeAware: ["app/server/**"],
          ignoresTypeAware: ["app/server/legacy/**"],
        },
      }).typeAware,
    ).toEqual([
      [
        ...typescriptFiles,
        "app/**/*.ts",
        "!**/*.svelte",
        "!**/*.generated.ts",
        "app/server/**",
        "!app/server/legacy/**",
      ],
    ]);
  });

  it("keeps the type-aware scope within TypeScript files, whatever the files of the TypeScript feature name", () => {
    // A directory also holds JavaScript and JSON files, and Svelte components, whose parser
    // reads no type information.
    expect(
      resolveOptions({
        svelte: true,
        typescript: { files: ["src/**"], typeChecked: true },
      }).typeAware,
    ).toEqual([[...typescriptFiles, "src/**", "!**/*.svelte"]]);
    expect(
      resolveOptions({
        svelte: true,
        typescript: { files: ["src/**/*.{ts,svelte}"], typeChecked: true },
      }).typeAware,
    ).toEqual([[...typescriptFiles, "src/**/*.{ts,svelte}", "!**/*.svelte"]]);
  });

  it("applies each list of ignores to the type-aware scope on its own", () => {
    // A negated pattern brings back only what its own list left out. The one of `ignores` does
    // not bring back the file that `ignoresTypeAware` leaves out.
    expect(
      resolveOptions({
        typescript: {
          ignores: ["**/generated/**", "!**/generated/keep.ts"],
          ignoresTypeAware: ["**/generated/keep.ts"],
          typeChecked: true,
        },
      }).typeAware,
    ).toEqual([
      [
        ...typescriptFiles,
        "!**/*.svelte",
        "!**/generated/**",
        "!**/generated/keep.ts",
      ],
      [
        ...typescriptFiles,
        "!**/*.svelte",
        "**/generated/keep.ts",
        "!**/generated/keep.ts",
      ],
    ]);
    // Nor does the one of `ignoresTypeAware` bring back a file that `ignores` leaves out, which
    // the parser of the feature does not read.
    expect(
      resolveOptions({
        typescript: {
          ignores: ["**/generated/**"],
          ignoresTypeAware: ["!**/generated/keep.ts"],
          typeChecked: true,
        },
      }).typeAware,
    ).toEqual([
      [...typescriptFiles, "!**/*.svelte", "!**/generated/**"],
      [
        ...typescriptFiles,
        "!**/*.svelte",
        "!**/generated/**",
        "**/generated/keep.ts",
      ],
    ]);
  });

  it("resolves the Svelte components that the Svelte feature parses", () => {
    expect(resolveOptions().svelteComponents).toEqual([]);
    expect(resolveOptions({}, allDetected).svelteComponents).toEqual([
      "**/*.svelte",
    ]);
    expect(resolveOptions({ svelte: true }).svelteComponents).toEqual([
      "**/*.svelte",
    ]);
    expect(
      resolveOptions({ svelte: false }, allDetected).svelteComponents,
    ).toEqual([]);
  });

  it("resolves the JavaScript rune modules that the Svelte feature parses", () => {
    expect(resolveOptions().javascriptRuneModules).toEqual([]);
    expect(resolveOptions({}, allDetected).javascriptRuneModules).toEqual([
      "**/*.svelte.js",
    ]);
    expect(
      resolveOptions({ svelte: false }, allDetected).javascriptRuneModules,
    ).toEqual([]);
    expect(
      resolveOptions({
        svelte: { files: ["app/**"], ignores: ["app/legacy/**"] },
      }).javascriptRuneModules,
    ).toEqual([["**/*.svelte.js", "app/**", "!app/legacy/**"]]);
  });

  it("keeps the Svelte components within the files and ignores of the Svelte feature", () => {
    expect(
      resolveOptions({
        svelte: {
          files: ["app/**/*.svelte", "app/**/*.svelte.ts"],
          ignores: ["**/generated/**", "app/legacy/**"],
        },
      }).svelteComponents,
    ).toEqual([
      ["**/*.svelte", "app/**/*.svelte", "!**/generated/**", "!app/legacy/**"],
      [
        "**/*.svelte",
        "app/**/*.svelte.ts",
        "!**/generated/**",
        "!app/legacy/**",
      ],
    ]);
  });

  it("restores Svelte components through ordered ignore negations", () => {
    expect(
      resolveOptions({
        svelte: {
          files: ["app/**", "shared/**"],
          ignores: [
            "**/generated/**",
            "!**/generated/Kept*.svelte",
            "**/KeptIgnored.svelte",
          ],
        },
      }).svelteComponents,
    ).toEqual([
      ["**/*.svelte", "app/**", "!**/generated/**", "!**/KeptIgnored.svelte"],
      [
        "**/*.svelte",
        "app/**",
        "**/generated/Kept*.svelte",
        "!**/KeptIgnored.svelte",
      ],
      [
        "**/*.svelte",
        "shared/**",
        "!**/generated/**",
        "!**/KeptIgnored.svelte",
      ],
      [
        "**/*.svelte",
        "shared/**",
        "**/generated/Kept*.svelte",
        "!**/KeptIgnored.svelte",
      ],
    ]);
  });

  it("has no TypeScript options or type-aware scope when TypeScript is off", () => {
    const resolved = resolveOptions({ typescript: false });

    expect(resolved.typescript).toBeUndefined();
    expect(resolved.typeAware).toBeUndefined();
  });

  it("has no type-aware scope when typed linting is off", () => {
    const resolved = resolveOptions({ typescript: { typeChecked: false } });

    expect(resolved.typescript?.typeChecked).toBe(false);
    expect(resolved.typeAware).toBeUndefined();
  });

  it("merges the built-in, environment, and custom globals in that order", () => {
    const { globals } = resolveOptions({
      environments: ["browser"],
      globals: { myGlobal: "readonly", window: "off" },
    });

    expect(globals.Promise).toBe(false);
    expect(globals.document).toBe(false);
    expect(globals.myGlobal).toBe("readonly");
    expect(globals.window).toBe("off");
  });
});
