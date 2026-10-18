# Dependency compatibility review

Reviewed on 18 October 2026 against `main` at `d07b0366e7ceeae2d447b196bc50e9672423e038`.

Ran `npx --yes npm-check-updates` in the original checkout without `-u`. It found 16 updates after applying `.npmrc`'s seven-day minimum release age.

## Applied updates

Applied the initial nine approved updates on 18 October 2026, followed by the Security Stage 1, Vitest Stage 2, and Unicorn Stage 3 upgrades described below. Each row marked **Updated** records its previous version, reviewed candidate, and installed version. The installed versions were checked against `package.json`, `package-lock.json`, and `node_modules` after `npm ci --ignore-scripts`.

The initial batch updates three runtime dependencies and six development dependencies. Security and Unicorn add two runtime dependency upgrades; Vitest and its UI add two development dependency upgrades. Thirteen of the 16 reviewed candidates are installed. The other three candidates remain unapplied. The Node 24 type patch alternative also remains outside these approved updates.

## Review results

| Dependency                                                                                                                      | Baseline → reviewed candidate | Installed version | Status       | Finding                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| [@eslint/json](https://github.com/eslint/json/releases/tag/json-v2.1.1)                                                         | 2.1.0 → 2.1.1                 | `2.1.1`           | Updated      | JSON parser and autofix fixes; rule inventory unchanged.                                                   |
| [prettier](https://github.com/prettier/prettier/releases/tag/3.9.10)                                                            | 3.9.9 → 3.9.10                | `3.9.10`          | Updated      | Fixes Markdown table parsing performance; formatting check passed.                                         |
| [svelte](https://github.com/sveltejs/svelte/releases/tag/svelte%405.57.2)                                                       | 5.57.1 → 5.57.2               | `5.57.2`          | Updated      | Compiler/runtime fixes; Svelte integration checks compatible.                                              |
| [eslint](https://github.com/eslint/eslint/releases/tag/v10.12.0)                                                                | 10.11.0 → 10.12.0             | `10.12.0`         | Updated      | Core fixes and API additions; remains inside the published peer range.                                     |
| [eslint-plugin-n](https://github.com/eslint-community/eslint-plugin-n/releases/tag/v18.4.1)                                     | 18.3.0 → 18.4.1               | `18.4.1`          | Updated      | Resolver and Node rule fixes; no added or removed rules.                                                   |
| [globals](https://github.com/sindresorhus/globals/releases/tag/v17.13.0)                                                        | 17.12.0 → 17.13.0             | `17.13.0`         | Updated      | Adds three browser speech-recognition globals; Node globals unchanged.                                     |
| [svelte-eslint-parser](https://github.com/sveltejs/svelte-eslint-parser/releases/tag/v1.9.0)                                    | 1.8.1 → 1.9.0                 | `1.9.0`           | Updated      | Improves JSDoc and template narrowing; published peer range still fits.                                    |
| [@cravingmaker/prettier-config](https://github.com/cravingmaker/prettier-config/releases/tag/v0.3.2)                            | 0.3.1 → 0.3.2                 | `0.3.2`           | Updated      | Dependency maintenance; formatter options and peer requirements unchanged.                                 |
| [tsdown](https://github.com/rolldown/tsdown/releases/tag/v0.23.1)                                                               | 0.23.0 → 0.23.1               | `0.23.1`          | Updated      | Build fixes; compatible with the Node and TypeScript versions in this repo.                                |
| [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security/releases/tag/eslint-plugin-security-v4.2.0) | 4.0.1 → 4.2.0                 | `4.2.0`           | Updated      | Classifies security/detect-invisible-characters as warn; uses bundled TypeScript declarations.             |
| [vitest](https://vitest.dev/guide/migration/)                                                                                   | 4.1.11 → 5.0.3                | `5.0.3`           | Updated      | Migrates the watcher to createVitest(options); paired with UI 5.0.3.                                       |
| [@vitest/ui](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3)                                                          | 4.1.11 → 5.0.3                | `5.0.3`           | Updated      | Upgraded with Vitest 5.0.3; exact peer relationship and authenticated UI startup verified.                 |
| [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn/releases/tag/v77.0.0)                             | 74.0.0 → 77.0.0               | `77.0.0`          | Updated      | Policy, repository lint, and snapshots migrated; final release and minimum-peer compatibility checks pass. |
| [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v8.71.1)                                | 8.70.0 → 8.71.1               | `8.70.0`          | Keep current | Reproduced false unused-variable reports and 20 fixture/formatting failures. Keep 8.70.0 for now.          |
| [typescript](https://registry.npmjs.org/typescript-eslint/8.71.1)                                                               | 6.0.3 → 7.0.2                 | `6.0.3`           | Keep current | Peer resolution fails: typescript-eslint@8.71.1 supports TypeScript >=4.8.4 <6.1.0.                        |
| [@types/node](https://www.npmjs.com/package/@types/node/v/26.6.5)                                                               | 24.19.0 → 26.6.5              | `24.19.0`         | Keep current | Typecheck passes, but 26.x types allow APIs beyond the Node 24 minimum. Prefer 24.19.2; it typechecks.     |

## Validation

The nine recommended updates passed `npm run validate` on the exact supported minimum, Node 24.15.0: formatting, build, TypeScript checking, zero-warning ESLint, all 1,522 tests in 59 files, Publint, and Are the Types Wrong. No snapshots or source files were changed to make these checks pass.

A separately installed tarball also passed `npm ls --all` and the CI minimum-peer integration checks on Node 24.15.0, with ESLint 10.4.0 and all advertised minimum optional peer versions.

After applying this batch in the contributor checkout, `npm run validate` also passed on Node 24.22.0, including all 1,522 tests in 59 files. `npm audit --audit-level=low` reported zero vulnerabilities. The review document passed the repository formatting and Markdown lint checks.

## Security Stage 1 follow-up

Implemented Stage 1 of [the deferred upgrade plan](DEPENDENCY_UPGRADE_PLAN.md): Security 4.2.0, `security/detect-invisible-characters: "warn"`, and removal of `@types/eslint-plugin-security`. Its unused transitive `@types/eslint` package also leaves the lockfile. The existing 14 security rule settings are unchanged.

Eight regression tests distinguish literal U+3164/U+FFA0 characters from visible escape sequences in JavaScript and TypeScript source and comments, and verify warning severity. All 46 focused security, policy, and generated-type tests passed on Node 24.22.0. The effective-policy review confirms that only the new warning and its rule/warning totals change in 17 source snapshots; the other 17 snapshots are unchanged.

After a fresh `npm ci --ignore-scripts`, Stage 1 passed `npm run release:check` on Node 24.22.0: zero audit vulnerabilities, formatting, build, typechecking, Knip, zero-warning ESLint, all 1,530 tests in 60 files, Publint, Are the Types Wrong, and the package dry run. The final documentation update also passed formatting and Markdown lint. Node 24.15.0, Node 26, minimum-peer integration, and Linux CI were not rerun for this follow-up; the initial nine-update batch's checks above remain historical.

## Vitest Stage 2 follow-up

Implemented Stage 2 of [the deferred upgrade plan](DEPENDENCY_UPGRADE_PLAN.md): Vitest and `@vitest/ui` are both pinned to 5.0.3. `npm ls vitest @vitest/ui` confirms their exact peer relationship after a fresh `npm ci --ignore-scripts`. The watcher test now uses `createVitest(options)`; its CLI filters, reporters, worker limits, filesystem mappings, and cleanup are unchanged.

Both watcher scenarios passed on Node 24.22.0, including removing and recreating `dist`, and the watcher file passed zero-warning lint. The existing UI commands started on separate ports with representative filters: eight security tests passed in the regular UI and three contract tests passed in the package UI. Their token-authenticated entry URLs issued cookies and served the HTML, JavaScript, CSS, and icons successfully. Both UI processes were stopped after verification.

Stage 2 passed `npm run release:check` on Node 24.22.0: zero audit vulnerabilities, formatting, build, typechecking, Knip, zero-warning ESLint, all 1,530 tests in 60 files, Publint, Are the Types Wrong, and the package dry run. The final documentation update passed formatting and Markdown lint. The Stage 1 policy and snapshots remain unchanged, and the lockfile changes for Stage 2 affect development dependencies only. Node 24.15.0, Node 26, minimum-peer integration, and Linux CI were not rerun for this follow-up.

## Unicorn Stage 3 follow-up

Implemented Stage 3 of [the deferred upgrade plan](DEPENDENCY_UPGRADE_PLAN.md): Unicorn is pinned to 77.0.0, with the locally declared rule maps split into `rules/recommended.ts` and `rules/other.ts`. All 374 non-deprecated rules are classified. The 38 new rules comprise 29 errors and nine disabled entries, each disabled entry documenting its reason. The JavaScript/TypeScript/Svelte file scopes and language ownership are unchanged.

The broader `no-unused-builtin-method-return` replaces deprecated `no-unused-array-method-return`, and deprecated `prefer-explicit-viewport-units` is removed. Bare `require-frontmatter-fields: "off"` resolves the JavaScript configuration error. Existing behavior is preserved through the reviewed explicit options, including nested-continue checks, short-body exclusions, conditional mutation handling, simplified negations, and filename directory roots. All other 329 existing rule entries retain their settings. Rule totals, automatic-fix counts, and suggestion counts reflect the installed metadata.

On Node 24.22.0, build, typecheck, Knip, zero-warning lint of the three Unicorn policy files, and all 1,071 focused tests in 15 files passed. These tests cover Unicorn behavior, complete rule coverage and options, deprecated rules, explicit overrides, overlaps, language separation, generated declarations, fixtures, formatting, file scopes, and feature toggles. The effective-policy comparison against the Stage 2 checkpoint shows only approved Unicorn changes in 15 source scenarios; the other 19 scenarios, including Markdown, JSON, and HTML, are unchanged. The existing snapshot files retain their Stage 2 contents pending Stage 5 review and updates.

A fresh `npm ci --ignore-scripts` installed the exact target versions and reported zero audit vulnerabilities. The subsequent build, repository formatting check, and zero-warning lint of the policy files and both dependency documents passed.

Full repository lint reports the planned 70 errors across 33 existing files and zero warnings: 37 wrapped-comment findings, 13 unnecessary flat-map findings, nine default-parameter findings, three each for top-level side effects, unnecessary parameters, and ternaries, plus one each for minimal ternaries and unnecessary Set construction. None are in the split policy files. Stage 4 owns these source migrations; Stage 5 owns the additional characterization tests, snapshot updates, and final release/runtime/minimum-peer validation. The Stage 1 and Stage 2 full validation results above predate the Unicorn upgrade.

## Unicorn Stage 4 follow-up

Implemented Stage 4 of [the deferred upgrade plan](DEPENDENCY_UPGRADE_PLAN.md): all 70 repository lint findings are resolved through changes in 31 code files. The 37 block-comment fixes preserve their text, scalar `flatMap` results retain filtering and flattening behavior, map keys feed `Set.union` directly, and equivalent branches are simplified. Three internal test helpers now use their existing constant inputs directly. Public signatures, test registration and assertion counts, dependencies, and published rule settings are unchanged.

Diagnostic formatters retain nullish handling for ESLint's nullable rule IDs, including the `"fatal"` label. Schema callbacks use explicit defaults and retain their guards for non-object values. The repository-only `repository/tool-configuration` override allows setup calls in exactly `eslint.config.js`, `tsdown.config.ts`, and `vitest.config.ts`. Effective-config checks confirm that other repository files, nested tool configs, and the published configuration keep `unicorn/no-top-level-side-effects` enabled as an error.

Build, typecheck, Knip, repository formatting, and `npm run lint:built` passed on Node 24.22.0; repository ESLint reports zero errors and zero warnings. All 1,482 workspace tests in 58 files passed with `--maxWorkers 1`, excluding the two snapshot-dependent files below. The preceding two-worker run had one watcher assertion failure; both watcher scenarios then passed in isolation and in the one-worker suite. Test assertions, timeouts, and the configured worker limit are unchanged.

All 48 tests in `tests/policy/effective-rules.test.ts` and `tests/scripts/policy-diff/report.test.ts` passed in a temporary copy using the reviewed Stage 3 descriptions as its snapshot baseline, confirming that Stage 4 preserves the published policy in all 34 scenarios. With the tracked snapshots, the report's current-scenarios assertion still detects the pending Unicorn snapshot changes. Stage 5 owns the tracked snapshot refresh and final release/runtime/minimum-peer validation; the complete release gate and remote CI remain pending.

## Stage 5 policy evidence and final validation

Added 14 Unicorn regressions across JavaScript and TypeScript for the frontmatter compatibility fix, preserved nested-continue reporting, discarded array and Set method results, consumed results, and the disabled hex/zip preferences. The disabled-rule cases also enable each rule through a consumer override and require a diagnostic, so their inputs exercise the rules. The eight existing Security regressions continue to verify literal invisible characters, visible escapes, and warning severity. All 107 focused security, Unicorn, coverage, option, deprecation, language-separation, and explicit-policy tests passed on Node 24.22.0.

Reviewed the canonical policy diff against `caf13a218331cd6d0fdfb08933a793e6d8c9c7bb` before updating snapshots. Across the complete upgrade, 17 scenarios change only through the approved Security warning, Unicorn inventory and severities, explicit options, and rule totals; 17 scenarios are unchanged. Stage 5 updates 15 source snapshots, retaining the two Security-only snapshots from Stage 1. All 34 snapshots exactly match the reviewed Stage 3 descriptions, including unchanged Markdown, JSON, and HTML policies. The generated declarations remain ignored and are regenerated by the build.

After a fresh `npm ci --ignore-scripts` for each runtime, `npm run release:check` passed on exact Node 24.15.0 and Node 26.12.0 on macOS arm64 with `NODE_OPTIONS=--max-old-space-size=4096` and `VITEST_MAX_WORKERS=1`: zero contributor audit vulnerabilities, formatting, build, typecheck, Knip, zero-warning lint, all 1,544 tests in 60 files, Publint, Are the Types Wrong, and the package dry run. Worker limits, timeouts, assertions, Node support, and peer ranges in the repository configuration are unchanged. The final installed dependency graph passes `npm ls --all`, with Security 4.2.0, Unicorn 77.0.0, and Vitest/UI 5.0.3.

An independently installed tarball passed the existing CI minimum-peer procedure on Node 24.15.0: ESLint 10.4.0, HTML React/Svelte plugins 0.60.0, Express Security 1.2.0, React Hooks 7.1.0, React Refresh 0.5.0, React 19.0.0, Svelte 5.0.0, and Svelte parser 1.6.0. `npm ls --all` passed, all five optional plugin integrations loaded, and real JSX, TypeScript Svelte, and server sources linted without fatal messages.

An additional audit of that consumer reports seven vulnerable package entries: three high, one moderate, and three low, including propagated parent-package entries. Its graph resolves `deepmerge-ts@7.1.6` through unchanged `eslint-plugin-functional@10.0.1`, `katex@0.16.47` through unchanged `@eslint/markdown@8.0.3` / `micromark-extension-math@3.1.0`, and the deliberately installed Svelte 5.0.0 minimum. The [DeepmergeTS advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) is patched in 8.0.0 and the [KaTeX advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7) in 0.18.2.

The repository forces DeepmergeTS 8.0.2 and KaTeX 0.18.2, but [npm only applies overrides from the consuming project's root package](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides). Contributor audit success therefore does not establish a clean consumer audit. These direct dependency versions, overrides, and peer ranges are unchanged from the baseline; consumer dependency remediation remains separate from this four-package migration.

Both existing UI commands started with matching Vitest/UI 5.0.3 on Node 24.15.0 and temporary CLI filters: 36 security/Unicorn tests in the regular UI and three contract tests in the package UI passed. Their authenticated entry URLs issued cookies and served HTML, JavaScript, CSS, and icons over HTTP successfully. Both processes exited cleanly and their ports are closed. The complete upgrade also passed the final diff, formatting, and zero-warning documentation lint checks.

## Deferred updates

TypeScript ESLint 8.71.1 caused 20 fixture/formatting test failures through false `unused-imports/no-unused-vars` reports on runtime-used variables. Reverting only `typescript-eslint` to 8.70.0 made all 235 tests in those two files pass. It also introduces `@typescript-eslint/no-unsafe-enum-assignment`, which needs an explicit policy entry before a future upgrade.

TypeScript 7.0.2 failed a strict peer-resolution install with `ERESOLVE`, because `typescript-eslint@8.71.1` requires TypeScript `>=4.8.4 <6.1.0`. Keep TypeScript 6.0.3 until the lint stack supports TypeScript 7.

`@types/node@26.6.5` typechecked after a fresh build, but its API declarations target a newer major than this package's Node 24 minimum. `npx npm-check-updates --filter @types/node --target minor` instead proposes 24.19.2; that version passed typechecking on Node 24.15.0. This alternative was checked separately from the nine-update batch.

## Release cooldown

Cooldown-excluded releases: ESLint 10.13.0, TypeScript ESLint 8.71.2, Unicorn 78.0.0, and Vitest / @vitest/ui 5.0.5.

## Verification scope

The original nine-update compatibility review ran in temporary copies. The Stage 5 section records the final four-package migration's local release checks on Node 24.15.0 and 26.12.0, minimum-peer compatibility, and UI checks. Remote Linux CI has not been run for this implementation. The independent consumer audit findings above remain open despite the clean contributor audits.

The findings above record the versions available at review time. Rerun `npx npm-check-updates` and the compatibility checks before adopting any deferred version.
