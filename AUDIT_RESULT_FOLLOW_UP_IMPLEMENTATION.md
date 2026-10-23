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
| 5     | Verified ownership, complementary checks, safe execution preference       | D8.1–D8.12                       | 4          | Complete    |
| 6     | Retained review signals and known parser/fix failures                     | D9, D10.1–D10.2, D11.1–D11.3     | 5          | Complete    |
| 7     | Severity, deprecated entries/options, generated ignores, explicit updates | D12, D13.1–D13.2, D14, D19       | 6          | Complete    |
| 8     | Source-map-free package                                                   | D15, R7                          | 7          | Complete    |
| 9     | Source, test, and ambient declaration ownership                           | D18.1–D18.6, R11                 | 8          | Complete    |
| 10    | Production utility/builder consolidation and Svelte negations             | R1, R2                           | 9          | Complete    |
| 11    | Derived disabled maps, shared test boundaries, local suppressions         | R3–R5                            | 10         | Complete    |
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

**Implemented early (items 3 to 7):** At the maintainer's request on
23 October 2026, #142 made the scripts and hooks consistent with
`@cravingmaker/prettier-config` ahead of Stages 10 and 11. The hook calls
`lint:staged`, lint-staged covers every format without overlapping globs,
`validate` generates once, `test:coverage` is removed, and `prepublishOnly`
is retained for an `npm publish` that turns lifecycle scripts back on. The
pull request records the evidence. Items 1 and 2 remain for this stage.

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

#### Stage 5 — rule ownership, complementary checks, and safe fixes

- **Status/date:** Complete, 21 October 2026.
- **Stage-entry commit:** `90a360aed94bd2b006b6b21463002cf611b830a4`.
  The worktree was clean on `cravingmaker/implement-stage-5`; a fresh fetch
  confirmed that `origin/main` still matched this completed Stage 4 baseline.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D8.1–D8.12, following every final choice.
- **Changes and rationale:**
  - D8.1–D8.3 give strict equality (including null), direct/optional/indirect
    eval, and nested result branches their retained core owners. The redundant
    null, Security eval, and Unicorn simplification entries are explicitly off.
    Indirect eval remains prohibited; conditional-position ternary nesting is
    outside the selected rule's coverage, and simplification is manual.
  - D8.4, D8.6, D8.8, D8.9, D8.11, and D8.12 preserve all complementary rules,
    severities, options, type-aware scopes, and reciprocal explanation comments.
    Unique cases and shared reports are tested rather than inferred from names.
    Exact lowercase switch omission markers, non-union defaults, and union/enum
    exhaustiveness remain distinct requirements. Await, comparator, and Unicode
    preferences do not authorize behavior-changing mechanical migrations.
  - D8.5 disables core control-regex checking in favor of RegExp's static pattern
    analysis and explicitly accepts intentional constructor tab/newline escapes.
  - D8.7 enables the existing core syntax rule with the approved direct-Identifier
    Buffer constructor selector. Stage 3 uses the internal arrow owner, so there
    were no existing syntax selectors to overwrite. It preserves global/import/type restrictions
    and Node deprecation checking, without reviving either old constructor rule.
    Diagnostics have no fix or suggestion toward restricted Buffer APIs. Local
    classes still match by name; dynamic aliases and global-property calls are
    outside this selector. Encoding, coercion, and shared memory need manual
    consideration when converting code. No production Buffer call required
    conversion in this checkout.
  - D8.10 keeps the RegExp execution preference for manual review and makes the
    TypeScript entry scalar off in both active and fallback maps. SonarJS stays
    off with comments naming the active manual-review policy. The inherited
    global-match sample retains both matches through repeated composed fixes;
    the accepted computed-access diagnostic gap is explicit.
  - The Stage 1 equality assertion now verifies its single owner. A separate
    synthetic overlap control preserves the harness's nested-range detector.
    README/contributor guidance distinguishes replacements from complementary
    coverage and records all accepted boundaries and upstream conditions.
- **Runtime/dependencies:** Node.js `24.22.0` from `.nvmrc`, npm `11.19.1`,
  ESLint `10.12.0`, TypeScript `6.0.3`, typescript-eslint `8.70.0`, RegExp `3.3.1`,
  Unicorn `77.0.0`, Security `4.2.0`, Promise `7.3.0`, SonarJS `4.2.2`, Node
  plugin `18.4.1`, and Vitest `5.0.3`. Commands use
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. Dependencies, peer ranges, and compiler contracts
  are unchanged.
- **Tests/commands and development evidence:**
  - `npm ci`, `npm run prepare`, and the stage-entry `npm run build` passed;
    npm reported zero vulnerabilities.
  - The new regression matrix failed before the policy changes, including
    duplicate equality/eval/ternary reports, constructor fixes to restricted
    Buffer APIs, and the inherited-global-flags rewrite. Existing per-quantifier
    movement reports and type-service boundaries were checked against installed
    implementations when calibrating the sample expectations; retained rule
    settings were not changed to satisfy those expectations.
  - The five-suite targeted run passed **5 files / 813 tests**. Subsequent
    coverage adds null inequality, enum exhaustiveness, retained Buffer API
    restrictions, and a Unicode runtime control showing why adding `u` needs
    review. The Node deprecation control uses an explicit `node:buffer` import:
    default environments do not supply Node global bindings.
  - `npm run typecheck` and explicit changed-file ESLint checks passed during
    development. The supported `npx vitest run tests/policy -u` process updated
    **16 snapshots**; its first run found the deprecation-control fixture issue
    above, which was corrected without changing production policy.
  - The selected new ownership and packed-consumer regressions passed **2 files /
    472 tests**. The full gate below runs every test without filters.
- **Final validation:** `npm run validate` passed **67 files / 2,455 tests**,
  formatting, build/generation, TypeScript, Knip, zero-warning repository lint,
  README and packed-consumer/minimum-peer suites, Publint, and ATTW's ESM profile.
  Explicit ESLint checks passed all **17 changed source/test/documentation files**;
  `git diff --check` passed.
  No coverage, timeout, assertion, or hook was weakened.
- **Policy/snapshot delta:** Every changed snapshot line is one of exactly
  eight approved IDs, or a derived severity total: `no-eq-null`,
  `security/detect-eval-with-expression`, `unicorn/no-unnecessary-nested-ternary`,
  `no-control-regex`, `no-restricted-syntax`, `unicorn/no-new-buffer`,
  `security/detect-new-buffer`, and `@typescript-eslint/prefer-regexp-exec`.
  All other entries, including the six complementary groups, are unchanged.
  `npm run policy:diff -- --base 90a360aed94bd2b006b6b21463002cf611b830a4`
  passed: **16 changed / 17 unchanged**. The cumulative
  `node scripts/policy-diff.ts --base 008a08207f28441297a2476b4798136aeb1023de`
  also passed: **25 changed / 8 unchanged**.
  Neither report has new, removed, or failed snapshots or locked-package changes.
- **Artifacts/consumer compatibility:** The new packed no-optional-peer case
  checks selected owners, the active RegExp report, stable repeated fixes, and
  actual global/non-global match arrays. Full package validation passed.
  Public options/exports, ESM output, optional-peer loading, config block order,
  compatibility filtering, file scopes, and override precedence are preserved.
  Generated `dist/` and `src/typegen.d.ts` remain excluded from the commit.
- **Retained exceptions/upstream conditions:** TypeScript execution preference
  remains off until an actually corrected dependency combination passes inherited
  flags, match/exec result arrays, computed access, repeated-fix, and restored
  unique-diagnostic checks. RegExp can report unknown flags without proving a
  safe rewrite. Stage 3's module-spacing and Svelte-padding conditions remain.
- **Unrelated work preserved:** The initial tree was clean; all changes belong
  to Stage 5 policy, regressions, affected documentation, or this handoff.
- **Remaining work:** None within Stage 5; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 6, D9, D10.1–D10.2, and D11.1–D11.3: retained review
  signals and known parser/fix failures. No Stage 6 policy is implemented here.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.

#### Stage 6 — review signals and known parser/fix failures

- **Status/date:** Complete, 21 October 2026.
- **Stage-entry commit:** `ae66847b3ceaa1da85100c1c0c444dc9fbf85a39`.
  The worktree was clean on `cravingmaker/implement-stage-6`; a fresh fetch
  confirmed that `origin/main` matched this completed Stage 5 baseline.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D9 = B, D10.1 = B, D10.2 = B, and
  D11.1–D11.3 = A; the Stage 6 portion of P4/P5.
- **Changes and rationale:**
  - D9 retains the error severity, `allowAny: false`, all four function-kind
    checks, empty allowed-Promise names, and existing type-aware scope.
    Regression cases cover synchronous opaque data, hidden Promises,
    explicit Promise contracts, concrete synchronous returns, getters,
    independent unsafe-type checks, feature/typed boundaries, and an explicit
    uncertainty-policy override. Opaque-return reports have no fix or
    suggestion. The targeted synchronous rule-option suppression in
    `src/utilities/plugin-policy.ts` is retained.
  - D10.1/D10.2 retain both Security warnings throughout the current source,
    helper, and test scopes. Tests demonstrate reviewed and unreviewed dynamic
    operations, literal negative controls, feature boundaries, and local
    suppressions that leave later unrelated warnings visible. No test-role
    exception, test-glob expansion, or compiler-option change is introduced.
    `tests/configs/svelte-scripts.test.ts` now suppresses four inspected
    filesystem operations locally; `tests/policy/overlaps.test.ts` suppresses
    eight fixed-rule-ID lookup statements locally. Their former whole-file
    Security directives are removed; unrelated directives are preserved.
  - D11.1 sets only HTML's `selfClosingCustomPatterns` to `[]`, keeping `warn`
    and `selfClosing: "always"`. Explicit custom-element end tags survive
    composed fixes and formatting. Existing self-closing/missing-tag forms
    report without a guessed boundary fix; standard void-element fixes remain.
  - D11.2 keeps all twenty-one explicit Markdown IDs and sets the five approved
    entries to scalar `off`, with the exact version/cause/upstream comment and
    their capability annotations. Fourteen rules remain active; GFM, YAML
    front matter, math, scopes, and overrides are preserved. The usual feature
    sentinel is now `markdown/require-alt-text`; explicit `no-bare-urls`
    override behavior is tested separately on non-triggering input.
  - D11.3 narrows only the Svelte glob to `.svelte`, `.svelte.js`, and
    `.svelte.ts`. The extra `.svelte.mjs`/`.svelte.mts` suffixes remain ordinary
    sources, with normal diagnostics and conditional TypeScript services.
    They receive no Svelte rune/template support. Supported rune/component
    parsing, feature filtering, component roles, and optional peers remain.
  - README and contributor guidance describe the retained review policy,
    custom-element/manual-fix boundary, temporary Markdown coverage loss and
    restoration requirement, and supported Svelte filenames.
- **Runtime/dependencies:** Node.js `24.22.0` from `.nvmrc`, npm `11.19.1`, ESLint `10.12.0`,
  TypeScript `6.0.3`, typescript-eslint `8.70.0`, HTML plugin/parser `0.66.1`,
  Markdown `8.0.3`, Security `4.2.0`, Svelte `5.57.2`, svelte-eslint-parser
  `1.9.0`, Prettier `3.9.10`, and Vitest `5.0.3`. Validation uses
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. Dependencies, peer ranges, public options/exports,
  ESM output, and consumer compiler contracts are unchanged.
- **Tests/commands and development evidence:**
  - `npm ci`, `npm run prepare`, and the stage-entry `npm run build` passed;
    npm reported zero vulnerabilities.
  - Before policy changes, the HTML/Markdown/Svelte regressions reproduced
    the end-tag rewrite, missing manual-review warnings, GFM `getLoc()`
    exceptions, and extra-suffix parser failures, including a typed `.mts`
    case. The initial parser-name assertion was corrected to read Espree's
    `name` rather than assuming every parser supplies `meta.name`.
  - The first composed run exposed test-expectation issues: ESLint supplies
    schema defaults on disabled Markdown rules; Security recognizes a path
    built entirely from literals; and an explicitly `any` return differs from
    an inferred unsafe return. Tests now assert the intended severity and use
    actual temporary-path and independent inferred/explicit-type controls.
    No production policy was changed to satisfy those expectations.
  - The targeted config/factory/overlap run passed **9 files / 356 tests**:
    `npx vitest run tests/configs/html.test.ts tests/configs/markdown.test.ts
tests/configs/svelte.test.ts tests/configs/svelte-scripts.test.ts
tests/configs/security.test.ts
tests/configs/typescript/promise-function-async.test.ts
tests/factory/factory.test.ts tests/factory/feature-toggles.test.ts
tests/policy/overlaps.test.ts`.
  - `npx vitest run tests/package/install.test.ts -t 'ships Stage 6'` passed
    both new real-installed packed-consumer cases, with and without optional
    peers. They exercise Markdown crashes/retained diagnostics, HTML fix
    stability, opaque-return and Security review signals, ordinary typed
    extra suffixes, normal equality diagnostics, parser selection, and rune
    support only with the Svelte feature active.
  - `npx vitest run tests/policy -u` passed **14 files / 1,646 tests** and
    updated exactly **2 snapshots** through the supported process. Their
    complete diff contains only the approved entries described below.
  - `npx tsc --noEmit`, explicit ESLint checks of the changed source/test
    files, and `git diff --check` passed. Development formatting and lint fixes
    did not alter production policy beyond D11's three approved changes.
- **Final validation:** `npm run validate` passed **68 files / 2,526 tests**,
  formatting, build/generation, TypeScript, Knip, zero-warning repository lint,
  all README and packed-consumer suites, Publint, and ATTW's ESM profile.
  The test phase took approximately 22 minutes with one worker; it needed no
  retry. No coverage, assertion, timeout, or hook was weakened. The expected
  broken-optional-peer fixture's stderr is part of a passing negative test.
- **Policy/snapshot delta:** The stage-entry report
  `node scripts/policy-diff.ts --base ae66847b3ceaa1da85100c1c0c444dc9fbf85a39`
  reports **2 changed / 31 unchanged**, with no new, removed, or failed
  snapshots and no locked-package changes. The only changed rule entries are
  HTML's custom-pattern option and the five approved Markdown severities;
  derived severity totals change accordingly. Extra-suffix parser routing is
  tested directly, including a real typed project and packed consumers.
  The cumulative report against implementation starting point
  `008a08207f28441297a2476b4798136aeb1023de` reports **25 changed / 8 unchanged**,
  with no new, removed, failed, or locked-package changes. Prior entries map
  to D1/D2 convergence, D3 function/documentation/spacing, D4–D7 passing
  configurations/metadata/naming, and D8 ownership/safe fixes; this stage adds
  only the D11 HTML/Markdown settings above. Svelte routing remains covered
  directly because the existing snapshot paths use the supported suffixes.
- **Artifacts/consumer compatibility:** The new packed tests pass for actual
  npm-installed consumers with all optional peers and with none. Full package
  validation passed, including existing disabled/missing/partial/broken-peer
  cases, public declarations/exports, and pack contents. The dedicated CI
  matrix for advertised minimum peer versions has not been run locally.
  Generated `dist/` and `src/typegen.d.ts` remain excluded from the commit.
- **Retained exceptions/upstream conditions:**
  - D8.10: TypeScript RegExp execution preference remains scalar off until the
    actual corrected dependency combination passes inherited flags, match/exec
    arrays, computed access, repeated fixes, and restored unique diagnostics.
    Stage 6 does not change this Stage 5 condition.
  - D11.2: The five Markdown exclusions are temporary coverage losses, not an
    upstream fix. Restore each only after the actual dependency combination
    passes all recorded crashing inputs (including `[https://example.com]`),
    restored unique diagnostics/fixes, and language/scope/override controls.
  - Stage 3's module-spacing and Svelte-padding conditions remain unchanged.
- **Unrelated work preserved:** The initial tree was clean; all changes belong
  to Stage 6 policy, regressions, documentation, or this handoff.
- **Remaining work:** None within Stage 6; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 7, D12, D13.1–D13.2, D14, and D19: severities,
  deprecated entries/options, generated ignores, and explicit updates. No
  Stage 7 policy is implemented here.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.

##### Whole-file Security suppression inventory for Stage 11

After narrowing the two directives above, **18 whole-file filesystem-rule
directives and one whole-file object-injection directive** remain across
18 files. This inventory identifies review boundaries, not completed approval
of every suppressed operation. Stage 11 must inspect each operation, narrow
where feasible, and retain unrelated rule tokens in combined directives.

- `tests/package/contract.test.ts` has both Security tokens alongside six
  unrelated tokens. Review the fixed repository-manifest URLs and every
  manifest/lockfile-derived key separately; preserve the other tokens.
- `tests/package/consumers.ts`, `tests/package/consumers.test.ts`,
  `tests/package/install.test.ts`, `tests/package/readme.test.ts`, and
  `tests/package/smoke.test.ts` own temporary consumers, but operations span
  repository fixtures, tarballs, child-project paths, and cleanup. Confirm
  each path's origin before replacing the broad directive. Preserve smoke's
  separate `n/no-sync` exception.
- `tests/factory/context.test.ts`, `factory.test.ts`, `feature-toggles.test.ts`,
  `preparation.test.ts`, and `workspaces.test.ts` under `tests/factory/` build
  temporary manifests/workspaces. Record fixed child names and cleanup roots
  per operation rather than relying on the filename role.
- `tests/configs/react.test.ts`, `tests/configs/type-aware-scope.test.ts`, and
  `tests/configs/typescript/naming.test.ts` create temporary parser/type
  projects. Separate fixture writes and dependency links from cleanup.
- `tests/policy/rule-ownership.test.ts` and `tests/policy/type-information.test.ts`
  own temporary typed consumers. Review the fixed fixture matrix, dependency
  links, and real-path/cleanup boundary per operation.
- `tests/scripts/policy-diff/report.test.ts` builds temporary repositories and
  package snapshots; `tests/vitest-watch.test.ts` creates temporary watcher
  inputs. Review source-path provenance, generated child paths, and cleanup.

The production `promise-function-async` exception in
`src/utilities/plugin-policy.ts` and the local Security key exceptions in
`src/options.ts` and `src/configs/plugins/react/rules.ts` are targeted existing
exceptions, not whole-file directives. Their synchronous-data and typed-key
contracts still require preservation and later review.

#### Stage 7 — severity, deprecated rules, ignores, and explicit updates

- **Status/date:** Complete, 22 October 2026.
- **Stage-entry commit:** `d1fb5e3edba78e918fb8e81871ebfc84c0010588`.
  The worktree was clean on `cravingmaker/implement-stage-7`; a fresh fetch
  confirmed that `origin/main` matched the completed Stage 6 baseline.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D12 = A, D13.1 = A, D13.2 = A, D14 = A,
  and D19; the Stage 7 portions of P6–P8 and the explicit-update finding.
- **Changes and rationale:**
  - D12 changes exactly five active owners to `warn`: core complexity and
    max-params, TypeScript max-params, Unicorn max-nested-calls, and HTML
    max-element-depth. All twelve approved limits now warn with their original
    limits/options, replacement ownership, and typed/feature scopes. Tests
    exercise the five changed boundaries, TypeScript void/non-void `this`,
    typed/untyped ownership, and feature/consumer overrides. Actual CLI runs
    verify ordinary success, the unchanged zero-warning failure budget,
    quiet-mode skipping, and hidden-but-counted warnings with both flags.
  - D13.1 removes all **17 deprecated rule IDs** found in installed metadata:
    native `no-return-await`, three Stylistic IDs, and thirteen SonarJS IDs.
    Two additional SonarJS off-map occurrences are removed as well. The fixed
    typed-ID list retains those two IDs solely to guard explicit consumer
    overrides; it does not author deprecated default rule entries. Tests keep
    those overrides inside typed scope and verify the accepted inheritance
    effect: an earlier `no-return-await` error survives, the TypeScript
    `return-await: always` policy remains active, and a later user config wins.
    Authored-map guards inspect source maps and Refresh variants before
    compatibility filtering, reject deprecated and unknown IDs, and cover
    scalar/tuple string/numeric severities even if peer filtering hides a key.
    Current non-deprecated inventory coverage and compatibility utilities remain.
    Composition counts now reflect 282 SonarJS entries, 95 Stylistic/internal
    entries, and 15 typed TypeScript replacement entries.
  - D13.2 removes only TypeScript max-params' redundant `maximum: undefined`.
    Shared `max: 4`, supported `countVoidThis: false`, the canonical-alias
    allowance, and Stylistic's explained `overrides: { arrow: "ignore" }`
    remain. A direct authored-option guard and composed function-type
    formatting regression protect both boundaries.
  - D14 appends exactly `**/.next/` and `**/.svelte-kit/` to the existing
    generated-directory defaults before caller patterns. Real directory
    discovery tests cover root/nested outputs, framework features on/off,
    retained sibling sources, caller additions, directory re-inclusion, later
    re-exclusion, and the pruned-parent boundary for descendant-only negations.
  - D19 enables native `no-plusplus` with no for-loop exception; both existing
    compound-assignment owners retain `never`. Regressions reject prefix,
    postfix, for-loop, arithmetic/exponentiation/shift/bitwise, and logical
    compounds in JavaScript and TypeScript. Explicit assignments, BigInt `1n`,
    conditional writes, independent bitwise restrictions, feature scopes,
    overrides, and repeated ESLint/Prettier convergence are protected.
    AST inspection of tracked JavaScript/TypeScript source and scripts plus
    fixture inspection found no executable production counter/compound updates
    to migrate. The embedded Svelte click fixture now caches the previous count,
    assigns explicitly, and returns the cached value; executing its actual
    handler verifies both state and postfix results for ordinary counts, a
    precision boundary, and NaN. No unused migration helper is introduced.
  - README and contributor guidance now explain warning budgets/quiet mode,
    deprecated-rule inheritance, generated directories and negations, explicit
    updates, and semantics-preserving migration.
- **Runtime/dependencies:** Node.js `24.22.0`, npm `11.19.1`, ESLint `10.12.0`,
  TypeScript `6.0.3`, typescript-eslint `8.70.0`, Stylistic `5.10.0`, SonarJS
  `4.2.2`, HTML plugin/parser `0.66.1`, and Vitest `5.0.3`. Commands use
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. Dependencies, peer ranges, exports/public options,
  ESM output, compiler contracts, scripts/hooks, and source maps are unchanged.
- **Tests/commands and development evidence:**
  - `npm ci`, `npm run prepare`, and the entry `npm run build` passed;
    installation reported zero vulnerabilities.
  - Before behavioral edits, the six-suite regression run reproduced **42
    failures / 208 passes** for the old severities, deprecated entries/alias,
    inherited disable, generated directories, and missing update prohibition.
    The first implementation run passed **7 files / 262 tests**.
  - Additional checks exposed stale Stylistic deprecated-entry assertions and
    an invalid test assumption that the always-on JavaScript feature could
    take an empty `files` list. Tests now exercise its supported narrowed,
    ignored, and override boundaries. Unsupported `Iterator.concat` typing
    and synthetic tuple typing were corrected without changing public policy.
    The corrected deprecation/update/Stylistic run passed **3 files / 176 tests**.
  - `npx vitest run tests/policy/effective-rules.test.ts -u` passed **33 tests**
    and updated exactly **17 snapshots** through the supported process.
    No snapshot was edited by hand. Installed metadata independently verified
    the changed rule-group and fixability counts.
  - Explicit ESLint of all changed source/test/docs files, `npx tsc --noEmit`,
    and `git diff --check` passed. The final documentation handoff is checked
    separately after adding this validation record.
- **Final validation:** `npm run validate` passed **71 files / 2,710 tests**,
  formatting, build/generation, TypeScript, Knip, zero-warning repository lint,
  README/packed consumers, Publint, and ATTW's ESM profile. The passing test
  phase took **378.05 seconds**. The first full attempt passed 70 files but
  hit one unchanged watcher assertion at `tests/fixtures/sample.ts` with
  "Compared values have no visual difference." The focused watcher/fixture
  run then passed **2 files / 144 tests**, and the entire validation command
  passed on retry with the same environment. No assertion, timeout, coverage,
  or hook was weakened. Broken-optional-peer stderr belongs to a passing
  negative test.
- **Policy/snapshot delta:**
  `node scripts/policy-diff.ts --base d1fb5e3edba78e918fb8e81871ebfc84c0010588`
  reports **17 changed / 16 unchanged**, with no new, removed, or failed
  snapshots and no locked-package changes. Every changed rule entry maps to
  exactly the five severity owners, `no-plusplus`, or the seventeen removed
  deprecated IDs; only their derived totals change otherwise. An independent
  report check verified this exact **23-ID** set. Directory discovery and
  inherited/typed override behavior are additionally tested directly.
  The cumulative report against implementation starting point
  `008a08207f28441297a2476b4798136aeb1023de` reports **25 changed / 8 unchanged**,
  with no new, removed, failed, or locked-package changes. Earlier deltas keep
  their Stage 2–6 decision mapping; this stage adds only D12/D13.1/D19 snapshot
  changes, with D13.2/D14 verified by their focused behavioral tests.
- **Artifacts/consumer compatibility:** Full packed-consumer validation passed,
  including disabled/missing/partial/broken optional peers, README examples,
  declarations, exports, and tarball checks. The dedicated advertised-minimum-
  peer CI matrix has not been run locally. Generated `dist/` and
  `src/typegen.d.ts` remain excluded from the commit.
- **Retained exceptions/upstream conditions:** Stage 3's module-spacing/Svelte
  padding conditions, D8.10's unsafe typed RegExp fix condition, D11.2's five
  temporary Markdown exclusions, and Stage 6's Security suppression inventory
  remain unchanged. The annotation-spacing arrow guard and deprecated typed-ID
  override guards remain intentional compatibility boundaries.
- **Unrelated work preserved:** The initial tree was clean; every changed file
  belongs to Stage 7 policy, regression coverage, documentation, or this handoff.
- **Remaining work:** None within Stage 7; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 8, D15/R7: remove source maps from build and published
  artifacts. No Stage 8 artifact or build setting is changed here.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record.

#### Stage 8 — publish without source maps

- **Status/date:** Complete, 22 October 2026.
- **Stage-entry commit:** `8273526416e19aa001fa73250e217aa1f8c971a1`.
  The worktree was clean on `cravingmaker/implement-stage-8`; a fresh fetch
  confirmed that `origin/main` matched the completed Stage 7 baseline.
- **Implementation commit(s):** Uncommitted at validation; the implementation
  and this handoff are delivered together.
- **Decisions/findings covered:** D15 = A; R7.
- **Changes and rationale:** TypeScript now explicitly disables declaration
  maps, and tsdown explicitly disables source maps with the required comment,
  `Do not publish original source through source maps.` Declaration generation,
  the ESM entry/output, runtime/type exports, and the `dist` package allowlist
  remain unchanged. A clean build removes the old maps and emits only
  `index.mjs` and `index.d.mts`. README migration/debugging guidance and the
  contributor build contract explain the accepted loss of mapped TypeScript
  runtime frames, reduced disclosure of original source embedded in maps,
  continued inspectability of emitted JavaScript, and the need to keep secrets
  out of bundled code. Consumer lint diagnostics keep their source locations.
- **Regression coverage:** Local-build tests require the exact two-file dist
  inventory and reject `sourceMappingURL` in both bundles. The actual tarball
  inventory retains only those bundles and the existing package documents.
  Installed-consumer checks require the same dist inventory, reject external
  and inline map references in each tarball bundle, and compare the installed
  files byte for byte with the tarball. Exact inventories also reject hidden
  maps, extra directories, and publication of `src/`.
- **Runtime/dependencies:** Node.js `24.22.0`, npm `11.19.1`, tsdown `0.23.1`,
  Rolldown `1.2.13`, TypeScript `6.0.3`, and Vitest `5.0.3`. Commands use
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. Dependency versions/peer ranges, public options,
  rule policy/scopes/order, scripts, and hooks are unchanged.
- **Tests/commands and development evidence:**
  - `npm ci`, `npm run prepare`, and the stage-entry `npm run build` passed.
    The captured entry build contained both external map files.
  - Before the build-option changes,
    `npx vitest run tests/package/contract.test.ts tests/package/install.test.ts -t 'source.map|contains the build|builds only'`
    reproduced all **6 expected failures** for the old inventories and map
    references. No expected failure or skip was added to the suites.
  - After the changes,
    `npx vitest run tests/package/contract.test.ts tests/package/install.test.ts`
    passed **2 files / 30 tests** in **66.06 seconds**, including real npm
    installations with missing, partial, and complete optional-peer sets.
  - Prettier and changed-file ESLint initially caught a transient test syntax
    error and three sorting/await-expression errors. These were corrected
    without new suppressions or policy changes; formatting, explicit ESLint
    of all seven changed files with `--max-warnings 0`, and `git diff --check`
    then passed. The final documentation handoff is checked separately after
    adding this validation record.
- **Final validation:** `npm run validate` passed on its first full run:
  **71 files / 2,715 tests**, formatting, clean build/generation, TypeScript,
  Knip, zero-warning repository lint, README/packed consumers, Publint, and
  ATTW's ESM profile. The test phase took **400.56 seconds**. Broken-optional-
  peer stderr belongs to a passing negative test. No gate, timeout, coverage,
  assertion, or hook was weakened.
- **Policy/snapshot delta:**
  `npm run policy:diff -- --base 8273526416e19aa001fa73250e217aa1f8c971a1`
  reports **all 33 snapshots unchanged**, with unchanged locked packages.
  The cumulative report,
  `node scripts/policy-diff.ts --base 008a08207f28441297a2476b4798136aeb1023de`,
  retains **25 changed / 8 unchanged**, with no new, removed, failed, or
  locked-package changes. Its differences remain the completed Stage 2–7
  decisions; Stage 8 adds no effective-rule or snapshot difference.
- **Artifacts/consumer compatibility:** Both emitted bundles match their
  captured stage-entry counterparts after removing only source-map-reference
  comments and trailing whitespace; normalized SHA-256 checks matched for
  runtime and declarations. An actual temporary `npm pack --ignore-scripts`
  tarball was inspected, and each packed bundle matched the local build byte
  for byte with no map reference. The five entries are `dist/index.mjs`,
  `dist/index.d.mts`, `LICENSE`, `README.md`, and `package.json`. Measured
  compressed/unpacked sizes changed from **264,510 / 1,639,993 bytes** at entry
  to **171,018 / 1,078,024 bytes** after the README update; the two removed maps
  accounted for **562,623 bytes**. Temporary inspection tarballs were deleted;
  package suites clean up their own packs/consumers. Public imports, declarations,
  optional-peer behavior, Publint, and ATTW passed. The dedicated advertised-
  minimum-peer CI matrix has not been run locally.
- **Audit/CI limitation:** The current registry audit reports **two moderate
  findings** in the unchanged locked `vitest` and `@vitest/ui` versions
  (`5.0.3`); `npm audit --json` returned status 1. The package manifest and
  lockfile match the entry commit exactly. CI's separate `release:check`
  audit gate may fail for these findings; dependency upgrades are outside
  Stage 8. This does not change the passing `npm run validate` result.
  The subsequent maintainer-requested CI follow-up below resolves this audit
  limitation with a separate dependency commit.
- **Retained exceptions/upstream conditions:** Earlier stages' temporary
  exclusions, compatibility guards, and Security suppression inventory remain
  unchanged. Source-map omission is the final D15 choice, with no upstream
  restoration condition.
- **Unrelated work preserved:** The initial tree was clean; every changed file
  belongs to Stage 8 build settings, package regressions, documentation, or this
  handoff. Generated `dist/` and `src/typegen.d.ts` remain outside the commit.
- **Remaining work:** None within Stage 8; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 9, D18.1–D18.6/R11: source, test, and ambient declaration
  ownership migrations, using the current `import-x/`, Package JSON
  `other-rules.ts`, React category aliases, Node typed maps, and
  `src/types/eslint-plugin-promise.d.ts` paths. No Stage 9 migration is included.
- **PR/CI:** Commit and PR requested after local completion; remote CI has not
  been evaluated in this record. The unchanged dependency-audit limitation
  above must be distinguished from local Stage 8 validation.

##### Stage 8 CI follow-up — patched Vitest

- **Status/date:** Local remediation validated, 22 October 2026; the new remote
  CI run remains to be verified after pushing the follow-up commit.
- **Entry commit:** `fe5fa5243c9c70fc2a5533750492448a57bbd0ae`; the worktree
  was clean. The maintainer requested investigation and repair of PR #134's
  failed CI after the original Stage 8 delivery. This follow-up extends that
  request to the two affected development dependencies; no Stage 9 work is
  included. The dependency fix and this record are uncommitted at validation.
- **Failure and fix:** Both Node jobs in
  [CI run 39693715028](https://github.com/cravingmaker/eslint-config/actions/runs/39693715028)
  stopped at `npm audit --audit-level=low`, before tests, for
  [GHSA-p458-7748-mcp3](https://github.com/advisories/GHSA-p458-7748-mcp3).
  `npm run release:check` reproduced the same two moderate findings locally.
  Exact `vitest` and `@vitest/ui` pins move together from 5.0.3 to the patched
  5.0.5. Four internal Vitest packages follow that version, and the required
  `obug` 3.0.0 is deduplicated with the existing build-tool copies. All nine
  changed lockfile paths belong to development packages. Runtime dependencies,
  public peers/exports, rules, source-map settings, tests, scripts, workflows,
  hooks, and audit thresholds remain unchanged.
- **Compatibility/cooldown review:**
  [DEPENDENCY_REVIEW.md](DEPENDENCY_REVIEW.md) records applied versions, the
  intervening release changes, supported Node/Vite ranges, and the reviewed
  security exception. An ordinary temporary install first reproduced the
  seven-day cutoff's `ETARGET`. A one-time command-line release-age exclusion
  selected exactly the six Vitest package names for the reviewed 5.0.5 update;
  `.npmrc` remains `min-release-age=7` with no persistent exclusions. Fresh
  `npm ci --ignore-scripts` installations of the resulting lockfile passed
  without exceptions on Node 24.15.0/npm 11.12.1 and Node 26.12.0/npm 11.20.0,
  each with zero audit findings. The project install and
  `npm audit --audit-level=low` also passed normally on Node 24.22.0/npm 11.19.1.
- **Targeted verification:**
  `npx vitest run tests/vitest-watch.test.ts tests/package/contract.test.ts`
  passed **2 files / 8 tests** on each CI runtime (24.15.0 and 26.12.0).
  A temporary localhost UI probe using `createVitest()` authenticated normally,
  served the UI with HTTP 200, and rejected synthetic `.env` and
  `.vitest-secret-token` files with HTTP 403 without returning their fixture
  contents. The server and fixture directory were closed/removed afterward.
- **Release validation:** On Node 24.22.0, `npm run release:check` passed its
  unchanged low-threshold audit with **zero findings**, full validation with
  **71 files / 2,715 tests**, Publint, ATTW's ESM profile, and dry-run packing
  of the expected five package files. The test phase took **438.13 seconds**.
  Commands retain `NODE_OPTIONS=--max-old-space-size=4096`,
  `VITEST_MAX_WORKERS=1`, and `UV_THREADPOOL_SIZE=16`. No test assertion or
  timeout was changed. Final documentation/manifest lint follows this record.
- **Policy/artifacts:**
  `npm run policy:diff -- --base fe5fa5243c9c70fc2a5533750492448a57bbd0ae`
  reports **all 33 snapshots unchanged** and exactly the nine reviewed
  development-package path changes. An independent scope check rejects any
  other manifest/lockfile change. Both emitted bundles match the captured
  pre-fix build byte for byte, with only `index.mjs` and `index.d.mts` in
  `dist/` and no map reference. The accepted Stage 8 artifact policy is intact.
- **Delivery/CI:** The fix is delivered as a separate dependency commit on
  PR #134. Local release readiness is green; the previous failed run is not
  treated as evidence for the new commit. Remote CI must be reported separately.

#### Stage 9 — source, test, and ambient declaration ownership

- **Status/date:** Complete, 22 October 2026.
- **Stage-entry commit:** `e82000143424c9fb4a513d30b058ce530492fbcc`.
  The tree was clean on `cravingmaker/implement-stage-9`; a fresh fetch
  confirmed that `origin/main` matched the completed Stage 8 baseline,
  including its separately approved Vitest security follow-up.
- **Implementation commit(s):** Uncommitted at validation; this implementation
  and its handoff are delivered together.
- **Decisions/findings covered:** D18.1–D18.6 = A; R11.
- **Source ownership:** The six `import-x/` modules moved byte for byte to
  `src/configs/plugins/imports/`; the factory and direct test imports now use
  that feature-facing path. The dependency, plugin namespace, resolver settings,
  public option, and rule IDs retain their existing names. Package JSON's
  fallback map moved byte for byte to `rules/other.ts`. React's two upstream
  best-practice label spellings now share the documented singular category,
  retaining all nine entries, duplicate-classname's position, and both fixability
  annotations. Its ten-entry composed HTML map keeps its original key order.
  Node's two TypeScript-specific maps now live in `rules-type-aware.ts`,
  importing the single base `n/no-sync` tuple from `rules.ts`. Builder imports
  changed without changing JavaScript activation, the untyped TypeScript/
  component guard, typed reactivation, overrides, or block order.
- **Ambient ownership:** The Promise declaration moved to
  `src/ambient/eslint-plugin-promise.d.ts`; its complete bytes, non-module
  semantics, package name, and targeted suppression match the entry file.
  Recursive compiler discovery, public `src/types.ts`, generated
  `src/typegen.d.ts`, and package exports keep their existing contracts.
- **Test ownership and current-tree adjustments:** Moved **37 existing suites**
  and both shared helpers. This includes the nineteen flat plugin suites,
  all four current TypeScript suites, the Svelte script suite, core category
  suites, exceptions/ignores, utility/script suites, and policy integrations.
  Compared with the audit's original thirty-three-suite proposal, the current
  tree also has two later TypeScript regressions, Stage 7's ignore suite, and
  the cross-feature function-layout suite; these follow their respective
  plugin, ignore, and policy owners. The twelve-feature builder contract stays
  together in `tests/policy/code-quality.test.ts`. Pure override-filter cases
  and their three constants moved to `tests/utilities/type-aware.test.ts`;
  temporary project creation and cleanup remain solely with the policy
  integration. Both original describe bodies were compared exactly. An AST
  comparison also preserved the other 36 moved suite bodies after accounting
  only for physical imports, generated-file URLs, and disk-backed typed inputs.
  Shared lint assertions retain their signatures, defaults, and implementation.
- **Meaningful coverage:** The new Comments suite has three cases checking
  missing explanations, unlimited disables, actual suppression, and an explained
  next-line control that leaves a later debugger violation visible. Stage 7's
  existing four ignore cases moved without duplication: they already exercise
  root/nested outputs, retained sources, framework toggles, caller additions,
  directory negation ordering, and the descendant re-inclusion boundary.
- **Typed-input drift resolved:** An early four-suite run reproduced **22
  parsing failures** because some `tests/utilities.ts` inputs actually depended
  on that file's membership in the repository TypeScript project. Those
  disk-backed inputs in six suites now use the moved `tests/support/lint.ts`.
  Configuration-only virtual `tests/utilities.ts` samples remain unchanged.
  No default-project fallback, compiler relaxation, placeholder source, or helper
  API redesign was added.
- **Watcher verification and retry:** Generated-type mappings and expectations
  now target `tests/scripts/typegen.test.ts`; rebuilt-output discovery also
  exercises a nested plugin suite and the moved support suite. Recursive
  discovery, the five-package-suite classification, UI filters, fixture paths,
  Knip entries, and existing timeouts remain intact. The first full validation
  passed 72 suites but failed the regular watcher case. A focused repeat
  reproduced delayed setup notifications being mixed into the first fixture
  edit; diagnostic tracing identified a setup policy-report input as the
  unexpected trigger. The isolated test server now uses polling to separate
  setup from measured edits. Original EventTarget reporting, exact expected
  file sets, rebuild checks, filters, and assertions remain in place; temporary
  tracing was removed. Formatting/lint and **three consecutive two-test watcher
  runs** passed before rerunning the complete validation.
- **Runtime/setup:** Node.js **24.22.0**, npm **11.19.1**, ESLint **10.12.0**,
  TypeScript **6.0.3**, and Vitest **5.0.5**. `npm ci`, `npm run prepare`, and
  the entry build passed; installation reported zero vulnerabilities. Commands
  used `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. No dependency, peer, compiler, build, script, hook,
  or package-consumer fixture setting changed.
- **Tests/commands:**
  - Entry Node/React/ignore/watcher checks passed **4 files / 47 tests**.
  - The post-migration targeted run passed **17 files / 883 tests**, covering
    the owning features, Comments/ignores, typed scopes, source utilities,
    shared assertions, type generation, and actual watcher cycles.
  - The final `npm run validate` passed **73 files / 2,717 tests**; its test
    phase took **620.03 seconds**. Formatting, build/generation, typecheck,
    Knip, zero-warning repository lint, real/packed README and optional-peer
    consumers, Publint, and ATTW's ESM profile passed. Broken-optional-peer
    stderr is an intentional passing negative fixture. The count includes
    three new Comments cases and one fewer generated deprecation-inventory
    case because React's two category maps now have one owner; no rule
    coverage or assertion was removed.
  - Explicit changed-file ESLint initially found five import-order errors
    caused by the new helper depths; automatic import sorting corrected them.
    Final changed-file/documentation checks and `git diff --check` accompany
    this handoff before the requested commit.
- **Policy/snapshot delta:**
  `npm run policy:diff -- --base e82000143424c9fb4a513d30b058ce530492fbcc`
  reports **all 33 snapshots unchanged**, with unchanged locked packages.
  Authored map/value/key-order comparisons passed for imports, Package JSON,
  Node, and React; Node retains strict tuple identity. Default and all-feature
  factory block orders match the captured entry build. Entry/current lint
  probes retained Node's JavaScript, untyped TypeScript, and typed TypeScript
  outcomes, plus React JSX/TSX duplicate-class diagnostics and fixes. The
  cumulative report against `008a08207f28441297a2476b4798136aeb1023de` retains
  **25 changed / 8 unchanged**, with no new, removed, or failed snapshots.
  Its nine dependency-path differences are solely the Stage 8 Vitest follow-up;
  Stage 9 adds no cumulative policy or dependency difference.
- **Artifacts/consumer compatibility:** The emitted public declaration matches
  the entry build byte for byte. Full consumer tests verify public imports,
  generated rule types, optional-peer behavior, the five-file tarball, and the
  source-map-free two-file dist inventory. Consumer policy, public options,
  scopes, settings, namespace registration, and effective ordering are unchanged.
  The dedicated advertised-minimum-peer CI matrix has not been run locally.
- **Documentation/retained boundaries:** Contributor guidance now describes
  source/test/support/ambient owners, the category alias/order exception,
  typed Node ownership, and current commands/links. Historical audit evidence,
  existing upstream workarounds and suppressions, fixtures, all snapshots,
  and core/javascript versus packageJson/enforce-package-type ownership are
  preserved. R4 helper redesign remains assigned to Stage 11.
- **Unrelated work preserved:** The entry tree was clean; every changed file is
  within this stage. Generated `dist/` and `src/typegen.d.ts` are excluded from
  the commit. Temporary inspection artifacts stay outside the repository.
- **Remaining work:** None within Stage 9; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 10, R1/R2: production utilities/builders and ordered
  Svelte ignore negations, using the new imports/Node policy and utility/test
  support paths. No Stage 10 behavior or consolidation is implemented here.
- **PR/CI:** Local validation is complete; remote CI is not evaluated in this
  record. The requested PR is created after committing and pushing this stage.

#### Stage 10 — production utilities, builders, and Svelte ignore negations

- **Status/date:** Complete, 22 October 2026.
- **Stage-entry commit:** `cba23af137a75d901e564ba28367d4e21a8559cd`.
  The tree was clean on `cravingmaker/implement-stage-10`; a fresh fetch
  confirmed that `origin/main` matched the completed Stage 9 baseline.
- **Implementation commit(s):** Uncommitted at validation; this implementation
  and its handoff are delivered together.
- **Decisions/findings covered:** R1, R2.
- **Intentional behavior correction:** `resolveSvelteComponents` now uses
  `withoutIgnores(narrowFiles(svelteComponentFiles, files), ignores)`.
  A component restored by an ordered Svelte ignore negation receives the
  JavaScript, TypeScript, and twelve source-plugin features again, within each
  feature's own files/ignores, plus the existing component exceptions.
  The parser still comes from the Svelte feature. Component scripts receive no
  type information; their typed-only guards remain off. Later positive patterns
  exclude a restored component again. The union of caller file patterns still
  intersects the component extension; files outside that scope, genuinely
  ignored components, rune modules, and unsupported suffix routes are preserved.
- **Regression and corrected baseline:** The pre-change run failed the new
  option-scope regression and both restored-component cases: only Svelte's ten
  markup rules reached the restored files. After the correction, **3 files /
  69 tests** passed. Coverage checks both caller directories, all twelve source
  features, core/TypeScript policy and typed guards, component exceptions,
  actual equality diagnostics, fix output versus an ordinary component, later
  exclusions, unsupported `.svelte.mjs`/`.svelte.mts` parsers, narrower source
  features, and a following consumer override. No expected-failure test or
  snapshot update hides the original defect.
- **Production consolidation:** `sourcePluginConfigs` owns the global setup
  and scoped rules pair for Comments, Security, Unused Imports, Promise, RegExp,
  Unicorn, Perfectionist, and Stylistic. Functional, SonarJS, Node, and Imports
  use the same pair while retaining explicit typed guards/blocks and resolver
  settings in their builders. Authored rule maps, internal plugin registration,
  override filtering, block names/order, and optional-peer loading retain their
  owners. Exceptions now iterate each role's existing feature map in declared
  order, retaining enabled-owner guards, file intersections, and rule order.
- **Guard comparison and retained boundary:** The current tree has seven
  `isRecord` definitions versus the audit's historical six: Stage 7 also added
  the deprecation inventory guard. The six guards in context, plugin policy,
  policy comparison, README consumers, rule-option coverage, and deprecation
  coverage share the dependency-free `src/utilities/is-record.ts`; the report
  imports it directly rather than through the comparison module. The effective
  serializer's existing guard also accepts arrays for section descriptions and
  remains local, with an explanatory comment. Production imports no script,
  test module, or optional peer through either new utility.
- **Registration boundary retained:** Package JSON still registers
  `package-json` and the internal plugin globally, while `enforce-package-type`
  registers in its scoped rules block. These registrations differ outside the
  feature, so they were not relocated for uniformity.
- **Runtime/setup:** Node.js **24.22.0**, npm **11.19.1**; `npm ci`,
  `npm run prepare`, the entry build, and type checking passed. Installation
  reported zero vulnerabilities. Commands use
  `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. Dependencies, peers, scripts, hooks, compiler
  settings, generated types, and authored rule maps are unchanged.
- **Tests/commands:** The post-consolidation targeted command covering
  `tests/factory`, exceptions, Svelte, the twelve-feature contract, effective
  policy, typed scopes, utilities, policy-report units/subprocesses, option
  coverage, and deprecated rules passed **22 files / 612 tests** in
  **84.85 seconds**. Explicit changed-file ESLint passed after import sorting,
  ordinary automatic fixes, and an operation-level explanation for reading
  calculated rules through fixed fixture IDs. Full `npm run validate` then
  passed **73 files / 2,722 tests**; its test phase took **980.88 seconds**.
  Formatting, build/generation, typecheck, Knip, zero-warning repository lint,
  packed/installed README and optional-peer consumers, Publint, and ATTW's ESM
  profile passed. Broken-optional-peer stderr is an intentional negative fixture.
- **Final watcher follow-up:** The new guard is also read by the policy-report
  subprocess. After full validation, an added filesystem-input case reproduced
  the missing regular-UI rerun. Its explicit watch mapping now includes
  `src/utilities/is-record.ts`. `npx vitest run tests/vitest-watch.test.ts`
  passed **2 tests** in **8.80 seconds**, covering both UI scopes with the
  original timeouts and exact expected rerun sets. Final formatting, typecheck,
  Knip, whole-repository and changed-file lint accompany this handoff; the
  pre-push hook reruns the complete test suite with the final mapping.
- **Policy/snapshot delta:**
  `npm run policy:diff -- --base cba23af137a75d901e564ba28367d4e21a8559cd`
  reports **all 33 snapshots unchanged**, with unchanged locked packages.
  Separate entry/corrected captures of five scenarios show changed effective
  policy only for `app/generated/Kept.svelte` and
  `shared/generated/Kept.svelte` under the ordered-negation scenario; all
  other sampled routes retain their policy and lint/fix outcomes. The corrected
  baseline was established before consolidation. Corrected/consolidated captures
  then match exactly across **90 effective configurations, 20 lint/fix probes**,
  and all five scenarios' block names/order, files, ignores, and registrations.
  The public declaration matches the entry build byte for byte. The cumulative
  report against `008a08207f28441297a2476b4798136aeb1023de` retains **25 changed /
  8 unchanged**, with no new, removed, or failed snapshots. Its dependency
  differences remain solely the Stage 8 Vitest follow-up. No snapshot was
  edited or regenerated; these existing scenarios do not contain Svelte ignore
  re-inclusion, which the new direct regressions cover instead.
- **Artifacts/consumer compatibility:** The full gate verified public imports,
  generated option types, real and linked optional-peer consumers, the five-file
  tarball, and the source-map-free two-file dist inventory. No public option,
  export, dependency range, compiler contract, or optional-peer loading path
  changed. Existing upstream workarounds retain their approved conditions.
- **Documentation:** README and contributor guidance describe ordered Svelte
  negations, shared builder/guard ownership, explicit specialized blocks, and
  retained registration/serializer boundaries. The historical rewrite record
  now links the resolved Svelte-negation finding to this stage.
- **Unrelated work preserved:** The entry tree was clean; every changed file
  belongs to Stage 10. Generated `dist/`, `src/typegen.d.ts`, and disposable
  comparison artifacts remain outside the commit.
- **Remaining work:** None within Stage 10; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 11, R3–R5: derived typed-off maps, shared test result
  boundaries/helper vocabulary, and local suppressions. Existing helper APIs,
  typed-off maps, and unrelated suppressions remain unchanged here.
- **PR/CI:** Local validation is complete; remote CI is not evaluated in this
  record. The requested PR is created after committing and pushing this stage.

#### Stage 11 — derived maps, test boundaries, and local suppressions

- **Status/date:** Complete, 23 October 2026.
- **Stage-entry commit:** `f30fa41363f4a278a686998d8f1c91107939cc07`.
  The worktree was clean on `cravingmaker/stage-11-audit-implementation`;
  a fresh fetch confirmed that `origin/main` matched this commit. The script,
  hook, and install-policy changes merged after Stage 10 are part of this
  baseline and are preserved.
- **Implementation commit(s):** Uncommitted at validation; this change and its
  handoff are delivered together.
- **Decisions/findings covered:** R3–R5; D7's AST-name comments, D9's synchronous
  opaque-data exception, and D10's Security review coverage are preserved.
- **Derived guards:** `rulesOff()` in `src/utilities/type-aware.ts` derives
  sorted off entries from authored keys, including disabled alternatives.
  TypeScript's 62 guards come from its typed policy and only the plugin entries
  of its typed replacement map; core replacement entries stay in their existing
  block. Functional's 12 and SonarJS's 69 guards come from their selected typed
  policies. Their explicit classifier sets remain because upstream category
  ownership and typed scope are different classifications; off values and
  fixability explanations are no longer independently maintained. Neither
  upstream presets nor runtime metadata add policy. Deprecated override-only
  IDs remain separate, and Node's distinct JavaScript/TypeScript `n/no-sync`
  guard and shared authored tuple are unchanged.
- **Typegen boundary retained:** The build-only registry still eagerly imports
  development plugins, with its core, Promise, Hooks, Refresh, and internal-rule
  adapters. Runtime builders retain lazy optional-peer imports and differing
  registration scopes. A shared catalog would couple those responsibilities
  without removing the adapters or feature builders. The existing guarded list
  therefore remains local; its strengthened test now checks every registered
  plugin rule as well as every configured rule against generated declarations.
- **Shared test boundary:** `tests/support/resolved-config.ts` owns the single
  justified cast of ESLint's untyped result. All repository TypeScript callers
  use it, including description and policy helpers. It preserves undefined for
  ignored/unmatched paths, optional rule maps, normalized numeric severities,
  configuration errors, and unknown rule-option values. The formatter check
  validates its string-array option shape instead of asserting a stronger
  unchecked config type. Boundary tests cover these contracts, plugin identity,
  settings/linter options, and JavaScript/HTML, JSON, and Markdown descriptions.
- **Semantic wrappers retained:** Snapshot serialization, concise file/rule
  descriptions, map conversion, fixture-engine construction, and lint assertions
  keep their distinct responsibilities while sharing resolved access. Standalone
  JavaScript scripts in packed/installed consumers retain their local ESLint
  calls so they exercise the installed package without repository test imports.
  Fatal-parser and ignored-file assertions remain active.
- **Helper vocabulary:** `typeChecked` and `refresh` replace the two obsolete
  internal names at every helper call site. Typed linting still defaults to
  false, Refresh still defaults to generic, and all framework features stay on.
  The unused-variable example now names `unused-imports/no-unused-vars`, with
  an executable regression. Legacy public-option rejection fixtures deliberately
  retain the removed public names.
- **Suppression review:** All 18 whole-file filesystem directives and the
  whole-file computed-key directive from Stage 6's inventory are narrowed to
  86 reviewed filesystem operations and one fixed optional-peer key lookup.
  Comments identify fixed repository URLs, literal fixture matrices, owned
  temporary roots, dependency-link endpoints, or installed artifact names.
  Cleanup continues to use the owned fixture roots. Contract JSON assertions,
  URL immutability, and optional-chain checks retain local exceptions. Its
  three file-wide sort exceptions remain because fixtures mirror manifest field
  order and group related declarations throughout the file. Smoke's three
  synchronous subprocess exceptions and the policy report's `registerHooks`
  exception are now local. The only other retained file-wide directives belong
  to the public re-export entry point and the global ambient declaration; their
  rules concern the whole module. No Security rule, role, severity, or production
  AST-key/opaque-return exception changed.
- **Regression evidence:** The two new helper-option regressions failed before
  the rename. Adding the shared boundary as a watcher input reproduced the
  missing regular-UI rerun; its explicit mapping now covers the policy-report
  subprocess. The focused run covering support, typed guards/scopes, Node,
  Functional, SonarJS, TypeScript, package contracts, typegen, and both UI scopes
  passed **15 files / 726 tests** in **61.77 seconds**, with the original watcher
  timeouts. Existing Security regressions continue to require unrelated dynamic
  operations to warn after a local exception.
- **Runtime/setup:** Node.js **24.22.0**, npm **11.19.1**; `npm ci` and
  `npm run prepare` passed, with zero installation vulnerabilities. Validation
  uses `NODE_OPTIONS=--max-old-space-size=4096`, `VITEST_MAX_WORKERS=1`, and
  `UV_THREADPOOL_SIZE=16`. Explicit changed-file ESLint with `--max-warnings 0`,
  type checking, Knip, and formatting passed before the full gate.
- **Full gate and consumer compatibility:** `npm run validate` passed
  **74 files / 2,735 tests**; its test phase took **434.21 seconds**. Formatting,
  generation/build, type checking, Knip, zero-warning repository lint, all unit
  and linked/installed consumer tests, Publint, and ATTW's ESM-only profile
  passed. Package tests verified public imports, optional-peer loading/error
  behavior, README consumers, the five-file tarball, and the source-map-free
  runtime/declaration inventory. Broken-optional-peer stderr is an intentional
  negative fixture. No public option/default, parser route, peer range, or
  published declaration changed.
- **Policy/snapshot delta:**
  `npm run policy:diff -- --base f30fa41363f4a278a686998d8f1c91107939cc07`
  reports **all 33 snapshots unchanged**, with unchanged locked packages.
  Direct entry/current-build comparisons also match **90 effective
  configurations and 20 lint/fix probes** across typed, untyped, scoped,
  overridden, and disabled scenarios, including block names/order, rule entry
  order, files/ignores, and plugin registrations. The public declaration and
  generated rule declarations match the entry build byte for byte. The
  cumulative report against `008a08207f28441297a2476b4798136aeb1023de` remains
  **25 changed / 8 unchanged**, with no new, removed, or failed snapshots;
  dependency differences remain the pre-existing Stage 8 follow-up. No snapshot
  was edited or regenerated.
- **Documentation/unrelated work:** Contributor guidance describes derived guard
  ownership, the retained typegen registry, shared result access, helper defaults,
  and local review signals. The entry tree was clean; only Stage 11 files are
  changed. Dependencies, compiler settings, public exports/options, scripts,
  hooks, and `CODING_PRINCIPLES.md` are unchanged. Generated output and disposable
  comparisons stay outside the commit.
- **Remaining work:** None within Stage 11; requested commit/push/PR delivery
  follows this validation record.
- **Next stage:** Stage 12, R6/R8: dead-entry review and consistent script/hook
  contracts. Review the already-merged script/hook changes against the current
  baseline rather than restoring the historical scripts. Stage 12 remains
  unstarted here.
- **PR/CI:** Local validation is complete. The requested PR follows commit and
  push; remote CI has not been evaluated in this record.
