# Rewrite implementation plan

Status: agreed on 6 October 2026. Stage 0 is done; it landed in the pull request that added this document. Stages 1 and 2 are done. Stage 3 is in progress: the parameter immutability, file-role exceptions, and CommonJS (F6) items are done. Stages 4 and 5 are not started.

To continue the work, start with [handoff.md](./handoff.md). It explains how to pick up a stage and how to run one in a Claude Code cloud session.

## Baseline

This plan is based on `main` at `1962379`, the commit released as 0.1.0. The snapshots were generated one commit earlier, at `c69fbbe`; the release commit changed only the version and the changelog.

The finding IDs below (F1–F12) come from an audit of an older commit, `da16755`. That audit is not part of the repository; the table states each finding in full.

| Area                   | State on `main`                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencies           | ESLint 10.11.0, unicorn 74, functional 10, typescript-eslint 8.70, package-json 1.9, `@eslint/json` 2                                       |
| Formatting             | Prettier config 0.3.1 (two spaces, double quotes), so every source file differs from the old branch                                         |
| `createConfig` options | `environments`, `globals`, `ignores`, `plugins`, `projectRootDirectory`, `reactRefreshVariant`, `rules`, `tsconfigRootDir`, `tsTypeChecked` |
| Config block names     | Present, prefixed with `@cravingmaker/eslint-config/`                                                                                       |
| Structure              | Unchanged: one 587-line `src/index.ts` plus `src/rules/<category>/`                                                                         |
| Rule policy            | 15 of 21 rule maps enable every non-deprecated plugin rule through `getPluginRules`                                                         |
| Release                | 0.1.0 was published to npm on 6 October 2026 with the options above and CommonJS support                                                    |

Audit findings re-checked against this baseline:

| Finding                         | State                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| F1 hidden plugin failures       | Fixed for evaluation errors. A missing peer still silently disables the integration        |
| F2 JSX parsing without peers    | Fixed                                                                                      |
| F3 hooks scope                  | Open: hooks rules apply to JSX/TSX only                                                    |
| F4 Svelte                       | Partly fixed: the TypeScript parser is delegated, but `.svelte` files get only 10 rules    |
| F5 nested manifests and outputs | Fixed                                                                                      |
| F6 CommonJS contract            | Resolved by supporting `.cjs` and `.cts` (#40). This plan removes that support             |
| F7 feature controls             | Open                                                                                       |
| F8 detection and globals        | Partly fixed: project root and globals options exist; detection still uses plugin presence |
| F9 typed linting scope          | Open: one boolean for all TypeScript files                                                 |
| F10 automatic rule enablement   | Open                                                                                       |
| F11 formatter ownership         | Open: `@html-eslint/indent`, `quotes`, and similar layout rules are enabled                |
| F12 negative fixtures           | Open: test utilities do not fail on fatal parse errors                                     |

## Decisions

| Topic                        | Decision                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Source layout                | One tree, `src/configs/`. A feature is one file and becomes a folder only when it outgrows one     |
| Public API                   | `createConfig(options, ...userConfigs)` and its types. Feature builders stay internal              |
| Old option names             | Clean break, no compatibility adapter. Migration notes go in the README                            |
| CommonJS                     | Not supported. Removing the `.cjs` and `.cts` support added in #40 is a deliberate breaking change |
| Composition                  | `Promise<Linter.Config[]>` built from native flat configs. No composer class                       |
| Rule overlap between plugins | One table, `src/overlaps.ts`, applied by the factory only when the owning feature is enabled       |
| New upstream rules           | The effective-policy snapshot is the review gate. `getPluginRules` stays, under an explicit name   |
| File-role exceptions         | A dedicated module, `configs/exceptions.ts`                                                        |
| Rule option typing           | Generated with `eslint-typegen`, introduced in stage 1                                             |
| Formatting                   | Prettier runs separately. Layout rules are turned off in the rule maps and guarded by a test       |
| Scope anchoring              | No `basePath`. `projectRootDirectory` is used for the manifest, tsconfig, and import resolver only |

Two questions about existing options were settled by the maintainer on 6 October 2026:

- **`environments` and `globals` stay.** 0.1.0 ships them as two top-level options applied to every JavaScript, TypeScript, and Svelte block, and the rewrite keeps that behavior.
- **`plugins` is removed.** Extra plugins go in `userConfigs`, where they can be scoped with `files`.

The rewrite changes the public options and removes CommonJS support, so it ships as a breaking release after 0.1.0. Release Please is configured with `bump-minor-pre-major`, which makes that 0.2.0.

## Target structure

```text
src/
  index.ts                  # exports createConfig and public types
  factory.ts                # selects features, fixes the order, appends user configs
  options.ts                # defaults; resolves boolean / object / "auto"
  types.ts                  # Options, FeatureOptions, Context, Rules
  typegen.d.ts              # generated, not committed
  globs.ts
  context.ts                # project root, consumer manifest, stack detection
  overlaps.ts               # owner → replaced rules
  utilities/
    import-peer.ts          # strict optional-peer loader
    all-rules.ts            # replaces getPluginRules
  configs/
    shared-options.ts       # replaces options/common.ts
    ignores.ts
    javascript/             # index, possible-problems, suggestions (done)
    typescript/             # index, parser, replacements, rules, rules-type-aware
    comments.ts
    imports.ts
    unused-imports.ts
    unicorn.ts
    promise.ts
    regexp.ts
    functional.ts
    node.ts
    security.ts
    perfectionist.ts
    html.ts
    json.ts
    package-json.ts
    markdown.ts
    react.ts
    svelte.ts
    express.ts
    exceptions.ts
scripts/
  typegen.ts
tests/
  policy/                   # snapshots (done), coverage, overlaps, deprecated, formatter
  configs/                  # per-feature wiring: parser, scope, options
  factory/                  # options, order, detection, peers
  package/                  # smoke, consumer install, types
  fixtures/
```

## Contracts

### Public options

```ts
type FeatureOptions = {
  files?: string[];
  ignores?: string[];
  overrides?: Rules;
};
type Feature<Extra = object> = boolean | (FeatureOptions & Extra);

type Options = {
  projectRootDirectory?: string; // default: process.cwd()
  ignores?: string[]; // extra global ignores
  environments?: GlobalEnvironment[]; // unchanged from 0.1.0
  globals?: Linter.Globals; // unchanged from 0.1.0

  javascript?: FeatureOptions; // always on
  typescript?: Feature<{
    typeChecked?: boolean; // default: false
    filesTypeAware?: string[];
    ignoresTypeAware?: string[];
    overridesTypeAware?: Rules;
    tsconfigRootDir?: string; // default: projectRootDirectory
  }>;

  comments?: Feature;
  imports?: Feature;
  unusedImports?: Feature;
  unicorn?: Feature;
  promise?: Feature;
  regexp?: Feature;
  functional?: Feature;
  node?: Feature;
  security?: Feature;
  perfectionist?: Feature;

  html?: Feature;
  json?: Feature<{ overridesJsonc?: Rules; overridesJson5?: Rules }>;
  packageJson?: Feature;
  markdown?: Feature;

  react?:
    | "auto"
    | Feature<{ refresh?: "auto" | "generic" | "next" | "vite" | false }>;
  svelte?: "auto" | Feature;
  express?: "auto" | Feature;
};

function createConfig(
  options?: Options,
  ...userConfigs: Linter.Config[]
): Promise<Linter.Config[]>;
```

The semantics are the same for every feature: `false` removes its blocks, `true` uses the defaults, an object enables it with options. `"auto"` exists only for `react`, `svelte`, and `express`, and is their default. Every other feature defaults to `true`.

Mapping from the current options: `tsTypeChecked` becomes `typescript.typeChecked`, `tsconfigRootDir` becomes `typescript.tsconfigRootDir`, `reactRefreshVariant` becomes `react.refresh`, and each `rules.<group>` becomes that feature's `overrides`. `plugins` has no replacement option: pass a config object that registers the plugin in `userConfigs`.

### Internal builders

Each feature is one function, `(options, context) => Linter.Config[] | Promise<Linter.Config[]>`. `context` carries the project root, the consumer's declared dependencies, the resolved globals, the tsconfig directory, and the type-aware scope (`files` and `ignores`, or `undefined` when typed linting is off). Features that own type-aware rules (`typescript`, `functional`, `node`) use that scope for their own type-aware block.

Blocks are named `@cravingmaker/eslint-config/<feature>/<part>`, where the part is `setup` (plugin registration, no `files`), `parser`, `rules`, or `rules-type-aware`. A feature's user overrides are merged at the end of its `rules` block.

### Composition order

1. `@cravingmaker/eslint-config/ignores`.
2. `javascript`, then the code-quality plugins: `comments`, `node`, `security`, `imports`, `unusedImports`, `promise`, `regexp`, `unicorn`, `functional`, `perfectionist`.
3. `typescript`: parser, core → `@typescript-eslint` replacements, rules, type-aware rules.
4. Frameworks: `react`, `svelte`, `express`.
5. Formats: `html`, `json`, `packageJson`, `markdown`.
6. `@cravingmaker/eslint-config/overlaps/*`.
7. `@cravingmaker/eslint-config/exceptions/*`.
8. `userConfigs`, in the order given.

The JavaScript and code-quality rule blocks use one source glob covering JavaScript and TypeScript, so the TypeScript block no longer repeats those rule lists. A rule that needs a JavaScript AST is never emitted without `files`.

### Overlap table

`src/overlaps.ts` lists each owner, the rules it replaces, and the owner's rules that cover them. A replaced rule is written as enabled in its own feature's rule map. The factory turns it off in an `overlaps/<feature>` block, over the files of the feature that holds the rule, when the owning feature is enabled, the replaced rule's feature is enabled, and that feature's overrides do not set the rule.

| Owner           | Replaced rules                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `regexp`        | `no-empty-character-class`, `no-invalid-regexp`, `no-useless-backreference`                                                                              |
| `unusedImports` | `no-unused-vars`, `@typescript-eslint/no-unused-vars`                                                                                                    |
| `imports`       | `no-duplicate-imports`, `n/file-extension-in-import`, `n/no-extraneous-import`, `n/no-missing-import`                                                    |
| `unicorn`       | `no-negated-condition`, `no-nested-ternary`, `no-warning-comments`, `n/no-process-exit`, `n/prefer-node-protocol`                                        |
| `perfectionist` | `sort-imports`, `sort-keys`, `import-x/first`, `import-x/order`, `@typescript-eslint/member-ordering`, `@typescript-eslint/adjacent-overload-signatures` |

Stage 2 re-derived the list from the rule maps, which added `@typescript-eslint/adjacent-overload-signatures`. Overlaps owned by the `javascript` feature stay in their rule maps with their reasons, because it is always on and no toggle can bring the replaced rule back: `perfectionist/sort-variable-declarations` (`one-var`), `unicorn/try-complexity` (the core complexity rules), and the excluded `unicorn/consistent-arrow-return-style` (`arrow-body-style`). Core → `@typescript-eslint` replacements stay in `configs/typescript/replacements.ts`, because both sides belong to one feature. Rules that are off because Prettier owns them stay `"off"` in their rule map with the reason. `tests/policy/overlaps.test.ts` reads the same table and checks that exactly one side is active, with the owner on and with the owner off.

## Stages

Each stage is one pull request to `main` and must pass `npm run validate`. Dependency bumps are never mixed into a refactor commit. Releases are the maintainer's decision: never merge a Release Please pull request, create a tag, or publish a GitHub Release as part of this work.

### Stage 0: baseline and JavaScript extraction (done)

Three commits; `npm run validate` passes with 30 test files and 191 tests.

1. `test: snapshot the effective lint policy per file type`. `tests/policy/effective-rules.test.ts` records what `calculateConfigForFile` resolves for 21 paths in the default suite, 2 paths in the type-checked suite, and the three React Refresh variants. The snapshots were generated from untouched source at `c69fbbe`.
   - Each snapshot holds the ignore status, language, plugins, language options, linter options, settings, and one line per rule with its severity and options.
   - The serializer keeps `Infinity` and regular expressions, sorts keys, and replaces absolute paths with `<root>`.
   - Snapshots are `.txt` files under `tests/policy/__snapshots__/effective-rules/`, so they are neither linted nor formatted.
2. `refactor: extract core JavaScript rules into a feature builder`. `src/rules/js/*` became `src/configs/javascript/` with an internal `javascript()` builder. The snapshots did not change.
3. `test: name the default parser in policy snapshots`.

One problem surfaced and is unresolved. `functional/prefer-immutable-types` reports different results depending on which files are linted together. On the baseline, `eslint .` passes, but `eslint tests/rule-coverage.test.ts` alone reports two errors, so the pre-commit hook can reject a commit that touches only that file. The helpers in `tests/rule-overlaps.test.ts` were rewritten to avoid the affected parameter types. The rule's `parameters: ReadonlyDeep` option is decided in stage 3. Stage 3 chose `ReadonlyShallow`; see [Parameter immutability](#parameter-immutability-done).

### Stage 1: foundation (done)

1. `scripts/typegen.ts` runs `pluginsToRulesDTS` from `eslint-typegen` over the core rules and every plugin, including the optional peers. It writes `src/typegen.d.ts`, which is ignored by git and produced by `npm run gen`. `gen` runs before `build`, `typecheck`, and `validate`. The file is not committed because Dependabot pull requests cannot regenerate it.
2. `types.ts`: `Rules` from the generated types, plus `FeatureOptions`, `Options`, and `Context`.
3. Existing rule maps are typed as `Rules`. Any option error this exposes is fixed in its own commit if it changes a snapshot.
4. `options.ts`, `context.ts`, `utilities/import-peer.ts`, and `utilities/all-rules.ts`. `createConfig` does not use them until stage 2.
5. `npm run inspect`, using `@eslint/config-inspector` as a dev dependency.

Gate: snapshots unchanged; `attw` and Publint still pass with the generated types; the root import works without optional peers.

Twelve commits; `npm run validate` passes with 36 test files and 254 tests. What stage 2 needs to know:

- **One approved snapshot change.** Typing the rule maps exposed three disabled core rules whose options their schemas reject: `capitalized-comments`, `no-console`, and `no-restricted-globals`. ESLint does not validate a rule that is off, but a later config that enables one with only a severity keeps those options, and ESLint then rejects the configuration. The maintainer approved fixing them in stage 1, in their own commit, which changes 30 lines in 10 snapshot files. `tests/policy/rule-options.test.ts` enables every rule that is off from a later config, so a new case fails the suite.
- **Generated types.** `src/typegen.d.ts` is ignored by git, by Prettier, and by this repository's ESLint config. `tests/typegen.test.ts` checks that every rule the configuration sets has a declaration and that the file compiles with `skipLibCheck: false`. `scripts/typegen.ts` removes one declaration that json-schema-to-typescript repeats.
- **The published declarations grow when the options become public.** Nothing public uses the generated types yet, so `dist/index.d.mts` is unchanged. Exporting `Options` and `Rules` from the root, tried and not committed, inlines all 1,302 rule declarations: the file grows from 1.4 KB to about 670 KB, Publint and attw pass, and a consumer without optional peers type-checks both types with `skipLibCheck: false`.
- **`Rules` is not a `Linter.RulesRecord`.** Its generated properties are optional, so a value can be `undefined`. Code that takes a rule map accepts `Rules` or `Linter.Config["rules"]`, as `buildTsConfig` now does.
- **Option objects that hold arrays use `satisfies RuleOptionOf<"<rule>">`, not `as const`.** `as const` makes arrays readonly, which ESLint's rule entry type rejects, and perfectionist sorts the elements of `as const` arrays; `enableAllRules` builds `[ruleId, "error"]` without it for that reason. The RegExp in `unicorn/filename-case` keeps a described `@ts-expect-error`, because the generated type cannot express it.
- **The new modules are not used yet.** `createConfig` does not import them, and the bundle does not contain them.
  - `resolveOptions(options, detection)` resolves `"auto"` from the `Detection` that its caller passes. For identical results, detect the way 0.1.0 does: a framework block is added when its peers are installed, each React block depends only on its own plugin, and React Refresh falls back to `"generic"`. Reading the declared dependencies instead, and turning Refresh off without a known bundler, is F8 in stage 3.
  - `createContext(options)` reads the declared dependencies as 0.1.0 does, including treating a missing or invalid manifest as empty. `detectReactRefreshVariant(dependencies)` replaces the function of the same name in `src/index.ts`, which takes a directory.
  - `importPeer(packageName, feature)` fails on a missing peer. Calling it where 0.1.0 skips a missing peer is F1 in stage 3.
  - `enableAllRules` returns what `getPluginRules` returns at every current call site.
  - `typescriptFiles` in `globs.ts` repeats the glob that `src/index.ts` writes inline.
- **Builder parameters and `functional/prefer-immutable-types`.** A parameter typed `Context`, `Options`, `FeatureOptions`, `Rules`, or a readonly record such as `Readonly<Linter.Globals>` is reported or not depending on which files are linted together. `context: Context` passed when linted alone and failed with all of `src/` or the whole repository, also with the globals as a `ReadonlyMap`. With `ignoreInferredTypes: true`, the rule skips a parameter that has a default value, because the default moves the type annotation off the parameter node. The new modules rely on that, and a builder declared as `(options: FeatureOptions = {}, context: Context = <default>)` passed in all three runs. The other way out is a repository-only `ignoreTypePattern` in `eslint.config.js`; the published options stay a stage 3 decision.
- **`npm run inspect`** builds the package and starts the config inspector, which loads 23 config items and 1,302 rules. Use it to compare block names and order while composition moves into `factory.ts`.

### Stage 2: extraction with identical results (done)

One commit per group. No commit may change a snapshot.

1. Code-quality plugins: `comments`, `unicorn`, `promise`, `regexp`, `functional`, `node`, `security`, `unused-imports`, `imports` (with the resolver), `perfectionist`. `src/rules/misc/` and `src/rules/node/` disappear.
2. `typescript`: the 790-line file becomes a folder with the parser, replacements, rules, and type-aware rules separated. The list of rules disabled for untyped linting disappears, because type-aware rules are emitted only in the type-aware block.
3. Formats: `html`, `json`, `package-json` (with `enforce-package-type`), `markdown`.
4. Frameworks: `react`, `svelte`, `express`. Their rule maps become plain data and no longer need dynamic imports.
5. `factory.ts` takes over composition and `index.ts` keeps only exports. The public options change in this commit. The snapshot suites change their option spelling and enable frameworks explicitly; the snapshot files do not change.
6. `overlaps.ts`: overlap `"off"` entries move from the rule maps into the table.

Gate: snapshots identical to stage 0. `src/rules/`, `src/options/`, and `src/utilities/plugin-rules.ts` are gone. `src/index.ts` contains only exports.

Seven commits; `npm run validate` passes with 41 test files and 339 tests. The cloud session was pinned to the branch `claude/loving-fermi-id06n8`, so the stage did not use `refactor/rewrite-stage-2`. What stage 3 needs to know:

- **One approved snapshot change.** The composition above cannot keep the TypeScript snapshots identical. When a later block sets a rule to only `"off"`, ESLint keeps the options of the earlier block. A core rule that TypeScript replaces now comes from the shared JavaScript block with its options, so the snapshots record those options instead of ESLint's defaults. The maintainer approved the change in its own commit, `refactor: share one source glob between JavaScript and TypeScript`. It changes 7 lines in each of the 6 TypeScript snapshots, and every changed line is a rule that stays off. The TypeScript split before it is byte-identical, and no other commit changes a snapshot.
- **Type-aware rules.** The hand-written list of rules disabled for untyped linting is gone. typescript-eslint's own `disableTypeChecked` config turns off the same 62 rules in the `typescript/rules` block. The maintainer chose this over dropping them, so untyped snapshots still list them as off. `typescript`, `functional`, and `node` set their type-aware rules in a `<feature>/rules-type-aware` block from `utilities/type-aware.ts`. The block covers `context.typeAware`, narrowed to the feature's own `files` with AND patterns when those are set, and it leaves out the feature's `ignores`. A feature's `overrides` apply again after its type-aware rules, and `typescript.overridesTypeAware` applies last. `node/rules-typescript` keeps `n/no-sync` off in TypeScript files outside the type-aware scope, as 0.1.0 does.
- **Type-aware scope (F9) is half done.** The type-aware blocks already follow `filesTypeAware` and `ignoresTypeAware`. What remains is that `typescript/parser` still sets `projectService` for every TypeScript file when typed linting is on.
- **Block names and plugin scopes.** Without type information the config has 45 blocks, and with it 48. Plugins keep the registration scope of 0.1.0, which the snapshots record. A feature whose plugin was registered for every file has a `setup` block; that covers the code-quality features, `package-json`, and `markdown`. typescript-eslint, `@eslint/json`, `@html-eslint`, `eslint-enforce-package-type`, and the framework plugins stay registered in the block for their files. Names outside the four planned parts are `javascript/jsx`, `javascript/commonjs`, `imports/resolver` (TypeScript files only, as before), `node/rules-typescript`, `json/rules-jsonc`, `json/rules-json5`, `react/html`, `react/hooks`, `react/refresh`, and `overlaps/<feature>`.
- **Context, detection, and peers.** The context also carries `tsconfigRootDir`, because the import resolver uses it as 0.1.0 does. `detectFeatures` in `context.ts` still detects a framework by its installed plugins. The framework builders load peers with `importOptionalPeer`, which skips a missing peer, and `importPeer` is still unused. Peer loading (F1) switches the builders to `importPeer`. Detection (F8) then replaces the plugin checks in `detectFeatures` with `context.dependencies` and returns `false` for Refresh without Next.js or Vite.
- **Overrides.** A feature's `overrides` apply only to its own blocks, so a plugin rule must be overridden in its plugin's feature. For example, `javascript.overrides` cannot turn off `unicorn/no-null`, because the unicorn block comes later. In 0.1.0, `rules.js` reached every JavaScript block, so the migration notes in stage 5 must say this. An overlap counts as overridden only when the feature that holds the replaced rule sets it; for `typescript` that means `overrides` or `overridesTypeAware`.
- **Where the other stage 3 items start.** CommonJS (F6) lives in `javascript/commonjs`, `commonjsFiles`, and `sourceFiles`, which still includes `.cjs` and `.cts`. The React blocks use `reactFiles` for hooks scope (F3). Svelte is one `svelte/rules` block over `svelteFiles`, whose parser hands scripts to the typescript-eslint parser, for Svelte scripts (F4). Feature toggles (F7) already work: `tests/factory/factory.test.ts` covers the order and a few toggles, and `tests/policy/overlaps.test.ts` covers rule recovery for every overlap.
- **Public API.** `src/index.ts` exports `createConfig` and the types `Feature`, `FeatureOptions`, `GlobalEnvironment`, `JsonOptions`, `Options`, `ReactOptions`, `ReactRefreshVariant`, `Rules`, and `TypeScriptOptions`, with a described `unicorn/no-barrel-files` disable. `dist/index.d.mts` is now about 672 KB, and Publint and attw pass. The rest parameter of `createConfig` has a described disable for `functional/functional-parameters` and `functional/prefer-immutable-types`; the latter reports a mutable array in every run, so the comment is never unused.
- **The README still documents the 0.1.0 options.** The stage is a breaking change, so Release Please proposes 0.2.0 after the merge. The README rewrite is stage 5.

### Stage 3: behavior changes

One commit per item. Each item has a test that fails before the change, and its snapshot diff is reviewed as part of the commit.

Work the items in the order of the table, which the maintainer set on 6 October 2026. Peer loading must come before detection, and type-aware scope before Svelte scripts.

| Item                      | Change                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Parameter immutability    | Decide the `functional/prefer-immutable-types` options whose results are unstable. Done: `ReadonlyShallow`                |
| File-role exceptions      | `exceptions.ts`, with the initial content below. Done, for JavaScript and TypeScript files only                           |
| CommonJS (F6)             | `.cjs` and `.cts` support is removed and the README says so. Done: neither gets rules; ESLint still parses `.cjs`         |
| Feature toggles (F7)      | Tests for `false`, `true`, and object on every feature, including rule recovery through the overlap table                 |
| Peer loading (F1)         | An enabled feature with a missing peer fails with an install message instead of being skipped                             |
| Detection (F8)            | `"auto"` reads the dependencies declared at the project root, not plugin presence. Refresh is off without a known bundler |
| Hooks scope (F3)          | Hooks rules apply to `.js` and `.ts`, not only JSX and TSX                                                                |
| Type-aware scope (F9)     | `filesTypeAware` and `ignoresTypeAware` work; typed sources and untyped scripts can be separated                          |
| Formatter ownership (F11) | HTML layout rules are turned off; the formatter test below is added                                                       |
| Svelte scripts (F4)       | JavaScript and TypeScript rules apply to the script in `.svelte` files                                                    |

Initial content of `exceptions.ts`, taken from the suppressions in this repository:

- Test files (`**/*.{test,spec}.*`): `functional/no-expression-statements` and `functional/no-return-void` off. There are 60 such suppressions today.
- Config files (`**/*.config.*`): `import-x/no-default-export` off. There are 3 such suppressions today.

The matching suppressions are removed from the repository in the same commit. Further exceptions are added only with similar evidence.

Formatter test: `eslint-config-prettier` as a dev dependency; no enabled rule may be one that it turns off, apart from a short list of exceptions with reasons. `@html-eslint` layout rules are outside its coverage and are decided by hand.

Gate: every open P1 finding has a fixture that fails before and passes after.

#### Parameter immutability (done)

One commit; `npm run validate` passes with 42 test files and 340 tests. `functional/prefer-immutable-types` now requires parameters to be `ReadonlyShallow` instead of `ReadonlyDeep`. Variables and return types stay unchecked, and `ignoreInferredTypes` stays on. One line changes in each of the two type-checked snapshots. What the next items need to know:

- **Cause.** eslint-plugin-functional computes immutability with `is-immutable-type`, whose cache lasts for the whole process unless `NODE_ENV` is `test`. The cache is keyed by `checker.getRecursionIdentity`, which every instantiation of a generic type shares, and the rule looks up a parameter by its type, not by its annotation. The first `readonly T[]`, `Readonly<T>`, or `ReadonlyMap<K, V>` that a process checks can therefore decide the deep result for later ones, whatever their `T`. ESLint lints each file as soon as it has been read, so the order, and with it the result, can differ even between two runs of the same command.
- **Evidence.** 50 fixture files with one parameter each were linted alone and together in four orders. A file's result changed with the files around it for 45 of them with `ReadonlyDeep`, for 30 with the plugin's `recommended` split (shallow for library types, deep for project types), and for 14 with `ReadonlyShallow`.
- **What remains.** A shallow check reads only the type's own members, which every instantiation of a generic type shares. The exception is a mapped type that copies modifiers from its argument: `Partial`, `Required`, `Pick`, `Omit`, or a user-defined `{ [K in keyof T]: T[K] }`. The 14 files are all of that kind. `Partial<Readonly<T>>` can still pass or fail depending on the files linted before it; `Readonly<Partial<T>>` cannot. No parameter in this repository has such a type. No rule option closes the gap: `ignoreTypePattern` matches source text, which an alias hides.
- **`functional/type-declaration-immutability`** uses the same cache. For a type whose name starts with `ReadonlyDeep` or `Immutable`, its deeper check can depend on the files linted before, including on parameters this rule checked shallowly. No type in this repository has such a name, and its options are not part of this item.
- **Testing the cache.** Vitest sets `NODE_ENV=test`, so a test that lints in its own process never sees the cache. `tests/policy/parameter-immutability.test.ts` lints fixtures in a child process without `NODE_ENV`, one file after another, in both orders, and expects the same messages; with `ReadonlyDeep` it fails. One `lintFiles` call for several files does not keep their order.
- **Builder parameters.** A parameter typed `Context`, `Options`, `FeatureOptions`, `TypeAwareScope`, `readonly Linter.Config[]`, or `Readonly<Linter.Globals>` now passes without a default value, alone and with the whole repository; `Rules` is reported in both. A parameter with a default value is still never checked, because the rule does not find its annotation. The disable comment for a `ReadonlyMap` parameter in `tests/deprecated-rules.test.ts` became unused and is removed.
- **Not changed.** `@typescript-eslint/prefer-readonly-parameter-types`, which keeps no state between calls, stays off; making it the owner would be a policy change beyond this item. The new test file has the usual file-level suppression of `functional/no-expression-statements` and `functional/no-return-void`, which the file-role exceptions item removes with the others.

#### File-role exceptions (done)

Two commits; `npm run validate` passes with 43 test files and 347 tests. `configs/exceptions.ts` turns off `functional/no-expression-statements` and `functional/no-return-void` in test files and `import-x/no-default-export` in config files. Its blocks, `exceptions/config-files` and `exceptions/test-files`, come after the overlaps. The suppressions they replace are gone: the file-level comment in all 42 test files, 83 rule names in all, and the next-line comment in the 3 config files. Three of the test-file comments keep their other rules. What the next items need to know:

- **Patterns are combined with `sourceFiles`.** ESLint lints every file that a `files` pattern matches, unless the pattern is `*`, starts with `!`, or ends in `/*` or `/**`; an AND array counts when any of its patterns does. On their own, `**/*.{test,spec}.*` and `**/*.config.*` made `eslint .` parse two `.txt` snapshots as JavaScript and fail. In a consumer, they would also reach files such as `example.test.ts.snap` and `vite.config.yaml`. `exceptions()` therefore combines each role's patterns with `sourceFiles` into AND patterns, and `tests/configs/exceptions.test.ts` checks that such files stay unlinted. A later block that selects files by name rather than by extension needs the same.
- **Scope.** A role's rules apply only while the feature that holds them is on, and a role with none of them has no block. The config now has 47 blocks without type information and 50 with it. Unlike an overlap, an exception does not follow the feature's `files`, `ignores`, or `overrides`: `"off"` changes nothing where the feature does not set the rule, and an override still applies outside the role's files. A user config, which comes last, turns a rule back on in those files.
- **Typed linting.** Both functional rules need type information, so without it, the default, they are already off, and only the config-file exception changes results. The snapshots record `eslint.config.js` in the default suite and `src/example.test.ts` in the type-checked suite. Both were added from unchanged source in a commit before the change, so the change's snapshot diff is the 5 lines it changes.
- **For the CommonJS item.** The exceptions reach `.cjs` and `.cts` files only through `sourceFiles`, so removing those extensions there removes them here.
- **For stage 5.** A consumer who suppresses these rules now gets an "Unused eslint-disable directive" warning, because the config sets `reportUnusedDisableDirectives`; with `--max-warnings 0`, the run fails. `eslint --fix` removes the comment but can leave a line with a single space. The migration notes should say so, and the README should list the exceptions and how to turn a rule back on.
- **Not added.** `import-x/no-anonymous-default-export` reports a config file whose default export is an object literal, such as `export default { … }`. The config files in this repository export a call, so there is no evidence for that exception yet.

#### CommonJS (F6) (done)

One commit; `npm run validate` passes with 44 test files and 349 tests. `cjs` and `cts` are gone from `javascriptFiles` and `typescriptFiles`, and with them from `sourceFiles` and every scope built from these globs. The `javascript/commonjs` block and `commonjsFiles` are gone, and the README says that CommonJS is not supported. The config now has 46 blocks without type information and 49 with it. What the next items need to know:

- **ESLint still parses `.cjs` files.** ESLint's default config, which comes before every flat config, matches `**/*.js`, `**/*.mjs`, and `**/*.cjs`, and sets `sourceType: "commonjs"` for `.cjs`. A `.cjs` file therefore stays linted, with ESLint's default parser and the plugins of the `setup` blocks, but no feature sets a rule for it. A `.cts` file matches no block, so `eslint .` skips it. This is the behavior before #40. Only a global ignore would make `eslint .` skip `.cjs` files too; the plan does not decide that, so this item does not add one.
- **Snapshot diff.** Two of the 28 snapshot files change. `src/example.cjs` loses the built-in globals and all 789 rules; what remains comes from ESLint's default config, apart from the plugins of the `setup` blocks. `src/example.cts` has no configuration. The suite keeps both paths, so a block that matches them again shows as a snapshot diff.
- **Tests.** `tests/configs/commonjs.test.ts` turns every feature and typed linting on. It checks that no rule applies to `.cjs`, `.cts`, and `.d.cts` files, including a config file, a test file, and a nested path, and that the ES module extensions keep `sourceType: "module"`. `tests/package.smoke.test.ts` checks the packed package. Both, and the block names in `tests/configs/javascript.test.ts`, fail against the previous source.
- **TypeScript scopes.** `typescriptFiles` is the default of `typescript.files` and of the type-aware scope, and the scope of `imports/resolver`, `node/rules-typescript`, and the TypeScript overlap block, so none of them reaches `.cts` files now. Declaration files for CommonJS, `.d.cts`, are not linted either.
- **For stage 5.** The README should list `.cjs` and `.cts` among the limits, and the migration notes should say:
  - `.cjs` and `.cts` files get no rules. In 0.1.0 they got the full policy as CommonJS, although `import-x/no-commonjs` reported `require` and `module.exports` in them.
  - `eslint .` still parses `.cjs` files, so it reports syntax errors and unused disable directives in them. A 0.1.0 suppression such as `// eslint-disable-next-line import-x/no-commonjs` becomes an "Unused eslint-disable directive" warning, and a run with `--max-warnings 0` fails. The warning comes from ESLint's default `reportUnusedDisableDirectives`; this config sets no `linterOptions`.
  - `eslint .` skips `.cts` files. A `.cts` path passed explicitly, as lint-staged or an editor does, gets the warning "File ignored because no matching configuration was supplied."

### Stage 4: tests and package contract

1. `tests/utilities.ts` fails positive and negative assertions on fatal parse errors and on ignored files (F12). `tests/rules/*` moves to `tests/configs/*` to follow the source layout.
2. `tests/fixtures/` holds one valid file per file type; the test expects no fatal messages and no lint messages.
3. Tests that only repeat upstream plugin behavior may be removed once the fixtures cover the same file type.
4. `tests/package/`: the fast symlink tests stay. Real tarball installs are added for three peer scenarios (none, partial, full), including a JSX fixture linted in a consumer without peers.
5. Type tests: an `Options` usage example compiles in a consumer without optional peers.

Gate: the cases below are covered.

| Area                 | Minimum cases                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Feature semantics    | `true`, `false`, object, and `"auto"`; an explicit option beats detection; output order is deterministic        |
| Parser safety        | JS, JSX without peers, TS, TSX, Svelte with JS and TS scripts, rune modules; no fatal errors on valid fixtures  |
| Framework quality    | Conditional hooks in `.js`, `.ts`, `.jsx`, and `.tsx`; Svelte script diagnostics; every Refresh variant and off |
| Missing/broken peers | Feature off without peers, feature on with missing peers, partial peer sets, a peer that throws on import       |
| Monorepo and root    | Nested manifests, nested outputs, explicit workspace scopes, a fixed project root with a different cwd          |
| Typed linting        | On and off, typed sources with untyped scripts, declaration files, no type-aware rule active in syntax mode     |
| Language separation  | JavaScript rules never reach Markdown, JSON, or HTML files; JSONC and JSON5 overrides stay in their scope       |
| Rule policy          | Core and TypeScript coverage, deprecated rules, overlap ownership, snapshot gate for new upstream rules         |
| Formatting           | `eslint --fix` is idempotent; Prettier → ESLint → Prettier is stable on shared fixtures                         |
| Package and typing   | A real installed tarball; no, partial, and full peers; exports, types, and pack contents                        |
| Documentation        | Every copyable README example runs as a consumer scenario                                                       |

### Stage 5: documentation and release candidate

1. The README is rewritten: options and defaults, supported file types, peers per framework, automatic detection, limits (no CommonJS, React and Svelte coverage), and migration notes from 0.1.0.
2. Every README example runs as a consumer scenario.
3. `npm run release:check` on Node 24 and 26.
4. `docs/rewrite/` is removed or reduced to a short record, and the rewrite section of `CLAUDE.md` is deleted.

Gate: the candidate is ready for review. Versioning and publishing are separate decisions.

## Out of scope

New plugins or integrations (Vue, Astro, YAML, TOML, JSDoc, Vitest, SonarJS, `eslint-plugin-svelte`, React JSX and accessibility rules), CommonJS support, subpath exports, and rule choices beyond those listed in stage 3.
