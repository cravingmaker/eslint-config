# Fix before release

What remains before 0.2.0 is released. Work the items in order, one pull request each unless an item says otherwise; the last item releases with the refined notes. Each problem was reproduced on 24 October 2026 against `main` at `e2cb99a`. [ROADMAP.md](ROADMAP.md) holds the work that can wait.

The release commit deletes this file; see item 8.

## 1. Keep `n/no-sync` off in Svelte rune modules

**Problem.** With the default options, in a project that declares `svelte`, a `.svelte.js` module that calls a function whose name ends in `Sync` inside a function stops ESLint for every file:

```text
You have used a rule which requires type information, but don't have parserOptions set to generate type information for this file.
```

svelte-eslint-parser hands rune modules to typescript-eslint's parser, and `n/no-sync` asks that parser for type information. `node/rules-typescript` turns the rule off in TypeScript files and Svelte components only, and `tests/policy/type-information.test.ts` lists the files where the rule needs type information as `.mts`, `.svelte`, `.ts`, and `.tsx`, without `.svelte.js`. With `n/no-sync` off, the module lints without a message. A rune module that calls `flushSync()` from `svelte` is enough:

```js
import { flushSync } from "svelte";

export const flush = () => {
  flushSync();
};
```

**Change.** Turn `n/no-sync` off in the JavaScript rune modules that the Svelte feature parses, as in TypeScript files without type information. While the Svelte feature is off, or leaves the module out, a `.svelte.js` file is plain JavaScript and keeps the rule. Add `.svelte.js` to the list of the type-information test.

**Done when.** The module above lints without throwing, `n/no-sync` still reports the call in a plain `.js` file and in a `.svelte.js` file that the Svelte feature does not lint, and any changed snapshot line concerns a `.svelte.js` file only.

**Title.** `fix: keep n/no-sync off in Svelte rune modules`

## 2. Lint `jsconfig.json` and Dev Container files as JSONC

**Problem.** VS Code reads `jsconfig.json` as JSON with comments, and the Dev Container specification allows comments in `.devcontainer.json` and in `.devcontainer/<name>/devcontainer.json`. The `json` feature lints these three as JSON, where a comment is `Parsing error: Unexpected character '/' found.` The JSONC block matches `**/*.jsonc`, `**/tsconfig*.json`, `**/.vscode/*.json`, and `**/.devcontainer/*.json`. 0.1.0 has the same gap, so this is not a regression; a commented `jsconfig.json` still makes `eslint .` fail.

**Change.** Add `**/jsconfig*.json`, `**/.devcontainer.json`, and `**/.devcontainer/*/devcontainer.json` to `jsoncFiles` in `src/globs.ts`, and to the JSONC list of the README. The JSON block already leaves out the files of the JSONC block.

**Done when.** `tests/policy/language-separation.test.ts` resolves the three names, with a comment, to `json/jsonc`, and `json.overrides` do not reach them.

**Title.** `fix: lint jsconfig and Dev Container files as JSONC`

## 3. Keep the policy's options for a severity-only feature override

**Problem.** A feature's `overrides` replace the whole entry of a rule, because each builder spreads them over its rule map. An override that gives only a severity therefore drops the policy's options and brings back the rule's own defaults. In a user config, the same entry keeps the policy's options, because ESLint merges a severity-only entry with the blocks before it. 432 of the 1,166 enabled entries have options. Resolved today:

| Override                                                                           | As a feature override                                                                        | As a user config                |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------- |
| `javascript`: `"no-restricted-globals": "warn"`                                    | `[1]`: no global is restricted, so the `Buffer` global is no longer reported                 | The restriction, as warning     |
| `react`, with `refresh: "vite"`: `"react-refresh/only-export-components": "error"` | `[2]`: `allowConstantExport` is gone, so a constant exported next to a component is an error | The Vite variant, as error      |
| `typescript`: `"@typescript-eslint/no-floating-promises": "warn"`                  | `[1]`: the rule's own `ignoreIIFE: false`, so an async IIFE is reported                      | The policy's `ignoreIIFE: true` |
| `unicorn`: `"unicorn/template-indent": "warn"`                                     | The rule's own options, which check the `gql` and `html` templates that Prettier formats     | The policy's options            |

The README's own example, `react: { overrides: { "react-hooks/exhaustive-deps": "warn" } }`, drops the options as well; it works only because they match the rule's built-in behavior.

**Decision.** Option A, confirmed by the maintainer on 24 October 2026: feature overrides merge as a later ESLint config object does. They are new in 0.2.0, so their meaning is cheapest to settle before users depend on it.

**Change.** A severity-only entry, such as `"warn"`, `1`, or `["warn"]`, keeps the options of the policy. An entry with options replaces them, without a deep merge, and `"off"` works as before. Apply this wherever a builder spreads `overrides`, `overridesTypeAware`, `overridesJsonc`, or `overridesJson5`, and keep the type-aware split of `typescript`, `functional`, `node`, and `sonarjs` working. Say in "Feature values" of the README how an override merges.

**Done when.** Tests cover each form: a severity-only override keeps the options in a feature's base block, in a type-aware block, and in each JSON language; an override with options replaces them; and `"off"`, and enabling a disabled rule, behave as before. Every disabled entry is a bare `"off"`, so `"error"` still enables such a rule with its own defaults. No policy snapshot changes, because no snapshot scenario has overrides.

**Title.** `fix: keep the policy's options for a severity-only override`

## 4. Explain the audit findings that consumers inherit

**Problem.** In a project that installs only this package and ESLint, `npm audit` reports six findings, three high and three low, and npm offers no fix:

- `deepmerge-ts` below 8.0.0, through `eslint-plugin-functional` 10.0.1: [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), high, stack exhaustion when merging recursive object graphs.
- `katex` below 0.18.2, through `micromark-extension-math` 3.1.0 and `@eslint/markdown` 8.0.3: [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7), low, existing prototype pollution can bypass trust restrictions.
- Their parents: `eslint-plugin-functional`, `@eslint/markdown`, `micromark-extension-math`, and `@cravingmaker/eslint-config` itself.

The two plugins are at their latest releases. This repository's `overrides` force `deepmerge-ts` 8.0.2 and `katex` 0.18.2, which is why its own audit and CI report nothing, but npm applies `overrides` from the root project only. Linting reaches neither problem: eslint-plugin-functional merges only its schemas and rule options, and `@eslint/markdown` loads KaTeX without rendering anything. Every published version since 0.0.4 is affected.

**Change.** Add a known issue to the README, and to the release notes of item 8: why the findings appear, why linting does not reach them, and the `overrides` that this repository runs its tests with, for a project that wants a clean audit:

```json
{
  "overrides": {
    "deepmerge-ts": "8.0.2",
    "micromark-extension-math@3.1.0": {
      "katex": "0.18.2"
    }
  }
}
```

The upstream follow-up is in the roadmap. Items 4 to 6 change documentation only and can share one pull request.

**Title.** `docs: explain the audit findings that consumers inherit`

## 5. List the policy changes in the migration notes

**Problem.** "Migrating from 0.1.0" in the README covers the options and some defaults, but not the policy changes that make most code that passed 0.1.0 fail. 0.1.0 required `count += 1` and `value ||= fallback`, allowed `count++` and function declarations, and asked for concise arrow bodies; 0.2.0 rejects all of them. The `stylistic` and `sonarjs` features are new and on by default. Nothing in that section names the four bundled `@cravingmaker/` rules.

**Change.** Add these changes to "Behavior" under "Migrating from 0.1.0", each with its rule IDs and a link to the README section that describes it, following the "Upgrading from 0.1.0" list of item 8.

**Title.** `docs: list the policy changes since 0.1.0`

## 6. Describe the Release Please flow

**Problem.** "Releases" in `CONTRIBUTING.md` asks a maintainer to update `package.json` and `package-lock.json`, create a `vX.Y.Z` tag, and publish a GitHub Release by hand. Releases go through Release Please instead: it keeps the release pull request up to date on every push to `main`, and merging that pull request creates the tag and the GitHub Release, which runs the publishing workflow.

**Change.** Describe that flow: `npm run release:check` before the merge, and only the maintainer merges. Say where the notes come from: the GitHub Release takes them from the body of the release pull request, and `CHANGELOG.md` from its branch. Release Please rewrites both on every push to `main`, so edited notes go in after the last push and before the merge.

**Title.** `docs: describe the Release Please flow`

## 7. Name the audit regressions by what they check

**Problem.** The deleted audit records named decisions and stages by IDs that tests and documents still use. These include test names such as `D8.10 inherited flags` in `tests/policy/rule-ownership.test.ts` and `D1:` to `D19:` in `tests/policy/fix-convergence.test.ts`. They also include `Stage 5` and `Stage 6` in `tests/package/install.test.ts` and `P10's three-option compiler contract` in `tests/package/readme.test.ts`. Others are the `D3` describe blocks of `tests/configs/core/function-style.test.ts` and `tests/policy/function-layout.test.ts`, "the audit selector" in `function-style.test.ts`, and a `D8.5 and D8.10` comment in `tests/policy/overlaps.test.ts`. The last are `D1/D2`, `D3`, and `D8` in "Things to know" of `CONTRIBUTING.md`, and `(P10)` in `tsconfig.json`. Without the records, these IDs explain nothing.

**Change.** Name what each case checks instead, such as `RegExp execution: inherited global flags`. `tests/policy/fix-convergence.test.ts` selects its function-layout samples with `name.includes("D3")`; give those samples an explicit property instead. The policy does not change.

**Done when.** No test, comment, or document uses the audit IDs, the tests pass, and `npm run policy:diff -- --base <entry SHA>` reports every snapshot unchanged.

**Title.** `test: name the audit regressions by what they check`

## 8. Release with the refined notes

Release Please regenerates the body and the branch of the release pull request, [#63](https://github.com/cravingmaker/eslint-config/pull/63), on every push to `main`. The GitHub Release takes its notes from that body when the pull request is merged, and `CHANGELOG.md` comes from the branch. So:

1. Merge items 1 to 7, and wait for the Release Please run of the last merge to update #63. Check that CI passes on `main` and on #63.
2. Build the notes from the draft below and the sections that Release Please generated, with the corrections below.
3. Replace the notes in the body of #63: the text between its first and last `---` lines, which must start with the `## [0.2.0](…)` heading, as Release Please's parser requires. On the branch of #63, commit the same text to the 0.2.0 section of `CHANGELOG.md`, and delete this file in that commit.
4. The maintainer merges #63 before anything else lands on `main`; another push to `main` rewrites the body and the branch, and step 3 must be repeated. Release Please then creates the `v0.2.0` tag and the GitHub Release, and the publishing workflow publishes to npm with provenance.
5. Check the GitHub Release, the publishing workflow, and `npm view @cravingmaker/eslint-config@0.2.0`.

Corrections to the generated sections:

- In "⚠ BREAKING CHANGES", replace "each declared peer needs metadata with an explicit `optional` boolean, including `optional: false` for required peers.", which comes from a commit footer and has no link, with "require `peerDependenciesMeta` with an explicit `optional` for every declared peer ([#130](https://github.com/cravingmaker/eslint-config/issues/130))".
- Remove #80 and #90. #111 replaced the overlap blocks that both changed, so they describe no behavior of 0.2.0.
- Reword #67 as "keep the import resolver within the files of the imports feature"; its overlap half is gone as well.
- Reword #133 as "warn on size and complexity limits, omit deprecated rules, ignore `.next/` and `.svelte-kit/`, and reject `++`, `--`, and compound assignments", and #134 as "publish without source maps": its Vitest update changes development dependencies only.
- Add a "Dependencies" section, because `chore(deps)` commits do not appear in the generated sections. Take it from `git diff v0.1.0 -- package.json`. On `e2cb99a`, it adds `@stylistic/eslint-plugin` 5.10.0 and `eslint-plugin-sonarjs` 4.2.2. It updates `@eslint/json` 2.1.0 → 2.1.1, `eslint-plugin-n` 18.3.0 → 18.4.1, `eslint-plugin-package-json` 1.9.0 → 1.10.1, `eslint-plugin-perfectionist` 5.11.1 → 5.12.1, `eslint-plugin-regexp` 3.2.0 → 3.3.1, `eslint-plugin-security` 4.0.1 → 4.2.0, `eslint-plugin-unicorn` 74.0.0 → 77.0.0, `globals` 17.12.0 → 17.13.0, and `typescript-eslint` 8.70.0 → 8.71.2. Peer ranges and `engines` are unchanged.

Add the changes of items 1 to 3 to the draft when they land. The draft comes first, above the generated sections:

```markdown
## [0.2.0](https://github.com/cravingmaker/eslint-config/compare/v0.1.0...v0.2.0) (YYYY-MM-DD)

This release rebuilds the config around one option per feature, lints TypeScript with type information by default, and revises most of the rule policy. A project that passes with 0.1.0 can fail with 0.2.0: read [Migrating from 0.1.0](https://github.com/cravingmaker/eslint-config/blob/v0.2.0/README.md#migrating-from-010) before upgrading, and keep the version pinned. The requirements are unchanged: Node.js 24.15.0 or later, ESLint 10.4.0 or later and below 11, and TypeScript below 6.1.

### Upgrading from 0.1.0

- **Options.** Each feature takes `false`, `true`, or an object with `files`, `ignores`, and `overrides`, and some take options of their own, such as `typescript.typeChecked` and `react.refresh`. `tsTypeChecked`, `tsconfigRootDir`, `reactRefreshVariant`, `rules`, and `plugins` are gone: `createConfig()` rejects them, and any other unknown option, with a message that names what replaces them ([#62](https://github.com/cravingmaker/eslint-config/issues/62), [#82](https://github.com/cravingmaker/eslint-config/issues/82)).
- **Typed linting is on by default.** Every TypeScript file that ESLint lints needs a `tsconfig.json` that includes it and sets `strict`, `noImplicitReturns`, and `allowUnreachableCode: false`. `typescript: { typeChecked: false }` turns typed linting off, as in 0.1.0 ([#124](https://github.com/cravingmaker/eslint-config/issues/124)).
- **Frameworks** turn on when the root `package.json` declares `react`, `svelte`, or `express`, not when their plugins are installed. A framework that is on fails with an install message when a plugin that it needs is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68), [#69](https://github.com/cravingmaker/eslint-config/issues/69)).
- **React.** React Refresh is off unless the project declares `next` or `vite` ([#69](https://github.com/cravingmaker/eslint-config/issues/69)), and the hooks rules lint `.js` and `.ts` files as well ([#70](https://github.com/cravingmaker/eslint-config/issues/70)). In typed `.tsx` files, components may have PascalCase names ([#130](https://github.com/cravingmaker/eslint-config/issues/130)).
- **Svelte.** The scripts of components get the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73)). `.svelte.mjs` and `.svelte.mts` files are linted as ordinary modules ([#132](https://github.com/cravingmaker/eslint-config/issues/132)).
- **CommonJS.** `.cjs` and `.cts` files get no rules ([#66](https://github.com/cravingmaker/eslint-config/issues/66)).
- **Two new features**, on by default: `stylistic`, with @stylistic/eslint-plugin, and `sonarjs`, with eslint-plugin-sonarjs ([#119](https://github.com/cravingmaker/eslint-config/issues/119), [#120](https://github.com/cravingmaker/eslint-config/issues/120)).
- **Functions** are arrow functions with block bodies. `@cravingmaker/prefer-arrow-functions` and `arrow-body-style: "always"` replace 0.1.0's free choice between declarations and expressions and its concise bodies (`"as-needed"`). Methods, accessors, constructors, generators, and functions that use their own `this`, `arguments`, or `new.target` keep their form, and the bundled rule reports without fixing ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#129](https://github.com/cravingmaker/eslint-config/issues/129)).
- **Assignments** are explicit: `count = count + 1`, not `count += 1` or `count++`. 0.1.0 required compound assignments; now `operator-assignment` and `logical-assignment-operators` are `"never"`, and `no-plusplus` is on, in `for` loops too ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#133](https://github.com/cravingmaker/eslint-config/issues/133)).
- **Comments and layout.** Multiline documentation comments keep a leading `*` on each line (`@cravingmaker/starred-documentation`), and a blank line follows a function-valued variable declaration. Escapes in regular expressions are uppercase, as in strings ([#128](https://github.com/cravingmaker/eslint-config/issues/128), [#129](https://github.com/cravingmaker/eslint-config/issues/129)).
- **Limits** on size, complexity, parameters, and nesting are stricter than in 0.1.0, and they warn instead of erroring ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#133](https://github.com/cravingmaker/eslint-config/issues/133)).
- **Binary data** uses `Uint8Array`: the `Buffer` global, imports from `buffer` and `node:buffer`, the `Buffer` type, and `new Buffer()` are reported ([#83](https://github.com/cravingmaker/eslint-config/issues/83), [#131](https://github.com/cravingmaker/eslint-config/issues/131)).
- **One owner per check.** Where two rules reported the same code, one of them is now off; "Rules that replace other rules" in the README names each owner. Fixes that could change behavior are off: `@typescript-eslint/prefer-regexp-exec`, and in HTML, the fix that made custom elements self-closing ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#131](https://github.com/cravingmaker/eslint-config/issues/131), [#132](https://github.com/cravingmaker/eslint-config/issues/132)).
- **`package.json`.** A manifest with `exports` must also export `./package.json`, and a manifest that declares `peerDependencies` needs `peerDependenciesMeta` with an explicit `optional` for each peer (`@cravingmaker/require-peer-metadata`) ([#113](https://github.com/cravingmaker/eslint-config/issues/113), [#130](https://github.com/cravingmaker/eslint-config/issues/130)).
- **File roles.** Config files, named `*.config.*`, may default-export a config built at load time, and test files may call functions for their effects ([#65](https://github.com/cravingmaker/eslint-config/issues/65), [#130](https://github.com/cravingmaker/eslint-config/issues/130)). A disable comment for a rule that is now off becomes an "Unused eslint-disable directive" warning.
- **Ignored by default:** `.next/` and `.svelte-kit/` at any depth, besides `dist/`, `build/`, and `coverage/` ([#133](https://github.com/cravingmaker/eslint-config/issues/133)).
- **Package.** The tarball has no source maps ([#134](https://github.com/cravingmaker/eslint-config/issues/134)).

The bundled rules have the `@cravingmaker/` prefix and need no installation. Override each one in the feature that holds it: `prefer-arrow-functions` in `javascript`, `starred-documentation` in `unicorn`, `svelte-function-variable-padding` in `stylistic`, and `require-peer-metadata` in `packageJson`.

### Known issues

- `npm audit` in a project that installs this package reports `deepmerge-ts` through `eslint-plugin-functional`, and `katex` through `@eslint/markdown`. Linting reaches neither problem, and those plugins have no fixed releases yet. [Known issues](https://github.com/cravingmaker/eslint-config/blob/v0.2.0/README.md#known-issues) in the README gives the `overrides` that clear the findings.
- TypeScript 7 is not supported yet: typescript-eslint supports TypeScript below 6.1.
- Five Markdown rules are off until [eslint/markdown#619](https://github.com/eslint/markdown/issues/619) is fixed.
```
