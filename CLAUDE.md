# @cravingmaker/eslint-config

A shareable ESLint flat config, published to npm as an ESM-only package. The public API is `createConfig()` in `src/index.ts`.

## Commands

- `npm ci`, then `npx husky`: install dependencies and enable the git hooks. `.npmrc` disables install scripts, so the hooks are not set up automatically.
- `npm run build`: bundle `src/` into `dist/`. Run it before linting or testing, because `eslint.config.js` and most tests import `./dist/index.mjs`.
- `npm run validate`: format check, build, typecheck, lint, tests, and package checks. Run it before pushing. It takes a few minutes; use a long command timeout.
- `npx vitest run <path>`: run one test file or directory.
- `npx eslint .`: lint with this package's own config.

## Environment

Node.js 24.15 or later is required at runtime. Check `node --version` before anything else. In a Claude Code cloud session the default is Node.js 22: if `/opt/node24/bin/node` exists, put `/opt/node24/bin` first on `PATH` for every command; otherwise install the version in `.nvmrc` from `nodejs.org` into `/opt/node24` first.

## Conventions

- ESM only. Do not add CommonJS output or CommonJS linting support.
- Dependencies are pinned to exact versions that are at least seven days old (`save-exact` and `min-release-age` in `.npmrc`). Keep dependency bumps in their own commits.
- Prettier formats; ESLint does not own layout.
- Pull request titles follow Conventional Commits and become the squash commit on `main`.
- Never bypass the git hooks with `--no-verify`.
- `tests/policy/__snapshots__/` records the effective lint policy. A changed line there is a changed policy: update with `npx vitest run tests/policy -u` only when the change is intended, and explain the diff. Never edit those files by hand.
- `functional/prefer-immutable-types` gives different results depending on which files are linted together. Before committing, lint both the whole repository and only the files you changed.

## Releases

Do not merge Release Please pull requests, create tags, or publish GitHub Releases. Merging a release pull request publishes to npm. The maintainer does this.

## Rewrite in progress

The package is being restructured in stages. Before changing anything under `src/` or `tests/`, read `docs/rewrite/handoff.md` and `docs/rewrite/implementation-plan.md`, and keep to the stage you were asked to work on.
