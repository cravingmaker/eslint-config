# Deferred dependency upgrade plan

Status: all five stages are implemented. Final release checks passed locally on Node 24.15.0 and 26.12.0, along with minimum-peer compatibility and both UI commands. The independent consumer audit finding is recorded in [DEPENDENCY_REVIEW.md](DEPENDENCY_REVIEW.md#stage-5-policy-evidence-and-final-validation); remote Linux CI has not been run. Decisions confirmed on 18 October 2026.

Baseline: `caf13a218331cd6d0fdfb08933a793e6d8c9c7bb`. Recheck the current branch and dependency inventory before implementation. [DEPENDENCY_REVIEW.md](DEPENDENCY_REVIEW.md) records the preceding compatibility review.

## Scope and confirmed decisions

Upgrade these exact versions, preserving the seven-day release cooldown:

- `eslint-plugin-security`: `4.0.1` → `4.2.0`.
- `vitest`: `4.1.11` → `5.0.3`.
- `@vitest/ui`: `4.1.11` → `5.0.3`, together with Vitest.
- `eslint-plugin-unicorn`: `74.0.0` → `77.0.0`.

The target releases still satisfy the cooldown as of this review. Unicorn 78 and Vitest/UI 5.0.5 remain outside this batch. TypeScript, TypeScript ESLint, Node types, the supported Node range, and published peer ranges are outside the upgrade scope.

Confirmed policy:

- Set `security/detect-invisible-characters` to `warn`, matching the existing security rules.
- Enable all 20 new Unicorn correctness and safety rules below as `error`.
- Enable nine new Unicorn preferences below as `error`.
- Explicitly disable the other nine new non-deprecated Unicorn rules.
- Preserve the current settings and behavior where new Unicorn options permit it. Upstream rule improvements will still introduce some new diagnostics; the repository migrations below account for those changes.

Preserve the public API, configuration order, feature overrides, filename conventions, and existing JavaScript/TypeScript/Svelte file scopes. Keep Markdown, JSON, and HTML ownership unchanged. Continue using locally declared policy entries and complete options; do not adopt an upstream preset or automatically enable new rules.

## Stage 1: Security

Implementation: Security 4.2.0 is installed with its bundled declarations, the new rule is configured as `warn`, and the redundant external type package is removed. Eight regression tests cover literal characters and visible escapes in JavaScript and TypeScript source and comments. The reviewed snapshot changes add only this warning and update the totals in 17 source scenarios. `npm run release:check` passed on Node 24.22.0, including all 1,530 tests in 60 files. See [the Stage 1 validation record](DEPENDENCY_REVIEW.md#security-stage-1-follow-up).

Update `package.json` and `package-lock.json` to Security 4.2.0. Remove `@types/eslint-plugin-security` from development dependencies because 4.2.0 supplies its own declarations. The temporary probe built and typechecked with the external declarations removed.

Add `security/detect-invisible-characters: "warn"` in `src/configs/plugins/security/rules/possible-security-vulnerability.ts`. Update the category and aggregate counts from 14 to 15 in that file and `src/configs/plugins/security/rules.ts`.

The rule detects literal U+3164 and U+FFA0 characters in source and comments, has no configurable options, and does not report a visible Unicode escape spelling. Add a focused regression that constructs the literal characters at runtime, checks warning severity, and distinguishes them from visible escape sequences. Keep the test source itself free of those literal invisible characters. See the [tagged rule documentation](https://github.com/eslint-community/eslint-plugin-security/blob/eslint-plugin-security-v4.2.0/docs/rules/detect-invisible-characters.md) and [4.2.0 release](https://github.com/eslint-community/eslint-plugin-security/releases/tag/eslint-plugin-security-v4.2.0).

Acceptance: the new rule is explicitly classified; coverage and type generation pass; the existing 14 security rules retain their settings. Warnings continue to fail the repository's `--max-warnings 0` lint command.

## Stage 2: Vitest and its UI

Implementation: Vitest and its UI are installed at 5.0.3, with their exact peer relationship verified after a clean install. The watcher invocation uses the new options-only signature. Both watch scenarios and watcher-file zero-warning lint passed on Node 24.22.0. Both existing UI commands passed representative scoped tests and served their authenticated HTML and local assets; the UI processes are stopped. `npm run release:check` passed on Node 24.22.0, including all 1,530 tests in 60 files. See [the Stage 2 validation record](DEPENDENCY_REVIEW.md#vitest-stage-2-follow-up).

Update Vitest and its UI to exactly 5.0.3 in the same manifest/lockfile change. Confirm their installed peer relationship with `npm ls vitest @vitest/ui`.

In `tests/vitest-watch.test.ts`, replace `createVitest("test", { ... })` with `createVitest({ ... })`. The old overload remains callable but is deprecated, which triggers `@typescript-eslint/no-deprecated`. The new signature is confirmed in the [tagged Vitest source](https://github.com/vitest-dev/vitest/blob/v5.0.3/packages/vitest/src/node/create.ts).

Preserve CLI filter parsing, reporter assertions, worker limits, cleanup, and filesystem watch mappings. Keep both UI scripts and their regular/package test scopes. Retain the regression for removing and recreating `dist`, rather than testing only ordinary file edits.

Acceptance: both existing watcher scenarios pass; the watcher file has zero lint warnings; both UI commands start with matching 5.0.3 packages and retain their intended scopes. The temporary probe already passed both watcher scenarios and the watcher-file lint check after changing the signature.

## Stage 3: Unicorn policy and compatibility

Implementation: Unicorn 77.0.0 is installed, and the static policy is split into the recommended and other rule maps. All 374 non-deprecated rules are classified, including the approved 29 new errors and nine new disabled rules. The deprecated entries, frontmatter compatibility change, explicit options, and metadata counts are migrated. Build, typecheck, Knip, zero-warning lint of the policy files, and all 1,071 focused tests in 15 files passed on Node 24.22.0. A comparison with the Stage 2 checkpoint confirms only approved Unicorn changes in 15 source scenarios; the other 19 scenarios are unchanged. Snapshot updates remain in Stage 5. See [the Stage 3 validation record](DEPENDENCY_REVIEW.md#unicorn-stage-3-follow-up).

Update Unicorn to 77.0.0. Keep `src/configs/plugins/unicorn/index.ts` responsible for assembly and `rules.ts` responsible for the aggregate policy. To accommodate the expanded inventory without exceeding the existing file-length limit, split the existing recommended and other rule maps into `rules/recommended.ts` and `rules/other.ts`, following the current categories. Preserve existing entries during the move; add reviewed entries in their proper category afterward.

### Existing rule migrations

- Remove `unicorn/no-unused-array-method-return`; replace it with `unicorn/no-unused-builtin-method-return: "error"`. The replacement intentionally checks additional built-in methods.
- Remove the already-disabled `unicorn/prefer-explicit-viewport-units`. It is now a deprecated alias for a rule moved to CSSicorn; this upgrade does not add a CSS plugin.
- Set `unicorn/require-frontmatter-fields` to bare `"off"` in the existing source policy. Its current `fields: []` configuration performs no field checks, but enabling it now rejects `js/js` before linting. Do not move it into the Markdown policy or invent required frontmatter fields.
- Keep other deprecated aliases absent. Unicorn 77 exposes ten newly added deprecated CSS aliases; those are not new active rules requiring policy entries.

These changes are supported by the [75](https://github.com/sindresorhus/eslint-plugin-unicorn/releases/tag/v75.0.0), [76](https://github.com/sindresorhus/eslint-plugin-unicorn/releases/tag/v76.0.0), and [77](https://github.com/sindresorhus/eslint-plugin-unicorn/releases/tag/v77.0.0) release notes and the installed rule metadata.

### New correctness and safety rules: error

All names in the following Unicorn lists have the `unicorn/` prefix:

- `no-async-iterator-callback`
- `no-conflicting-constraints`
- `no-incomplete-accessor-override`
- `no-ineffective-csp-directives`
- `no-invalid-boolean-attribute-value`
- `no-invalid-dom-token`
- `no-invalid-integrity`
- `no-invalid-intl-options`
- `no-invalid-property-descriptor`
- `no-invalid-response-options`
- `no-invalid-style-set-property`
- `no-invalid-temporal-arithmetic`
- `no-invalid-url-protocol-comparison`
- `no-prevent-default-in-passive-listener`
- `no-unsafe-json-serialization`
- `no-unused-builtin-method-return`
- `no-unused-iterator-helper`
- `no-url-in-search-params`
- `no-using-resource-escape`
- `require-text-decoder-streaming`

### New preferences: error

- `no-unnecessary-parameters`, with `{ minimumCallCount: 2 }`.
- `no-useless-set-construction`.
- `prefer-combined-guards`, with `{ checkCompoundConditions: false, checkMultiStatementBodies: false }`.
- `prefer-escaped-irregular-whitespace`.
- `prefer-json-import`.
- `prefer-literal-ascii`.
- `prefer-promise-static-methods`.
- `prefer-short-escape-sequences`.
- `prefer-temporal-conversion`.

### New rules: off

Use bare `"off"` entries with a reason beside each declaration:

- `comma-spacing`: JSON-only formatting; preserve language ownership and Prettier's responsibility.
- `indent`: JSON/CSS-only formatting; preserve language ownership and Prettier's responsibility.
- `key-name-casing`: data-language policy, outside this feature's source scope.
- `no-empty-link-text`: Markdown-only; preserve the existing Markdown policy.
- `no-javascript-url`: Markdown-only; preserve the existing Markdown policy.
- `no-loss-of-precision`: its supported languages exclude JavaScript; preserve existing language owners.
- `no-leading-empty-lines`: Prettier already removes leading empty lines.
- `prefer-iterator-zip`: `Iterator.zip` is unavailable in the checked Node 24.22 and 26.12 runtimes.
- `prefer-uint8array-hex`: native `toHex`/`fromHex` are unavailable in the checked Node 24.22 runtime. This supersedes the initial decision to enable ten preferences; the final decision enables nine.

The inventory contains 38 new non-deprecated rules: 29 enabled and nine disabled. Existing Markdown-only `require-frontmatter-fields` is a separate compatibility change, not one of these 38 new rules.

### Explicit options on existing rules

Declare the complete settings while retaining the existing options not mentioned here:

- `filename-case`: add `directoryRoots: []`. Preserve directory checking, allowed cases, multiple extensions, and numeric migration-prefix exceptions.
- `no-break-in-nested-loop`: add `{ checkContinue: true }`. The old version reports nested `continue`; the new default would stop reporting it.
- `no-immediate-mutation`: add `{ checkConditionals: false }`. Conditional mutation checking is new relative to version 74.
- `prefer-continue` and `prefer-early-return`: use `{ checkShortBodies: false, maximumStatements: 1 }`.
- `prefer-simplified-conditions`: add `{ negatedConditions: "simplify" }`.
- Retain both existing `prefer-minimal-ternary` flags as `false`.

Recheck the tightened selector schemas for `isolated-functions`, `string-content`, and `template-indent`; the current empty selector lists remain valid. Update inventory, fixability, and suggestion counts from the installed metadata.

Acceptance: JavaScript config creation and linting succeed; every installed non-deprecated rule is classified; no deprecated rule is configured; enabled rules have complete options; language separation and explicit consumer overrides still work.

## Stage 4: Repository lint migrations

Implementation: all 70 findings are resolved in 31 code files, preserving comment text, public signatures, assertion coverage, and the published policy. A repository-only override permits configuration setup calls in the three root tool entry points. Build, typecheck, Knip, formatting, and zero-warning repository lint passed on Node 24.22.0. All 1,482 workspace tests in 58 files passed with one worker; the remaining 48 effective-policy/report tests passed in a temporary copy against the reviewed Stage 3 baseline. Tracked snapshot updates remain in Stage 5. See [the Stage 4 validation record](DEPENDENCY_REVIEW.md#unicorn-stage-4-follow-up).

The temporary policy probe exposed additional migration work beyond the original review. It reported 70 findings across 33 existing files, plus three ordering/layout findings in the temporary Unicorn declaration file. The 70 findings were:

- 37 `no-manually-wrapped-comments` findings.
- 13 `no-unnecessary-array-flat-map` findings.
- Nine `prefer-default-parameters` findings.
- Three each for `no-top-level-side-effects`, `no-unnecessary-parameters`, and `prefer-ternary`.
- One each for `prefer-minimal-ternary` and `no-useless-set-construction`.

Affected areas include the policy-diff scripts, utility/configuration helpers, and tests. Run the upgraded lint command again after implementing the final rule layout to obtain the authoritative file/line inventory.

The Stage 3 implementation reproduced exactly those 70 errors across 33 existing files, with zero warnings. Stage 4 resolves them in 31 files because one repository override covers the three root tool entry points. The split Unicorn policy files retain their Stage 3 contents and have no lint findings.

Preserve runtime behavior, public signatures, assertion coverage, and comment meaning when applying source fixes. Review each automatic fix before retaining it. For the legitimate top-level setup calls in `eslint.config.js`, `tsdown.config.ts`, and `vitest.config.ts`, use a documented repository-only exception where necessary. Keep the published `no-top-level-side-effects` policy enabled.

Keep these source migrations reviewable separately from dependency/policy edits. Do not disable the newly approved rules to make repository lint pass. Resolve the temporary option ordering and file-length findings through sorted options and the planned rule-map split.

Acceptance: repository ESLint passes with zero warnings, and relevant script, helper, and package tests pass after the source migrations.

## Stage 5: Policy evidence, tests, and packaging

Implementation: added 14 Unicorn regressions and reused the eight Security regressions, reviewed the baseline policy diff, and updated exactly 15 source snapshots. Both requested runtimes passed `npm run release:check`, including all 1,544 tests in 60 files with one worker. The independently installed minimum-peer tarball passed the CI compatibility procedure; both UI commands passed scoped tests and authenticated HTTP checks, and their processes are stopped. Generated declarations remain ignored. Contributor audits report zero vulnerabilities; the consumer audit finding and remote CI limits are recorded in [the final validation record](DEPENDENCY_REVIEW.md#stage-5-policy-evidence-and-final-validation).

Regenerate ignored `src/typegen.d.ts` through `npm run gen`; do not hand-edit or add it to Git. Use the current coverage, deprecated-rule, option, overlap, language-separation, formatter, and effective-policy tests as the main guards.

Add focused regressions for the changed contracts: invisible-character warnings, the frontmatter compatibility fix, preserved nested-continue reporting, the broader built-in return-value replacement, and the two disabled native-API preferences. Reuse existing coverage when it already proves the contract.

Review `npm run policy:diff -- --base caf13a218331cd6d0fdfb08933a793e6d8c9c7bb` before accepting snapshot updates. Only the approved dependency/rule inventory, severity, and explicit-option changes should appear. Markdown/JSON/HTML policy must not acquire Unicorn rules. Update effective-rule snapshots only after reviewing the expected changes.

Run the existing validation workflow without weakening it:

1. Reinstall from the final lockfile with `npm ci --ignore-scripts`; check the relevant installed versions and peer graph.
2. Run the focused watcher, Unicorn, policy, fixture, formatting, and modified-helper tests.
3. Run `npm run release:check` on Node 24.15.0 and Node 26. This includes audit, formatting, build, typecheck, Knip, zero-warning lint, all tests, Publint, declaration/package checks, and a package dry run.
4. Run the existing minimum-peer CI procedure against an independently installed tarball on Node 24.15.0, including ESLint 10.4.0 and the advertised optional-peer minimums. Verify `npm ls --all` and real JSX/Svelte/server linting.
5. Verify both UI commands, then stop their processes. Run `git diff --check` and inspect the final dependency, source, snapshot, and documentation diffs.

Update `DEPENDENCY_REVIEW.md` after implementation with actual installed versions, resolved blockers, intentional policy changes, and the checks that passed. Correct its Security candidate link to the 4.2.0 release. Report local validation separately from remote Linux CI.

## Evidence and limits of this planning review

The original planning experiments ran in temporary copies. The following results describe that combined-upgrade probe before Stage 1 was implemented; the current implementation results for all five stages are recorded in [DEPENDENCY_REVIEW.md](DEPENDENCY_REVIEW.md).

- The four target packages installed together and the build passed on Node 26.12.0.
- Typechecking passed, including with Security's external type package removed; the latter check used Node 24.22.0.
- Migrating the Vitest signature passed both watcher scenarios and watcher-file zero-warning lint.
- A policy/configuration/fixture probe passed all 315 tests in seven files. It used the initial 30-rule enabled proposal before the final decision to disable `prefer-uint8array-hex`.
- Direct runtime checks confirmed why the zip and hex preferences should remain disabled on supported Node 24 installations.
- The combined probe required the source migrations above, completed in Stage 4. Stage 5 completed the local snapshot updates, release matrix, minimum-peer compatibility, and UI checks. The consumer audit finding and remote CI limits are documented in the review.

All five stages are implemented and locally validated. Consumer dependency remediation remains separate work; remote Linux CI has not been run.
