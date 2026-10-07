# Rewrite implementation plan

Status: agreed on 6 October 2026. Stage 0 is done; it landed in the pull request that added this document. Stages 1, 2, 3, and 4 are done; Svelte scripts (F4) was the last item of stage 3. Stage 5 is not started. One question is open for the maintainer: what should happen to TypeScript files that the TypeScript feature leaves out (see [Feature toggles](#feature-toggles-f7-done)). Stage 4 found policy problems that need decisions as well (see [Found, not changed](#found-not-changed)).

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

Each feature is one function, `(options, context) => Linter.Config[] | Promise<Linter.Config[]>`. `context` carries the project root, the consumer's declared dependencies, the resolved globals, the Svelte components whose scripts the source features lint, the tsconfig directory, and the type-aware scope (`files` and `ignores`, or `undefined` when typed linting is off). Features that own type-aware rules (`typescript`, `functional`, `node`) use that scope for their own type-aware block.

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

The JavaScript and code-quality rule blocks use one source glob covering JavaScript and TypeScript, and the Svelte components that the Svelte feature parses while it is on, so the TypeScript block no longer repeats those rule lists. A rule that needs a JavaScript AST is never emitted without `files`.

### Overlap table

`src/overlaps.ts` lists each owner, the rules it replaces, and the owner's rules that cover them. A replaced rule is written as enabled in its own feature's rule map. The factory turns it off in an `overlaps/<feature>` block, over the files of the feature that holds the rule, when the owning feature is enabled, the replaced rule's feature is enabled, and that feature's overrides do not set the rule. An owner with `files` or `ignores` of its own gets an `overlaps/<feature>/<owner>` block instead, narrowed to the files that both features lint, so the replaced rule stays on where the owner does not lint.

| Owner           | Replaced rules                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `regexp`        | `no-empty-character-class`, `no-invalid-regexp`, `no-useless-backreference`                                                                              |
| `unusedImports` | `no-unused-vars`, `@typescript-eslint/no-unused-vars`                                                                                                    |
| `imports`       | `no-duplicate-imports`, `n/file-extension-in-import`, `n/no-extraneous-import`, `n/no-missing-import`                                                    |
| `unicorn`       | `no-negated-condition`, `no-warning-comments`, `n/no-process-exit`, `n/prefer-node-protocol`                                                             |
| `perfectionist` | `sort-imports`, `sort-keys`, `import-x/first`, `import-x/order`, `@typescript-eslint/member-ordering`, `@typescript-eslint/adjacent-overload-signatures` |

Stage 2 re-derived the list from the rule maps, which added `@typescript-eslint/adjacent-overload-signatures`. Formatter ownership (F11) removed `no-nested-ternary` from the `unicorn` row, because `unicorn/no-nested-ternary` conflicts with Prettier and is off. Overlaps owned by the `javascript` feature stay in their rule maps with their reasons, because it is always on and no toggle can bring the replaced rule back: `perfectionist/sort-variable-declarations` (`one-var`), `unicorn/try-complexity` (the core complexity rules), and the excluded `unicorn/consistent-arrow-return-style` (`arrow-body-style`). Core → `@typescript-eslint` replacements stay in `configs/typescript/replacements.ts`, because both sides belong to one feature. Rules that are off because Prettier owns them stay `"off"` in their rule map with the reason. `tests/policy/overlaps.test.ts` reads the same table and checks that exactly one side is active, with the owner on, with the owner off, and with the owner limited by `files` and `ignores`.

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

### Stage 3: behavior changes (done)

One commit per item. Each item has a test that fails before the change, and its snapshot diff is reviewed as part of the commit.

Work the items in the order of the table, which the maintainer set on 6 October 2026. Peer loading must come before detection, and type-aware scope before Svelte scripts.

| Item                      | Change                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Parameter immutability    | Decide the `functional/prefer-immutable-types` options whose results are unstable. Done: `ReadonlyShallow`                |
| File-role exceptions      | `exceptions.ts`, with the initial content below. Done, for JavaScript and TypeScript files only                           |
| CommonJS (F6)             | `.cjs` and `.cts` support is removed and the README says so. Done: neither gets rules; ESLint still parses `.cjs`         |
| Feature toggles (F7)      | Tests for `false`, `true`, and object on every feature, including rule recovery through the overlap table. Done           |
| Peer loading (F1)         | An enabled feature with a missing peer fails with an install message instead of being skipped. Done                       |
| Detection (F8)            | `"auto"` follows the dependencies declared at the project root, not plugins. Refresh is off without a known bundler. Done |
| Hooks scope (F3)          | Hooks rules apply to `.js` and `.ts`, not only JSX and TSX. Done                                                          |
| Type-aware scope (F9)     | `filesTypeAware` and `ignoresTypeAware` work; typed sources and untyped scripts can be separated. Done                    |
| Formatter ownership (F11) | HTML layout rules are turned off; the formatter test below is added. Done, with three unicorn rules off as well           |
| Svelte scripts (F4)       | JavaScript and TypeScript rules apply to the script in `.svelte` files. Done, without type information                    |

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

#### Feature toggles (F7) (done)

Two commits; `npm run validate` passes with 45 test files and 427 tests. `tests/factory/feature-toggles.test.ts` checks `false`, `true`, and an object on every feature through `createConfig`, and `tests/policy/overlaps.test.ts` checks every overlap with its owner limited by `files` and `ignores`. The tests found two places where an object did not keep a feature within its files, and both are fixed. With default options, and with typed linting, the configuration is unchanged block by block: 46 blocks without type information and 49 with it. What the next items need to know:

- **What the toggle tests check.** For each of the 18 features that can be off: with `false`, no block of the feature remains and its rule is not set. With `true`, the block names and the resolved configuration of a file it lints equal those with `{}` and, for the 15 features whose default is `true`, those with the option left out. `react`, `svelte`, and `express` are not compared with their default, `"auto"`, because detection (F8) decides it. With `{ files, ignores, overrides }`, the override applies in its files, and outside its files and in its ignores the resolved configuration equals the one with the feature off, apart from the plugins that `setup` blocks register for every file. `functional` and `node` are checked with typed linting. `javascript`, which is always on, is checked with an object only, and `json` for the scope of each JSON language.
- **Overlaps follow the owner's scope.** An owner limited by `files` or `ignores` used to turn its replaced rules off in all of the holding feature's files, so where the owner did not lint, neither side was active. Now a replaced rule is off only where both features lint. Owners that keep their default scope share `overlaps/<feature>` as before. An owner with files or ignores of its own gets `overlaps/<feature>/<owner>`, whose `files` are AND patterns of both features' files and whose `ignores` are both features' ignores. An owner's `overrides` still do not bring a replaced rule back; the holding feature's `overrides` do.
- **`imports/resolver` follows `imports.files`,** through `narrowFiles`, as `node/rules-typescript` does. It already followed `imports.ignores`. The resolver settings change no rule on their own, so this matters only to a user config that adds `import-x` rules outside `imports.files`; such a config now sets the resolver itself.
- **Snapshot diff.** The first commit adds a `narrowed-owners` suite from unchanged source: the five owners limited to `src/**`, and `scripts/example.js` and `scripts/example.ts`, which none of them lints. In the fix, 15 replaced rules in the first file and 17 in the second change from `off` to `error` with their options unchanged, the severity counts change with them, and the resolver settings leave the second file. Core `no-unused-vars` stays off in the second, because typescript-eslint's replacement is on. No other snapshot changes.
- **Not changed, by design.** `json.files` and `json.overrides` apply to JSON files only. JSONC and JSON5 files keep their globs and have their own overrides, while `json.ignores` applies to all three; the json test records this. File-role exceptions still do not follow a feature's `files`, as described under [File-role exceptions](#file-role-exceptions-done).
- **Open: TypeScript files that the TypeScript feature leaves out.** The JavaScript and code-quality blocks match TypeScript files through `sourceFiles`, but only `typescript/parser` gives them a parser that reads TypeScript. A TypeScript file that the feature leaves out, with `typescript: false`, outside `typescript.files`, or in `typescript.ignores`, is therefore linted with espree and fails with `Parsing error: Unexpected token :` at the first type annotation. With typed linting, the type-aware blocks of `functional` and `node` also reached the files outside `typescript.files` or in `typescript.ignores`, until type-aware scope (F9) kept the type-aware scope within the files that `typescript/parser` parses. The toggle tests do not show this, because with the feature limited and with it off, those files resolve to the same configuration. The plan does not decide the behavior, so this item leaves it as it is. Two directions:
  - Leave those files unlinted, as for every other language feature: the shared blocks reach TypeScript files only where the TypeScript feature does, and the type-aware scope is narrowed the same way. Every shared feature's default files would then depend on the `typescript` options, and `typescript.ignores` would reach the other blocks as negated patterns in AND arrays, such as `[["**/*.ts", "!**/*.generated.ts"]]`, which ESLint 10.11 supports.
  - Keep them parseable: `typescript/parser`, and the core rules that the compiler checks, cover every TypeScript file that a shared block lints, and `files` and `ignores` narrow only the TypeScript rules. Core rules that typescript-eslint replaces would then run on TypeScript code without their replacements, and `typescript: false` would still need the first direction.

  Type-aware scope (F9) was done without the decision, because either direction keeps type information within the files that `typescript/parser` parses. Its notes say what each direction changes in the type-aware scope.

- **For stage 5.** The README should say that limiting an owner with `files` or `ignores` brings the rules it replaces back outside its scope, and that the holding feature's `overrides` keep a replaced rule on. It should also describe the scope of `json.files`, `json.overrides`, and `json.ignores`.

#### Peer loading (F1) (done)

One commit; `npm run validate` passes with 45 test files and 429 tests. The `react`, `svelte`, and `express` builders load their peers with `importPeer`, so a framework feature that is on fails when a peer it needs is missing, instead of leaving out the blocks of that peer. `importOptionalPeer` is gone; `isPeerInstalled` stays for detection. With every peer installed, the configuration is unchanged block by block. What the next items need to know:

- **What each feature needs.** `react` needs `@html-eslint/eslint-plugin-react` and `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` unless `refresh` is `false`. `svelte` needs `@html-eslint/eslint-plugin-svelte` and `svelte-eslint-parser`. `express` needs `eslint-plugin-express-security`. This holds whether the feature is set or detected. `createConfig` rejects, and the ESLint CLI stops with exit code 2 before it lints anything.
- **The message.** It names the package and the setting that turns off what needs it: `<feature>: false`, or `react: { refresh: false }` for the Refresh plugin, which `importPeer` takes as an optional third argument. When several peers of a feature are missing, it names the first in the builder's order: HTML, hooks, then Refresh for React, and plugin, then parser for Svelte. A consumer without any React plugin therefore sees one message per run until all are installed.
- **Detection still uses plugin presence.** `detectFeatures` turns React on when any of its three plugins is installed, and Svelte only when both of its peers are. With `"auto"`, a partial React set now fails: with the HTML and hooks plugins but not the Refresh plugin, Refresh falls back to `"generic"` and needs its plugin unless `refresh` is `false`. A partial Svelte set leaves Svelte off without a message. `tests/package.smoke.test.ts` records the React case as `detected`. Detection (F8) reads the declared dependencies instead: a project that declares a framework and lacks a peer will fail, one that does not declare it gets no blocks whatever is installed, and without Next.js or Vite, Refresh is off and needs no plugin. F8 therefore changes the `detected` expectation, and `isPeerInstalled` loses its last caller.
- **Peers of peers are not checked.** `svelte-eslint-parser` imports `svelte/compiler` when it loads. Without `svelte`, `createConfig` rejects with Node's `ERR_MODULE_NOT_FOUND` for `svelte` rather than the install message, as it did before this item. The same holds for any package that a peer imports.
- **Tests.** `tests/package.smoke.test.ts` adds two consumers. One has no optional peers and turns each framework on. The other has the HTML plugins for React and Svelte and the hooks plugin, and checks detection, `react: true`, `react: { refresh: false }`, and `svelte: true`. `tests/factory/import-peer.test.ts` checks the message with an option, and tests `isPeerInstalled` in place of `importOptionalPeer`. Against the previous source, 3 of the 14 tests in the two files fail.
- **Snapshot diff.** None. The suites turn every framework on in this repository, where every peer is installed, and with every peer installed the builders load the same modules and return the same blocks. A dump of every block for eight option sets, with frameworks detected, on, off, narrowed, and in each Refresh variant, and with typed linting, is byte-identical before and after.
- **For stage 4.** The gate's cases for a feature on with missing peers and for partial peer sets exist as symlink tests. The real installs should cover them too.
- **For stage 5.** The README should list the peers of each framework and show the error. The migration notes should say that in 0.1.0 a missing React plugin left out only its own block, while now `react` needs both plugins, and the Refresh plugin unless `refresh` is `false`.

#### Detection (F8) (done)

One commit; `npm run validate` passes with 45 test files and 442 tests. `detectFeatures` reads `context.dependencies`, the package names that the manifest at `projectRootDirectory` declares, instead of resolving plugins. React is detected when the project declares `react`, Svelte when it declares `svelte`, and Express when it declares `express`. React Refresh is `"next"` when the project declares `next`, then `"vite"` when it declares `vite`, and off otherwise. `isPeerInstalled` is gone. What the next items need to know:

- **What counts as declared.** `readDependencies` reads `dependencies`, `devDependencies`, and `peerDependencies`, so a component library that declares `react` only as a peer is detected. Installed packages count for nothing, and neither do the plugins, declared or installed. Only the manifest at `projectRootDirectory` is read: a monorepo root that declares no framework gets none, whatever its packages declare.
- **Refresh follows detection whenever `refresh` is `"auto"`,** also with `react: true` or an object without `refresh`. `react: true` in a project without Next.js or Vite therefore has no `react/refresh` block and needs no Refresh plugin. The variants are unchanged.
- **With strict peers (F1).** A project that declares a framework and lacks a peer fails with the install message. One that declares none gets no framework blocks, whatever is installed. A React project without a bundler no longer needs the Refresh plugin: with the HTML and hooks plugins but not the Refresh plugin, the interim case that the peer loading item recorded as `detected`, it gets the HTML and hooks blocks again, as in 0.1.0. The partial-peers consumer in `tests/package.smoke.test.ts` now declares `react` and `vite`, so its cases still show the Refresh message.
- **This repository's own config.** `eslint.config.js` uses the defaults, so it detects from this repository's manifest, which declares `react` and `svelte` as optional peers and dev dependencies: React and Svelte are on, Express is off, and Refresh is off. No file in the repository is JSX, TSX, or Svelte, so `eslint .` reports the same, and the Express rules no longer run on its sources. Hooks scope (F3) brings the hooks rules to `.js` and `.ts`, so with React detected here they will reach this repository's sources too.
- **Tests that relied on plugin presence.** Every optional peer is installed in this repository, so on `main` the defaults turned every framework on in a test. Now they turn on React and Svelte but not Express, from this repository's manifest. The rule tests, through `tests/utilities.ts`, `tests/deprecated-rules.test.ts`, `tests/typegen.test.ts`, and the minimum-peers job in `.github/workflows/ci.yml` set every framework explicitly now. Without that, the Express rule tests and the CI job fail, and the other two silently stop covering the Express rules. A new test that needs a framework sets it, or uses a temporary project root whose manifest declares it, as `tests/factory/factory.test.ts` and `tests/factory/feature-toggles.test.ts` do.
- **Snapshot diff.** None. `npx vitest run tests/policy -u` changes none of the 30 files, because the suites set every framework and the Refresh variant explicitly. A dump of every block for 18 option sets, against `main` and against this item, is identical wherever the frameworks and Refresh are set explicitly. Where one is `"auto"`, the only differences are framework blocks that are no longer added: `express/rules` with this repository's manifest, `react/refresh` without a bundler, and every block of a framework that a fixture project does not declare. No block is added or changed.
- **Tests.** `tests/factory/context.test.ts` checks each framework, Refresh without a bundler, and plugins declared without a framework. `tests/factory/factory.test.ts` replaces the plugin-presence test with temporary project roots and checks each detected Refresh variant against the explicit one. `tests/factory/feature-toggles.test.ts` adds the comparison that the toggles item left to this one: for `react`, `svelte`, and `express`, `"auto"` and the default equal `true` in a project that declares the framework, and `false` in one that does not. `tests/package.smoke.test.ts` adds a consumer with a partial peer set whose working directory declares every framework, while each case reads a project root that declares one framework or none. Against the previous source, the 12 new or changed detection tests fail, and every other test in the changed files passes.
- **For stage 4.** The gate's feature semantics row now has `"auto"` for each framework. The real installs should cover a declared framework with missing peers, and a project that declares none with every peer installed.
- **For stage 5.** The README should say which package turns each framework on and that Refresh needs Next.js or Vite. The migration notes should say:
  - In 0.1.0, a framework's blocks were added when its plugins were installed: each React block when its own plugin was, Svelte when both of its peers were, and Express when its plugin was. Now the manifest at `projectRootDirectory` must declare `react`, `svelte`, or `express`. A project that installs the plugins without declaring the framework, such as a monorepo root, sets the feature to `true` or points `projectRootDirectory` at the package that declares it.
  - In 0.1.0, React Refresh used the generic variant without Next.js or Vite. Now it is off; `react: { refresh: "generic" }` turns it back on.

#### Hooks scope (F3) (done)

One commit; `npm run validate` passes with 45 test files and 453 tests. The `react/hooks` block covers `sourceFiles`, so the hooks rules, the React Compiler rules among them, apply to every JavaScript and TypeScript source, where custom hooks live, and not only to JSX and TSX. `react/html` and `react/refresh` keep `reactFiles`. The blocks, their names, and their order are unchanged. What the next items need to know:

- **`files` replaces both scopes.** When `react.files` is set, all three blocks use it, as before, so a project that sets it gets the same result. Narrowing `react/html` and `react/refresh` to `reactFiles` with `narrowFiles`, as `node/rules-typescript` is narrowed, would drop their rules from a `files` pattern without a JSX extension, such as one for JSX in `.js` files, so this item leaves the meaning of `files` alone.
- **Overrides follow their rules.** `react/hooks` takes only the overrides of `react-hooks/*` rules; `react/html` and `react/refresh` take all of them, as before. ESLint rejects a rule that is on in a file whose configuration does not register its plugin, so an override of an `@html-eslint/react` or `react-refresh` rule in the hooks block would make every `.js` and `.ts` file fail. Other overrides, such as core rules, keep to component files, as `rules.react` did in 0.1.0.
- **For type-aware scope (F9).** The same check applies to the type-aware blocks. On `main`, `filesTypeAware: ["**/*.js"]` makes ESLint reject every `.js` file with `Could not find plugin "@typescript-eslint"`, because only `typescript/parser` registers the plugin, over `typescript.files`.
- **Where the hooks rules reach.** Every `.js`, `.mjs`, `.ts`, and `.mts` file, declaration, test, and config files included. Svelte rune modules (`.svelte.js`, `.svelte.ts`) have those extensions too, so in a project with both frameworks, a rune module that calls a function named like a hook conditionally is reported. `.cjs`, `.cts`, `.svelte`, and non-JavaScript files stay out. The compiler rules analyze only functions that look like components or hooks: a capitalized function, or one whose name is `use` followed by a capital letter or digit, that calls a hook or creates JSX. In this repository, whose manifest declares `react`, `eslint .` reports nothing new and takes no measurable extra time.
- **Snapshot diff.** 9 of the 30 files change, each in the same way: `react-hooks` joins the plugins line, the rule count grows by 16 errors, and the 16 `react-hooks/*` lines of the `.tsx` snapshot are added unchanged. The 9 are the `.js` and `.ts` paths of the default, type-checked, and narrowed-owners suites, including `eslint.config.js`, both rune modules, and `src/example.test.ts`. The `.jsx` and `.tsx` snapshots and the React Refresh variants do not change.
- **Tests.** `tests/rules/react/react-hooks.test.ts` checks a conditional hook call in `.js`, `.jsx`, `.ts`, and `.tsx` files, and a missing effect dependency in `.js` and `.ts` files. `tests/configs/frameworks.test.ts` checks that a `.js` or `.ts` file gets exactly the hooks rules, that a JSON file gets no React configuration, and where each kind of override applies. In `tests/factory/feature-toggles.test.ts`, the first file of `react` is a `.ts` hooks module. `tests/package.smoke.test.ts` checks the packed package. Against the previous source, 9 of the 95 tests in these four files fail.
- **Found, not changed: `files` without an extension.** A feature whose `files` is a directory pattern, such as `app/**`, also reaches the JSON and Markdown files there, and ESLint stops with an error from a rule that expects a JavaScript AST. On `main` this holds for `javascript`, `typescript`, `node`, `perfectionist`, `regexp`, `unicorn`, and `react`. The narrowed-owners suite uses `src/**`, but records only JavaScript and TypeScript files. Combining each feature's `files` with its default extensions, as `exceptions.ts` does with `narrowFiles`, would avoid it, but it changes what `files` means for every feature, so it needs a decision.
- **For stage 4.** The gate's case for conditional hooks in `.js`, `.ts`, `.jsx`, and `.tsx` exists as lint tests. The shared fixtures should include a custom hook in a `.ts` file.
- **For stage 5.** The README should say that the hooks rules apply to every JavaScript and TypeScript file and the other React rules to JSX and TSX files, that `react.files` replaces both, and which overrides reach which files. The migration notes should say that in 0.1.0 the hooks rules applied to JSX and TSX files only, and that now a custom hook in a `.js` or `.ts` file is checked, and so is any function there whose name makes it a hook.

#### Type-aware scope (F9) (done)

Two commits; `npm run validate` passes with 46 test files and 465 tests. With typed linting on, `typescript/parser` no longer sets `projectService`. A new block, `typescript/parser-type-aware`, sets `projectService` and `tsconfigRootDir` over the type-aware scope only, so a TypeScript file outside it, such as a script that no tsconfig includes, is parsed without type information. The type-aware scope stays within the files that `typescript/parser` parses: `resolveTypeAwareScope` narrows `filesTypeAware` to `typescript.files` with AND patterns and adds `typescript.ignores` to `ignoresTypeAware`. The config now has 46 blocks without type information and 50 with it. What the next items need to know:

- **Type information and type-aware rules cover the same files.** `narrowTypeAwareScope` in `utilities/type-aware.ts` gives the files and ignores of `typescript/parser-type-aware` and of every `<feature>/rules-type-aware` block: the type-aware scope, narrowed to the feature's own `files`, without its `ignores`. On `main`, a type-aware rule in a file without type information crashed the whole run with "You have used a rule which requires type information", and one in a file whose configuration does not register `@typescript-eslint` failed with `Could not find plugin`. `tests/configs/type-aware-scope.test.ts` checks, for three option sets, that the type-aware rules of `typescript`, `functional`, and `node` are on exactly where `projectService` is set.
- **`context.typeAware.files` can hold AND patterns.** `filesTypeAware: ["src/**"]` resolves to `[["src/**", "**/*.{ts,mts,tsx,mtsx}"]]`, and `narrowFiles` accepts such entries in its scope. Without `filesTypeAware`, the scope is `typescript.files` itself, so the default typed configuration resolves to the same configuration as on `main` for every path.
- **Files outside the scope get no type information at all.** Before, the project service parsed them while their type-aware rules were off. Rules that read type information when it is there, such as the type tracker of eslint-plugin-regexp, now run without it in those files. Each of the three changed snapshots resolves byte-identically to the same path with `typeChecked: false`.
- **JavaScript files never get type information.** The scope is narrowed to TypeScript files, so `filesTypeAware: ["**/*.js"]` matches nothing; on `main`, it made ESLint reject every `.js` file. Typed linting of JavaScript would need `typescript/parser` on JavaScript files, which the plan does not cover.
- **The open question stays open.** F9 narrows the type-aware scope to the files that `typescript/parser` parses today: `typescript.files` without `typescript.ignores`. If TypeScript files outside the feature are to stay unlinted, this narrowing stays as it is. If they are to stay parseable, `typescript/parser` covers every TypeScript file that a shared block lints, and `resolveTypeAwareScope` narrows to that wider scope instead, so the type-aware rules of `functional` and `node` reach those files again, this time with type information. Either way, such a file still fails with `Parsing error: Unexpected token :` until the question is decided.
- **Repeated patterns.** When `typescript.files` or `typescript.ignores` is set, the TypeScript feature's own type-aware blocks repeat it, because `narrowTypeAwareScope` narrows the resolved scope by the feature's options once more. ESLint matches the same files. The narrowing keeps the builder correct with a context built by hand, as in `tests/configs/typescript.test.ts`.
- **Snapshot diff.** The first commit adds a `type-aware-scope` suite from unchanged source. It limits typed linting to `src/**` without `src/legacy/**`, puts `**/*.generated.ts` in `typescript.ignores`, and records `scripts/example.ts`, outside `filesTypeAware`; `src/legacy/example.ts`, in `ignoresTypeAware`; and `src/example.generated.ts`, in `typescript.ignores`. In the fix, the first two lose `projectService` and `tsconfigRootDir` from their parser options, and in the third, the 12 functional type-aware rules and `n/no-sync` change from `error` to `off`. No other snapshot changes. A comparison of block names and resolved configurations with `main`, for 13 option sets and 16 paths, shows only these changes, the new block, and the files that `main` rejected.
- **Tests.** `tests/configs/type-aware-scope.test.ts` lints a temporary project whose tsconfig includes `src/` only: a script outside it lints without a parsing error, a directory in `filesTypeAware` leaves the JavaScript and JSON files there lintable, and a TypeScript file in `typescript.ignores` lints without a crash. `tests/configs/typescript.test.ts`, `tests/factory/options.test.ts`, and `tests/factory/context.test.ts` check the parser blocks and the resolved scope, and `tests/package.smoke.test.ts` checks the scope in the packed package without optional peers. Against the previous source, 11 of the 60 tests in these five files fail.
- **For Svelte scripts (F4).** `.svelte` components are outside the type-aware scope, because `typescript.files` does not match them. Rune modules (`.svelte.ts`, `.svelte.mts`) are inside it, and their configuration merges `projectService` with the `parser` that the Svelte block sets. If F4 gives component scripts type-aware rules, those files need the project service with `extraFileExtensions: [".svelte"]`, as svelte-eslint-parser documents, and the rules must stay within the files that read type information.
- **For stage 4.** The gate's typed-linting cases for typed sources with untyped scripts, and for type-aware rules only where type information exists, exist as lint tests on a temporary project. The real installs should cover them too.
- **For stage 5.** The README should say that `filesTypeAware` and `ignoresTypeAware` decide where the parser reads type information as well as where type-aware rules apply, that they match only the TypeScript files that the feature lints, and how to lint scripts that no tsconfig includes.

#### Formatter ownership (F11) (done)

One commit, after one that adds `eslint-config-prettier` 10.1.8 as a dev dependency; `npm run validate` passes with 47 test files and 476 tests. The nine `@html-eslint` layout rules are off, three unicorn rules that conflict with Prettier are off, and `unicorn/template-indent` leaves out the templates that Prettier formats. The blocks, their names, and their order are unchanged. What the next items need to know:

- **The formatter test.** `tests/policy/formatter.test.ts` resolves one file of each kind with every feature on, with and without typed linting. No rule that `eslint-config-prettier` turns off may be on there, apart from `unicorn/template-indent`, whose reason the test checks as the CLI of `eslint-config-prettier` does: its tags and comments leave out `css`, `gql`, `graphql`, `html`, `markdown`, `md`, `/* GraphQL */`, and `/* HTML */`. The `eslint-config-prettier/prettier` entry point is not used, because it lists rules that conflict only with eslint-plugin-prettier. When a dependency update brings a rule that the test reports, turn the rule off in its rule map with the reason, or, if it cannot conflict with Prettier, add it to the exceptions with that reason.
- **@html-eslint is decided by hand.** `eslint-config-prettier` does not cover it. The test lists every style rule of the three @html-eslint plugins, found by `meta.docs.category` (`Style` or `Stylistic Issues`) or by `meta.type` `layout`, and fails when a plugin version adds one that is neither off as layout nor kept with a reason. Off, because they check only whitespace, line breaks, indentation, or attribute quotes: `attrs-newline`, `class-spacing`, `element-newline`, `indent`, `no-extra-spacing-tags`, `no-extra-spacing-text`, `no-multiple-empty-lines`, `no-trailing-spaces`, and `quotes`. Kept: `id-naming-convention`; `lowercase`, because Prettier lowercases known HTML names but keeps the case of custom elements; `sort-attrs`, because Prettier keeps the order of attributes; `@html-eslint/react/classname-spacing`, because Prettier leaves JSX strings alone; and `@html-eslint/svelte/class-spacing`, because prettier-plugin-svelte 4.1.1 keeps leading spaces in class names and does not undo the fix.
- **Evidence.** HTML fixtures were formatted by Prettier 3.9.9 with its defaults, with this repository's Prettier config, and with tabs and a print width of 120, and then linted one rule at a time. `attrs-newline` and `indent` reported Prettier's output, and their fixes never converged with it; `element-newline` reported it as well. The other six never reported it, so they only repeated Prettier, apart from `no-trailing-spaces` inside `<pre>`, where Prettier keeps trailing spaces because they are content. Of the rules that stay on and report Prettier's output, the fixes of `head-order` and `sort-attrs` are stable under Prettier.
- **Unicorn, decided by the maintainer on 7 October 2026.** `empty-brace-spaces` reports the empty `if {} else {}` and `try {} catch {}` blocks that Prettier prints across lines, `number-literal-case` with its default `hexadecimalValue: "uppercase"` reports the `0xff` that Prettier prints, and `no-nested-ternary` reports `a ? 1 : b ? 2 : 3`, from which Prettier removes the parentheses that the rule adds. Prettier reverts each fix, so the three are off. With `html` among its tags, `template-indent` and Prettier never converge on an `html` template in a ternary; without `gql`, `html`, and `/* HTML */`, as `eslint-config-prettier` documents, they converge after one fix.
- **Nested ternaries.** The overlap table no longer lists `no-nested-ternary` under `unicorn`, so core `no-nested-ternary`, which the JavaScript rule map already sets to `"error"`, applies. It reports every nested ternary, also `a ? (b ? 1 : 2) : 3`, which unicorn allowed, and it has no fix for Prettier to revert. This repository has no nested ternary.
- **Snapshot diff.** 14 of the 30 files change. `index.html` turns the nine layout rules off; a bare `"off"` replaces the entry, so their options disappear. Each of the 13 JavaScript and TypeScript paths of the default, type-aware-scope, and type-checked suites changes the same five lines: `unicorn/empty-brace-spaces`, `unicorn/no-nested-ternary`, and `unicorn/number-literal-case` off, `no-nested-ternary` on, and the `template-indent` options. Two errors become off in each severity count. `number-literal-case` still shows its default option, as rules that are off do. The Svelte component, JSON, Markdown, and React Refresh snapshots do not change, and neither do the narrowed-owners files, which are outside unicorn's files, so the core rule was already on there.
- **Tests.** `tests/rules/js/suggestions.test.ts` checks that core `no-nested-ternary` reports a chained ternary as Prettier prints it, and `tests/rules/html/html.test.ts` that `no-extra-spacing-tags` leaves spacing between attributes alone. Against the previous source, 6 of the 29 tests in these two files and the formatter test fail. Three tests changed their sample without changing what they check: the HTML rule in `tests/factory/feature-toggles.test.ts` is `no-duplicate-id`, the HTML override in `tests/configs/formats.test.ts` turns `indent` back on with `"warn"`, and the control in `tests/policy/overlaps.test.ts` is `no-negated-condition`.
- **Cross-check.** The CLI of `eslint-config-prettier`, run on this repository's own config, reports the three unicorn rules and the `template-indent` options before this item and nothing after it. With ESLint 10 it works only without `ESLINT_USE_FLAT_CONFIG=true`, which makes it use `FlatESLint`, and ESLint 10 no longer exports that.
- **Found, not changed: self-closing custom elements.** `@html-eslint/require-closing-tags` has `selfClosing: "always"` and `selfClosingCustomPatterns: ["-"]`, so in an HTML file it reports `<my-element></my-element>` and fixes it to `<my-element />`. HTML ignores that slash on elements that are not void, so a browser reads a start tag and nests the content that follows inside the custom element. Prettier keeps either form, so it is not a formatter matter, and it needs a decision.
- **For Svelte scripts (F4).** The formatter test resolves `src/Component.svelte`, so rules that reach the script in `.svelte` files are checked there too. Prettier formats `.svelte` files only with prettier-plugin-svelte.
- **For stage 4.** The test checks which rules are on, not formatted output. The gate's formatting row, an idempotent `eslint --fix` and a stable Prettier → ESLint → Prettier round trip on the shared fixtures, still needs that round trip.
- **For stage 5.** The README should say that Prettier is expected to run as a separate step, list the rules that are off for it, and show how a project that does not format HTML with Prettier turns them back on with `html.overrides`. The migration notes should say that the nine HTML rules and three unicorn rules are off, that `no-nested-ternary` now reports every nested ternary, and that `template-indent` no longer checks `gql` and `html` templates. A suppression of a rule that is now off becomes an "Unused eslint-disable directive" warning.

#### Svelte scripts (F4) (done)

One commit, after one that adds `src/Component.svelte` to the type-checked suite from unchanged source; `npm run validate` passes with 48 test files and 521 tests. While the Svelte feature is on, the scripts of the components that it parses get the rules of TypeScript sources without type information, apart from four rules that components break by design. With every framework on, the config has 47 blocks without type information and 51 with it; the new block is `exceptions/svelte-components`. What stages 4 and 5 need to know:

- **Components follow the Svelte feature's scope.** `resolveOptions` resolves `svelteComponents`: the Svelte feature's `files` narrowed to `**/*.svelte`, with each of its `ignores` as a negated pattern in the same AND array, such as `[["**/*.svelte", "!**/generated/**"]]`, or none while the feature is off. The context carries them, and `withSvelteComponents` in `globs.ts` adds them to the default files of the `javascript`, `typescript`, and ten code-quality features, of `imports/resolver` and `node/rules-typescript`, and of the overlap blocks. A feature's own `files` still replace its defaults. Only svelte-eslint-parser reads a component, so where the Svelte feature does not parse one, no feature lints it, and `eslint .` skips it as before. An ignore that starts with `!` cannot become a negated pattern, so it is left out, and the files that it unignores get only the Svelte rules. `buildContext` now resolves the options with detection, so that `"auto"` decides the components.
- **TypeScript rules on every script.** svelte-eslint-parser hands every script to typescript-eslint's parser, with `lang="ts"` or without, so the `typescript` feature lints all components, and the core rules that the compiler checks, such as `no-undef`, are off in them as in TypeScript files. In the 19 sample components below, no typescript-eslint rule reported a JavaScript script. A project that writes components only in JavaScript and wants `no-undef` in them sets `typescript: false` or narrows `typescript.files`.
- **Exceptions, decided by the maintainer on 7 October 2026.** `configs/exceptions.ts` has a third role, `svelte-components`, over the same components, and `fileRoles` is now a function of the resolved options. An instance script runs once per component instance, so its top-level variables are the instance's state, which Svelte updates through assignments: `functional/no-let` and `unicorn/no-top-level-assignment-in-function` report the canonical `let count = $state(0)` with `onclick={() => count++}`. `import-x/no-mutable-exports` reports the `export let` props of legacy mode, also as `let name; export { name }`. `import-x/unambiguous` reports every component, because svelte-eslint-parser puts the statements of a script below its element instead of the program. Rune modules keep all four rules: their top level is module state that every importer shares.
- **Evidence.** 19 sample components, compiled with svelte 5.55.9 in runes and legacy mode, in JavaScript and TypeScript, with module scripts, snippets, generics, stores, bindings, and directives, were linted with the policy extended to them. The four rules above reported code that has no valid alternative: `const` for state that changes fails with "Cannot assign to constant", for a `bind:` target with "Cannot bind to constant", and `export const` turns a legacy prop into a constant export. No rule crashed and no file had a parsing error. The other reports apply as in TypeScript files and stay: `unicorn/name-replacements` on `type Props`; `prefer-const` on `let { a } = $props()`, whose fix compiles, because svelte-eslint-parser counts `bind:` and assignments as writes; `no-self-assign` on the legacy `items = items`, which an immutable update replaces and which runes mode does not need; `import-x/group-exports` on several legacy `export let` props, which `export { a, b }` replaces; `functional/no-classes` on classes with `$state` fields; and `no-return-assign` in template expressions, which the rules reach as well.
- **Typed linting leaves components out, decided by the maintainer.** `resolveTypeAwareScope` still defaults to `typescriptFiles`, so components get neither type information nor type-aware rules. With the project service and `extraFileExtensions: [".svelte"]`, type-aware rules work in a sample project, but a component that no tsconfig includes fails with "was not found by the project service", and the handlers of `<svelte:window>` are typed `any`, which the `no-unsafe-*` rules report. A later item that adds components to the type-aware scope needs `extraFileExtensions` in `typescript/parser-type-aware` and must keep the type-aware rules within the files that read type information.
- **import-x and the Svelte parser.** import-x parses a module that a file imports with that file's parser, and svelte-eslint-parser reads every file but a `.svelte.js` or `.svelte.ts` module as a component. On `main`, a rune module that imports `svelte/store` got three "Parse errors in imported module" errors, from `import-x/namespace`, `import-x/no-deprecated`, and `import-x/no-rename-default`, plus console warnings. The Svelte block now sets `import-x/parsers` to parse `.js`, `.mjs`, and `.cjs` modules with espree, which import-x resolves through ESLint's own dependencies, so the set of modules that import-x reads is unchanged. In TypeScript files and components, the TypeScript resolver maps `svelte` to its declaration file, which import-x does not read.
- **Snapshot diff.** 4 of the 31 files change. `src/Component.svelte`, in the default and the type-checked suite, goes from 10 rules to 925: the rules of `src/example.ts` without its 16 React hooks and 10 Express rules, with the four exceptions off, plus the 10 Svelte rules as before. Its plugins gain `@typescript-eslint`, and its settings the TypeScript resolver and `import-x/parsers`. The two component snapshots are byte-identical. `src/state.svelte.js` and `src/state.svelte.ts` gain `import-x/parsers`. No rule changes outside components.
- **Tests.** `tests/configs/svelte-scripts.test.ts` checks that a component gets the rules of a TypeScript source apart from the exceptions, without and with typed linting; that problems in JavaScript and TypeScript scripts and in a template expression are reported; that a component outside the Svelte feature's files or in its ignores, and any component with Svelte off, gets no configuration; that valid components in both modes and languages and a rune module lint without messages in a temporary project; and that `import-x/named` reports a name that a rune module does not export. `tests/configs/exceptions.test.ts`, `tests/factory/options.test.ts`, `tests/factory/context.test.ts`, and the builder tests check the role, the resolved components, and each builder's default files; `tests/policy/overlaps.test.ts` checks that every overlap resolves in a component as in a TypeScript source, with its owner on and off; `tests/package.smoke.test.ts` checks the packed package. Against the previous source, 46 of the 182 tests in these nine files fail.
- **Minimum peers.** The consumer of the CI job, with svelte-eslint-parser 1.6.0, ESLint 10.4.0, svelte 5.0.0, and @html-eslint/eslint-plugin-svelte 0.60.0, lints the job's component and four valid sample files without a crash or a fatal message. The job's own component now gets `@typescript-eslint/no-inferrable-types`, which the job does not check.
- **Found, not changed.**
  - `svelteFiles` includes `.svelte.mjs` and `.svelte.mts`, but svelte-eslint-parser treats only `.svelte.js` and `.svelte.ts` files as rune modules. It reads the other two as components and fails with `Parsing error: Expected token }`, on `main` too. Leaving them out of `svelteFiles` would make them plain JavaScript and TypeScript sources; that needs a decision.
  - Legacy TypeScript components type their props, events, and slots with the interfaces `$$Props`, `$$Events`, and `$$Slots`. `unicorn/name-replacements` asks for `$$Properties`, which Svelte's tooling does not read, and `unused-imports/no-unused-vars` reports `$$Events` and `$$Slots`, which no code references. Runes mode does not use them.
  - `import-x/no-duplicates` reports `svelte/animate` and `svelte/transition` imported in one file, because the TypeScript resolver maps both to `svelte/types/index.d.ts`. TypeScript files behave the same on `main`.
- **For stage 4.** The gate's parser-safety case for Svelte with JavaScript and TypeScript scripts and its case for Svelte script diagnostics exist as lint tests on a temporary project in `tests/configs/svelte-scripts.test.ts`. The shared fixtures should include a valid component of each kind, and the real installs should lint one.
- **For stage 5.** The README should say that components get the rules of TypeScript sources without type information, which four rules are off in them and why, that `svelte.files` and `svelte.ignores` decide which components the other features lint, and that `typescript: false` keeps `no-undef` for components written in JavaScript. The migration notes should say that in 0.1.0 components got only the 10 `@html-eslint/svelte` rules, so a lint run that passed can fail.

### Stage 4: tests and package contract (done)

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
| Documentation        | Moved to stage 5, which rewrites the README; decided by the maintainer on 7 October 2026                        |

Ten commits, one of which adds `prettier-plugin-svelte` 4.1.1 as a dev dependency, which the maintainer approved on 7 October 2026; `npm run validate` passes with 48 test files and 625 tests. No snapshot changes. The cloud session was pinned to the branch `claude/jolly-hopper-4bpe0t`. What stage 5 needs to know:

- **Test layout.** `tests/configs/` follows `src/configs/`: the wiring tests and the rule tests of a feature share one file, named after its module. `code-quality.test.ts` keeps the checks that the ten code-quality builders share, which are all that `comments` and `security` have left, because each of their rule tests repeated upstream behavior. `commonjs`, `svelte-scripts`, and `type-aware-scope` test behavior across modules, and the four format features share `describe-file.ts`. `tests/policy/` holds the checks of the whole policy, rule coverage and deprecated rules among them, `tests/factory/` options, detection, and composition, and `tests/package/` the packed package: `contract.test.ts` for the manifest, `smoke.test.ts` for consumers with linked packages, and `install.test.ts` for real installs. `tests/utilities.ts` and `tests/typegen.test.ts` stay at the top.
- **Lint assertions (F12).** `expectLintError` and `expectNoLintError` fail when ESLint ignores the path or cannot parse the code, so a negative assertion no longer passes without linting. `tests/utilities.test.ts` checks this against both helpers. Markdown is linted with `lintText` like the other languages; the helpers that wrote a temporary file are gone.
- **Which rule tests stay.** Each assertion was linted again with its rule reset to the plugin's own defaults. 99 rule tests reported the same and checked nothing else, so they are removed: the snapshots record that those rules are on and with which options, and the fixtures show that each file type lints without false positives. A rule test now checks an option or decision of this package, such as a rule that stays off, or wiring that the defaults cannot show: the hooks rules in `.js`, `.jsx`, `.ts`, and `.tsx` files, each React Refresh variant, the TypeScript parser for Svelte scripts, the unused-imports replacement for `no-unused-vars`, and core `no-nested-ternary`. The same check found four tests that could not fail for the reason they stated, which are fixed, and three that could not fail at all, which are replaced by one that reads the configuration. A new rule test should pass the check.
- **Fixtures.** `tests/fixtures/` is a small project with one valid file of each type. Its `package.json` is the manifest fixture, and its `tsconfig.json` is the JSONC fixture and types the TypeScript fixtures, the rune modules through `types: ["svelte"]`. `tests/policy/fixtures.test.ts` lints them with every feature on, with and without typed linting, and expects no messages; it also checks that the TypeScript fixtures type-check and that the folder holds nothing else. The files in `react/` are linted without type information, and the manifest describes a library with optional peers; both follow from findings below. The repository's own lint leaves `tests/fixtures/` to this test, and the root tsconfig leaves it out.
- **Real installs.** `tests/package/install.test.ts` packs the build and installs it from the npm registry into three consumers, with ESLint and the peers at the versions this repository tests with, and with `ignore-scripts` and `min-release-age=7`: one without optional peers, one with a partial set, and one with every peer. The installs run in parallel and take about 20 seconds with a warm npm cache, so `npm test` needs network access. Each consumer lints fixtures with its own ESLint CLI. The test also checks the install messages, the contents of the tarball, the root export, and that a TypeScript example of the options compiles with `skipLibCheck: false` and no ambient types. The symlinked consumers in `smoke.test.ts` stay for speed.
- **A partial peer set as npm installs it.** npm installs `svelte-eslint-parser` with `@html-eslint/eslint-plugin-svelte`, whose required peer it is, and the parser treats `svelte` as optional. With the plugin but not `svelte`, `svelte: true` therefore fails with Node's message for `svelte` rather than the install message, as the peer loading notes predicted for peers of peers; the install test records it.
- **Formatting.** `tests/policy/formatting.test.ts` formats every fixture with four Prettier configurations: Prettier's defaults, this repository's configuration, tabs with 120 columns, and single quotes without semicolons. In each, ESLint reports and fixes nothing in what Prettier prints, and Prettier keeps its own output. Seven unfixed files, one per language and a Svelte component, check that `eslint --fix` leaves no fixable problem, changes nothing when run again, and agrees with Prettier after one round. This repository's Prettier configuration loads `prettier-plugin-svelte` when it is installed, so `npm run format:check` now also checks `.svelte` files.
- **Where the gate cases are.** Feature semantics: `factory/feature-toggles`, `factory/options`, and `factory/factory`, which also checks that an explicit value beats detection either way and that the output is the same from every call and for any order of the options. Parser safety: `policy/fixtures`, and the JSX component without peers in `package/install` and `package/smoke`. Framework quality: `configs/react` and `configs/svelte-scripts`. Missing and broken peers: `package/install`, `package/smoke`, and `factory/import-peer`. Monorepo and root: `package/smoke`, and `factory/workspaces` for features scoped to workspaces. Typed linting: `policy/fixtures`, `configs/type-aware-scope`, `package/install`, and `policy/type-information`, which checks every rule that declares `requiresTypeChecking`. Language separation: `policy/language-separation`. Rule policy: `policy/rule-coverage`, `policy/deprecated-rules`, `policy/overlaps`, and the snapshots. Formatting: `policy/formatting`. Package and typing: `package/install` and `package/contract`.

#### Found, not changed

The fixtures and the real installs found these. Each needs a decision, and none is part of stage 4.

- **Typed linting reports every React component.** `@typescript-eslint/naming-convention` allows only camelCase for functions and variables, so a component in a `.tsx` file, which React requires to be capitalized, is reported. `functional/no-return-void` reports event handlers and effects that call a state setter, and `functional/functional-parameters` reports a handler written inline in JSX, because its `ignoreLambdaExpression` exempts only call arguments. Linted with typed linting and a minimal declaration of React's types, the TSX and hook fixtures got these three rules and nothing else. Without React's types, which React does not ship, every value from React is an error type besides.
- **No manifest without peer dependencies passes.** `package-json/require-peerDependenciesMeta` requires the field, and `package-json/no-empty-fields` reports it when it is empty, so only a package with peer dependencies can have a clean `package.json`; `require-peerDependencies` itself is off. `require-author`, `require-devDependencies`, `require-devEngines`, and `require-scripts` apply to private packages as well. JSON has no disable comments, so an application's manifest cannot pass.
- **A bracketed URL stops the run.** In a Markdown file, a URL or email address in square brackets, such as `See [https://example.com].` or `[me@example.com]`, makes five rules of `@eslint/markdown` 8.0.3 throw "Custom getLoc() method must be implemented in the subclass": `no-bare-urls`, `no-invalid-label-refs`, `no-missing-label-refs`, `no-reference-like-urls`, and `no-space-in-emphasis`. ESLint stops for every file. 8.0.3 is the latest version, with `@eslint/plugin-kit` 0.7.3, so the choices are an upstream fix or turning the five rules off.
- **`eslint --fix` cannot remove a blank line inside a doc comment.** `perfectionist/sort-modules` counts the blank lines inside a documentation comment between two members of the same group, such as a paragraph break in the comment of a function that follows another function, and reports "Extra spacing". Its fix leaves the comment alone, so ESLint reports circular fixes and the problem stays. `unicorn/no-asterisk-prefix-in-documentation-comments` makes every paragraph break in a doc comment an empty line. The formatting test fails with such a file, so its unfixed files leave the case out.
- **Global declaration files.** A declaration file without imports or exports, such as the `vite-env.d.ts` that Vite generates, is reported by `import-x/unambiguous`, and its `/// <reference types="vite/client" />` by `@typescript-eslint/triple-slash-reference`. The module form, `declare global` with `export {}`, passes.
- **A type-aware rule outside the type-aware blocks.** `unicorn/no-non-function-verb-prefix`, new in unicorn 74, declares that it needs type information and is on in every source, because `enableAllRules` turns it on. It does nothing in a file without type information, so it is harmless; `type-information.test.ts` lists it as an exception. Moving it to a unicorn type-aware block would change the snapshots.

#### For stage 5

- **The README examples.** The Documentation row of the stage 4 gate moved here. `tests/package/install.test.ts` already has real-install consumers, a lint helper for the consumer's CLI, and a TypeScript check; the harness can write each copyable example as `eslint.config.js`, type-check it with `checkJs`, and lint the fixtures with it. Snippets that must not run, such as the 0.1.0 options in the migration notes, need a marker that the harness skips.
- **The README.** It should say that Prettier formats Svelte components only with `prettier-plugin-svelte`, and it cannot promise what the findings above rule out until they are decided: typed linting of React components, a clean manifest for an application, and Markdown with bracketed URLs.
- **References to this plan.** `tests/fixtures/README.md` and the comment on `lintFixtures` in `tests/policy/fixtures.test.ts` point to the stage 4 findings here. If `docs/rewrite/` is removed, they need another home for that record.

### Stage 5: documentation and release candidate

1. The README is rewritten: options and defaults, supported file types, peers per framework, automatic detection, limits (no CommonJS, React and Svelte coverage), and migration notes from 0.1.0.
2. Every README example runs as a consumer scenario. This is also the Documentation row of the stage 4 gate, which the maintainer moved here on 7 October 2026.
3. `npm run release:check` on Node 24 and 26.
4. `docs/rewrite/` is removed or reduced to a short record, and the rewrite section of `CLAUDE.md` is deleted.

Gate: the candidate is ready for review. Versioning and publishing are separate decisions.

## Out of scope

New plugins or integrations (Vue, Astro, YAML, TOML, JSDoc, Vitest, SonarJS, `eslint-plugin-svelte`, React JSX and accessibility rules), CommonJS support, subpath exports, and rule choices beyond those listed in stage 3.
