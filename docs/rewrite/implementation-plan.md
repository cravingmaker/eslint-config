# Rewrite implementation plan

Status: agreed on 6 October 2026. Stage 0 is done; it landed in the pull request that added this document. Stages 1–5 are not started.

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

Two decisions are still waiting for the maintainer. Until they are answered, follow the recommendation:

1. **`environments` and `globals`.** 0.1.0 ships them as two top-level options applied to every JavaScript, TypeScript, and Svelte block. Recommendation: keep them as they are.
2. **`plugins`.** Recommendation: remove it. Extra plugins belong in `userConfigs`, where they can be scoped with `files`.

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
  environments?: GlobalEnvironment[]; // see pending decision 1
  globals?: Linter.Globals; // see pending decision 1

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

Mapping from the current options: `tsTypeChecked` becomes `typescript.typeChecked`, `tsconfigRootDir` becomes `typescript.tsconfigRootDir`, `reactRefreshVariant` becomes `react.refresh`, and each `rules.<group>` becomes that feature's `overrides`.

### Internal builders

Each feature is one function, `(options, context) => Linter.Config[] | Promise<Linter.Config[]>`. `context` carries the project root, the consumer's declared dependencies, the resolved globals, and the type-aware scope (`files` and `ignores`, or `undefined` when typed linting is off). Features that own type-aware rules (`typescript`, `functional`, `node`) use that scope for their own type-aware block.

Blocks are named `@cravingmaker/eslint-config/<feature>/<part>`, where the part is `setup` (plugin registration, no `files`), `parser`, `rules`, or `rules-type-aware`. A feature's user overrides are merged at the end of its `rules` block.

### Composition order

1. `@cravingmaker/eslint-config/ignores`.
2. `javascript`, then the code-quality plugins: `comments`, `node`, `security`, `imports`, `unusedImports`, `promise`, `regexp`, `unicorn`, `functional`, `perfectionist`.
3. `typescript`: parser, core → `@typescript-eslint` replacements, rules, type-aware rules.
4. Frameworks: `react`, `svelte`, `express`.
5. Formats: `html`, `json`, `packageJson`, `markdown`.
6. `@cravingmaker/eslint-config/overlaps`.
7. `@cravingmaker/eslint-config/exceptions/*`.
8. `userConfigs`, in the order given.

The JavaScript and code-quality rule blocks use one source glob covering JavaScript and TypeScript, so the TypeScript block no longer repeats those rule lists. A rule that needs a JavaScript AST is never emitted without `files`.

### Overlap table

`src/overlaps.ts` lists each owner and the rules it replaces. A replaced rule is written as enabled in its own feature's rule map. The factory turns it off in the `overlaps` block when the owning feature is enabled, the replaced rule's feature is enabled, and the user has not overridden that rule explicitly.

| Owner           | Replaced rules                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `regexp`        | `no-empty-character-class`, `no-invalid-regexp`, `no-useless-backreference`                                       |
| `unusedImports` | `no-unused-vars`, `@typescript-eslint/no-unused-vars`                                                             |
| `imports`       | `no-duplicate-imports`, `n/file-extension-in-import`, `n/no-extraneous-import`, `n/no-missing-import`             |
| `unicorn`       | `no-negated-condition`, `no-nested-ternary`, `no-warning-comments`, `n/no-process-exit`, `n/prefer-node-protocol` |
| `perfectionist` | `sort-imports`, `sort-keys`, `import-x/first`, `import-x/order`, `@typescript-eslint/member-ordering`             |

The list was read from an older commit and must be re-derived from the current rule maps when stage 2 reaches it. Core → `@typescript-eslint` replacements stay in `configs/typescript/replacements.ts`, because both sides belong to one feature. Rules that are off because Prettier owns them stay `"off"` in their rule map with the reason. `tests/policy/overlaps.test.ts` reads the same table and checks that exactly one side is active, with the owner on and with the owner off.

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

One problem surfaced and is unresolved. `functional/prefer-immutable-types` reports different results depending on which files are linted together. On the baseline, `eslint .` passes, but `eslint tests/rule-coverage.test.ts` alone reports two errors, so the pre-commit hook can reject a commit that touches only that file. The helpers in `tests/rule-overlaps.test.ts` were rewritten to avoid the affected parameter types. The rule's `parameters: ReadonlyDeep` option is decided in stage 3.

### Stage 1: foundation

1. `scripts/typegen.ts` runs `pluginsToRulesDTS` from `eslint-typegen` over the core rules and every plugin, including the optional peers. It writes `src/typegen.d.ts`, which is ignored by git and produced by `npm run gen`. `gen` runs before `build`, `typecheck`, and `validate`. The file is not committed because Dependabot pull requests cannot regenerate it.
2. `types.ts`: `Rules` from the generated types, plus `FeatureOptions`, `Options`, and `Context`.
3. Existing rule maps are typed as `Rules`. Any option error this exposes is fixed in its own commit if it changes a snapshot.
4. `options.ts`, `context.ts`, `utilities/import-peer.ts`, and `utilities/all-rules.ts`. `createConfig` does not use them until stage 2.
5. `npm run inspect`, using `@eslint/config-inspector` as a dev dependency.

Gate: snapshots unchanged; `attw` and Publint still pass with the generated types; the root import works without optional peers.

### Stage 2: extraction with identical results

One commit per group. No commit may change a snapshot.

1. Code-quality plugins: `comments`, `unicorn`, `promise`, `regexp`, `functional`, `node`, `security`, `unused-imports`, `imports` (with the resolver), `perfectionist`. `src/rules/misc/` and `src/rules/node/` disappear.
2. `typescript`: the 790-line file becomes a folder with the parser, replacements, rules, and type-aware rules separated. The list of rules disabled for untyped linting disappears, because type-aware rules are emitted only in the type-aware block.
3. Formats: `html`, `json`, `package-json` (with `enforce-package-type`), `markdown`.
4. Frameworks: `react`, `svelte`, `express`. Their rule maps become plain data and no longer need dynamic imports.
5. `factory.ts` takes over composition and `index.ts` keeps only exports. The public options change in this commit. The snapshot suites change their option spelling and enable frameworks explicitly; the snapshot files do not change.
6. `overlaps.ts`: overlap `"off"` entries move from the rule maps into the table.

Gate: snapshots identical to stage 0. `src/rules/`, `src/options/`, and `src/utilities/plugin-rules.ts` are gone. `src/index.ts` contains only exports.

### Stage 3: behavior changes

One commit per item. Each item has a test that fails before the change, and its snapshot diff is reviewed as part of the commit.

| Item                      | Change                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Peer loading (F1)         | An enabled feature with a missing peer fails with an install message instead of being skipped                             |
| Detection (F8)            | `"auto"` reads the dependencies declared at the project root, not plugin presence. Refresh is off without a known bundler |
| Hooks scope (F3)          | Hooks rules apply to `.js` and `.ts`, not only JSX and TSX                                                                |
| Svelte scripts (F4)       | JavaScript and TypeScript rules apply to the script in `.svelte` files                                                    |
| CommonJS (F6)             | `.cjs` and `.cts` support is removed and the README says so                                                               |
| Type-aware scope (F9)     | `filesTypeAware` and `ignoresTypeAware` work; typed sources and untyped scripts can be separated                          |
| Feature toggles (F7)      | Tests for `false`, `true`, and object on every feature, including rule recovery through the overlap table                 |
| File-role exceptions      | `exceptions.ts`, with the initial content below                                                                           |
| Formatter ownership (F11) | HTML layout rules are turned off; the formatter test below is added                                                       |
| Parameter immutability    | Decide the `functional/prefer-immutable-types` options whose results are unstable                                         |

Initial content of `exceptions.ts`, taken from the suppressions in this repository:

- Test files (`**/*.{test,spec}.*`): `functional/no-expression-statements` and `functional/no-return-void` off. There are 60 such suppressions today.
- Config files (`**/*.config.*`): `import-x/no-default-export` off. There are 3 such suppressions today.

The matching suppressions are removed from the repository in the same commit. Further exceptions are added only with similar evidence.

Formatter test: `eslint-config-prettier` as a dev dependency; no enabled rule may be one that it turns off, apart from a short list of exceptions with reasons. `@html-eslint` layout rules are outside its coverage and are decided by hand.

Gate: every open P1 finding has a fixture that fails before and passes after.

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
