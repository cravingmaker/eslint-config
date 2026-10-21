# Audit follow-up implementation

This document is the execution guide for the confirmed decisions in
[AUDIT_RESULT.md](AUDIT_RESULT.md). It was prepared on 21 October 2026 for an AI
to implement one stage at a time. Writing this guide did not implement the
audit. Every stage initially started as **Not started**; the ledger and execution
records below track subsequent implementation.

## Authority and goals

Read [CODING_PRINCIPLES.md](CODING_PRINCIPLES.md) first. Its priority order is
both the end goal and the guardrail for this package's code, files, folders,
architecture, configuration, scripts, and the behavior it enforces in consumer
projects: deterministic and consistent; readable and maintainable; secure;
performant and efficient; non-obsolete; non-deprecated; non-redundant; modern;
elegant and concise.

Use the audit's **Maintainer decision log**, including each final **Maintainer
choice**, as the policy authority. Earlier recommendations, alternatives,
timings, counts, and proposed steps are historical evidence. This fourteen-stage
guide replaces the original ten-step execution order, without replacing the
decision record. Later explicit maintainer instructions take precedence.

In particular, do not apply the original proposals to remove complementary
checks, allow opaque synchronous returns without review, disable Security in
tests, gate AWS checks on the root manifest, or restrict SonarJS test checks to
the shared test-file role. Those proposals were rejected. D3 is a custom choice,
not either original alternative. D13.1 supersedes the earlier preference to
keep deprecated rules explicitly disabled.

Discuss questions and report progress in Indonesian. Keep source comments,
decision records, implementation notes, and this document in English. If an
unresolved policy choice is discovered, ask a focused question in Indonesian,
recommend an option against the principles, and compare the choices with code
and resulting behavior. Routine implementation choices do not reopen confirmed
decisions.

## Execution contract

1. Implement only the requested stage. Read its dependencies and the preceding
   handoff before editing. Continue through all work and checks within that
   stage; leave the next stage for the next instruction.
2. Read the current repository instructions, scripts, installed rule schemas,
   tests, and source. Paths and counts below describe the decision-review
   baseline, not a reason to undo subsequent approved changes. Resolve drift
   explicitly and preserve unrelated work.
3. Capture the stage-entry commit SHA and working-tree status. Separate existing
   changes from the stage's changes. Do not reset, discard, or commit unrelated
   work. Use a separate worktree when needed to isolate it.
4. Write meaningful failing regressions before behavioral changes. Keep normal
   validation green at the end of every stage. Do not use skipped tests,
   unconditional expected failures, weakened assertions, updated snapshots, or
   blanket suppressions to conceal a failure. Stage 1's temporary
   characterization of an exact known defect is explained separately below.
5. Preserve public options and exports, ESM output, optional-peer behavior,
   feature toggles, file scopes, block names/order, override precedence,
   compatibility filtering, and diagnostics/fixes except for the changes
   explicitly assigned to that stage. Do not introduce a new public feature
   option, external plugin, dependency upgrade, or compiler contract.
6. Update affected README/contributor instructions, fixtures, rule counts,
   fixability annotations, and owner explanations in the stage that changes
   them. Stage 13 is the final consistency pass, not permission to leave earlier
   stages inaccurately documented.
7. Check effective policy and actual lint behavior. A rule tuple assertion alone
   does not prove diagnostic coverage, safe fixes, parser routing, or optional
   peer compatibility. Test feature-disabled, narrowed, ignored, typed/untyped,
   and consumer-override cases where they affect the change.
8. Keep generated `dist/` and `src/typegen.d.ts` out of commits. Run the required
   hooks; never bypass them. A plan stage does not itself authorize publishing,
   merging, tagging, or releasing. Commit/push/PR delivery follows the current
   maintainer request.
9. Record actual commands, outcomes, expected policy differences, and remaining
   conditions in a stage handoff. Mark a stage complete only after its exit
   criteria pass. Historical probes in the audit do not count as current tests.

### Setup and common validation

Use the Node version in `.nvmrc` (24.22.0 at the decision-review baseline).
`.npmrc` disables install scripts, so a fresh checkout needs both commands:

```sh
npm ci
npm run prepare
```

Build before commands that import `dist/index.mjs`. The baseline commands are:

```sh
npm run build
npm run validate
git diff --check
```

`validate` covers formatting, build, generated types/type checking, Knip, full
repository linting with `--max-warnings 0`, Vitest including package consumers,
Publint, and Are the Types Wrong. Run the targeted regressions while developing,
then this full gate at each stage's completion. Also lint the changed source
files explicitly, as the contributor instructions require. Use the current
equivalent commands after Stage 12 changes script composition. Do not run a
clean build concurrently with tests that load its output.

If resource limits require it, use `NODE_OPTIONS=--max-old-space-size=4096` and
`VITEST_MAX_WORKERS=1`; report the environment and any retry. Do not reduce test
coverage or skip hooks to obtain a pass.

For a policy comparison, capture `git rev-parse HEAD` **before stage edits** and
pass that actual SHA to `npm run policy:diff -- --base <stage-entry-sha>`.
Replace the placeholder; do not pass it literally. Pure refactors must have zero
effective-policy and snapshot differences against their own stage-entry
baseline. Later refactors must not compare against the original audit commit
and erase intentional changes from earlier stages. Separately retain the
cumulative, decision-mapped delta against the implementation starting point.

For intentional policy changes, review the report and snapshot delta entry by
entry against the stage's decisions. Follow the repository's supported snapshot
update process; never hand-edit or regenerate snapshots to hide unexpected
drift. Some changes, such as inherited deprecated rules or parser behavior,
require direct tests beyond the standard effective-policy scenarios.

## Stage ledger and dependencies

Run stages in order. This keeps behavioral corrections ahead of structural
migrations and supplies a verified baseline for each refactor.

| Stage | Deliverable                                                               | Decisions/findings               | Depends on | Status      |
| ----- | ------------------------------------------------------------------------- | -------------------------------- | ---------- | ----------- |
| 1     | Baseline and combined-rule regression harness                             | P1–P3; guard against regressions | None       | Complete    |
| 2     | Escape-case and import-spacing convergence                                | D1, D2                           | 1          | Complete    |
| 3     | Arrow functions, starred documentation, function spacing                  | D3                               | 2          | Complete    |
| 4     | Passing configurations, conditional peer metadata, typed TSX names        | D4–D7 and D7 AST follow-up       | 3          | Complete    |
| 5     | Verified ownership, complementary checks, safe execution preference       | D8.1–D8.12                       | 4          | Not started |
| 6     | Retained review signals and known parser/fix failures                     | D9, D10.1–D10.2, D11.1–D11.3     | 5          | Not started |
| 7     | Severity, deprecated entries/options, generated ignores, explicit updates | D12, D13.1–D13.2, D14, D19       | 6          | Not started |
| 8     | Source-map-free package                                                   | D15, R7                          | 7          | Not started |
| 9     | Source, test, and ambient declaration ownership                           | D18.1–D18.6, R11                 | 8          | Not started |
| 10    | Production utility/builder consolidation and Svelte negations             | R1, R2                           | 9          | Not started |
| 11    | Derived disabled maps, shared test boundaries, local suppressions         | R3–R5                            | 10         | Not started |
| 12    | Dead entries and consistent scripts/hooks                                 | R6, R8                           | 11         | Not started |
| 13    | Documentation and source conventions                                      | R9, R10; D16, D17 retention      | 12         | Not started |
| 14    | Final consumer verification and audit closure                             | All decisions/findings           | 13         | Not started |

## Stage 1: baseline and combined-rule regression harness

**Purpose:** Establish trustworthy evidence before changing consumer policy.
Read [the original regression proposal](AUDIT_RESULT.md#a-guard-against-regressions)
and P1–P3, then apply the final decisions when defining accepted overlaps.

**Primary locations:** `tests/policy/`, its effective-config/scenario helpers,
the existing overlap/formatter/formatting suites, and the package README suite.
Use a focused new suite such as `tests/policy/fix-convergence.test.ts` rather
than adding an unrelated test framework.

**Implementation:**

1. Install/prepare, run the existing full validation, and record the starting
   SHA, runtime/dependency versions, suite counts, and effective-policy baseline.
   Diagnose setup failures before treating them as package regressions.
2. Reproduce the audit's escape-case, import-comment spacing, and documented
   module-spacing loops with the published factory. Include a mixed sample so
   interactions across features are exercised, not just isolated rule pairs.
3. Build a helper that collects lint reports and circular-fix warnings, applies
   ESLint fixes, formats with the package's formatter, and repeats the complete
   sequence. Compare final text and diagnostics after a second cycle. Check
   equivalent `.js` and typed `.ts` cases, plus relevant component cases.
4. Add controls that demonstrate the harness detects changed text, unexpected
   warnings, and overlapping reports. Compare rule IDs and ranges; do not reject
   every coincident location indiscriminately.
5. Maintain a short, explicit list of approved complementary overlaps from
   Stage 5/D8 and existing justified owners. Each entry names the rules, sample,
   and distinct concern. Do not permit every pair from two plugin namespaces or
   assert that every overlap must disappear.
6. Until Stages 2–3 fix a reproduced loop, an exact characterization test may
   assert its observed warning/output. Label it with the decision and fixing
   stage. Avoid dependence on unstable warning wording or global warning
   listeners that leak across workers. Replace that characterization with a
   positive convergence assertion in the assigned fixing stage.

**Exit criteria:** Existing validation passes; the new harness demonstrably
detects the known defects and passes its controls; every temporary baseline
characterization has a named fixing stage. No runtime policy, package API, or
effective snapshot changes. This stage does not claim that the loops are fixed.

## Stage 2: escape-case and import-spacing convergence

**Decisions:** D1 = A; D2 = A, including the maintainer's 21 October 2026
implementation follow-up approving `exactCount: false` for multiline comments.

**Primary locations:** RegExp stylistic rule map, Unicorn escape-case entry,
`src/configs/plugins/import-x/rules/style-guide.ts`, Perfectionist import policy,
and the Stage 1 regressions. Stage 9 will later rename the import feature folder.

**Implementation:**

1. Set `regexp/letter-case`'s `hexadecimalEscape` and `unicodeEscape` to
   `"uppercase"`. Preserve its other options and Unicorn's uppercase policy.
2. Set `import-x/newline-after-import`'s `considerComments` and `exactCount` to
   `false`. Retain `count: 1` as a minimum and preserve `perfectionist/sort-imports`,
   including `partitionByComment: false`. Comments must not create new import
   partitions. The exact-count change was approved after implementation
   reproduced its conflict with required multiline documentation; it supersedes
   this stage's original instruction to preserve that setting.
3. Replace the D1/D2 baseline characterizations with passing repeated-fix and
   formatter-convergence assertions. Test escaped regex/string values and
   imports followed by comments, interleaved comments, and ordinary statements.
4. Preserve import ordering, grouping, feature filtering, and overrides. Update
   only the relevant effective entries, fixtures, and documentation.

**Exit criteria:** Both loops are absent in targeted and mixed samples; a second
fix/format cycle is stable; full validation passes. The policy delta is limited
to the D1/D2 options. The remaining D3 characterization is still tracked.

## Stage 3: arrows, starred documentation, and function spacing

**Decision:** D3 = the confirmed custom policy.

**Primary locations:** Core function-style rules, Stylistic padding policy,
Perfectionist module sorting, Unicorn documentation-comment policy, source
documentation, and combined-rule regressions. Read the complete D3 record;
its nine arrow probes and eight spacing probes are feasibility evidence only.

**Required result:**

```js
const first = () => {
  return 1;
};

/**
 * Describe the second function.
 *
 * Explain a detail.
 */
const second = () => {
  return 2;
};

const maxAttempts = 3;
const timeoutMilliseconds = 1000;
```

**Implementation:**

1. Require arrow functions with block bodies for ordinary standalone functions
   and compatible callbacks. Retain expression-style and block-body settings,
   but do not mistake `func-style: "expression"` for arrow-only enforcement.
2. Preserve methods, accessors, constructors, generators, and functions that
   require their own dynamic `this` or `arguments`. Review `new.target`, named
   function-expression recursion, and other behavior-sensitive conversions.
   Never apply a blanket function-to-arrow autofix.
3. Start from the existing `func-style`, `prefer-arrow-callback`, and
   `no-restricted-syntax` capabilities. The recorded selector
   `VariableDeclarator > FunctionExpression.init[generator=false]` covers only
   one position. Verify declarations, initializers, assignments, return values,
   default/named exports, callbacks, async functions, TypeScript wrappers and
   overloads. Establish one diagnostic owner per case and honor the semantic
   exceptions. Do not claim completion from the limited selector alone.
4. Use the existing selector-capable
   `@stylistic/padding-line-between-statements` for direct function-valued
   variable declarations and their named-export wrappers. The D3 selector
   examples inspect `declarations.0`; review multiple declarators and typed
   wrappers deliberately. Require separation before a following statement or
   its documentation comment. Do not require padding after ordinary data
   variables/object properties or before a closing brace/EOF.
5. Disable `unicorn/no-asterisk-prefix-in-documentation-comments` with an owner
   reason. Enforce starred `/** ... */` documentation while preserving paragraph
   breaks. Do not apply `multiline-comment-style: "starred-block"` globally
   without addressing its conversion of ordinary grouped `//` comments.
6. Resolve the original Perfectionist module-spacing no-op/fix loop as well.
   Function-variable padding alone cannot fix it. Preserve declaration ordering;
   use the smallest compatible spacing adjustment and document the exact scope.
7. If installed native/plugin rules cannot express the approved arrow exceptions
   or documentation-only convention, prove that limitation with tests and add
   the smallest internal rule needed. Keep it within existing feature scopes,
   registration/override conventions, build, type generation, and explicit-rule
   coverage. Document any new observable rule ID. Do not add a dependency or
   consumer feature option, or silently weaken the approved policy.
8. Migrate affected repository functions/comments and fixtures carefully. Test
   positive/negative arrow cases, semantic exceptions, ordinary line comments,
   documentation paragraphs, nested/exported/async function variables, ordinary
   variables, EOF, and formatter interaction.

**Exit criteria:** The approved syntax and exceptions have actual diagnostic
coverage; documentation/spacing have a passing form; all Stage 1 loop
characterizations are replaced by positive convergence tests. Repeated ESLint
and Prettier runs are stable, semantic controls retain their behavior, and full
validation passes. Record the new syntax/layout policy delta explicitly.

## Stage 4: passing configurations, peer metadata, and typed TSX names

**Decisions:** D4 = A; D5 = B; D6 = A; D7 = A; D7 AST-name follow-up = B.

**Primary locations:** Shared exception roles, repository `eslint.config.js`,
Package JSON rules/parser integration, Functional tacit policy, TypeScript
naming options, package/README fixtures, and feature/factory tests.

**Implementation:**

1. **D4:** Add `unicorn/no-top-level-side-effects: "off"` to the existing
   `config-files` exception role, emitted only while Unicorn is enabled. Preserve
   the role's existing source-file intersection. Remove the redundant
   `repository/tool-configuration` block only after the shared exception replaces
   it. Lint the actual README configuration in an external consumer; ensure
   application modules still report the rule.
2. **D5:** Keep `peerDependencies` optional. When it is present, require nonempty
   `peerDependenciesMeta` and an explicit boolean `optional` for every declared
   peer, including `false` for a required peer. With no peers, metadata may be
   omitted; an explicitly empty metadata object remains invalid. Preserve
   `valid-peerDependenciesMeta`, its relationship check, and `no-empty-fields`.
3. Inspect the installed Package JSON rule schemas/implementation for conditional
   support. The current unconditional `require-peerDependenciesMeta` cannot
   implement B alone. Use one conditional diagnostic owner; if necessary add a
   minimal internal JSON rule using the existing parser/registration approach,
   with typed/generated rule coverage. Do not replace this requirement with
   merely optional metadata or require peers on every application.
4. Cover absent peers/metadata, empty fields, missing metadata or peer entries,
   missing/nonboolean `optional`, explicit `true`/`false`, and invalid metadata
   relationships. Preserve existing shape errors without duplicate conditional
   reports. Update this repository's manifest and consumer fixtures, including
   explicit required-peer metadata where needed; do not change peer ranges.
5. **D6:** Keep `unicorn/no-array-callback-reference`; turn off
   `functional/prefer-tacit` with a named owner reason. Verify forwarding arrows
   with block bodies pass. Include a callback with a default second parameter:
   forwarding only the value must not become direct `map` callback passing that
   receives the index and changes results.
6. **D7:** In typed `.tsx`, allow PascalCase for function-valued `const` component
   bindings and the relevant function naming cases. Preserve ordinary data
   binding formats, other extensions, existing accepted names, and typed
   linting. D3 still requires arrows for ordinary functions.
7. **D7 follow-up:** Keep targeted naming-convention suppressions on the actual
   AST property keys. Do not introduce an AST-name whitelist, broad uppercase
   property exception, context detector, or transitive AST-enum dependency.

**Exit criteria:** The README tool config, a manifest without peers, a valid
explicit-peer manifest, the forwarding callback, and a typed PascalCase arrow
component each pass their assigned policy. Negative controls still report;
feature/scope/override controls and full validation pass. Record any internal
rule integration and the intended D4–D7 policy deltas.

## Stage 5: rule ownership, complementary checks, and safe fixes

**Decisions:** D8.1–D8.12, using the final choice for every subdecision. Read their
coverage examples before editing. Some explanation comments were already added
during decision review; preserve and verify them rather than duplicating them.

**Primary locations:** Core, Security, RegExp, Unicorn, Promise, SonarJS, and
TypeScript rule maps; replacement and typed-off maps; overlap/coverage/fix suites;
README ownership documentation.

| Decision | Required implementation                                                                                                                                           | Required coverage boundary                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| D8.1 A   | `eqeqeq: ["error", "always", { null: "always" }]`; `no-eq-null: "off"` with `Handled by` reason                                                                   | `===`/`!==` required for null too; loose non-null and null comparisons report once through this owner                            |
| D8.2 A   | Keep `no-eval: ["error", { allowIndirect: false }]`; disable `security/detect-eval-with-expression` with `Handled by no-eval` comment                             | Direct, optional, and indirect eval coverage; no relaxed indirect allowance                                                      |
| D8.3 A   | Keep `no-nested-ternary: "error"`; disable `unicorn/no-unnecessary-nested-ternary` with owner reason                                                              | Core covers more result-branch nesting; do not claim that it catches every conditional-position nesting or retains Unicorn's fix |
| D8.4 A   | Retain core and RegExp `no-useless-escape`, preserving core `allowRegexCharacters: []`                                                                            | Core string/unique literal checks and RegExp constructor checks complement each other                                            |
| D8.5 A   | Keep `regexp/no-control-character: "error"`; disable core `no-control-regex`                                                                                      | Explicitly accept intentional constructor control escapes that only core rejected; this is an approved coverage trade-off        |
| D8.6 B   | Retain `regexp/no-super-linear-backtracking`, `regexp/no-super-linear-move`, and `security/detect-unsafe-regex` at current error/error/warn                       | The Security heuristic has unique reports; it is not fully replaced by the two RegExp analyses                                   |
| D8.7 A   | Retain Uint8Array preference, Buffer API/type/import restrictions, and `n/no-deprecated-api`; replace two direct-constructor rules with native syntax restriction | Cover direct `new Buffer(...)`, including nonliteral sizes, without suggesting `Buffer.alloc`/`Buffer.from`                      |
| D8.8 A   | Retain `unicorn/prefer-await` and Promise's `prefer-await-to-then` with `strict: false`                                                                           | Promise sees void chains/name heuristics; Unicorn covers additional awaited/yielded/top-level/constructor/computed cases         |
| D8.9 A   | Retain Unicorn and TypeScript `require-array-sort-compare`; keep TypeScript `ignoreStringArrays: true` and untyped off guard                                      | Ordinary/string/undefined and computed/optional cases differ; keep typed-array controls                                          |
| D8.10 A  | Keep `regexp/prefer-regexp-exec`; temporarily set TypeScript counterpart to scalar `off` in active and fallback maps; keep Sonar counterpart off                  | Avoid the verified inherited-global-flag autofix; document accepted missing computed-access preference reports                   |
| D8.11 A  | Retain core `require-unicode-regexp` with unspecified `requireFlag` and `sonarjs/unicode-aware-regex`                                                             | Either `u` or `v` remains allowed; typed implicit-pattern checks add coverage                                                    |
| D8.12 A  | Retain `default-case` and typed `switch-exhaustiveness-check`; keep `requireDefaultForNonUnion: true` and `considerDefaultExhaustiveForUnions: false`             | Empty typed switches, exact omission markers, non-union defaults, and exhaustive unions retain their distinct checks             |

**Implementation:**

1. Give each disabled owner a concise English reason naming the retained owner.
   Use reciprocal `Complemented by ...` comments when both checks have unique
   coverage. Keep special-case/fixability annotations and precise scope caveats.
2. For D8.7, append this entry to the existing native `no-restricted-syntax`
   entries; do not overwrite D3 restrictions or other current selectors:

   ```js
   {
     selector: "NewExpression[callee.type='Identifier'][callee.name='Buffer']",
     message: "Use Uint8Array instead.",
   }
   ```

   Set `unicorn/no-new-buffer` off with the conflicting-autofix explanation and
   `security/detect-new-buffer` off with the native-owner explanation. Do not
   claim alias or global-property matching from this selector. Manually preserve
   encoding, coercion, and shared-memory behavior when migrating affected code.

3. For D8.10, explain the temporary autofix defect on the disabled TypeScript
   entries. Update Sonar's disabled-owner reason to the active RegExp/manual
   policy rather than naming the disabled TypeScript owner. With
   `text.match(new RegExp(source))`, test a source regex carrying `g`: a safe
   implementation must not autofix the resulting match array into a different
   `exec` result. Keep a separate active RegExp diagnostic control. Do not
   upgrade dependencies or fork parser/rule behavior in this stage.
4. Add actual unique-case, overlap, and negative controls for each row, reusing
   the audit reproductions. Verify applicable JavaScript, typed/untyped TS,
   TSX/component, feature-disabled/narrowed/ignored, and explicit override paths.
   Disabled losers remain disabled when the selected owner is unavailable;
   never add fallback activation accidentally.
5. Retained await checks are review requirements, not permission to add `await`
   mechanically to detached work or to make constructors async. Unicode flags
   must not be inserted blindly when semantics could change. Match exact switch
   omission-marker behavior rather than accepting arbitrary comments.
6. Update the Stage 1 overlap expectations and README: fixed ownership applies
   to replacements, while explicitly reviewed complementary checks can report
   together. Preserve existing unrelated owners.

**Exit criteria:** Every row has verified effective settings and lint/fix
regressions; the unsafe global-match example keeps its behavior; comments and
documentation state the real coverage boundaries; full validation passes. The
temporary TypeScript rule remains off until its restoration condition is met.

## Stage 6: review signals and known parser/fix failures

**Decisions:** D9 = B; D10.1 = B; D10.2 = B; D11.1–D11.3 = A.

**Primary locations:** TypeScript promise policy, Security rules/test
suppressions, HTML/Markdown maps and tests, Svelte/source globs and routing,
package README/consumer tests.

**Implementation:**

1. **D9:** Retain `@typescript-eslint/promise-function-async` as an error with
   `allowAny: false`, all four function-kind checks, `allowedPromiseNames: []`,
   and the existing typed scope. Cover hidden Promises and synchronous opaque
   returns as review points. Preserve the justified synchronous rule-option
   suppression in `src/utilities/plugin-policy.ts`; improve contracts or add
   justified local exceptions without converting synchronous APIs to async.
2. **D10.1/D10.2:** Keep filesystem-path and object-injection warnings throughout
   current Security scopes, including tests. Add tests showing reviewed dynamic
   test paths/keys still warn and negative controls do not. Do not add shared
   test-role exceptions or broaden test-file globs. Begin an inventory of
   whole-file suppressions for Stage 11, preserving necessary exceptions and
   unrelated suppressed rules.
3. **D11.1:** In the HTML closing-tag rule, set `selfClosingCustomPatterns: []`.
   Keep warning severity, `selfClosing: "always"`, scope, and other options.
   Add the approved English reason. Verify paired custom-element tags survive
   fixes and standard void-element behavior remains. Existing self-closing or
   missing-end-tag custom elements need manual boundary review, not a guessed
   insertion of an end tag.
4. **D11.2:** Temporarily disable these exact Markdown rules with scalar `off`:
   `markdown/no-bare-urls`, `markdown/no-invalid-label-refs`,
   `markdown/no-missing-label-refs`, `markdown/no-reference-like-urls`, and
   `markdown/no-space-in-emphasis`. Preserve their explicit entries and
   fixability annotations, the remaining active rules, GFM, front matter, math,
   feature scopes, and overrides. Use the version/cause/upstream explanation:

   ```js
   // Temporarily disabled: GFM autolink nodes without positions crash 8.0.3 (eslint/markdown#619).
   ```

   Reproduce `[https://example.com]` through the public config without a lint
   exception. Add a retained-rule diagnostic control. Replace any test using
   `no-bare-urls` as the normal active-feature sentinel, while preserving
   explicit-override coverage. Do not inject fake node positions or upgrade
   dependencies to work around the issue.

5. **D11.3:** Route only `.svelte`, `.svelte.js`, and `.svelte.ts` through Svelte.
   `.svelte.mjs` and `.svelte.mts` keep ordinary JavaScript/TypeScript routing;
   they are not ignored and gain no rune support. Preserve source globs,
   component-role calculations, feature filtering, and optional-peer behavior.
   Test parser selection, supported rune modules, ordinary modules with the
   extra suffixes, and the disabled/missing-peer case. Add the agreed explanation
   and filename guidance.

**Exit criteria:** Review signals retain their approved severity/scope;
custom-element output is stable; Markdown triggering samples do not throw and
retained diagnostics still work; parser routing matches the suffix contract.
Full validation passes. Record both temporary restoration conditions separately
from completed implementation, without claiming the upstream bugs are fixed.

## Stage 7: severity, deprecated rules, ignores, and explicit updates

**Decisions:** D12 = A; D13.1 = A; D13.2 = A; D14 = A; D19 = explicit updates.

**Primary locations:** Core/plugin limit entries, TypeScript replacements,
authored rule inventory/deprecation/option tests, global ignores, source/tests
containing update operators, and contributor policy.

**Implementation:**

1. **D12:** Set only the five currently error-level quantitative owners to
   `warn`: `complexity` (10, classic), core `max-params` (4, existing native
   options), TypeScript `max-params` (4, `countVoidThis: false`),
   `unicorn/max-nested-calls` (3), and `@html-eslint/max-element-depth` (6).
   Preserve the seven already-warning owners: `max-depth` (3), `max-lines`
   (600), `max-lines-per-function` (60), `max-nested-callbacks` (3), and SonarJS
   cognitive/expression/regex complexity (15/3/20). Preserve scopes/options and
   repository exceptions; do not reclassify security/correctness checks. Keep
   `--max-warnings 0` and verify ordinary versus quiet command behavior.
2. **D13.1:** Re-inventory installed metadata and omit every deprecated rule
   from package-authored maps, including `off`. Include the deprecated native
   `no-return-await` replacement entry and reviewed SonarJS/Stylistic entries.
   Preserve explicit policies for all current non-deprecated rules and active
   TypeScript `return-await` behavior. Reconcile counts and contributor text.
3. Extend authored core and plugin map guards to reject deprecated IDs at every
   severity **before optional-peer filtering**. Retain old-peer schema/ID
   compatibility. Add an inherited-config case: if a preceding consumer enables
   `no-return-await`, removing this package's `off` entry leaves it enabled.
   This is an accepted behavior difference, not a reason to restore the entry.
   Consumer overrides still retain their public precedence.
4. **D13.2:** Remove only redundant `maximum: undefined` from the TypeScript
   max-params options. Keep canonical shared `max: 4`, `countVoidThis: false`,
   and D12's warning severity. Do not copy unsupported native `countThis` into
   the extension. Keep Stylistic's `overrides: { arrow: "ignore" }` compatibility
   guard and English reason. Protect the specific redundant alias without
   banning every identically named key or removing the existing alias allowance.
5. **D14:** Add `**/.next/` and `**/.svelte-kit/` to global directory defaults at
   any depth, independent of framework detection/toggles. Preserve dist/build/
   coverage defaults and append caller patterns afterward, including directory
   negations. Test root/nested ignores, default discovery, retained sibling
   sources, and supported caller re-inclusion semantics. Keep trailing slashes
   and an English generated-output reason; do not invent other framework dirs.
6. **D19:** Set `no-plusplus: ["error", { allowForLoopAfterthoughts: false }]`.
   Retain `operator-assignment: ["error", "never"]` and
   `logical-assignment-operators: ["error", "never"]`. Remove the stale comment
   preferring increment/decrement. Cover prefix/postfix and for-loop updates,
   arithmetic/exponentiation/shift/bitwise compounds, and `&&=`, `||=`, `??=`.
   Existing independent bitwise restrictions remain.
7. Manually migrate affected code to explicit assignments such as
   `count = count + 1`. Preserve prefix/postfix expression results, numeric
   coercion, BigInt `1n`, receiver/key/getter evaluation counts, and conditional
   setter/short-circuit behavior. A blind text replacement of `value++` or
   `object[key()] += amount` is unsafe. Add behavior tests for the complex cases
   actually migrated; do not invent unused abstraction helpers.

**Exit criteria:** The twelve approved limit owners warn without option drift;
authored deprecated entries are absent; guards test pre-filter maps; new ignores
and explicit updates behave as approved. Full validation and reviewed policy
snapshots pass. Document inherited-config and intentional syntax changes.

## Stage 8: publish without source maps

**Decision/finding:** D15 = A; R7.

**Primary locations:** `tsconfig.json`, `tsdown.config.ts`, package-content
contract/smoke/consumer suites, and publication documentation.

**Implementation:**

1. Set TypeScript `declarationMap: false` and explicitly set bundler
   `sourcemap: false`. Keep `dts: true`, ESM output, entry points, declarations,
   and runtime/type exports. Add `Do not publish original source through source
maps.` as the English bundler comment.
2. Clean and build. Verify no `.map` files, inline/hidden maps, or
   `sourceMappingURL` references remain. Do not broaden package allowlists to
   publish `src/` or compensate by removing declarations.
3. Inspect an actual temporary tarball and the packed consumer. Dist should
   contain `index.mjs` and `index.d.mts`, alongside existing package documents
   elsewhere in the tarball. Update package assertions for this deliberate
   artifact change. Remove all temporary packs after inspection.
4. Compare executable/declaration content against the stage-entry build after
   excluding map references/trailing whitespace. Investigate any other change;
   do not normalize away substantive emitted-code differences.
5. Document the accepted loss of mapped TypeScript runtime frames and reduction
   in original-source disclosure. Emitted JavaScript remains inspectable; this
   decision does not make application secrets safe to bundle.

**Exit criteria:** Clean build, tarball checks, public imports/types, Publint,
Are the Types Wrong, and consumer tests pass; zero effective-policy/snapshot
delta. No source-map artifact/reference or package-source expansion remains.

## Stage 9: source, test, and ambient declaration ownership

**Decisions:** D18.1–D18.6 = A; R11. This is a structural migration with two
justified new behavior regressions. Do not combine R4 helper API redesign here.

### Source migrations

| Decision | Change                                                                            | Preserve/update                                                                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D18.1    | `src/configs/plugins/import-x/` → `src/configs/plugins/imports/`                  | All six modules/category organization; update factory, direct tests/code-quality references, contributor table; keep dependency/namespace/rule IDs `import-x` and public feature `imports`      |
| D18.2    | Package JSON `rules/other-rules.ts` → `rules/other.ts`                            | Keep `otherRules`, rule/category order/options/comments; update its composition import; do not rename official `no-other-paradigms.ts`                                                          |
| D18.3    | Merge React `html-best-practices.ts` into `html-best-practice.ts`                 | All nine entries in their original effective key order, including duplicate-classname position; remove plural import/export; keep stylistic/Hooks/Refresh separate and add alias/order comments |
| D18.4    | Extract Node `typeAwareRules` and `typescriptRulesOff` into `rules-type-aware.ts` | One base `nodeRules` owner and shared `no-sync` tuple; update builder imports; retain JS activation, untyped TS/component off, typed reactivation and block/key order                           |
| D18.6    | `src/types/eslint-plugin-promise.d.ts` → `src/ambient/eslint-plugin-promise.d.ts` | Exact declaration and suppression; no `import`/`export {}` that changes ambient semantics; keep public `src/types.ts` and generated `src/typegen.d.ts` in place                                 |

Do not change compiler `typeRoots`, discovery paths, public exports, plugin
registration, dependency versions, or core/javascript and
packageJson/enforce-package-type ownership to make these moves work.

### Test migrations: D18.5

Move the nineteen flat feature suites from `tests/configs/<feature>.test.ts` to
`tests/configs/plugins/<feature>/index.test.ts` for these exact features:
`enforce-package-type`, `express`, `functional`, `html`, `imports`, `json`,
`markdown`, `node`, `package-json`, `perfectionist`, `promise`, `react`, `regexp`,
`security`, `sonarjs`, `stylistic`, `svelte`, `unicorn`, and `unused-imports`.

Apply the additional ownership moves below. Count against the current tree;
Stage 1 may already have added new suites.

| Existing location                                            | Destination/action                                                                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/configs/typescript/{index,rules}.test.ts`             | `tests/configs/plugins/typescript/`, same filenames                                                                                                                            |
| `tests/configs/svelte-scripts.test.ts`                       | `tests/configs/plugins/svelte/scripts.test.ts`                                                                                                                                 |
| `tests/configs/core/index.test.ts`                           | Keep in place                                                                                                                                                                  |
| `tests/configs/core/{possible-problems,suggestions}.test.ts` | `tests/configs/core/rules/`, same filenames                                                                                                                                    |
| `tests/configs/exceptions.test.ts`                           | `tests/configs/exceptions/index.test.ts`                                                                                                                                       |
| `tests/configs/file-scope.test.ts`                           | `tests/utilities/file-scope.test.ts`                                                                                                                                           |
| `tests/factory/import-peer.test.ts`                          | `tests/utilities/import-peer.test.ts`                                                                                                                                          |
| `tests/plugin-policy.test.ts`                                | `tests/utilities/plugin-policy.test.ts`                                                                                                                                        |
| `tests/configs/type-aware-scope.test.ts`                     | Pure `overridesWithoutTypeInformation` cases and their three constants to `tests/utilities/type-aware.test.ts`; factory integration to `tests/policy/type-aware-scope.test.ts` |
| `tests/configs/{commonjs,code-quality}.test.ts`              | `tests/policy/`, same filenames                                                                                                                                                |
| `tests/typegen.test.ts`                                      | `tests/scripts/typegen.test.ts`                                                                                                                                                |
| `tests/utilities.ts` and `tests/utilities.test.ts`           | `tests/support/lint.ts` and `tests/support/lint.test.ts`                                                                                                                       |
| `tests/configs/describe-file.ts`                             | `tests/support/describe-file.ts`                                                                                                                                               |

**Implementation and verification:**

1. Use physical moves first, preserving assertions, parameterized cases, helper
   signatures/defaults, setup/cleanup, and fixture paths. Keep the twelve-feature
   shared builder contract in the moved code-quality suite; do not copy it into
   every feature test.
2. Keep temporary typed-project setup with the integration suite. The extracted
   pure utility suite receives no copied project creation. Preserve both
   original describe bodies and their behavior.
3. Rewrite relative imports for their new depth. In moved typegen tests, update
   both the built import and the two `new URL` paths to `src/typegen.d.ts`.
   Distinguish physical imports from virtual lint filenames such as
   `tests/utilities.ts`, which must stay as behavioral sample data.
4. Update `vitest.config.ts` generated-type watch mapping and all affected
   `tests/vitest-watch.test.ts` expectations, including moved support tests.
   Verify recursive discovery and rebuilt-output triggers, the five-file package
   classification, package timeouts, unchanged fixtures, and Knip fixture entry
   points. Do not use placeholder files as evidence of runnable tests.
5. Add meaningful direct coverage at
   `tests/configs/plugins/comments/index.test.ts` and
   `tests/configs/ignores/index.test.ts`. Check actual diagnostic/suppression
   behavior and ignores with retained-source controls, reusing Stage 7 coverage
   rather than duplicating it. A directory-existence assertion or a test for
   every source leaf is not required.
6. Update current contributor paths/examples and the Node/React category and
   ambient ownership explanations. Preserve historical paths in the audit's
   original evidence. Verify the ambient declaration content byte for byte.

**Exit criteria:** All moved suites run under their new paths, watcher mappings
are tested, new regressions prove behavior, type generation/declaration discovery
and full validation pass. No old physical-path references remain in active
imports/tooling/docs. Zero effective-policy and snapshot delta; key/block order
and lint behavior remain unchanged. Report actual suite counts, not the audit's
static proposal count as if it were a test result.

## Stage 10: production utilities, builders, and Svelte ignore negations

**Findings:** R1, R2. Stage 9's new paths apply. Separate the intended Svelte
behavior correction from the remaining behavior-preserving refactors.

**Primary locations:** `src/options.ts`, `src/utilities/file-scope.ts`,
`src/context.ts`, plugin-policy utilities, exception builder, source-plugin
builders, and matching utility/factory/policy suites.

**Implementation:**

1. Add a Svelte component-ignore regression for ordered positive/negative
   patterns and caller file narrowing. Replace the copied negation logic in
   `resolveSvelteComponents` with
   `withoutIgnores(narrowFiles(svelteComponentFiles, files), ignores)` using the
   existing utility. Preserve pattern order and its intersection/union behavior.
   Verify re-included components regain the expected source-feature rules,
   while truly ignored components and unsupported suffixes retain their routes.
2. Treat that correction as an explicit R1 behavior change. Record the exact
   affected file/rule scopes and any justified snapshot delta. Establish the
   corrected baseline before assessing the pure refactors; never label the
   entire stage behavior-preserving.
3. Compare the six historical `isRecord` definitions and their actual needs.
   Share a small neutral guard where import direction and runtime dependencies
   remain sound. Do not make production import tests/scripts, eagerly load
   optional peers, or add a heavy common utility layer merely to erase copies.
   Explain any intentionally retained boundary-local guard.
4. Replace repeated per-feature exception conditions with iteration over the
   existing role feature map/type. Preserve emitted order, enabled-feature
   guards, file intersections, and typed behavior; D4/D10 exceptions must retain
   their approved policy.
5. Extract a small source-plugin builder helper for the eight repeated shapes
   and use it for specialized builders only where their extra blocks remain
   explicit. Preserve setup registration versus rule-file scope, block names,
   order, `withSvelteComponents`, files/ignores, overrides, and lazy optional-peer
   loading. Keep named authored maps visible; avoid a generic configuration
   framework or dynamic policy discovery.
6. Do not relocate Package JSON versus enforce-package-type registration just
   for uniformity. First prove identical effective registration, including
   files outside the feature; otherwise retain the deliberate distinction.

**Exit criteria:** Re-inclusion is directly tested and its delta documented;
all remaining refactors have zero additional policy/snapshot/diagnostic/fix
delta. Factory, feature-toggle, narrowed-scope, optional-peer, and full validation
pass. Explain retained duplication when it protects a real dependency boundary.

## Stage 11: derived maps, test boundaries, and local suppressions

**Findings:** R3, R4, R5. Preserve D7's AST-name suppressions, D9's opaque-data
exception, and D10's test security-review coverage.

**Primary locations:** Functional/SonarJS/TypeScript typed maps and off guards,
typegen registration, `tests/support/`, policy/effective-config helpers, and
suppression-heavy package/test files.

**Implementation:**

1. Derive typed-off maps from the keys of explicit authored typed/replacement
   maps where the classification is equivalent. Do not enumerate upstream
   recommended/all rules, enable future rules, or erase distinct typed guards.
   Node's `no-sync` guard has special JS versus TS behavior and must not become
   a universal typed-only policy.
2. Review typegen's plugin list against runtime registration. Share a neutral
   declarative catalog only if it avoids eager optional imports and preserves
   namespaces, generated declarations, and public behavior. An existing guarded
   list can remain if sharing would create worse coupling; record the reason.
3. Add one typed boundary for `calculateConfigForFile` results and migrate the
   repeated unsafe casts to it. Account for `undefined`/ignored files and the
   shape each caller actually consumes. Centralize the justified cast rather
   than claiming an unchecked stronger return contract.
4. Share common resolved-config access across support/description/policy
   helpers. Keep thin semantic wrappers when lint assertions, snapshot rendering,
   or description responsibilities genuinely differ. Preserve fatal-parser
   handling and assertion quality; do not collapse them into one giant helper.
5. Rename internal test helper options `tsTypeChecked` → `typeChecked` and
   `reactRefreshVariant` → `refresh`, aligned with the public option vocabulary.
   Preserve the helper's intentional default `false` for typed linting and
   existing all-feature defaults. This is not a public API or default migration.
   Update all call sites and the stale unused-variable example to an active
   package rule.
6. Inventory whole-file disables, especially `tests/package/contract.test.ts`
   and Security test directives. Narrow to the reviewed operation where
   feasible, with concise English reasons explaining the trusted path/key
   boundary. Retain justified file-wide cases when truly pervasive and explain
   them. Preserve unrelated suppressed rules and synchronous opaque contracts;
   do not silence test Security policy globally or replace AST-key comments.

**Exit criteria:** Shared boundaries have meaningful tests, existing callers and
helper defaults behave identically, typed/untyped scopes and optional peers are
unchanged, and suppressions remain justified. Full validation passes with zero
effective-policy/snapshot/consumer-diagnostic delta. Record any intentional
boundary-local duplication retained after review.

## Stage 12: dead entries and consistent scripts/hooks

**Findings:** R6, R8. D13 already owns deprecated entries and the maximum alias.

**Primary locations:** `src/globs.ts`, imports resolver setup, TypeScript
replacements, `package.json`, Husky hooks, CI/publish workflows, contributor
commands, and script/watch/package tests.

**Implementation:**

1. Remove the ineffective yarn.lock JSON ignore only after confirming the JSON
   block still matches JSON files only. Make the always-present
   `tsconfigRootDir` resolver project value unconditional, preserving the value.
2. Review the duplicate native `no-unused-vars` off entry against core ownership,
   authored inventory, effective tuple options, and preceding-consumer configs.
   Remove only if those remain identical; scalar and array `off` forms need not
   imply identical inherited effective options. Keep the non-deprecated core
   owner explicit and explain any necessary retained replacement entry.
3. For `prepublishOnly`, inspect actual local and workflow publishing paths,
   npm script settings, and tarball behavior. Retain the explicit release gate.
   `.npmrc`'s `ignore-scripts` alone is not proof that the lifecycle guard is
   useless in every caller context. Remove only a proven redundant path; retain
   justified defense with a reason rather than weakening publication checks.
4. Resolve the unsupported `test:coverage` command. At the recorded dependency
   set no coverage provider is installed: prefer removing the unusable command
   and stale references rather than adding an unrequested dependency. Recheck
   current dependencies before acting and retain supported behavior if changed.
5. Consolidate lint-staged formatting for every format supported by CI,
   including JSON/JSON5, YAML, HTML, and Svelte. Run ESLint only for formats and
   files supported by the current configuration; YAML formatting does not
   authorize introducing a YAML lint parser. Preserve Markdown/package linting.
   Avoid overlapping concurrent tasks editing the same staged file.
6. Keep generation once in `validate`, while standalone build and typecheck
   remain self-sufficient. Use a small `:built`/prepared command composition if
   needed; prove generated declarations cannot be stale. Remove `check:commit`
   only if the hook directly invokes the same supported lint-staged command and
   all references are updated. Keep pre-push tests and existing safety gates.
7. Exercise real staged representatives in an isolated test checkout for the
   hook formats, including partially staged content. Verify formatting/lint
   sequencing, unstaged-content preservation, failure exit status, and full
   validation. Keep tests proportionate to behavior; do not assert script text
   merely to mirror implementation.

**Exit criteria:** Supported standalone commands and full validation pass; hook
coverage matches CI capabilities; staged files are handled without races or
scope loss; generation and publication gates remain reliable. Zero consumer
policy/snapshot delta. Record removed entries and retained lifecycle defenses
with evidence.

## Stage 13: documentation and source conventions

**Findings/decisions:** R9, R10; D16 = B; D17 = B. Earlier stages must already
document their own behavior changes. This stage reconciles the complete result.

**Primary locations:** `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, current cloud
setup, repository config comments, builders/public type documentation, shared
rule options, and SonarJS scope regressions.

**Implementation:**

1. **D16:** Retain all eighteen AWS CDK error checks in their existing SonarJS
   scope without a root-manifest gate. Preserve the English reason above the
   seventeen-entry group and the separately grouped IAM rule. Test a workspace
   child/optional-dependency case where the root manifest does not declare CDK
   but the checked code still reports. Do not widen feature/typed scopes or add
   manifest detection just to make the test pass.
2. **D17:** Retain the twenty reviewed test-rule entries at current scopes and
   severities, including the existing typed guard for `assertions-in-tests`.
   Keep the English scope comment. Test recognized cases in alternate names
   such as `__tests__/check.*` and `test/check.*`, beyond `.test`/`.spec`, with
   negative controls. Do not narrow the group to the shared test-file role or
   broaden that role as a workaround. Historical timing is not proof of a safe
   coverage reduction.
3. Reconcile README ownership language with replacement owners and approved
   complementary checks; warn-level limits, compiler contract, source maps,
   generated ignores, function conventions, conditional metadata, and supported
   Svelte filenames must match implemented behavior. Preserve public options,
   minimum-peer instructions, and the actual tested usage example.
4. Align cloud setup's Node value with `.nvmrc` and use `npm run prepare`
   consistently in contributor instructions. Correct the repository
   naming-convention comment to describe its actual typed scope. If the
   historical `docs/rewrite/record.md` still exists, correct its obsolete
   replacement-block statement; do not recreate a deleted historical document.
5. Document current non-deprecated rule inventory, D18 paths and category
   exceptions, source/test/ambient ownership, local suppression standards,
   quantitative warnings, and fixed/complementary owner comments. Recheck all
   current references after the moves.
6. Apply D3's starred documentation consistently to builder/API descriptions;
   use line comments for implementation explanations. Preserve ordinary grouped
   line comments and paragraph breaks. Normalize final periods and formatter
   wrapping without rewriting meaning or adding redundant commentary.
7. Replace vague TypeScript-disabled reasons with compiler diagnostic ownership
   only where the stated compiler contract actually guarantees that diagnostic.
   Retain semantic exceptions and `Complemented by` where coverage differs.
8. Document one meaningful option-layout convention compatible with the
   existing Perfectionist newline partitions. Do not let cosmetic blank lines
   accidentally change sorting partitions. Preserve option values and any
   semantically significant ordering; remove meaningless unset-key grouping.
9. Use `satisfies RuleOptionOf<...>` for shared option objects where useful;
   shared core/extension options may satisfy an intersection only when both
   schemas support them. Preserve literal inference (`as const` where needed)
   and explicit undefined option semantics. Do not force native-only options
   into extensions or remove proven formatter compatibility guards.

**Exit criteria:** Docs and examples match the implemented package; D16/D17
security/alternate-filename coverage is proved; formatting and full validation
pass. No runtime rule value/scope or consumer compiler-contract change is
introduced by this consistency pass. If emitted documentation changes, review
that artifact difference separately from executable/policy behavior.

## Stage 14: final consumer verification and closure

**Scope:** All D1–D19 decisions and P1–P11/R1–R11 findings. This is a final
acceptance stage, not a license for another broad refactor.

**Implementation:**

1. Reconcile every ledger row and the coverage map below with actual commits,
   tests, and handoffs. No stage is complete solely because an isolated probe
   or a previous AI said it passed. Close remaining implementation gaps through
   their owning stage and rerun affected checks.
2. Run a clean build and the complete current validation pipeline. Inspect the
   actual pack contents and exercise external-cwd packed consumers, runtime
   exports/declarations, README configuration, and minimum supported optional
   peers using the repository's existing consumer/CI mechanisms. Record which
   supported runtimes and peer combinations ran locally versus only in CI.
3. Run the final combined-rule harness across JavaScript, typed/untyped
   TypeScript, typed TSX, supported Svelte files, HTML, Markdown, JSON, and
   package manifests as applicable. Require stable fixes/formatting, no circular
   warnings/crashes, preserved behavior, and only approved complementary
   overlaps. Every temporary Stage 1 defect characterization must be gone.
4. Recheck feature toggles, narrowed/ignored files, caller global negations,
   override precedence, optional-peer absence, alternate test filenames,
   root/nested generated directories, and inherited deprecated-rule behavior.
5. Review the cumulative policy delta against the implementation starting SHA.
   Map every changed setting/scope/artifact to a confirmed decision or the R1
   Svelte-negation correction. Structural stages must contribute no additional
   unexplained drift. Inspect final authored rule/deprecation/option coverage.
6. Record P10 explicitly: expanding the consumer compiler contract to
   `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, or
   `noFallthroughCasesInSwitch` was not approved. Retain the documented
   `strict`, `noImplicitReturns`, and `allowUnreachableCode: false` contract.
   Do not use unchecked-index protection as a substitute for trust validation
   or remove Security review rules on that basis.
7. Update this ledger and append an implementation-completion record to the
   audit, linking actual stage evidence while retaining the original dated
   findings/decisions. Distinguish completed implementation from temporary
   upstream restoration conditions. If PR delivery is requested, inspect the
   complete diff, honor hooks, commit/push, create/link the PR, and report local
   verification separately from remote CI. Do not publish or merge implicitly.

**Exit criteria:** Every confirmed decision is implemented and verified; all
findings are resolved or have a documented retained boundary/explicitly
out-of-scope disposition; local required checks pass; cumulative differences
are explained. The temporary conditions below remain visible until independently
verified, even when the implementation stages are complete.

## Temporary upstream restoration conditions

| Condition                                 | Current approved policy                                                           | Evidence required before changing it                                                                                                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D8.10 TypeScript RegExp-execution autofix | TypeScript rule scalar off; active RegExp owner; Sonar off reason matches reality | Test the actual corrected dependency combination, inherited global flags, match/exec result arrays, computed access, repeated fixes, and restored unique diagnostics; update comments/tests/docs together                    |
| D11.2 Markdown GFM autolink positions     | Five named explicit scalar-off entries; other Markdown policy retained            | Test the actual corrected dependency combination on every recorded crashing case, including `[https://example.com]`, then each restored rule's unique diagnostics/fixes, GFM/front matter/math, feature scopes and overrides |

A new version number alone is not proof of a fix. These conditions do not
authorize a dependency upgrade during an unrelated stage. Keep the disabled
entries and cause comments until the evidence supports restoration and the
change is made within the maintainer's requested scope.

## Decision and finding coverage

This index makes omissions visible. Consult the final audit choice, not its
earlier recommendation, for each entry.

| Audit item                               | Owning stage(s)          | Disposition                                                                  |
| ---------------------------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| D1, D2                                   | 2                        | Approved convergence options                                                 |
| D3                                       | 3                        | Custom arrow/documentation/spacing policy and semantic exceptions            |
| D4, D5, D6, D7, D7 AST-name follow-up    | 4                        | Passing forms, conditional metadata, names; retain local AST suppressions    |
| D8.1, D8.2, D8.3, D8.4, D8.5, D8.6       | 5                        | Verified owners or complementary coverage, including accepted D8.5 trade-off |
| D8.7, D8.8, D8.9, D8.10, D8.11, D8.12    | 5                        | API consistency, retained coverage, temporary unsafe-fix exclusion           |
| D9, D10.1, D10.2                         | 6, 11                    | Retain review policy; narrow justified suppressions                          |
| D11.1, D11.2, D11.3                      | 6                        | HTML correction, temporary Markdown exclusions, Svelte routing               |
| D12, D13.1, D13.2, D14, D19              | 7                        | Consistent severity/inventory/ignores/explicit assignments                   |
| D15                                      | 8                        | No published source maps                                                     |
| D16, D17                                 | 13                       | Retain broad diagnostic coverage with evidence/comments                      |
| D18.1, D18.2, D18.3, D18.4, D18.5, D18.6 | 9                        | Approved structural migrations only                                          |
| P1                                       | 1–3                      | Stable combined fixes and formatting                                         |
| P2                                       | 4                        | Passing forms and negative controls                                          |
| P3                                       | 1, 5                     | Correct ownership and explicit complementary overlaps                        |
| P4                                       | 6, 11                    | Final retained-review choices supersede removal proposals                    |
| P5                                       | 5–6                      | Unsafe-fix/crash exclusions and parser/HTML corrections                      |
| P6, P7, P8, P11                          | 7                        | Quantitative severity, deprecated policy, ignores, explicit updates          |
| P9                                       | 13                       | D16/D17 reject proposed scope reductions                                     |
| P10                                      | 14                       | Existing compiler contract retained; expansion outside approved scope        |
| R1, R2                                   | 10                       | Scoped consolidation plus explicit Svelte-negation correction                |
| R3, R4, R5                               | 11                       | Authored derivation, shared test boundaries, reviewed suppressions           |
| R6, R8                                   | 12                       | Remove proven dead paths; preserve release/hook guarantees                   |
| R7                                       | 8                        | D15 package-artifact choice                                                  |
| R9, R10                                  | Every affected stage; 13 | Accurate current docs and conventions                                        |
| R11                                      | 9                        | D18 ownership layout                                                         |

## Required handoff after each stage

Append a record below, retaining previous evidence. Update the ledger status to
**Complete** only when the exit criteria pass; otherwise use **In progress** and
state the remaining work. Do not invent future commit hashes or test outcomes.

```text
Stage: <number and title>
Status: <Complete / In progress>
Stage-entry commit: <actual SHA>
Implementation commit(s): <actual SHA(s), or uncommitted>
Decisions/findings covered: <IDs>
Changes and rationale: <behavior and ownership; important trade-offs>
Tests/commands: <actual commands, runtime, results, retries>
Policy/snapshot delta: <expected entries or verified zero; baseline SHA>
Artifacts/consumer compatibility: <actual checks and limitations>
Retained exceptions/upstream conditions: <precise reason and owner>
Unrelated work preserved: <relevant status information>
Remaining work: <none for completed stage, or concrete failing exit criteria>
Next stage: <number, prerequisites, current paths>
PR/CI: <only if requested; URL and local versus remote status>
```

### Reusable instruction for a future AI

```text
Implement Stage <N> of AUDIT_RESULT_FOLLOW_UP_IMPLEMENTATION.md.
Read CODING_PRINCIPLES.md, the final maintainer choices in AUDIT_RESULT.md,
current repository instructions, and the latest stage handoff first.
Complete only this stage, including its regressions, required validation,
documentation, policy review, ledger update, and evidence-based handoff.
Preserve unrelated work and all behavior outside the approved stage delta.
Communicate with me in Indonesian; keep repository records/comments in English.
If a new policy decision is necessary, recommend an option and compare code
and resulting behavior before requesting that decision.
Do not continue to Stage <N+1> or publish/merge/release without my instruction.
```

### Execution records

#### Stage 1 — baseline and combined-rule regression harness

- **Status/date:** Complete, 21 October 2026.
- **Stage-entry commit:** `008a08207f28441297a2476b4798136aeb1023de`.
  The worktree was clean on `t3/bc96dba3`, matching `origin/main`.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** Stage 1's guard for P1–P3; D1/D2 and D3
  loop characterizations; retained complementary checks from D8.4, D8.6,
  D8.8, D8.9, D8.11, D8.12, and the existing export-placement/grouping owners.
  P2's policy corrections remain assigned to Stage 4.
- **Changes and rationale:** Added `tests/policy/fix-convergence.ts` and
  `fix-convergence.test.ts`. The runner uses the built public factory in a real
  temporary project and records complete reports before fixes, after fixes,
  and after the package formatter, through two full cycles. It exercises
  JavaScript, typed TypeScript, JSX/TSX, and JavaScript/TypeScript scripts in
  Svelte components. A typed-only comparator report verifies that TypeScript
  services are actually active. Warning types/codes are captured in an isolated
  Node process; listener counts and warnings outside the cycles are checked.
  Controls detect text changes hidden by formatting, changed diagnostics,
  real unexpected warnings, and nested diagnostic ranges; parser failures and
  ignored files are rejected. Complementary overlaps are reviewed by named
  sample and individual rule IDs, with their distinct concerns; unreviewed
  samples/rules receive no namespace-wide exemption. Contributor instructions
  explain how to run and extend the suite. README consumer examples now run
  sequentially: their existing `it.concurrent` registration spawned several
  ESLint/TypeScript processes even with one Vitest worker. All examples,
  assertions, isolation, and 120-second timeouts are retained.
- **Runtime/dependencies:** Node.js `24.22.0` from `.nvmrc`, npm `11.19.1`,
  ESLint `10.12.0`, TypeScript `6.0.3`, typescript-eslint `8.70.0`, Vitest
  `5.0.3`, Prettier `3.9.10`, `@cravingmaker/prettier-config` `0.3.2`,
  Import X `4.17.1`, Perfectionist `5.12.1`, RegExp `3.3.1`, Unicorn
  `77.0.0`, Promise `7.3.0`, Security `4.2.0`, SonarJS `4.2.2`, and Stylistic
  `5.10.0`. Dependency versions and the lockfile are unchanged.
- **Tests/commands:**
  - `npm ci` and `npm run prepare`: passed; npm reported zero vulnerabilities.
  - Stage-entry `npm run validate`, with `NODE_OPTIONS=--max-old-space-size=4096`
    and `VITEST_MAX_WORKERS=1`: passed, **62 test files / 1,787 tests**, plus formatting,
    build, generated types/typechecking, Knip, zero-warning repository lint,
    packed consumers, Publint, and Are the Types Wrong. No baseline retry.
  - `node scripts/policy-diff.ts --base 008a08207f28441297a2476b4798136aeb1023de`: all **33 effective snapshots**
    matched before implementation, using the existing build.
  - `npx vitest run tests/policy/fix-convergence.test.ts`, with the same environment:
    **33 tests passed**. Development
    probes established the exact loop outputs; fixture filenames avoid
    TypeScript's same-stem `.ts`/`.tsx` project-service exclusion, and Node
    imports use the installed Node declarations in the temporary project.
  - `npx tsc --noEmit`, `npm run knip`, and explicit ESLint checks of all three
    changed TypeScript files and the updated documentation: passed.
  - The first completion `npm run validate` attempt with one worker passed all
    **1,820 tests**, but the existing package-install suite's `afterAll` cleanup
    exceeded its unchanged 10-second hook timeout. The pipeline failed; this
    is not counted as a validation pass.
  - A retry at the repository's standard two-worker limit hit the unchanged
    120-second timeout in twelve existing README example tests. That failed
    run was cancelled, and its remaining processes and temporary consumers
    were cleaned up. This host has 8 GiB of RAM; the package suites also
    start multiple ESLint processes. No assertion or timeout was changed.
  - Another single-worker attempt with `UV_THREADPOOL_SIZE=16` exposed the
    remaining within-file README concurrency and was stopped before adjusting
    that suite's scheduling. The final retry retains the 4 GiB heap and one
    test-file worker, with additional filesystem workers for consumer cleanup.
  - Final `npm run validate`, with `NODE_OPTIONS=--max-old-space-size=4096`,
    `VITEST_MAX_WORKERS=1`, and `UV_THREADPOOL_SIZE=16`: passed, **63 test files /
    1,820 tests**, including all **33 new harness tests** and the existing
    README/packed-consumer suites, plus formatting, build, generated types,
    typechecking, Knip, zero-warning lint, Publint, and Are the Types Wrong.
  - `npm run policy:diff -- --base 008a08207f28441297a2476b4798136aeb1023de`:
    passed; all **33 effective snapshots** match the stage-entry commit and
    the lockfile resolves the same packages. `git diff --check` also passed.
- **Policy/snapshot delta:** Verified zero against the stage-entry SHA; no
  runtime policy or snapshot edits. This is also Stage 1's cumulative
  implementation baseline.
- **Artifacts/consumer compatibility:** Both entry and completion validation
  passed the existing packed-consumer and README suites. Public options/exports, ESM output,
  optional peers, feature scopes, and generated artifacts are unchanged;
  generated `dist/` and `src/typegen.d.ts` are excluded from the commit.
- **Retained exceptions/upstream conditions:** D1 and D2 are exact known-defect
  characterizations owned by **Stage 2**; D3 is owned by **Stage 3**. The mixed
  D1/D2/D3 sample must be updated in both stages. The Svelte escape cases belong
  to Stage 2. All currently reproduce circular-fix warnings and remaining
  fixable reports; none claims that a loop is resolved. D8 complementary
  overlaps retain the maintainer's approved coverage. The D8.1 equality overlap
  control records a remaining duplicate for **Stage 5** to replace with its
  single-owner assertion; the independent unreviewed-sample and same-namespace
  rule controls must remain. Other stages' restoration
  conditions and policy decisions are untouched.
- **Unrelated work preserved:** The initial tree was clean. Changes are limited
  to the two harness files, README consumer scheduling, contributor instructions,
  and this ledger/handoff.
- **Remaining work:** None within Stage 1; requested commit/PR delivery follows
  this validation record. Do not start Stage 2 without the next instruction.
- **Next stage:** Stage 2, D1/D2: the RegExp stylistic map at
  `src/configs/plugins/regexp/rules/stylistic-issues.ts`, the existing Unicorn
  escape policy, `src/configs/plugins/import-x/rules/style-guide.ts`, and
  Perfectionist's import policy. Replace the D1/D2, mixed, and Svelte baseline
  assertions with the approved convergence checks while retaining D3's Stage 3
  characterization.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.

#### Stage 2 — escape-case and import-spacing convergence

- **Status/date:** Complete, 21 October 2026.
- **Stage-entry commit:** `48ed7d1548a79465b0bd70d048ccf187c1d049e7`.
  The worktree was clean on `cravingmaker/implement-audit-stage-two`, matching
  `origin/main` and containing the completed Stage 1 handoff.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D1 = A; D2 = A, including the maintainer's
  explicit 21 October follow-up approving `exactCount: false`.
- **Changes and rationale:** RegExp's hexadecimal and Unicode escape casing
  now agrees with Unicorn's uppercase policy. Import X ignores comments as
  import boundaries and retains `count: 1` as a minimum. The maintainer approved
  disabling exact spacing after the existing combination rejected multiline
  documentation, which Unicorn requires. Perfectionist still sorts across
  comments with its original grouping and `partitionByComment: false`. Rule
  categories/counts, README/contributor guidance, and D2's decision record now
  describe these settings. No declaration comments or fixtures were relocated,
  compacted, or suppressed in the final change.
- **Regression coverage:** Replaced D1/D2 characterizations with positive
  repeated ESLint–Prettier checks for JavaScript, typed TypeScript, and Svelte
  scripts. Added hexadecimal/Unicode string values, comments between imports,
  a following comment, multiline documentation, an ordinary following
  statement, and a combined D1/D2 sample. The installed-package regression
  checks JavaScript and untyped TypeScript with uppercase escapes, sorted
  imports, unchanged multiline documentation, stable second fixes, and no
  diagnostics or warnings in a consumer without optional peers.
- **Runtime/dependencies:** Node.js `24.22.0` from `.nvmrc`, npm `11.19.1`,
  ESLint `10.12.0`, TypeScript `6.0.3`, typescript-eslint `8.70.0`, Vitest
  `5.0.3`, RegExp `3.3.1`, Import X `4.17.1`, Unicorn `77.0.0`, Perfectionist
  `5.12.1`, Prettier `3.9.10`, and `@cravingmaker/prettier-config` `0.3.2`.
  Dependency versions and the lockfile are unchanged. Test commands use
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16` on this host.
- **Tests/commands:**
  - `npm ci` and `npm run prepare`: passed; npm reported zero vulnerabilities.
  - Stage-entry `npm run build` followed by
    `npx vitest run tests/policy/fix-convergence.test.ts`: all **33 tests passed**.
  - Before the initial policy changes,
    `npx vitest run tests/configs/regexp.test.ts tests/policy/fix-convergence.test.ts`
    failed **15 of 49 tests**, reproducing the escape/import defects.
  - Intermediate targeted runs exposed the multiline-documentation conflict
    in existing React fixtures. Against the preceding `exactCount: true` build,
    `npx vitest run tests/policy/fix-convergence.test.ts -t 'multiline documentation'`
    then failed both new JavaScript/TypeScript cases. The maintainer-approved
    exact-count correction preserves the original documentation layout.
  - After rebuilding, `npx vitest run tests/policy -u`: **13 files / 1,152 tests
    passed**, including all **43 convergence/harness tests**; **14 snapshots**
    were updated through the supported process.
  - Explicit ESLint checks of every changed TypeScript/source/documentation
    file with `--max-warnings 0`: passed.
  - `npx vitest run tests/configs/regexp.test.ts tests/configs/imports.test.ts tests/configs/perfectionist.test.ts tests/package/install.test.ts`:
    **4 files / 33 tests passed**, including consumers without optional peers,
    with a partial peer set, and with all optional peers.
  - The first completion `npm run validate` passed formatting, build, typecheck,
    and Knip, then found missing import-to-statement blank lines in
    `src/configs/plugins/react/index.ts` and `tests/utilities.ts`. The new minimum
    spacing requires one added blank line in each file; no code/comment content
    changed.
  - The next `npm run validate` passed every static check and **1,833 tests**,
    but the existing regular-UI watcher comparison failed on
    `tests/fixtures/sample.ts` (**1 failed / 1,833 passed** across 63 files).
    `npx vitest run tests/vitest-watch.test.ts --maxWorkers=1` passed both tests
    without edits. No watcher source, assertion, timeout, or hook was changed;
    the final complete retry used the same environment.
  - Final `npm run validate`: passed **63 test files / 1,834 tests**, including
    all **43 convergence/harness tests**, README and packed-consumer suites,
    formatting, build, generated types/typechecking, Knip, zero-warning
    repository lint, Publint, and Are the Types Wrong. No assertion, timeout,
    worker coverage, or hook was weakened to obtain this pass.
  - `npm run policy:diff -- --base 48ed7d1548a79465b0bd70d048ccf187c1d049e7`:
    passed; only the four approved options differ in **14 snapshots**, with
    **19 unchanged** and unchanged dependencies. The cumulative check used
    `node scripts/policy-diff.ts --base 008a08207f28441297a2476b4798136aeb1023de`
    and reported the same decision-mapped delta. `git diff --check` passed.
- **Policy/snapshot delta:** The built policy comparison against the stage-entry
  SHA reports **14 changed / 19 unchanged** snapshots, no additions, removals,
  failures, or dependency changes. Every changed snapshot was also checked
  against the exact expected four-option transformation: only
  `regexp/letter-case`'s `hexadecimalEscape`/`unicodeEscape` become `"uppercase"`,
  and `import-x/newline-after-import`'s `considerComments`/`exactCount` become
  `false`. All other snapshot lines are unchanged. The cumulative comparison
  against the implementation starting point
  `008a08207f28441297a2476b4798136aeb1023de` reports the same four approved
  option changes in the same **14 changed / 19 unchanged** snapshots, with
  unchanged dependencies.
- **Artifacts/consumer compatibility:** The final full gate passed the existing
  packed-consumer, minimum-peer, README, public API/type, Publint, and ESM
  declaration checks. Public options/exports, optional-peer loading, feature
  scopes, block names/order, and consumer overrides are unchanged. Generated
  `dist/` and `src/typegen.d.ts` remain excluded from the commit.
- **Retained exceptions/upstream conditions:** D3's standalone and mixed
  module-spacing characterizations remain owned by **Stage 3**. The mixed case
  now requires only the D3 fixable report and rejects D1/D2 reports. Existing
  D8 overlap exceptions and the Stage 5 equality control are unchanged.
- **Unrelated work preserved:** The initial tree was clean. The final scope is
  the two owning rule maps, two required import-spacing fixes, Stage 2 regressions,
  the fourteen reviewed snapshots, affected guidance, and this
  decision/ledger/handoff update. No dependency,
  public API, feature scope, override composition, or other stage is changed.
- **Remaining work:** None within Stage 2; requested commit/PR delivery follows
  this validation record.
- **Next stage:** Stage 3, D3: core function-style policy, Stylistic padding,
  Perfectionist module sorting, Unicorn documentation-comment policy, and
  `tests/policy/fix-convergence.test.ts`. Read the complete D3 decision before
  replacing the remaining characterizations; no Stage 3 work is included here.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.

#### Stage 3 — arrows, starred documentation, and function spacing

- **Status/date:** Complete, 21 October 2026.
- **Stage-entry commit:** `e4325397d3ee57c150114d523536da643afcb4f1`.
  The worktree was clean on `cravingmaker/implement-audit-stage-3`, matching
  `origin/main` and containing the completed Stage 2 handoff.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D3, the confirmed custom policy.
- **Changes and rationale:** The bundled internal
  `@cravingmaker/prefer-arrow-functions` rule owns ordinary function style in
  the JavaScript feature, including declarations, expressions, assignments,
  returns, exports, callbacks, async functions, and TypeScript wrappers.
  Native `func-style` and `prefer-arrow-callback` stay off because they cannot
  jointly express the approved exceptions without duplicate or unsafe reports.
  Expression style remains enforced by the internal owner, and core
  `arrow-body-style: ["error", "always"]` is unchanged. The new owner has no
  automatic fixes or editor suggestions: hoisting and function identity need
  review when converting.
- **Semantic exceptions:** Methods, accessors, constructors, generators,
  functions using their own `this`, `arguments`, or `new.target`, named
  recursive function expressions, and overload signatures/implementations retain
  their semantics. Constructor detection follows local identifier assignments
  and aliases, stops cycles, and recognizes `new`, inheritance, prototype access,
  and `Reflect.construct`. Only the defining function's names/bindings establish
  constructibility; constructing a parameter does not exempt the enclosing
  ordinary function. Nested arrows retain lexical ownership; nested
  ordinary functions, class fields, and static blocks have their own ownership,
  while computed field keys retain the enclosing receiver. Constructor contracts
  visible only outside the defining file require review and a scoped override.
- **Documentation and spacing owners:** Unicorn disables its asterisk-removal
  rule and enables `@cravingmaker/starred-documentation`, which fixes only
  multiline `/** ... */` comments, preserving paragraphs, relative example
  indentation, and CRLF. Ordinary grouped line comments and block comments
  remain unchanged. Stylistic's existing selector-based padding rule handles
  direct function variables, including any declarator, named exports, and
  transparent TypeScript wrappers. It excludes destructuring metadata, ordinary
  data, objects, and calls containing callbacks, and adds nothing at EOF or a
  closing brace. The installed rule skips `SvelteScriptElement` parents, so the
  internal `@cravingmaker/svelte-function-variable-padding` companion covers
  only those top-level script pairs, within the Stylistic feature's existing
  scope and override conventions. Native Stylistic owns nested statements;
  the companion has its own override ID and loads no optional peer.
- **Module spacing:** `perfectionist/sort-modules` retains ordering, groups,
  dependency detection, the overload-adjacency option, and all other options, while
  `newlinesBetween: "ignore"` also makes inherited `newlinesInside` ignore
  module-member gaps. This resolves the original no-op/circular fix, including
  its unstarred-comment variant. Import sorting/spacing remains unchanged.
  A direct TypeScript overload/documentation-paragraph probe retained
  `newlinesBetweenOverloadSignatures: 0` with no fixable report or warning.
- **Integration and migration:** Existing block names/order and feature scopes
  are preserved. The three internal policies live in their owning rule maps;
  existing JavaScript, Unicorn, and Stylistic blocks register the shared plugin.
  Rule generation loads its source before building, and inventory/generated-type
  checks include all three IDs. Category totals and capability comments,
  README/contributor guidance, repository documentation/function spacing, and
  eight fixtures are updated. A TypeScript AST-token comparison verified that
  all 55 checked migration-only files preserve their non-comment tokens.
- **Runtime/dependencies:** Node.js `24.22.0` from `.nvmrc`, npm `11.19.1`,
  ESLint `10.12.0`, TypeScript `6.0.3`, typescript-eslint `8.70.0`, Stylistic
  `5.10.0`, Unicorn `77.0.0`, Perfectionist `5.12.1`, Prettier `3.9.10`, and
  Vitest `5.0.3`. Dependency versions, peer ranges, and the lockfile are unchanged.
  Test commands use `NODE_OPTIONS=--max-old-space-size=4096`,
  `VITEST_MAX_WORKERS=1`, and `UV_THREADPOOL_SIZE=16` on this host.
- **Tests/commands and development evidence:**
  - `npm ci` and `npm run prepare`: passed; npm reported zero vulnerabilities.
    Stage-entry build and the existing convergence suite passed all **43 tests**.
  - Before policy edits, the new function-style/layout regressions failed
    **21 of 35 tests**, reproducing the missing arrow, documentation, and spacing
    coverage. Controls prove that native expression mode rejects semantic
    exceptions, the audit selector misses expression positions and rejects
    receivers, and global starred-block style also converts ordinary comments.
  - Targeted function/layout/convergence checks passed **97 tests** before the
    Svelte extension. A subsequent five-file component/policy run passed
    **195 tests**. Additional regressions cover feature-disabled, narrowed,
    ignored, and consumer-override cases, multiple/typed declarators,
    destructuring metadata, nested statements, EOF, documentation paragraphs,
    CRLF, module ordering, and an actual Unicorn comparator suggestion.
  - The runtime control evaluates receiver, arguments, constructor/new.target,
    and named-recursion examples before and after linting; both return
    `[3,2,true,6]` with no function rewrite.
  - `npx vitest run tests/policy -u` passed **13 files / 1,158 tests** after
    replacing every D3 loop characterization with positive convergence checks,
    including typed TypeScript, JSX/TSX controls, Svelte scripts, the original
    declaration cases, and the mixed D1/D2/D3 sample. Snapshots were updated only
    through the supported process and checked against the intended D3 entries.
  - An intermediate full `npm run validate` passed every static gate and
    **1,905 tests**; the new consumer sample needed multiline function bodies
    for the retained `max-statements-per-line` policy, and the existing regular
    UI watcher assertion failed on `tests/fixtures/sample.ts`. The sample was
    corrected; watcher code/assertions/timeouts were unchanged.
    `npx vitest run tests/package/install.test.ts tests/vitest-watch.test.ts --maxWorkers=1`
    then passed **2 files / 20 tests**. The final full gate is recorded below.
  - A subsequent full `npm run validate` passed **65 files / 1,909 tests** and
    every static/package gate. Final source review then found that constructor
    detection also considered parameter bindings. New JavaScript/TypeScript
    regressions failed both selected owner tests against that build. Filtering
    the function's declared variables to its own function-name definitions fixes
    the exemption in declarations, initializers, callbacks, and default exports.
    `npx vitest run tests/configs/core/function-style.test.ts tests/configs/function-layout.test.ts tests/policy/fix-convergence.test.ts`
    then passed **3 files / 117 tests**, retaining every semantic exception.
  - Explicit ESLint checks passed all **74 changed source/test/documentation
    files** outside the separately checked fixture project. Internal callback
    exceptions are limited to the operations/visitors that require them.
    A separate composed-fixer runtime probe returned `[3,2,true,6]` before and
    after all enabled fixes, emitted no arrow diagnostic, and had no second fix.
- **Final validation:** The full `npm run validate` rerun after the
  constructor-parameter regression fix passed **65 files / 1,909 tests**,
  formatting, build/generation, TypeScript, Knip, zero-warning repository lint,
  packed-consumer/minimum-peer checks, Publint, and ATTW's ESM profile.
- **Policy/snapshot delta:**
  `npm run policy:diff -- --base e4325397d3ee57c150114d523536da643afcb4f1`
  and the cumulative
  `node scripts/policy-diff.ts --base 008a08207f28441297a2476b4798136aeb1023de`
  both passed: **25 changed / 8 unchanged** snapshots, with no additions,
  removals, failures, or dependency changes. The stage delta consists only of
  the three internal rule IDs, their plugin registration and derived counts,
  the native function-style/asterisk owners becoming off, Stylistic's targeted
  padding options, and the module newline option becoming ignore. Core
  expression/callback options remain in the effective off entries. Every
  unrelated entry is preserved. The cumulative delta also retains Stage 2's
  four approved escape/import-spacing option changes.
- **Artifacts/consumer compatibility:** Public options/exports, ESM packaging,
  and optional-peer behavior retain their contracts. The installed-package
  regression runs JavaScript and TypeScript without optional peers and verifies
  the arrow diagnostic owner, starred documentation, function-variable padding,
  and stable second fixes. Generated `dist/` and `src/typegen.d.ts` are excluded
  from the commit; final package/minimum-peer checks are recorded with validation.
- **Retained exceptions/upstream conditions:** The module newline workaround
  remains until the upstream documentation-paragraph fixer is corrected. The
  Svelte companion remains until Stylistic supports script-element parents.
  All Stage 1 temporary loop characterizations are replaced. D8 overlaps and
  later-stage decisions remain unchanged.
- **Unrelated work preserved:** The initial tree was clean. No dependency,
  compiler contract, public feature option, config block, release, or other
  implementation stage is changed.
- **Remaining work:** None within Stage 3; requested commit/PR delivery follows
  this validation record.
- **Next stage:** Stage 4, D4–D7 and the D7 AST-name follow-up: shared config-file
  exceptions, conditional Package JSON peer metadata, Functional tacit ownership,
  and typed TSX names. No Stage 4 work is included here.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.

#### Stage 4 — passing configurations, peer metadata, and typed TSX names

- **Status/date:** Complete, 21 October 2026.
- **Stage-entry commit:** `311598b92d56630842fa0b4056f0b6741ae77dc0`.
  The worktree was clean on `cravingmaker/implement-stage-4`, matching
  `origin/main` and containing the completed Stage 3 handoff.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D4 = A; D5 = B; D6 = A; D7 = A;
  D7 AST-name follow-up = B.
- **Changes and rationale:**
  - D4 adds `unicorn/no-top-level-side-effects` to the shared config-file role,
    conditional on Unicorn being enabled and retaining the existing source-file
    intersection. The redundant repository-only tool-config block is removed.
    Application modules still report; a following consumer config can restore
    the rule for tool configs.
  - D5 replaces the unconditional metadata requirement with the bundled,
    nonfixing `@cravingmaker/require-peer-metadata` rule. It checks root peer
    completeness only. Installed Package JSON validation already requires each
    metadata entry's boolean `optional`; it retains ownership of malformed or
    missing boolean values, while nonempty-field and relationship checks stay
    enabled. The new rule adds no conditional report to an existing empty or
    malformed metadata object. Peers remain optional; no-peer applications can
    omit metadata. The repository and lockfile root explicitly mark ESLint as
    required with `optional: false`; the manifest fixture covers required and
    optional peers without changing peer ranges.
  - D6 keeps Unicorn's callback-reference guard and disables Functional's tacit
    preference with the owner reason, including its type-aware off map. Explicit
    consumer enablement remains limited to typed scope. The obsolete local
    suppression in `src/utilities/plugin-policy.ts` is removed.
  - D7 adds one `typescript/rules-type-aware-tsx` block after the existing typed
    block. It changes only naming for function-valued `const` bindings and
    functions in typed `.tsx`, retaining the existing accepted formats,
    underscores, ordinary-data policy, other extensions, type-aware scope,
    parser routing, and feature/typed/user override precedence. The D3 arrow
    owner and typed promise checks remain active. AST-name property suppressions
    are retained; no whitelist, detector, or transitive enum dependency is added.
- **Internal integration:** The existing Package JSON setup block registers the
  shared internal plugin with the existing JSONC parser. The new rule uses the
  direct parser dependency's AST/listener types and a documented ESLint listener
  boundary assertion. Existing type generation and inventory tests cover its ID;
  no new public option, dependency, optional-peer requirement, or export is added.
  Existing block names/order are retained around the single new typed TSX block.
- **Runtime/dependencies:** Node.js `24.22.0` from `.nvmrc`, npm `11.19.1`,
  ESLint `10.12.0`, TypeScript `6.0.3`, typescript-eslint `8.70.0`, Package JSON
  `1.10.1`, Functional `10.0.1`, Unicorn `77.0.0`, and Vitest `5.0.3`.
  Locked package versions and peer ranges are unchanged. Commands use
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16` on this host.
- **Tests/commands and development evidence:**
  - `npm ci` and `npm run prepare`: passed; npm reported zero vulnerabilities.
    The stage-entry build and four owning feature suites passed **28 tests**.
  - Before source edits, D4's new scope/behavior regressions failed four cases
    and D5's missing/partial metadata and no-peer controls reproduced the
    unconditional requirement. Correcting the new TSX project's conflicting
    same-stem filenames exposed five intended PascalCase naming failures and
    the combined arrow/typed-control failure. A simple forwarding-arrow
    regression also failed against the unchanged Functional policy.
  - The first implementation run passed **8 files / 96 tests**. Expanded checks
    cover root/nested manifests, private/public manifests, absent/empty/partial
    metadata, required/optional booleans, existing shape/relationship errors,
    multiple missing peers, and feature/files/ignores/override controls.
  - The callback runtime regression retains `[2,4,6]` through composed fixes;
    directly passing the function with a default second parameter produces
    `[0,2,6]`. Consumer overrides can explicitly restore tacit preference in
    typed files only.
  - `npx vitest run tests/policy -u`: **13 files / 1,162 tests passed**;
    exactly **8 snapshots** were updated through the supported process.
  - The six-file integration run passed **106 tests** and found one new packed
    sample that omitted its imported dependency declaration, used ungrouped
    exports, and appended a manifest field out of order. Correcting that sample
    to preserve the consumer manifest, group exports, and retain field order
    made `npx vitest run tests/package/install.test.ts -t 'ships passing configs'`
    pass. Assertions and package policy were not weakened. The actual README
    Usage configuration also passed with no diagnostics in its external consumer.
  - The first pre-push run passed **65 files / 1,969 tests** and hit the existing
    regular-UI watcher comparison on `tests/fixtures/sample.ts`. The unchanged
    `npx vitest run tests/vitest-watch.test.ts --maxWorkers=1` then passed both
    tests. Watcher source, assertions, timeouts, worker coverage, and hooks were
    unchanged; this delivery retry is separate from the complete validation below.
- **Final validation:** `npm run validate` passed **66 test files / 1,970 tests**,
  formatting, build/generation, TypeScript, Knip, zero-warning repository lint,
  README and packed-consumer/minimum-peer suites, Publint, and ATTW's ESM profile.
  No timeout, assertion, worker coverage, or hook was weakened. Explicit ESLint
  checks passed all **27 changed source/test/documentation/manifest files**
  outside the separately checked fixture project and ignored lockfile;
  `git diff --check` passed.
- **Policy/snapshot delta:** The built stage-entry comparison reports **8 changed
  / 25 unchanged**, with no added, removed, or failed snapshots and unchanged
  locked packages. D4 changes only the config-file side-effect severity; D5 adds
  the internal conditional owner and disables the unconditional owner in two
  manifest snapshots; D6 disables tacit preference in five typed snapshots;
  D7 appends the two targeted naming entries in the typed TSX snapshot. Derived
  rule/severity totals are the only other differences. Every changed snapshot
  line was checked against this exact owner list. The final
  `npm run policy:diff -- --base 311598b92d56630842fa0b4056f0b6741ae77dc0`
  passed with the same result. The cumulative
  `node scripts/policy-diff.ts --base 008a08207f28441297a2476b4798136aeb1023de`
  also passed: **25 changed / 8 unchanged**, with no additions, removals,
  failures, or locked-package changes. Its rule IDs contain only the approved
  Stage 2, Stage 3, and Stage 4 owners.
- **Artifacts/consumer compatibility:** Existing public options/exports, ESM
  output, and optional-peer loading are preserved. The packed no-optional-peer
  regression verifies passing tool config, no-peer/explicit-peer manifests,
  forwarding callbacks, and typed PascalCase names with negative controls.
  Generated `dist/` and `src/typegen.d.ts` remain excluded from the commit.
- **Retained exceptions/upstream conditions:** The Stage 3 module-spacing and
  Svelte-padding conditions and later-stage D8 overlaps remain unchanged.
- **Unrelated work preserved:** The initial tree was clean; all changes belong
  to Stage 4 policy, regression coverage, affected documentation, or handoff.
- **Remaining work:** None within Stage 4; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 5, D8.1–D8.12: verified ownership, complementary checks,
  and safe execution preference. No Stage 5 policy is implemented here.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.
