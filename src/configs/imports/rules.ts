import type { Rules } from "../../types.js";

// Policy for eslint-plugin-import-x.
const importsRules: Rules = {
  "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
  "import-x/default": "error",
  "import-x/export": "error",
  "import-x/exports-last": "error",
  "import-x/group-exports": "error",
  "import-x/named": ["error", { commonjs: false }],
  "import-x/namespace": ["error", { allowComputed: false }],
  "import-x/no-absolute-path": [
    "error",
    { amd: false, commonjs: true, esmodule: true, ignore: undefined },
  ],
  "import-x/no-amd": "error",
  "import-x/no-anonymous-default-export": [
    "error",
    {
      allowAnonymousClass: false,
      allowAnonymousFunction: false,
      allowArray: false,
      allowArrowFunction: false,
      allowCallExpression: true,
      allowLiteral: false,
      allowNew: false,
      allowObject: false,
    },
  ],
  "import-x/no-default-export": "error",
  "import-x/no-deprecated": "error",
  "import-x/no-duplicates": [
    "error",
    { considerQueryString: false, "prefer-inline": false },
  ],
  "import-x/no-dynamic-require": ["error", { esmodule: false }],
  "import-x/no-empty-named-blocks": "error",
  "import-x/no-extraneous-dependencies": [
    "error",
    {
      packageDir: undefined,

      bundledDependencies: true,
      devDependencies: true,
      includeInternal: false,
      includeTypes: false,
      optionalDependencies: true,
      peerDependencies: true,
      whitelist: [],
    },
  ],
  "import-x/no-import-module-exports": ["error", { exceptions: [] }],
  "import-x/no-mutable-exports": "error",
  "import-x/no-named-as-default": "error",
  "import-x/no-named-as-default-member": "error",
  "import-x/no-named-default": "error",
  "import-x/no-relative-packages": [
    "error",
    { amd: false, commonjs: false, esmodule: true, ignore: undefined },
  ],
  "import-x/no-rename-default": [
    "error",
    { commonjs: false, preventRenamingBindings: true },
  ],
  "import-x/no-self-import": "error",
  "import-x/no-unassigned-import": [
    "error",
    {
      allow: [],
      devDependencies: false,
      optionalDependencies: false,
      peerDependencies: false,
    },
  ],
  "import-x/no-unresolved": [
    "error",
    {
      amd: false,
      caseSensitive: true,
      caseSensitiveStrict: false,
      commonjs: false,
      esmodule: true,
      ignore: undefined,
    },
  ],
  "import-x/no-useless-path-segments": [
    "error",
    { commonjs: false, noUselessIndex: false },
  ],
  "import-x/unambiguous": "error",

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
      count: 1,

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

  "import-x/max-dependencies": ["off", { ignoreTypeImports: false, max: 10 }], // Prefer no dependency count limit
  "import-x/no-cycle": [
    "off",
    {
      allowUnsafeDynamicCyclicDependency: false,
      amd: false,
      commonjs: false,
      esmodule: true,
      ignore: undefined,
      ignoreExternal: false,
      maxDepth: Infinity,
    },
  ], // Prefer lightweight workflow, it's computationally expensive
  "import-x/no-named-export": "off", // Prefer named export
  "import-x/no-nodejs-modules": ["off", { allow: [] }], // Prefer built-in Node.js modules
  // Its schema requires an active export check whenever options are supplied.
  "import-x/no-unused-modules": "off", // Prefer flat config, it's only compatible with legacy configs
  "import-x/prefer-default-export": ["off", { target: "single" }], // Prefer named export
  "import-x/prefer-namespace-import": ["off", { patterns: undefined }], // Prefer named import, with default import as fallback

  "import-x/no-internal-modules": ["off", { allow: [] }], // Project specific
  "import-x/no-relative-parent-imports": [
    "off",
    { amd: false, commonjs: false, esmodule: true, ignore: undefined },
  ], // Project specific
  "import-x/no-restricted-paths": [
    "off",
    { basePath: undefined, zones: undefined },
  ], // Project specific

  "import-x/dynamic-import-chunkname": [
    "off",
    {
      allowEmpty: false,
      importFunctions: [],
      webpackChunknameFormat: String.raw`([0-9a-zA-Z-_/.]|\[(request|index)\])+`,
    },
  ], // Project specific, only target Webpack
  "import-x/no-webpack-loader-syntax": "off", // Project specific, only target Webpack

  "import-x/first": ["off", "disable-absolute-first"], // Covered by `perfectionist/sort-imports`, see src/overlaps.ts
  "import-x/order": [
    "off",
    {
      alphabetize: {
        caseInsensitive: false,
        order: "ignore",
        orderImportKind: "ignore",
      },
      consolidateIslands: undefined,
      distinctGroup: true,
      groups: ["builtin", "external", "parent", "sibling", "index"],
      named: false,
      "newlines-between": "ignore",
      // The schema allows these only with type sorting or separated groups enabled.
      "newlines-between-types": undefined,
      pathGroups: [],
      pathGroupsExcludedImportTypes: ["builtin", "external", "object"],
      sortTypesGroup: false,
      warnOnUnassignedImports: false,
    },
  ], // Covered by `perfectionist/sort-imports`, see src/overlaps.ts
} as const;

export { importsRules };
