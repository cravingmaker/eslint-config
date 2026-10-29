import type { Linter } from "eslint";
import type { Context } from "../../../../src/types.js";

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { imports } from "../../../../src/configs/plugins/imports/index.js";
import { createContext, defaultContext } from "../../../../src/context.js";
import { createConfig } from "../../../../src/factory.js";
import { expectLintError } from "../../../support/lint.js";
import { getResolvedConfig } from "../../../support/resolved-config.js";

const svelteContext: Context = {
  ...defaultContext,
  svelteComponents: [["**/*.svelte", "!**/generated/**"]],
};

const getSettings = async (
  eslint: ESLint,
  filePath: string,
): Promise<Linter.Config["settings"]> => {
  const config = await getResolvedConfig(eslint, filePath);
  return config?.settings;
};

describe("imports feature", () => {
  it("uses the resolved project root or explicit tsconfig directory for path aliases", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "eslint-config-imports-"),
    );
    try {
      await Promise.all([
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only package.json beneath this test's owned temporary root.
        writeFile(
          path.join(directory, "package.json"),
          JSON.stringify({
            name: "imports-fixture",
            private: true,
            type: "module",
          }),
        ),
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only tsconfig.json beneath this test's owned temporary root.
        writeFile(
          path.join(directory, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: {
              paths: { "#stage12-target": ["./target.ts"] },
            },
          }),
        ),
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the literal alias target beneath the same owned temporary root.
        writeFile(
          path.join(directory, "target.ts"),
          "export const target = 1;\n",
        ),
      ]);
      const contexts = await Promise.all([
        createContext({ projectRootDirectory: directory, typescript: false }),
        createContext({
          typescript: { tsconfigRootDir: directory, typeChecked: false },
        }),
      ]);
      await Promise.all(
        contexts.map(async (context) => {
          const eslint = new ESLint({
            cwd: directory,
            overrideConfig: imports({}, context),
            overrideConfigFile: true,
          });
          const results = await eslint.lintText(
            "import { target } from '#stage12-target';\nimport { missing } from '#stage12-missing';\nexport { missing, target };\n",
            { filePath: "source.ts" },
          );
          const messages = results.flatMap((result) => {
            return result.messages;
          });
          expect(
            messages.some((message) => {
              return message.fatal === true;
            }),
          ).toBe(false);
          expect(
            messages.filter((message) => {
              return message.ruleId === "import-x/no-unresolved";
            }),
          ).toEqual([expect.objectContaining({ line: 2, severity: 2 })]);
        }),
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("resolves imports in TypeScript files through the TypeScript resolver", async () => {
    const eslint = new ESLint({
      overrideConfig: imports(),
      overrideConfigFile: true,
    });
    const [typescriptSettings, javascriptSettings] = await Promise.all([
      getSettings(eslint, "src/example.ts"),
      getSettings(eslint, "src/example.js"),
    ]);

    expect(typescriptSettings?.["import-x/resolver-next"]).toEqual([
      expect.objectContaining({ name: "eslint-import-resolver-typescript" }),
      expect.objectContaining({ name: "eslint-plugin-import-x:node" }),
    ]);
    expect(javascriptSettings?.["import-x/resolver-next"]).toBeUndefined();
  });

  it("resolves imports in Svelte components through the TypeScript resolver", async () => {
    const eslint = new ESLint({
      overrideConfig: imports({}, svelteContext),
      overrideConfigFile: true,
    });
    const settings = await getSettings(eslint, "src/Component.svelte");

    expect(settings?.["import-x/resolver-next"]).toEqual([
      expect.objectContaining({ name: "eslint-import-resolver-typescript" }),
      expect.objectContaining({ name: "eslint-plugin-import-x:node" }),
    ]);
  });
});

describe("import-x rules", () => {
  it("import-x/extensions: requires explicit JavaScript file extensions for relative imports", async () => {
    await expectLintError(
      `import { value } from './fixture';\nconsole.log(value);\n`,
      "import-x/extensions",
      {
        filePath: "test.js",
      },
    );
  });
});

describe("the TypeScript extensions of the imports feature", () => {
  it.each([
    { expected: ["import-x/extensions"], typescriptExtensions: "output" },
    { expected: [], typescriptExtensions: "source" },
  ] as const)(
    "with $typescriptExtensions, reports a relative import of value.ts: $expected",
    async ({ expected, typescriptExtensions }) => {
      const directory = await mkdtemp(
        path.join(os.tmpdir(), "eslint-config-extensions-"),
      );
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the manifest of the temporary project created above.
        await writeFile(
          path.join(directory, "package.json"),
          '{"name":"extensions","type":"module"}\n',
        );
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the imported module of the temporary project created above.
        await writeFile(
          path.join(directory, "value.ts"),
          "export const value = 1;\n",
        );
        const eslint = new ESLint({
          cwd: directory,
          overrideConfig: await createConfig({
            imports: { typescriptExtensions },
            projectRootDirectory: directory,
            typescript: { tsconfigRootDir: directory, typeChecked: false },
          }),
          overrideConfigFile: true,
        });
        const [result] = await eslint.lintText(
          'import { value } from "./value.ts";\n\nexport { value };\n',
          { filePath: path.join(directory, "index.ts") },
        );

        expect(
          result.messages
            .map(({ ruleId }) => {
              return ruleId;
            })
            .filter((ruleId) => {
              return ruleId === "import-x/extensions";
            }),
        ).toEqual(expected);
      } finally {
        await rm(directory, { force: true, recursive: true });
      }
    },
  );
});
