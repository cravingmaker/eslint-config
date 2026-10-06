import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import pluginImportX, { createNodeResolver } from "eslint-plugin-import-x";

import { defaultContext } from "../context.js";
import { sourceFiles, typescriptFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for eslint-plugin-import-x.
const importsRules: Rules = {
  ...enableAllRules("import-x", pluginImportX.rules),

  "import-x/extensions": [
    "error",
    "ignorePackages",
    {
      js: "always",
      jsx: "always",
      mjs: "always",

      // TypeScript (NodeNext): .ts/.tsx/.mts files are imported with their compiled
      // output extension (.js/.jsx/.mjs), never require the source extension.
      mts: "never",
      ts: "never",
      tsx: "never",
    },
  ],
  "import-x/newline-after-import": [
    "error",
    {
      considerComments: true,
      exactCount: true,
    },
  ],
  "import-x/no-commonjs": [
    "error",
    {
      allowConditionalRequire: false,
      allowPrimitiveModules: false,
      allowRequire: false,
    },
  ],
  "import-x/no-namespace": [
    "error",
    {
      ignore: [
        "node:assert",
        "node:assert/strict",
        "node:async_hooks",
        "node:buffer",
        "node:child_process",
        "node:cluster",
        "node:console",
        "node:constants",
        "node:crypto",
        "node:dgram",
        "node:diagnostics_channel",
        "node:dns",
        "node:dns/promises",
        "node:domain",
        "node:events",
        "node:fs",
        "node:fs/promises",
        "node:http",
        "node:http2",
        "node:https",
        "node:inspector",
        "node:inspector/promises",
        "node:module",
        "node:net",
        "node:os",
        "node:path",
        "node:path/posix",
        "node:path/win32",
        "node:perf_hooks",
        "node:process",
        "node:querystring",
        "node:readline",
        "node:readline/promises",
        "node:repl",
        "node:sea",
        "node:sqlite",
        "node:stream",
        "node:stream/consumers",
        "node:stream/promises",
        "node:stream/web",
        "node:string_decoder",
        "node:sys",
        "node:test",
        "node:test/reporters",
        "node:timers",
        "node:timers/promises",
        "node:tls",
        "node:trace_events",
        "node:tty",
        "node:url",
        "node:util",
        "node:util/types",
        "node:v8",
        "node:vm",
        "node:wasi",
        "node:worker_threads",
        "node:zlib",

        "react",
        "react-dom",

        "jsonc-eslint-parser",
      ],
    },
  ],

  "import-x/max-dependencies": "off", // Prefer no dependency count limit
  "import-x/no-cycle": "off", // Prefer lightweight workflow, it's computationally expensive
  "import-x/no-named-export": "off", // Prefer named export
  "import-x/no-nodejs-modules": "off", // Prefer built-in Node.js modules
  "import-x/no-unused-modules": "off", // Prefer flat config, it's only compatible with legacy configs
  "import-x/prefer-default-export": "off", // Prefer named export
  "import-x/prefer-namespace-import": "off", // Prefer named import, with default import as fallback

  "import-x/no-internal-modules": "off", // Project specific
  "import-x/no-relative-parent-imports": "off", // Project specific
  "import-x/no-restricted-paths": "off", // Project specific

  "import-x/dynamic-import-chunkname": "off", // Project specific, only target Webpack
  "import-x/no-webpack-loader-syntax": "off", // Project specific, only target Webpack

  // Off while perfectionist is on, see src/overlaps.ts
  "import-x/first": "error",
  "import-x/order": "error",
} as const;

// Builds the flat config for eslint-plugin-import-x. TypeScript files resolve imports through
// the TypeScript resolver first, with the project's tsconfig.
function imports(
  { files = sourceFiles, ignores = [], overrides = {} }: FeatureOptions = {},
  { tsconfigRootDir }: Context = defaultContext,
): Linter.Config[] {
  const resolverProject = tsconfigRootDir ? { project: tsconfigRootDir } : {};

  return [
    {
      name: "@cravingmaker/eslint-config/imports/setup",
      plugins: { "import-x": pluginImportX },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/imports/rules",
      rules: { ...importsRules, ...overrides },
    },
    {
      files: [...typescriptFiles],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/imports/resolver",
      settings: {
        "import-x/resolver-next": [
          createTypeScriptImportResolver({
            alwaysTryTypes: true,
            ...resolverProject,
          }),
          createNodeResolver(),
        ],
      },
    },
  ];
}

export { imports, importsRules };
