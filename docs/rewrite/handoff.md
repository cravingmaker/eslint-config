# Rewrite handoff

This document lets a new session, local or cloud, continue the rewrite of `@cravingmaker/eslint-config` without the conversation that produced the plan. Read it first, then read [implementation-plan.md](./implementation-plan.md).

## Where things stand

- **Released:** 0.1.0 is on npm. It has the pre-rewrite structure: one large `src/index.ts` plus rule maps under `src/rules/`.
- **Done:** stages 0, 1, and 2, and the parameter immutability item of stage 3. The effective lint policy is snapshotted in `tests/policy/`. `src/factory.ts` composes the config from one internal builder per feature under `src/configs/`, rule overlaps live in `src/overlaps.ts`, and `createConfig` takes the per-feature options of the plan.
- **Next:** the rest of stage 3 (behavior changes), starting with file-role exceptions, one item per commit in the order the plan records, then stages 4 and 5. Each stage depends on the one before it. Read the notes at the end of stage 2 and under stage 3 in the plan first.
- **Decisions:** every design question in the plan is settled. Nothing is waiting for the maintainer.

## Working on a stage

Work on one stage per session and one pull request per stage.

1. Read the stage in the plan, including its gate. Do not start work from a later stage.
2. Branch from the latest `main`: `refactor/rewrite-stage-<n>`.
3. Check the environment (see [Environment](#environment)).
4. Make the change in small commits. After each one, run `npm run build` and `npx vitest run tests/policy`.
5. Before pushing, run `npm run validate`. It takes a few minutes, so give the command a long timeout.
6. Update the plan in the same pull request: mark the stage done and record anything the next stage needs to know.
7. Open the pull request with a conventional title and say which gate items you verified and how.

Stop and ask the maintainer when:

- a snapshot changes during stage 1 or 2;
- the work needs a decision the plan does not cover;
- the work needs a dependency the plan does not name.

### Snapshot rules

`tests/policy/__snapshots__/effective-rules/` records the configuration ESLint resolves for each representative path, one rule per line.

- **Stages 1 and 2:** the snapshots must not change. A changed line means the refactor changed the lint policy; fix the code, not the snapshot.
- **Stage 3 onward:** update with `npx vitest run tests/policy -u`, read the diff, and commit it together with the change that caused it. Say in the commit message what changed and why.
- **Dependency updates:** the same as stage 3. New or changed upstream rules appear as a diff to review.
- Never edit a snapshot file by hand.
- When the public options change in stage 2, the suite definitions in `tests/policy/effective-rules.test.ts` change their spelling. The snapshot files still must not change.

## Environment

- Node.js 24.15 or later (`.nvmrc` pins 24.21.0). The source uses APIs that older versions lack, so a lower version fails at runtime, not just at install.
- `npm ci` installs dependencies. `.npmrc` sets `ignore-scripts=true`, so the `prepare` script does not run and the git hooks are not installed. Run `npx husky` once after `npm ci` to enable them.
- `.npmrc` also sets `save-exact=true` and `min-release-age=7`. New dependencies are pinned to an exact version that is at least seven days old. Do not override either setting.
- The pre-commit hook builds and runs Prettier and ESLint on staged files. The pre-push hook runs the test suite. Do not bypass them with `--no-verify`.

## Things that will trip you up

- **Build before lint and test.** `eslint.config.js` and most tests import `./dist/index.mjs`. After changing `src/`, run `npm run build` first, or you lint and test the previous build.
- **Internal builders are tested from source.** Feature builders are not exported from the package root. Tests for them import from `src/`, as `tests/configs/javascript.test.ts` does.
- **`functional/prefer-immutable-types` shares a cache across files.** Since stage 3 it checks parameters shallowly, which gives the same result whatever files are linted together, except for a parameter whose type is a mapped type that copies modifiers, such as `Partial<Readonly<T>>`. Write `Readonly<Partial<T>>` instead, and do not add a disable comment: in the runs where the rule stays silent, the comment is reported as unused. The cache is off while `NODE_ENV` is `test`, so a Vitest test that lints in its own process cannot show such a difference; `tests/policy/parameter-immutability.test.ts` lints in a child process. Check both `npx eslint .` and `npx eslint <the files you changed>` before committing.
- **`eslint --fix` reorders literals.** Perfectionist sorts object keys and some arrays. Do not encode meaning in the order of an array literal that a fix may sort.
- **A severity-only entry keeps earlier options.** When a later block sets a rule to only `"off"` or `"error"`, ESLint keeps the options from an earlier block, and the snapshots record them. Inside one block, an object spread replaces the whole entry instead. This is why moving a rule between blocks can change a snapshot line even when the rule stays off.
- **Snapshots are `.txt` on purpose.** That keeps ESLint and Prettier away from them.
- **Releases.** Release Please opens or updates a release pull request when a `feat`, `fix`, or breaking commit reaches `main`. Opening that pull request publishes nothing. Merging it creates a GitHub Release, and the release triggers `npm publish`. Leave release pull requests, tags, and GitHub Releases to the maintainer. Use honest conventional types in titles; do not pick a type to steer the release.

## Continuing in a Claude Code cloud session

This section is for the maintainer. It describes the setup once and then the routine per stage. The setup script below was verified in a cloud session on 6 October 2026.

### One-time setup

1. **Merge the stage 0 pull request.** A cloud session works from a fresh clone of GitHub, so this document, the plan, and `CLAUDE.md` must be on the branch the session starts from. After the merge, that is `main`.
2. **Connect GitHub.** Either authorize the Claude GitHub App during onboarding at [claude.ai/code](https://claude.ai/code), or run `/web-setup` in a local Claude Code session to use your `gh` token. The GitHub App is also what enables auto-fix on pull requests.
3. **Keep the default network access.** The Default environment uses Trusted access, which reaches `registry.npmjs.org` and `nodejs.org`. Nothing else is needed.
4. **Install Node.js 24 with a setup script.** The cloud image ships Node.js 20, 21, and 22, and this repository needs 24.15 or later. Open the environment settings at claude.ai/code and paste this into the **Setup script** field:

   ```bash
   #!/bin/bash
   set -euo pipefail

   # Keep in sync with .nvmrc.
   NODE_VERSION=24.21.0

   case "$(uname -m)" in
     x86_64) NODE_ARCH=x64 ;;
     aarch64) NODE_ARCH=arm64 ;;
     *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
   esac

   mkdir -p /opt/node24
   curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz" \
     | tar -xz --strip-components=1 -C /opt/node24
   ```

   The script runs as root before Claude Code starts, and its result is cached for later sessions. It installs Node.js 24 next to the bundled versions and does not change the default: `node --version` still prints 22, because the bundled Node.js comes first on `PATH`. `CLAUDE.md` tells Claude to put `/opt/node24/bin` first on `PATH` in every command, and shell state does not carry over between commands, so that prefix is needed each time. If you skip the script, the session still works: Claude installs Node.js 24 itself, which costs a minute at the start of every session.

### Start a session for a stage

Start each stage from `main`, after the previous stage's pull request is merged.

- **Browser:** open [claude.ai/code](https://claude.ai/code), choose `cravingmaker/eslint-config` and the `main` branch, and send the prompt.
- **Terminal:** from a checkout that is on `main` and pushed, run `claude --cloud "<prompt>"`. The session clones the GitHub remote at your current branch, not your local files.

Prompt for a stage, with the number filled in:

```text
Read docs/rewrite/handoff.md and docs/rewrite/implementation-plan.md, then
implement stage <n> of the plan and nothing beyond it. Follow "Working on a
stage" in the handoff. Open one pull request to main when the stage's gate
passes, and stop to ask me if a stop condition applies.
```

For stage 3, which is a list of independent behavior changes, you can run one item per session instead:

```text
Read docs/rewrite/handoff.md and docs/rewrite/implementation-plan.md, then
implement only the "<item>" row of stage 3. Add the failing test first, update
the policy snapshots, and explain the snapshot diff in the pull request.
```

### Review and merge

1. Read the diff in the session, or open the pull request on GitHub. For stages 1 and 2, confirm that no file under `tests/policy/__snapshots__/` changed. For stage 3, read every changed snapshot line; each one is a lint policy change.
2. Check that CI passed on Node.js 24 and 26.
3. To have Claude follow up on CI failures and review comments, turn on **Auto-fix** in the session's CI status bar.
4. To continue a cloud session on your machine, run `claude --teleport` from a clean checkout of this repository.
5. Merge the stage's pull request yourself. If Release Please opens a release pull request afterwards, leave it open until you want to publish.
