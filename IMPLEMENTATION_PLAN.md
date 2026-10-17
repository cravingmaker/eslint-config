# Maintainer Experience Implementation Plan

Status: historical staged plan. The subsequent explicit-rule-policy refactor supersedes its earlier automatic rule-enabling requirement. Current rules and fixed option defaults are declared locally, and new upstream rules require explicit review.

Baseline: `main` at `0c29d66b9fbc40f13e62187cfff789f144f6ce6b`, inspected on 14 October 2026. Recheck the branch, open pull requests, and current implementation before starting a stage so work already completed elsewhere is not duplicated.

## Objective

Make the package easier to understand, update, and maintain while preserving its consumer-facing behavior. A maintainer should be able to find a rule's policy, understand why it applies, and review the impact of a change without tracing the entire configuration factory.

The work covers seven improvements:

1. Rename the internal JavaScript core-rule module to `core`.
2. Organize maintainer documentation around common tasks.
3. Separate policy declarations from assembly code in selected large features.
4. Report effective-policy changes using the existing snapshot infrastructure.
5. Give general file-scope helpers a dedicated module.
6. Resolve configuration options once in the main factory path.
7. Verify behavior preservation throughout delivery.

The public configuration API, dependency versions, and lint policy remain the baseline for every stage. Future intentional rule changes and dependency updates are separate work; this plan makes those tasks easier to perform and review.

## Behavior that must be preserved

| Area                     | Required invariants                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public API               | Keep `createConfig(options, ...userConfigs)`, its promise of a flat config array, existing exported types, option names, defaults, and ESM-only package exports. Internal helpers remain internal.            |
| Core naming              | Keep the public `javascript` option and the emitted `javascript/rules` and `javascript/jsx` block names. The rename applies to internal implementation names and matching test organization.                  |
| Policy                   | Preserve every rule's severity and complete options, including disabled rules. Keep deprecated rules absent. Declare current rule settings explicitly; new upstream rules require review.                     |
| Composition              | Preserve config block names, order, plugin registrations, parser settings, resolver settings, feature override semantics, exceptions, and user-config precedence. Consumers can inspect or copy named blocks. |
| File selection           | Preserve default patterns, narrowing through `files`, global and feature-local ignores, ordered negated ignores, language separation, and current unsupported file behavior.                                  |
| Replacements             | Preserve the distinction between equivalent checks that return outside their owner's scope and style rules that remain disabled. Preserve explicit override handling.                                         |
| Type information         | Preserve typed-linting defaults, parser/rule scope alignment, typed-only overrides, and exclusion of JavaScript and Svelte components from typed linting.                                                     |
| Project context          | Preserve path resolution relative to the working directory, globals precedence, manifest dependency fields, framework detection, React Refresh selection, and missing/unreadable/invalid manifest fallback.   |
| Dependency loading       | Preserve optional-peer loading conditions and failures. Moving a rule declaration must not eagerly load an optional peer.                                                                                     |
| Observable results       | Preserve lint diagnostics, fixes, parsing failures, ignored-file behavior, and configuration failures for the same inputs and installed dependencies.                                                         |
| Formatting and packaging | Preserve Prettier's responsibilities, published entry points, supported runtimes, build-before-test requirements, and existing hooks and validation checks.                                                   |

Keep the existing limitations and open questions in [the rewrite record](docs/rewrite/record.md) separate from this work. Do not change their behavior while reorganizing the implementation.

## Delivery order

Use a focused branch and independently reviewable commits. Stages run in order; split stage 3 into one commit per feature. Each stage starts from the preceding validated state.

| Stage | Deliverable                                   | Depends on               |
| ----- | --------------------------------------------- | ------------------------ |
| 0     | Recorded baseline and preservation checks     | Current repository state |
| 1     | Internal `javascript` to `core` rename        | Stage 0                  |
| 2     | Task-oriented maintainer guide                | Stage 1                  |
| 3     | Policy/assembly separation for three features | Stage 2                  |
| 4     | Read-only policy difference report            | Stage 3                  |
| 5     | General file-scope utility module             | Stage 4                  |
| 6     | Single option-resolution path                 | Stage 5                  |
| 7     | Final verification and documentation cleanup  | Stages 1–6               |

## Stage 0: Establish the baseline

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CLAUDE.md](CLAUDE.md), and the current design decisions in [the rewrite record](docs/rewrite/record.md). Inspect the current branch, worktree changes, `origin/main...HEAD`, and relevant open pull requests. Preserve unrelated work and use an isolated checkout if necessary.

Record the baseline commit, Node.js/npm versions, and lockfile state in the implementation's review notes. Use the existing lockfile and installed supported toolchain. Install with `npm ci` only when dependencies need to be restored; do not combine dependency upgrades with these refactors.

Run `npm run validate` before source changes. Record any baseline failure separately and reproduce it before deciding whether it blocks this work. Do not weaken assertions, hooks, timeouts, or worker limits to obtain a passing run.

Use the existing effective-config snapshots, feature tests, fixture tests, formatter checks, and packed-consumer tests as the baseline. Add characterization tests only where a touched behavior lacks coverage, particularly actual lint/fix output or configuration failure paths. Run any new characterization against the unchanged implementation first.

Acceptance: the implementer can distinguish pre-existing failures from regressions, and the baseline dependency set and policy expectations are recorded. No snapshot is regenerated to accommodate a refactor.

## Stage 1: Rename the internal core-rule module

The current builder applies ESLint's built-in rules to JavaScript, TypeScript, and supported Svelte scripts. `core` describes that responsibility more accurately than `javascript`.

### File scope

- Move `src/configs/javascript/` to `src/configs/core/`, retaining `index.ts`, `possible-problems.ts`, and `suggestions.ts`.
- Rename the internal `javascript()` builder to `core()` and `javascriptRules` to `coreRules`.
- Update its import and invocation in `src/factory.ts`.
- Move `tests/configs/javascript/` to `tests/configs/core/`; update internal imports and descriptions that refer to the builder.
- Update current contributor guidance and source comments that identify the internal module. Preserve historical rewrite records as historical records.

The factory should make the compatibility mapping visible through `core(resolved.javascript, context)`. Keep `Options.javascript`, option validation, replacement-feature keys, messages referring to the public option, and emitted `@cravingmaker/eslint-config/javascript/*` names unchanged. Do not introduce a public `core` option or alias.

Keep `javascriptFiles` and other names that mean the JavaScript language rather than the built-in rule collection. Search each reference and classify its meaning; do not perform a repository-wide text substitution.

Validation: build, run `tests/configs/core`, `tests/factory`, and `tests/policy`, and run the shared stage checks below. Confirm existing consumers still use `javascript.overrides` and can find the same named blocks.

Acceptance: the internal module is named `core`; public API behavior, block names/order, and effective-policy snapshots are unchanged.

## Stage 2: Organize the maintainer guide by task

Scope: `CONTRIBUTING.md`. Update a link in `README.md` only if needed to expose the guide; avoid duplicating the guide or the rule policy.

Put a short architecture map and four task recipes before the detailed contributor reference:

1. **Change a rule:** locate the owning policy declaration; read its explicit severity and options; inspect replacements, file-role exceptions, and typed-linting restrictions; run the relevant feature tests and inspect the effective configuration.
2. **Update a plugin:** keep the dependency change separate from refactors; identify new, removed, deprecated, and changed rules; review effective-policy changes; validate rule options, formatter compatibility, and installed consumers.
3. **Explain an unexpected rule:** select a concrete file and options; inspect the matching blocks and final rule entry; trace policy, replacements, exceptions, and user overrides in order.
4. **Change a file exception:** locate the existing exception, explain its file-role requirement, and identify the tests that prove its scope. An actual behavior change requires its own implementation task.

Document `npm run inspect` and `npx eslint --print-config <file>`. Explain that the existing inspector uses this repository's `eslint.config.js`, whose enabled frameworks and typed-linting options are not a neutral consumer default. Use an explicit consumer configuration when investigating different options.

Preserve the detailed technical guidance, grouping it under the task it supports or a linked reference subsection. Explain the internal `core`/public `javascript` mapping and distinguish feature overrides from trailing user configs. Keep commands build-aware because many tests import `dist/index.mjs`.

Validation: format and lint the edited Markdown, check local links and command names, and manually follow the rule-location and inspection recipes. Do not change a rule merely to demonstrate a recipe.

Acceptance: a new maintainer can locate a built-in rule, an explicitly configured plugin rule, and a replaced rule using the guide. Existing caveats remain available without requiring the reader to start with the entire reference section.

## Stage 3: Separate policy from assembly in large features

Use the existing JavaScript/core and TypeScript structure as the model. Start with Perfectionist, then apply the same boundary to imports and HTML in separate commits.

### File scope

| Existing file                  | Proposed files                                   | Main related tests                    |
| ------------------------------ | ------------------------------------------------ | ------------------------------------- |
| `src/configs/perfectionist.ts` | `src/configs/perfectionist/index.ts`, `rules.ts` | `tests/configs/perfectionist.test.ts` |
| `src/configs/imports.ts`       | `src/configs/imports/index.ts`, `rules.ts`       | `tests/configs/imports.test.ts`       |
| `src/configs/html.ts`          | `src/configs/html/index.ts`, `rules.ts`          | `tests/configs/html.test.ts`          |

Update factory and test imports that reference these modules. Keep small features such as Promise in one file. Keep the current TypeScript decomposition and React's optional-loading implementation in this stage.

Move each policy map and its policy-specific option constants into `rules.ts`. Keep plugin registration, parsers, resolvers, file selection, and config assembly in `index.ts`. Preserve every object spread, rule tuple, option value, and emitted block in its original semantic position. Retain imports required to enumerate a bundled plugin's rules; do not turn computed policy into a manually maintained rule inventory.

Place the reason for a policy exception beside the rule declaration. Use short, consistent explanations for formatter ownership, replacement by another rule, and deliberate policy choices. Keep the authoritative replacement table in `src/overlaps.ts` and file-role exceptions in `src/configs/exceptions.ts`; documentation may link to them without duplicating their data.

Validation: build and run each affected feature's tests, effective-policy tests, overlap tests, formatter checks, and the shared stage checks. Verify both diagnostics and autofix output for a representative affected sorting rule where existing coverage is insufficient.

Acceptance: changing a rule's configured options has an obvious policy location; understanding parser or resolver setup is unnecessary for that edit. All baseline rule values and effective snapshots remain unchanged.

## Stage 4: Add an effective-policy difference report

Build on `tests/policy/effective-rules.test.ts` and `tests/policy/effective-config.ts`. The report is a development tool and is not exported or shipped as part of the runtime API.

### File scope

- Add `scripts/policy-diff.ts` and focused tests under `tests/scripts/`.
- Extract the existing snapshot scenario definitions into a small shared module under `tests/policy/`, consumed by both the snapshot test and the report. Preserve all existing scenarios and snapshot paths.
- Reuse the existing effective-config serializer. Add comparison helpers only where necessary; do not maintain another copy of the scenarios or serializer.
- Add a `policy:diff` package script that builds before running the report, and document it in `CONTRIBUTING.md`.

Proposed interface: `npm run policy:diff -- --base <git-ref>`, with `HEAD` as the default baseline. Read the baseline's tracked snapshots through Git and calculate the current working tree's configuration from the freshly built package. Resolve the ref safely and pass arguments directly to Git, without constructing shell commands from user input.

The report must:

- Group changes by scenario and representative file, identifying added/removed rule entries and changed severities or options.
- Surface changes to ignored-file status, language/parser settings, plugin registration, globals, and resolver settings as well as rules.
- Account for the existing React Refresh variants and identify added or missing scenario coverage. Missing baseline data or a failed configuration calculation must not appear as a clean comparison.
- Record enough baseline/toolchain context to distinguish a structural refactor from a deliberate dependency update. Reuse the existing root-path normalization for comparable results.
- Print deterministic output, explicitly report an unchanged policy, and leave snapshots, source files, and dependency files untouched. Normal build artifacts may be refreshed by the wrapper script.
- Exit successfully after producing a valid report, including one containing differences; fail on invalid refs, unavailable baseline data, or calculation failures. Review remains responsible for deciding whether differences are intended.

Test comparison behavior with identical inputs, added/removed rules, severity-only changes, option-only changes, metadata changes, and missing/malformed baseline inputs. Include one integration case against the actual effective-config scenarios. Keep the tool free of new runtime dependencies.

Validation: build, run the report tests and existing policy tests, and compare the current implementation to the pre-refactor baseline. Confirm no tracked files changed and no snapshots were rewritten.

Acceptance: a maintainer can understand the scope of a future plugin update from one report. This refactor produces no effective-policy differences from its baseline.

## Stage 5: Separate general file-scope utilities

Scope: `src/utilities/type-aware.ts`, a new `src/utilities/file-scope.ts`, and the direct import sites in options, configuration builders, overlaps, exceptions, and tests.

Move `narrowFiles()` and `withoutIgnores()` into `file-scope.ts`, together with the private ignore-negation helper they require. Keep `narrowTypeAwareScope()`, `typeAwareConfig()`, and typed-rule override filtering in `type-aware.ts`; they import the general helpers as needed.

This is a move of responsibility and names, not a rewrite of pattern composition. Preserve nested AND patterns, feature narrowing, ordered negated ignores, and the current handling of Svelte component scopes exactly. In particular, do not fix the recorded Svelte negated-ignore limitation as part of the move.

Validation: build and run factory option tests, feature-toggle tests, language-separation tests, type-information tests, type-aware-scope tests, overlap tests, and the shared stage checks. Extend tests only if a moved behavior lacks existing coverage.

Acceptance: general file selection can be found without searching a module named for typed linting. All existing selection and ignore cases retain their results.

## Stage 6: Resolve configuration options once

Scope: `src/context.ts`, `src/options.ts`, `src/factory.ts`, related internal types if necessary, and tests under `tests/factory/`. Preserve the public exports in `src/index.ts`.

The current path resolves options while locating the project root, while creating context, and again in the factory. Introduce a small internal preparation function returning both resolved options and context through this sequence:

```text
Reject unknown option names
  -> resolve the project root
  -> read declared dependencies
  -> detect frameworks and React Refresh
  -> apply option defaults once
  -> derive context from those resolved options
  -> assemble the existing config blocks
```

Use a shared project-root resolver so discovering the manifest does not require resolving every option. Derive context from the completed options and dependency set without calling the full option resolver again. Pass the same resolved values to feature builders.

Preserve `defaultContext` as the no-dependency internal fallback; it must not start reading the working directory's manifest. Existing internal helpers may delegate to the preparation function where tests still need them. Avoid global caching, new runtime validation, or a general-purpose composition framework.

Before changing the path, characterize the affected observable cases: missing/invalid manifests, declared versus merely installed frameworks, Next.js/Vite precedence, explicit feature switches, relative roots, custom globals, unknown option failures, and optional-peer loading failures. Preserve current error behavior; malformed-value handling and other recorded limitations are not cleanup opportunities in this stage.

Validation: build, run all factory tests, typed-scope and overlap tests, and the package smoke/install tests through the shared stage checks. Compare effective policy to the baseline. Use focused internal coverage to establish a single full option-resolution path without replacing behavior tests with call-count assertions.

Acceptance: the factory's preparation flow can be followed in one direction; resolved options are applied once per public call, and context and builders agree on the same settings. Consumer behavior remains unchanged.

## Shared validation and preservation evidence

For each source-changing stage:

1. Build before targeted tests; source-only tests do not replace validation against the built package.
2. Run the targeted tests listed for that stage. Add tests for gaps in affected behavior, not copies of upstream plugin tests or assertions that only mirror implementation structure.
3. Check the effective snapshots without update mode. Existing snapshot expectations must remain unchanged. Also compare config block names/order and use actual lint/fix and consumer tests where serialized configuration cannot prove behavior.
4. Run `npm run validate` once the stage is ready. It includes formatting, build, typechecking, whole-repository lint, all tests, and package integrity checks. Run lint on changed source files as well, as required by the repository's parameter-immutability guidance.
5. Run `git diff --check`, inspect the final diff, and record the validation results with the stage's commit or pull request. Preserve pre-commit and pre-push hooks.

Run builds and tests sequentially in a checkout. Concurrent builds can replace `dist/` while tests are importing it. Preserve Vitest's configured worker limit.

Keep evidence for the default, typed, narrowed-feature, ignored-file, framework-enabled, framework-disabled, React Refresh, and trailing-user-config scenarios already covered by the suite. Preserve package tests for supported installed peers and missing peers. Snapshots alone are not proof of identical parser, resolver, diagnostic, or fix behavior.

For future intentional rule updates, the maintainer guide should explain reviewed snapshot updates as a separate workflow. Do not use that workflow to accept differences introduced by the refactors in this plan.

## Stage 7: Finish the delivery

- Recheck the guide's paths, commands, examples, and compatibility explanation against the final implementation.
- Confirm dependency declarations, lockfile, public option names, exported types, config block names/order, and baseline policy remain unchanged, except for the additive development script.
- Run final validation if the last checks do not already cover the final state; avoid redundant full runs without a change or unresolved failure.
- Record which commits implement each stage, the preservation evidence, and any remaining limitation. Do not describe planned work as completed.
- When implementation is complete, replace or remove this temporary plan as appropriate, keeping current contributor guidance and the historical rewrite record useful and consistent.

Definition of done: all stages are implemented and validated, the maintainer guide supports the common tasks, the internal core naming is clear, large-feature policy edits are localized, policy differences are inspectable, and the package produces the same consumer-facing behavior on the baseline dependency set.
