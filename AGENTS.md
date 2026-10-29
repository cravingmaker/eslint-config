# @cravingmaker/eslint-config

A TypeScript-first, shareable ESLint flat config, published to npm as an ESM-only package. By default it lints TypeScript files with type information and expects the strict tsconfig that the README names. The public API is `createConfig()` in `src/index.ts`.

## Commands

- `npm ci`, then `npm run prepare`: install dependencies and enable the git hooks. `.npmrc` disables install scripts, so the hooks are not set up automatically.
- `npm run build`: bundle `src/` into `dist/`. Run it before linting or testing, because `eslint.config.js` and most tests import `./dist/index.mjs`.
- `npm run gen`: generate the rule option types in `src/typegen.d.ts`, which is not committed. `build` and `typecheck` run it first.
- `npm run lint:unused`: run Knip to check for unused files, exports, types, and dependencies. `knip.json` marks disk-loaded test fixtures as entry points.
- `npm run lint:workflows`: check the GitHub Actions workflows with the pinned actionlint, which it downloads into the ignored `.tools/` on first use.
- `npm run validate`: `npm run validate:static` (format check, build, typecheck, Knip, lint, workflow lint, and package checks), then the tests. Run it before pushing. It takes a few minutes and installs the packed package from the npm registry; use a long command timeout.
- `npx vitest run <path>`: run one test file or directory.
- `npm run policy:diff -- --base <git-ref>`: build, then report how the effective lint policy of the working tree differs from the snapshots at `<git-ref>`, `HEAD` by default. A refactor must report every snapshot unchanged.
- `npx eslint .`: lint with this package's own config.

## Environment

Node.js 24.15 or later is required at runtime. Check `node --version` before anything else and use the contributor version in `.nvmrc`. In a Claude Code cloud session, if `/opt/node24/bin/node` matches that version, put `/opt/node24/bin` first on `PATH` for every command; otherwise install the pinned version from `nodejs.org` into `/opt/node24` first. See the setup script in `CONTRIBUTING.md`, then run `npm ci` and `npm run prepare`.

## Conventions

- ESM only. Do not add CommonJS output or CommonJS linting support.
- Dependencies are pinned to exact versions that are at least seven days old (`save-exact` and `min-release-age` in `.npmrc`). Keep dependency bumps in their own commits.
- Prettier formats; ESLint does not own layout.
- Markdown keeps each paragraph and list item on one line; never wrap prose by hand. Write pull request bodies and release notes the same way, because GitHub renders their line breaks.
- Pull request titles follow Conventional Commits and become the squash commit on `main`.
- Never bypass the git hooks with `--no-verify`.
- `tests/policy/__snapshots__/` records the effective lint policy. A changed line there is a changed policy: update with `npx vitest run tests/policy -u` only when the change is intended, and explain the diff. Never edit those files by hand.
- `functional/prefer-immutable-types` can give different results depending on which files are linted together when a parameter's type is a mapped type such as `Partial<Readonly<T>>`; write `Readonly<Partial<T>>` instead. Before committing, lint both the whole repository and only the files you changed.
- Before changing anything under `src/` or `tests/`, read "Things to know" in `CONTRIBUTING.md`. `ROADMAP.md` lists planned work, including the evidence required before a temporary workaround is removed.
- Builder and API descriptions use starred `/** ... */` documentation, with prose paragraphs kept intact; implementation explanations use `//` and final periods. Preserve ordinary grouped comments and paragraph breaks.
- Keep option keys, including explicit `undefined`, in one sorted group. Blank lines partition sorting; retain them only for a meaningful commented category or a shared-options spread boundary. Shared core/extension options satisfy both supported schemas without changing values or spread precedence.

## Releases

Do not merge Release Please pull requests, create tags, publish GitHub Releases, or approve staged npm versions. Merging a release pull request stages the release on npm. The maintainer does this.
