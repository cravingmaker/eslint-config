import type { Rules } from "../../../../types.js";

// Style guide: https://github.com/un-ts/eslint-plugin-import-x#rules.
const recommendedRules: Rules = {
  // --- Rules with default options (1/1) -----------------------------------------------------------------------------------------------------------.
  "import-x/no-duplicates": [
    "error",
    { considerQueryString: false, "prefer-inline": false },
  ], // Automatically fixable by the --fix command.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (7/17) ----------------------------------------------------------------------------------------------------------.
  "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"], // Automatically fixable by the --fix command.
  "import-x/exports-last": "error",
  "import-x/group-exports": "error",
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
  "import-x/no-named-default": "error",
  "import-x/no-unassigned-import": [
    "error",
    {
      allow: [],
      devDependencies: false,
      optionalDependencies: false,
      peerDependencies: false,
    },
  ],

  // --- Rules with overridden options (3/17) -------------------------------------------------------------------------------------------------------.
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
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "import-x/newline-after-import": [
    "error",
    {
      count: 1,

      considerComments: true,
      exactCount: true,
    },
  ], // Automatically fixable by the --fix command.
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
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (7/17) --------------------------------------------------------------------------------------------------------------------.
  "import-x/dynamic-import-chunkname": "off", // Project specific, only target Webpack. Manually fixable by editor suggestions.
  "import-x/first": "off", // Handled by `perfectionist/sort-imports`. Automatically fixable by the --fix command.
  "import-x/max-dependencies": "off", // Prefer no dependency count limit.
  "import-x/no-named-export": "off", // Prefer named export.
  "import-x/order": "off", // Handled by `perfectionist/sort-imports`. Automatically fixable by the --fix command.
  "import-x/prefer-default-export": "off", // Prefer named export.
  "import-x/prefer-namespace-import": "off", // Prefer named import, with default import as fallback. Automatically fixable by the --fix command.
} as const;

const styleGuideRules: Rules = {
  ...recommendedRules, // 1/18 rules, 1 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 17/18 rules, 7 automatically fixable, 2 editor suggestions fixable.
} as const;

export { styleGuideRules };
