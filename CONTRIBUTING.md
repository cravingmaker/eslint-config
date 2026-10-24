# Contributing

Please follow the
[Code of Conduct](https://github.com/cravingmaker/.github/blob/main/CODE_OF_CONDUCT.md)
in all project interactions.

This guide starts with setup, a map of the code, and recipes for the
common maintenance tasks. The recipes link to the detailed reference,
[Things to know](#things-to-know), so you can start with the task at
hand.

- [Setup](#setup)
- [Making changes](#making-changes)
- [How the configuration is built](#how-the-configuration-is-built)
- [Inspecting the configuration](#inspecting-the-configuration)
- [Common tasks](#common-tasks)
- [Things to know](#things-to-know)
- [Validation](#validation)
- [Releases](#releases)
- [Reporting issues](#reporting-issues)

## Setup

Development and the published configuration require Node.js 24.15.0 or newer.

Use the contributor Node.js version pinned in [.nvmrc](.nvmrc). If you use
nvm, run:

```bash
nvm install
nvm use
```

From a local checkout, run:

```bash
npm ci
npm run prepare
```

The repository disables installation scripts, so run `npm run prepare`
explicitly once per checkout to activate Husky hooks.

See [README.md](README.md) for the runtime configuration and supported
integrations.

### Claude Code cloud sessions

To install the contributor Node.js version in a Claude Code cloud environment,
paste this into the **Setup script** field of
the environment at [claude.ai/code](https://claude.ai/code). It runs as
root before Claude Code starts, and its result is cached for later
sessions:

```bash
#!/bin/bash
set -euo pipefail

# Keep in sync with .nvmrc.
NODE_VERSION=24.22.1

case "$(uname -m)" in
  x86_64) NODE_ARCH=x64 ;;
  aarch64) NODE_ARCH=arm64 ;;
  *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

mkdir -p /opt/node24
curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz" \
  | tar -xz --strip-components=1 -C /opt/node24
```

The script does not change the default `node`, which stays first on
`PATH`, so [AGENTS.md](AGENTS.md) tells Claude to put `/opt/node24/bin`
first on `PATH` in every command. Without the script, Claude installs
Node.js 24 itself at the start of each session.

After dependency installation, run `npm run prepare` in the checkout to enable
the hooks; installation scripts are disabled here as in local setup.

## Making changes

Use the [coding principles](CODING_PRINCIPLES.md) to choose code style,
architecture, linter rules, formatter settings, and scripts. Apply the goals in
their stated priority order when comparing approaches.

Create a branch from the latest `main` and keep each pull request focused.
Use a conventional pull request title, such as `fix: ...`, `test: ...`, or
`docs: ...`. Describe the problem and resulting behavior, including
before/after examples when lint diagnostics or fixes change.

Add relevant regression tests for behavior changes. A feature's builder suite
follows its source path, such as `tests/configs/plugins/node/index.test.ts`
for `src/configs/plugins/node/index.ts`. For configuration or plugin changes,
exercise packed consumers in `tests/package/` as well.

## How the configuration is built

`src/index.ts` exports `createConfig()` from `src/factory.ts` and the
public types from `src/types.ts`. Everything else is internal.
Authored dependency declarations belong in `src/ambient/`, separate from those
public types and the generated rule-option declarations in `src/typegen.d.ts`.
Keep an ambient module declaration free of top-level imports and exports so it
declares the dependency rather than augmenting an existing module. The recursive
TypeScript include discovers these files without a custom `typeRoots` setting.

`createConfig(options, ...userConfigs)` works in this order:

1. `src/unknown-options.ts` rejects an option name that it does not
   know.
2. `src/context.ts` reads the dependencies that the manifest at
   `projectRootDirectory` declares, and `src/options.ts` applies the
   defaults: a feature that is off becomes `undefined`, and `"auto"`
   turns a framework on when the manifest declares it.
3. The builder of each feature that is on, in `src/configs/`, returns
   the feature's blocks. A builder takes the feature's options and a
   context with what more than one feature needs: the globals, the
   Svelte components, the tsconfig directory, and the type-aware scope.
   The blocks come in a fixed order: the global ignores, `javascript`
   and the code-quality features, `typescript`, the frameworks, and the
   file formats. Plugin features live in `src/configs/plugins/`, beside
   `src/configs/core/`. Global ignores and file-role exceptions have their
   own folders directly under `src/configs/`; shared options also stay there.
   Every feature has its builder in `index.ts` and its rule maps in modules
   of their own. Builders export the builder only; import policy from its
   owning rule module. Upstream categories have named modules under `rules/`,
   as in `core/rules/possible-problems.ts`;
   features without official categories keep their policy in `rules.ts`.
   Feature folders use the feature-facing name, such as `imports/`, while
   dependency names, plugin namespaces, and rule IDs retain `import-x`.
   The established `core/` owner of `javascript` remains deliberate.
   A categorized feature's `rules.ts` composes its category maps. Rule maps
   use the `Rules` type, `as const` for object literals, and named exports.
   The `packageJson` option composes two plugin builders, in separate
   `package-json/` and `enforce-package-type/` folders.
4. Each feature declares disabled alternatives in its own rule map, with a
   `Handled by` comment naming the winning rule. There are no dynamic overlap
   blocks. `src/configs/exceptions/index.ts` adds file-role exceptions.
5. The user configs follow, in the order given.

Every block is named `@cravingmaker/eslint-config/<feature>/<part>`, and
`tests/factory/factory.test.ts` pins the names and their order. A
`setup` block registers a plugin for every file, a `rules` block holds a
feature's rule map and its `overrides`, and a `rules-type-aware` block
holds the rules that need type information, over the type-aware scope.

Source-plugin builders use `sourcePluginConfigs()` from
`src/utilities/source-plugin.ts` for their setup and rules blocks. Pass the
feature's explicit name, plugin registrations, and named authored rule map,
followed by its options and context. The helper keeps registration global and
applies `withSvelteComponents`, file narrowing, ignores, and overrides to rules.
Functional, SonarJS, Node, and Imports keep their typed or resolver blocks
explicit after those shared blocks; typed override filtering stays with its
owning builder. Framework builders retain lazy optional-peer loading.
Package JSON deliberately registers `package-json` globally, while
`enforce-package-type` registers only in its Package JSON rules block; retain
that difference for files outside the feature.

The internal `@cravingmaker` plugin in `src/rules/` supplies the policies
that installed rules cannot express safely. The existing JavaScript rules block
registers and enables `@cravingmaker/prefer-arrow-functions`; Unicorn's existing
setup/rules blocks register the same plugin and enable
`@cravingmaker/starred-documentation`. Their scopes and overrides follow their
owning features, without adding public options or config blocks. Type generation
loads these rule definitions from source before the build; include internal
rules in inventory, consumer, scope, and generated-type checks.
Stylistic's existing setup/rules blocks also register the plugin and enable
`@cravingmaker/svelte-function-variable-padding` only for the top-level Svelte
script statements that the installed native padding rule cannot visit. The
companion has its own override ID; it never duplicates native nested-statement
diagnostics or loads an optional peer.

Package JSON's existing setup block registers the same internal plugin for
`@cravingmaker/require-peer-metadata`. The rule checks only root peer metadata
completeness; upstream shape validation already requires each entry's boolean
`optional`, the nonempty-field rule rejects empty objects, and the relationship
rule rejects undeclared peers. Keep these owners without duplicate conditional
reports, automatic fixes, or new peer dependencies. Every declared peer in this
repository's manifest has explicit metadata, including `optional: false` for ESLint.

The TypeScript builder adds `typescript/rules-type-aware-tsx` after its general
typed block. It changes only naming for function-valued `const` bindings and
functions in typed `.tsx`, within the already resolved type-aware scope; all
feature and typed overrides still win. Ordinary data, other extensions, parser
routing, and the arrow-style owner retain their policies. Actual AST property
contracts continue to use targeted naming suppressions; do not add a name whitelist.

The builders share these modules:

| Module                           | Holds                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/globs.ts`                   | The default files of the features                                                                            |
| `src/configs/shared-options.ts`  | Rule options that more than one rule map uses, such as those of a core rule and of the rule that replaces it |
| `src/utilities/file-scope.ts`    | `narrowFiles()` and `withoutIgnores()`, which limit `files` patterns by other patterns and by an ignore list |
| `src/utilities/source-plugin.ts` | Shared source-plugin setup and rule blocks, with explicit policy and specialized blocks kept in each builder |
| `src/utilities/is-record.ts`     | Dependency-free object guard shared by production, scripts, and tests; excludes arrays                       |
| `src/utilities/type-aware.ts`    | The helpers of the type-aware scope, such as `typeAwareConfig()`                                             |
| `src/utilities/import-peer.ts`   | `importPeer()`, which loads an optional peer or fails with a message that names it                           |
| `src/utilities/plugin-policy.ts` | Limits the explicit framework policy to rules and option fields supported by an installed optional peer      |
| `src/typegen.d.ts`               | The rule option types, which `npm run gen` generates and which are not committed                             |

The effective-config serializer keeps its local object guard because its
section descriptions also accept arrays. Do not replace it with the stricter
record guard. File-role exceptions iterate each role's feature map in declared
order and emit rules only for enabled owners.
The policy-report subprocess's watch mapping also covers the shared record guard.

Dedicated suites follow their source owners: feature builders have
`tests/configs/plugins/<feature>/index.test.ts`, core category suites live in
`tests/configs/core/rules/`, and production utility suites live in
`tests/utilities/`. Purpose-named feature integration suites, such as Svelte's
`scripts.test.ts`, stay with their feature. `tests/factory/` tests `createConfig()`
and its options; `tests/policy/` owns cross-feature behavior, including the shared
twelve-feature builder contract and typed-scope integration. `tests/scripts/`
tests scripts, including type generation, and `tests/package/` exercises the
packed package in temporary consumers. Shared lint assertions and effective-file
descriptions belong in `tests/support/`.
Add tests for behavior rather than requiring one suite for every source leaf.
Many suites load the build, so build first, as [Builds and tests](#builds-and-tests)
explains.

### Where a rule is declared

The prefix of a rule ID names its plugin, and each plugin belongs to
one feature. The rule map of that feature is the policy for its rules.
Category modules follow the installed plugin's official categories and
separate recommended rules from other rules where both are present.
Within each map, group rules with default options, rules with overridden
options, and turned-off rules, omitting empty groups. Use the same dashed
section comments as the core maps, with the number of entries in the group
and the total in that map. ESLint fixes alphabetical ordering within groups.
Keep fixed defaults explicit and explain disabled rules with a comment;
use `Handled by` and the winning rule ID for overlaps, including Prettier.
Inline fixability comments describe the installed rule's `meta.fixable` and
`meta.hasSuggestions` capabilities, including for disabled rules. Composition
spreads summarize each map's rule and fixability counts against the containing
map's total; standalone maps put the summary beside their named export.
End comment text, including headings and directive explanations, with a period.
Review these comments when updating dependencies. Compatibility filtering,
typed-rule suppression, and user overrides do not choose the authored groups.
The package-json feature follows the upstream README's Require Properties
and Valid Properties categories; its remaining rules are in `rules/other.ts`,
as Unicorn's are. Keep official category names such as `no-other-paradigms.ts`.
React deliberately treats the upstream `Best Practice` and `Best Practices`
labels as one local category in `html-best-practice.ts`. Its nine entries keep
the original composition order, with duplicate-classname first; the stylistic,
Hooks, and Refresh policies remain separate.
Node's `rules-type-aware.ts` owns the TypeScript-specific off and typed
reactivation maps, referencing the single `n/no-sync` tuple in `rules.ts`.
JavaScript keeps that base policy; untyped TypeScript, components, and the
JavaScript rune modules that Svelte parses keep the guard that turns it off.
Functional and SonarJS keep explicit typed-rule classifications beside their
authored category maps. Their off guards come from the selected authored maps
through `rulesOff()` in `src/utilities/type-aware.ts`. TypeScript derives its
guard from its typed map and the plugin entries of its typed replacement map;
core replacement entries remain in their own block. Upstream metadata never
adds runtime policy. Omitted deprecated rules retain separate typed override
guards. Keep fixability and ownership explanations at the authored policy entry.
Typegen's build-only plugin registry remains local so it can eagerly inspect
all development plugins without coupling runtime lazy optional-peer loading to
generation. `tests/scripts/typegen.test.ts` checks configured and registered
rule IDs against the generated declarations.
The table lists each feature's policy entry points:

| Rule ID prefix                                          | Feature         | Policy modules                                                                                                           |
| ------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| None: ESLint core rules                                 | `javascript`    | `src/configs/core/rules.ts`, its category modules in `core/rules/`, and `src/configs/plugins/typescript/replacements.ts` |
| `@typescript-eslint/`                                   | `typescript`    | `src/configs/plugins/typescript/rules.ts`, `rules-type-aware.ts`, and `replacements.ts`                                  |
| `@eslint-community/eslint-comments/`                    | `comments`      | `src/configs/plugins/comments/rules.ts`                                                                                  |
| `n/`                                                    | `node`          | `src/configs/plugins/node/rules.ts` and `rules-type-aware.ts`                                                            |
| `security/`                                             | `security`      | `src/configs/plugins/security/rules.ts`                                                                                  |
| `sonarjs/`                                              | `sonarjs`       | `src/configs/plugins/sonarjs/rules.ts` and `rules-type-aware.ts`                                                         |
| `import-x/`                                             | `imports`       | `src/configs/plugins/imports/rules.ts`                                                                                   |
| `unused-imports/`                                       | `unusedImports` | `src/configs/plugins/unused-imports/rules.ts`                                                                            |
| `promise/`                                              | `promise`       | `src/configs/plugins/promise/rules.ts`                                                                                   |
| `regexp/`                                               | `regexp`        | `src/configs/plugins/regexp/rules.ts`                                                                                    |
| `unicorn/`                                              | `unicorn`       | `src/configs/plugins/unicorn/rules.ts`                                                                                   |
| `functional/`                                           | `functional`    | `src/configs/plugins/functional/rules.ts` and `rules-type-aware.ts`                                                      |
| `perfectionist/`                                        | `perfectionist` | `src/configs/plugins/perfectionist/rules.ts`                                                                             |
| `@stylistic/`                                           | `stylistic`     | `src/configs/plugins/stylistic/rules.ts`                                                                                 |
| `@html-eslint/react/`, `react-hooks/`, `react-refresh/` | `react`         | `src/configs/plugins/react/rules.ts`                                                                                     |
| `@html-eslint/svelte/`                                  | `svelte`        | `src/configs/plugins/svelte/rules.ts`                                                                                    |
| `express-security/`                                     | `express`       | `src/configs/plugins/express/rules.ts`                                                                                   |
| `@html-eslint/`                                         | `html`          | `src/configs/plugins/html/rules.ts`                                                                                      |
| `json/`                                                 | `json`          | `src/configs/plugins/json/rules.ts`                                                                                      |
| `package-json/`                                         | `packageJson`   | `src/configs/plugins/package-json/rules.ts`                                                                              |
| `enforce-package-type/`                                 | `packageJson`   | `src/configs/plugins/enforce-package-type/rules.ts`                                                                      |
| `markdown/`                                             | `markdown`      | `src/configs/plugins/markdown/rules.ts`                                                                                  |

Every current non-deprecated core and plugin rule has an explicit setting
in its owning rule map, including the rules that are off. The maps declare
fixed option defaults locally for enabled rules; disabled rules need only
`"off"`. No plugin preset or rule-registry loop chooses the policy. For optional peers, `supportedPluginPolicy()` applies
only declared rules and option fields that the installed version supports;
core defaults also respect the host ESLint's option schemas. Feature
overrides follow this compatibility step unchanged. New upstream
rules remain unconfigured until a
maintainer classifies them, and `tests/policy/rule-coverage.test.ts` fails
on an unclassified rule.

The authored core maps are the reference for rule policy. Enabled rules
declare canonical options; deprecated aliases do not need duplicate entries.
Omit deprecated core and plugin rule keys at every severity, including `off`.
The authored-map guard checks installed metadata before optional-peer filtering.
Omission leaves a preceding consumer setting active: in particular, an earlier
`no-return-await` prohibition can conflict with TypeScript's retained
`return-await: ["error", "always"]` policy. A consumer can disable it in a later
config. Keep canonical `max` without the redundant `maximum` alias on TypeScript's
parameter limit; retain its supported `countVoidThis: false`. Stylistic's
annotation-spacing `overrides: { arrow: "ignore" }` is an intentional neutral
compatibility guard that prevents a Prettier fix loop, rather than an unused alias.
The core reference selects default forms for `curly` and `radix`.

Stylistic explicitly inventories every current non-deprecated bundled rule,
including experimental rules as `"off"`. Its upstream rule list has overlapping tags
rather than exclusive categories, so `rules.ts` groups recommended and other
rules, as the uncategorized plugins do. Stable token spacing and structural
checks remain on when they agree with Prettier; its disable list is not a policy
source. Width, indentation, quote, and semicolon choices stay with Prettier.

SonarJS has no exclusive upstream rule categories, so its explicit inventory stays in
`rules.ts`, grouped into recommended and other rules. Both groups include disabled
non-deprecated rules; neither imports the upstream preset. Capability comments come
from rule metadata. The fixed inventory in `rules-type-aware.ts` guards every rule
that requires type information, even disabled alternatives that overrides may enable.
SonarJS owns duplicated branches across non-adjacent conditionals and switches,
while Unicorn's overlapping adjacent-if rule stays off. SonarJS permits short partial
branches so simple dispatch code does not need an abstraction solely to remove a
repeated expression. Existing rules retain other overlaps, with a `Handled by` comment on each disabled alternative. Review-oriented
checks warn; correctness checks error. This follows the priority order in
[the coding principles](CODING_PRINCIPLES.md), with readability ahead of forced
abstractions or arbitrary limits on domain models.

Quantitative maintainability limits use `warn`: core complexity, parameter,
line-count, block-depth, and callback-depth limits; the TypeScript parameter
owner; Unicorn's nested-call limit; HTML element depth; and SonarJS cognitive,
expression, and regex complexity. These twelve owner entries request contextual
review rather than a mechanical API rewrite. Preserve their numeric options,
replacement ownership, typed scopes, and justified repository exceptions.
Security and correctness policies keep their independently reviewed severities.
The repository still runs `eslint . --max-warnings 0`, so warnings fail its gate.
An ordinary consumer CLI permits warnings; `--quiet` skips warning rules unless
`--max-warnings` is also present, when they run and count but their output is hidden.

Use explicit updates (`count = count + 1` or `count = count - 1`), including
`for` update clauses. Core `no-plusplus` rejects prefix/postfix `++` and `--`
without automatic fixes. Keep both compound-assignment owners set to `never`,
including arithmetic, exponentiation, shifts, bitwise, and logical assignments.
Migrate deliberately: preserve expression results, numeric coercion, BigInt's
`1n`, receiver/key/getter evaluation counts, and conditional setters. Expand
logical assignments with explicit branches when an unconditional property write
would change behavior. Do not add a blanket replacement helper or suppression.

An option set to `undefined` deliberately retains inference from settings,
the project's engines or tsconfig, or a rule's optional behavior without a
neutral schema-valid value. Mutually exclusive option forms keep the
selected form. Variadic lists of restrictions can be empty; a bare
severity then declares no restrictions. `import-x/no-unused-modules` takes
no options while off because its schema requires an active export check
whenever options are supplied. Suppression blocks use severity-only
entries to retain the owning map's options when ESLint merges the blocks.

Keep a single option object's ordinary keys in one sorted group, including
explicitly unset keys. A blank line is a sorting partition because
`perfectionist/sort-objects` uses `partitionByNewLine: true`; use one only for
a meaningful, commented category or a shared-options spread boundary. Preserve
spread precedence, matcher/group arrays, and other semantically ordered values.
Unset values alone do not justify a separate group. Check the effective policy
after changing partitions; do not change the Perfectionist setting to format a map.

Shared option objects use `satisfies RuleOptionOf<...>` against each consuming
schema when both support the same fields. Use intersections for core/extension
options and the specific tuple position for multi-object rules, retaining
`as const` when literal inference matters. Keep native-only options at their
native entry and extension-only options at their extension entry. A type check
does not replace installed-schema validation or the annotation-spacing guard.

The eighteen AWS CDK checks, including the separately grouped IAM resource
check, remain errors independently of the root manifest. Workspace and optional
dependencies need the same security coverage. The twenty reviewed test-rule
entries also retain the current SonarJS scope, with `assertions-in-tests` warned
only in the typed scope. Do not restrict them to the shared `.test`/`.spec`
exception role or broaden that role: runners recognize alternate names such as
`__tests__/check.*` and `test/check.*`. Their own API recognizers, feature
filters, typed guards, and later overrides still apply.
`tests/configs/plugins/sonarjs/scope.test.ts` checks these manifest, filename,
diagnostic, negative-control, and boundary cases through the public factory.

### The `javascript` option and the `core` module

The public feature `javascript` holds ESLint's core rules. Its builder
is `core()` in `src/configs/core/`, because those rules apply to
TypeScript files and to the scripts of Svelte components as well as to
JavaScript. `src/factory.ts` shows the mapping:
`core(resolved.javascript, context)`. What consumers see keeps the name
`javascript`: the option, `javascript.overrides`, the messages that name
them, and the block names that start with `javascript/`. Core rules belong
to this feature even when their alternatives are implemented by a plugin. There is no `core` option, and
`createConfig()` rejects one as unknown. Names such as `javascriptFiles`
in `src/globs.ts` mean the language, not the feature. The tests of the
builder are in `tests/configs/core/`.

### Feature overrides and user configs

A consumer can change a rule in two places, which apply at different
points of the order:

- **A feature's `overrides`** go into the feature's `rules` block, after
  its rule map, and reach the feature's files only. An entry replaces
  the whole entry of the policy, so `"warn"` alone drops the options
  that the policy gives the rule. Overrides can enable a disabled
  alternative within its feature's files, but a later file-role exception
  still turns its rules off. A few features split their overrides: an
  override that turns on a rule that needs type information applies
  only where typed linting does, the blocks of the React feature divide
  the overrides by plugin, and `json.overrides` reach JSON files only,
  with `overridesJsonc` and `overridesJson5` for the other two
  languages.
- **User configs** are flat config objects that follow every block of
  this package, in the order given. ESLint merges each of them with the
  blocks before it, so `"warn"` alone keeps the options of the policy,
  as [Policy and snapshots](#policy-and-snapshots) explains. A user
  config can limit a change to some files, register another plugin, and
  turn back on a rule that a file-role exception turns off.

`tests/factory/factory.test.ts` checks that user configs come last, and
`tests/configs/exceptions/index.test.ts` that they can turn a rule back on.
The README describes both to consumers, in "Feature values" and "User
configs".

## Inspecting the configuration

Three tools show what ESLint resolves:

- **The snapshots** in `tests/policy/__snapshots__/effective-rules/`
  hold the reviewed configuration of representative paths. Each lists
  the settings that decide how ESLint parses the file, then one rule per
  line with its severity and options. The options include the defaults
  that ESLint adds from the rule's schema.
  `tests/policy/effective-scenarios.ts` describes the scenarios; all of
  them turn every framework on. The snapshots need no build:

  ```bash
  grep -rn '^no-unused-vars:' tests/policy/__snapshots__/effective-rules/
  ```

- **`npx eslint --print-config <file>`** prints the configuration that
  ESLint resolves for one path, as JSON. The file need not exist. It
  prints `undefined` when ESLint ignores the path or no block matches
  it.
- **`npm run lint:inspect`** builds the package and starts
  [ESLint Config Inspector](https://github.com/eslint/config-inspector),
  which lists every block with its files and rules. Its "Test matching
  with filepath" field shows the blocks that match a path.

The last two load `eslint.config.js`, which imports `dist/index.mjs`.
`npm run lint:inspect` builds first, but `--print-config` shows the
previous build until you run `npm run build`.

### Interactive Config Inspector

Start the inspector from the repository root:

```bash
npm run lint:inspect
```

Open the URL printed in the terminal, normally <http://localhost:7777/>.
The command keeps running until you press Ctrl+C. It does not open a
browser automatically; use `npm run lint:inspect -- --open` to do so, or
`npm run lint:inspect -- --port=7778` to choose another port. The server
listens on `127.0.0.1` unless `--host` or the `HOST` environment variable
selects another address. Keep that default: the inspector serves the
configuration and the repository's file paths without authentication.

Start it with `npm run lint:inspect` rather than
`npx eslint --inspect-config`. ESLint's flag runs
`npx @eslint/config-inspector@latest`, which can download a newer release
than the version locked in `package-lock.json`.

Try paths such as `src/factory.ts`, `eslint.config.js`, and `package.json`
to see which named blocks apply and how their rules combine. The Rules
view also shows rule metadata and links to the upstream documentation.

Config Inspector 3.5.0 omits this package's `*-type-aware` blocks from
file matches when their `files` contain nested negated globs. Clear the
filepath field to see those blocks, and confirm their final rules with
`npx eslint --print-config src/factory.ts`. For example, ESLint enables
`@typescript-eslint/no-floating-promises` there even when the inspector's
merged view shows it off. This limitation also affects static snapshots.

The inspector reloads edits to `eslint.config.js`. After editing `src/`,
restart `npm run lint:inspect` so it rebuilds `dist/index.mjs` before
loading the config; the command builds only once at startup.

To save a static snapshot of the current configuration:

```bash
npm run lint:inspect:build
```

This builds the package and writes a standalone inspector to
`node_modules/.cache/eslint-config-inspector/`. Serve that directory with
a static HTTP server to browse it. The build deletes its output directory
before writing, so each run replaces the previous snapshot. The script's
directory is ignored by Git and the repository checks and is removed by
`npm ci`; the inspector's default, inside `dist/`, would be published.
Run the command again after config changes.
Inspector options can be forwarded with `--`, for example
`npm run lint:inspect:build -- --base /eslint-config/` for hosting at a
subpath.

### This repository's options are not the defaults

Both tools resolve this repository's `eslint.config.js`, which differs
from what a consumer gets by default:

- `overridesTypeAware` adds an option to
  `@typescript-eslint/naming-convention`.
- The `"auto"` frameworks follow this repository's manifest, which
  declares `react` and `svelte`: React and Svelte are on, and Express
  and React Refresh are off.
- `src/typegen.d.ts` and `tests/fixtures/` are ignored.

To inspect other options, write an explicit consumer configuration in
`node_modules/.cache/`, which git, Prettier, and ESLint ignore, and
which `npm ci` removes. Set every framework, because `"auto"` reads the
manifest in the working directory, which is this repository's:

```js
// node_modules/.cache/consumer.config.js
import { createConfig } from "../../dist/index.mjs";

export default createConfig({
  express: false,
  react: false,
  svelte: false,
});
```

Pass it with `--config`. ESLint then matches paths from the working
directory, and the inspector from the directory of the config, unless
`--basePath` names another:

```bash
npm run build
npx eslint --config node_modules/.cache/consumer.config.js --print-config src/example.ts
npm run lint:inspect -- --config node_modules/.cache/consumer.config.js --basePath .
```

### The blocks that set a rule

This script lists every block of a config that sets a rule, in the
order that ESLint applies them, with the files that each block covers.
Pass it a config and a rule ID; `./eslint.config.js` lists the blocks of
this repository's configuration:

```bash
node --input-type=module --eval '
const [file, ruleId] = process.argv.slice(1);
const { default: configs } = await import(file);
for (const { files, ignores, name, rules = {} } of await configs)
  if (Object.hasOwn(rules, ruleId))
    console.log(name, JSON.stringify(rules[ruleId]), JSON.stringify({ files, ignores }));
' ./node_modules/.cache/consumer.config.js no-unused-vars
```

### Comparing the policy with a commit

`npm run policy:diff` builds the package and compares the configuration
of the working tree with the snapshots of a commit, `HEAD` unless
`--base` names another. Fetch first to compare with the current `main`:

```bash
npm run policy:diff
npm run policy:diff -- --base origin/main
```

It describes the snapshots of `tests/policy/effective-scenarios.ts` with
the build, as the snapshot test does, reads those of the commit through
Git, and lists the differences by scenario and file: the rules that were
added or removed, the severities and options that changed, each option
by its path, and the changes to whether ESLint ignores the file, its
language, parser, plugins, globals, and settings, such as the import
resolver. A snapshot that only one side has is listed as new or removed.
The report starts with the commit, the Node.js and ESLint versions, and
the packages whose locked version differs from the commit's
`package-lock.json`, which tell a refactor from a dependency update, and
ends with a summary.

The report changes no file but `dist/`, which the build refreshes. It
exits with 0 when it compares every snapshot, whatever the differences,
and with 1 when the base is not a commit, the commit has no snapshots,
the installed packages differ from `package-lock.json`, or a snapshot
cannot be described or read.

## Common tasks

Each recipe names the tests that cover its change. Before opening a
pull request, run the full [validation](#validation) as well.

### Change a rule

1. **Find its rule map.** [Where a rule is declared](#where-a-rule-is-declared)
   names the module of the rule's feature. Search the rule maps
   rather than all of `src/`, because the generated
   `src/typegen.d.ts` names every rule:

   ```bash
   rg -n '"no-unused-vars"' src/configs
   ```

2. **Read its explicit setting and options.** Every current non-deprecated
   core and plugin rule has an entry in its owning map. A missing entry is
   unconfigured, and the coverage test reports it. Change that entry and
   give an `"off"` its reason in a comment. Declare fixed defaults rather
   than reading a preset or a plugin's `defaultOptions` at runtime. Keep
   inferred or optional values explicitly unset where replacing them with
   a fixed value would change consumer behavior.

3. **Check ownership and the other blocks that set it.**
   - Rule ownership is explicit in the rule maps. An alternative stays off
     even when its winner is disabled or excludes a file. Add a `Handled by`
     comment naming the winning rule when changing an overlap.
   - In TypeScript files and Svelte components,
     `src/configs/plugins/typescript/replacements.ts` turns off the core rules
     that the compiler checks or that an extension rule replaces. When
     a rule and its replacement share options, those options are in
     `src/configs/shared-options.ts`, so that they change together.
   - `src/configs/exceptions/index.ts` turns some rules off in the files of a
     role; see [Change a file exception](#change-a-file-exception).
   - A rule that needs type information is on only where typed linting
     is; see [Parsing and type information](#parsing-and-type-information).
   - Review a style rule against the coding principles and actual formatter
     behavior. Compatible token spacing and structural rules can stay on;
     competing wrapping, indentation, quote, and semicolon policies stay off
     with a specific reason. See "The formatter test guards layout".

4. **Test the policy, not the plugin.** Add a rule test to the file of
   the module in `tests/configs/`, following "A rule test checks this
   package, not the plugin". Rule tests lint through the build, so
   build first, and run them with the policy tests:

   ```bash
   npm run build
   npx vitest run tests/configs/plugins/unicorn/index.test.ts tests/policy
   ```

5. **Review the snapshots.** Without update mode, the snapshot test
   fails on each line that the change touches, in every scenario.
   `npm run policy:diff` lists the same changes by scenario and file,
   with each option that changed; see
   [Comparing the policy with a commit](#comparing-the-policy-with-a-commit).
   Check that the diff holds the intended change and nothing else, then
   update the snapshots as "Snapshots record the policy" describes.

6. **Check the result** for a path with `--print-config`, as in
   [Inspecting the configuration](#inspecting-the-configuration), and
   update the README where it describes the rule, such as in "Formatting
   with Prettier", "Rules that replace other rules", or "Known issues".

### Update a plugin

1. **Keep the update on its own.** Update the plugin in a commit of its
   own, with only the packages whose versions must match it, such as
   those of @html-eslint, and without refactors, so that every changed
   snapshot line has one cause. `.npmrc` pins exact versions
   (`save-exact`) and installs only releases that are at least seven
   days old (`min-release-age`). For an optional peer, the policy must
   work with every version in its `peerDependencies` range: CI's
   "Minimum peer versions" job installs the lowest ones. For
   typescript-eslint, see "TypeScript support follows typescript-eslint's
   peer range" under [Dependencies and peers](#dependencies-and-peers).

2. **Find the changed rules.** Read the release notes for new, removed,
   deprecated, and changed rules. Then run the
   [policy report](#comparing-the-policy-with-a-commit), which builds the
   package and lists what the update changes in every scenario, with the
   packages that `package-lock.json` changed, and run the policy tests
   without update mode:

   ```bash
   npm run policy:diff
   npx vitest run tests/policy
   ```

   - A new core or plugin rule stays unconfigured and fails
     `tests/policy/rule-coverage.test.ts` until its rule map has an explicit
     enabled or disabled entry and its options are reviewed.
   - Remove a rule that becomes deprecated from its map at every severity,
     including `off`. `tests/policy/deprecated-rules.test.ts` rejects authored
     deprecated core and plugin entries before compatibility filtering.
     Review inherited consumer settings as well as the default configuration.
   - A removed rule that a rule map turns on stops ESLint with
     `Could not find "<rule>" in plugin "<plugin>"`. An `"off"` entry
     for it passes without a message, so search the rule maps for each
     removed rule.
   - Fixed defaults are declared locally. Review new or changed options
     against the installed schema; `tests/policy/rule-options.test.ts`
     checks enabled rules' explicit options in the selected schema form
     and validates any options retained on disabled rules.
     Context-derived options and upstream implementations can still change
     behavior, so review the effective snapshots and actual lint results.

3. **Review the policy change.** Decide each changed snapshot line: keep
   a new rule on, or turn it off in its rule map with a reason. Then
   update the snapshots, and say in the commit message what changed and
   why, as "Snapshots record the policy" describes.

4. **Check the options, Prettier, and consumers.**
   - `npm run typecheck` regenerates the rule option types and checks
     the rule maps against them. ESLint rejects the options of a rule
     that is on when its schema does not accept them, and
     `tests/policy/rule-options.test.ts` checks those of the rules that
     are off.
   - `tests/policy/formatter.test.ts` fails on a rule that conflicts
     with Prettier; see "The formatter test guards layout".
     `tests/policy/formatting.test.ts` checks that Prettier and
     `eslint --fix` agree on the fixtures.
   - `tests/policy/fixtures.test.ts` fails on a new rule that reports a
     fixture, and `tests/policy/type-information.test.ts` on a new rule
     that needs type information and is on outside the type-aware scope.
   - `npm run test:package` installs the packed package in temporary
     consumers, some of them from the npm registry; see "A missing peer
     needs a consumer". `npm run validate` runs all of these checks.

### Inspect dependencies

Use [Node Modules Inspector](https://github.com/antfu/node-modules-inspector)
when reviewing dependency updates. It shows the installed dependency tree,
filters production and development dependencies, and reports package sizes.

Start the interactive UI:

```bash
npm run deps:inspect
```

Open the URL printed in the terminal, normally <http://localhost:9999/>.
The command keeps running until you press Ctrl+C. It does not open a
browser automatically; use `npm run deps:inspect -- --open` to do so, or
`npm run deps:inspect -- --port=10000` to choose another port. Like the
config inspector, it listens on `127.0.0.1` unless `--host` or `HOST`
selects another address; keep that default.

Run reports without starting the UI:

```bash
npm run deps:report-duplicates
npm run deps:report-sizes -- --limit 10
```

Both reports cover the installed tree, including development dependencies.
UI filters do not limit the CLI reports. For JSON output, use `--silent`
to keep npm's script banner out of stdout:

```bash
npm run --silent deps:report-duplicates -- --json
npm run --silent deps:report-sizes -- --json --limit 10
```

Registry metadata is fetched by default and cached under
`node_modules/.cache/node-modules-inspector/`. For local analysis without
metadata requests, supply an inspector configuration with
`fetchNpmMeta: false` using `-- --config /path/to/config.mjs`.
Node Modules Inspector 2.7.0 prints `Failed to get npm meta for:` with
many packages even when their metadata loaded: its vulnerability lookup
lists every package without a recorded vulnerability. The reports and
their JSON output are unaffected.

To save a static snapshot of the installed tree:

```bash
npm run deps:inspect:build
```

This writes a standalone inspector to
`node_modules/.cache/node-modules-inspector-build/`. Serve that directory
with a static HTTP server to browse it. As with the config inspector,
each run replaces the previous snapshot, and the script avoids the
default inside `dist/`. The directory is separate from
`node_modules/.cache/node-modules-inspector/` so that a build keeps the
metadata cache.

Finish dependency changes with the required [validation](#validation).

### Find unused code and dependencies

Run [Knip](https://knip.dev/) to check for unused files, exports, types,
and dependencies, as well as missing dependencies and unresolved imports:

```bash
npm run lint:unused
```

Knip discovers the build entry point, scripts, tool configurations, and
Vitest tests through its built-in plugins. [knip.json](knip.json) also
marks the fixtures as entry points: the tests lint those samples and copy
them into packed consumers by path. Public exports and fixture exports are
intentional, while internal modules are checked for unused exports.

`npm run validate` includes this check, so it also runs in CI and during
release checks. Findings and stale configuration hints fail validation.
Review each finding before removing code or adding an exception.

### Check the published package

Two checks read the package as `npm pack` produces it, so they see only
the files that npm publishes:

```bash
npm run lint:package
npm run typecheck:package
```

- `lint:package` runs [publint](https://publint.dev/) with `--strict`,
  which fails on warnings as well as errors. It checks `exports`, `main`,
  `types`, and the other entry fields against the packed files.
- `typecheck:package` runs
  [Are the Types Wrong?](https://arethetypeswrong.github.io/) with the
  `esm-only` profile. It resolves each `exports` subpath as Node.js and
  bundlers do and checks that the declarations it finds match the
  JavaScript they describe. The profile skips the `node10` and
  `node16-cjs` resolutions, which describe CommonJS consumers: the
  package is published as ESM only.

Both build the package first; their `:built` variants reuse an existing
build. `npm run validate` runs both before the tests.

### Explain an unexpected rule

1. **Pin down the case:** the path of the file, the options, the user
   configs, and the manifest at `projectRootDirectory`, which decides
   the `"auto"` frameworks. A rule can differ between `.ts` and `.tsx`
   files, with typed linting on or off, and with a framework on or off.

2. **Find the final entry.** The snapshots may already hold the case.
   Otherwise, write the options and user configs into a consumer
   configuration, as in
   [Inspecting the configuration](#inspecting-the-configuration), and
   print the configuration of the path. Set each framework as the
   consumer's manifest would, or point `projectRootDirectory` at a
   directory with such a manifest.

3. **List the blocks that set the rule** with
   [the script](#the-blocks-that-set-a-rule), and find those that match
   the file, by their `files` and `ignores` or with the inspector's "Test
   matching with filepath". ESLint takes the entry of the last matching
   block, but an entry with a severity alone keeps the options before
   it.

4. **Trace them in order:**
   1. The explicit entry in the rule map of the feature that holds the
      rule, and then the feature's `overrides`.
   2. The later blocks that change it. `typescript/rules` turns off
      core rules in TypeScript files and Svelte components,
      `node/rules-typescript` turns off `n/no-sync` there and in the JavaScript
      rune modules that the Svelte feature parses, and the `rules-type-aware` blocks
      turn on the rules that need type information where typed linting
      is.
   3. The `exceptions/` blocks, which turn off rules in the files of a
      role.
   4. The user configs.

5. **Decide.** When the entry follows the policy, the comment beside
   its declaration, or the README section that describes the rule,
   explains it. When it does not, changing it is a separate
   [Change a rule](#change-a-rule) task.

### Change a file exception

1. **Find the role.** `fileRoles()` in `src/configs/exceptions/rules.ts` lists
   each role with its files and its rules, by the feature that holds
   each rule, and the comment above a role says why its files break
   those rules. `configFiles` and `testFiles` in `src/globs.ts` are the
   patterns of two roles; the Svelte components follow the options of
   the Svelte feature.

2. **State its file-role requirement.** An exception replaces a
   suppression that every file of the role would need, and is added only
   with evidence. Its files must stay JavaScript and TypeScript sources: on
   its own, a name pattern such as `**/*.config.*` makes ESLint lint
   every file that it matches. See "A `files` pattern also decides
   which files `eslint .` lints" under [Files and blocks](#files-and-blocks).

3. **Find the tests that prove its scope.**
   `tests/configs/exceptions/index.test.ts` lists the paths that each role
   reaches and some that it leaves alone, and checks that the blocks
   make ESLint lint no other file, apply only while their feature is on,
   and come before the user configs. `tests/factory/factory.test.ts`
   names the blocks in order. In
   `tests/policy/__snapshots__/effective-rules/`, the snapshots
   `default/eslint.config.js.txt`, `default/src__Component.svelte.txt`,
   and `default/src__example.test.ts.txt` show the result. The
   README's "File-role exceptions" describes the roles to consumers.

4. **Change the behavior in a task of its own.** A new role, rule, or
   pattern changes what consumers see, so it needs its own pull request,
   with tests of the new scope, reviewed snapshots, and the README.
   Moving an exception or explaining it better must leave those tests
   and the snapshots as they are.

## Things to know

The reference that the recipes link to, grouped by topic.

### Builds and tests

- **Build before linting and testing.** `eslint.config.js` and most
  tests import `./dist/index.mjs`. After changing `src/`, run
  `npm run build` first, or you lint and test the previous build.
- **Internal builders are tested from source.** Feature builders are not
  exported from the package root. Tests for them import from `src/`, as
  `tests/configs/core/index.test.ts` does.
- **Published builds contain no source maps.** Keep `declarationMap: false`
  in `tsconfig.json` and explicit `sourcemap: false` in `tsdown.config.ts`,
  with declaration generation enabled. A clean `dist/` contains only
  `index.mjs` and `index.d.mts`, with no `sourceMappingURL` references.
  Package tests check the local build, an actual tarball, and its installed
  files. Keep the package allowlist at `dist`; do not publish `src/` to
  replace declaration maps. This reduces disclosure of original source
  embedded in maps and accepts runtime stack frames in emitted JavaScript
  instead of mapped TypeScript. Emitted code remains inspectable, and
  secrets must stay out of bundled code. Preserve runtime and declaration
  content when changing build settings, excluding only map-reference
  comments and trailing whitespace from comparisons.
- **The defaults detect frameworks from this repository's manifest.**
  `"auto"` reads the manifest at `projectRootDirectory`, which defaults
  to the working directory. A test that runs in this repository with the
  defaults therefore has React and Svelte on, because this repository's
  manifest declares `react` and `svelte`, and Express and React Refresh
  off. With React on, the hooks rules apply to every JavaScript and
  TypeScript file, and with Svelte on, `createContext()` carries the
  Svelte components, which `defaultContext` does not. A test that needs
  a framework sets it, or points `projectRootDirectory` at a temporary
  project root whose manifest declares it, as
  `tests/factory/feature-toggles.test.ts` does.
- **A rule test checks this package, not the plugin.** If the sample of
  a rule test is reported the same with the rule reset to its plugin's
  defaults, the test repeats upstream behavior; test an option, a
  decision such as a rule that stays off, or wiring instead. A negative
  test needs a sample that the rule reports when it is on, or it cannot
  fail.
- **Known parser and fix workarounds need composed regressions.**
  `tests/configs/plugins/html/index.test.ts` preserves custom-element end tags and manual
  correction boundaries while keeping void-element fixes. The Markdown suite
  lints bracketed URL/email and shorthand-autolink cases through the public
  config, retaining unrelated diagnostics, GFM, front matter, math, and explicit
  overrides. Its five scalar-off entries document the missing-position crash
  in Markdown 8.0.3; restore each only after checking the actual corrected
  dependency combination against the trigger corpus and its unique diagnostics
  and fixes. Use an active rule such as `markdown/require-alt-text` as the normal
  feature-scope sentinel. Svelte tests keep `.svelte`, `.svelte.js`, and
  `.svelte.ts` on the component/rune parser; `.svelte.mjs` and `.svelte.mts`
  stay ordinary sources, with typed checks conditional on the existing scope.
  The packed-consumer regression covers these boundaries with and without peers.
- **The fixtures are a project of their own.** `tests/fixtures/` has its
  own `package.json` and `tsconfig.json`. The repository's `eslint .`
  ignores the folder and the root tsconfig leaves it out, so
  `tests/policy/fixtures.test.ts` is what lints it, and it fails on a
  file that it does not list. A fixture must lint without messages with
  every feature on, with and without typed linting, and Prettier formats
  it, `.svelte` files included.
- **The README examples run.** `tests/package/readme.test.ts` installs
  what the `npm install` commands of the README name, writes each
  JavaScript block of the README as the `eslint.config.js` of a project
  in that consumer, type-checks it, and lints the fixtures with it. The Usage
  configuration itself must also lint without diagnostics in that consumer. A
  block that must not run, such as the options of 0.1.0, follows an
  `<!-- eslint-skip -->` comment. The install commands must name ESLint,
  the package, and every optional peer but React and Svelte.

- **Combined rules need repeated fixes and formatting.** Build, then run
  `npx vitest run tests/policy/fix-convergence.test.ts`. Its isolated Node
  runner records reports and warning types through two ESLint–Prettier cycles,
  using real projects for typed files and component parsers. The harness checks
  both second-cycle transitions, so a formatter cannot hide an ESLint rewrite.
  Approved complementary overlaps name a sample, rule IDs, and distinct concerns;
  a shared location or plugin namespace is not an automatic exception. D1/D2
  assert uppercase escapes and import-comment convergence, separately and
  together. D3 checks arrow-variable separation, starred documentation, the
  original declaration-spacing failure with and without asterisks, and the
  mixed D1/D2/D3 sample through positive convergence assertions. No temporary
  loop characterizations remain. Typed passing samples take a parameter to
  satisfy the independently retained Functional policy.
  The final acceptance matrix also runs every TypeScript source sample without
  type information, supported Svelte rune modules and ordinary `.svelte.mjs` /
  `.svelte.mts` sources, HTML, Markdown, JSON/JSONC/JSON5, and package manifests.
  Every normal sample must converge without warnings or remaining fixes;
  separate assertions preserve manual diagnostics, comments, custom-element
  boundaries, and conditional peer metadata.
- **Import comments keep their documentation layout.**
  `import-x/newline-after-import` uses `considerComments: false` and
  `exactCount: false`, with `count: 1` as a minimum. The rule counts intervening
  comment lines, so an exact gap would reject multiline documentation after
  the final import. Perfectionist still sorts across comments within each
  configured import group.

### Policy and snapshots

- **Snapshots record the policy.** `tests/policy/__snapshots__/` holds
  the configuration that ESLint resolves for representative paths, one
  rule per line. A changed line is a changed policy: update the snapshots
  with `npx vitest run tests/policy -u`, read the diff, commit it with
  the change that caused it, and say in the commit message what changed
  and why. A dependency update that brings new or changed rules shows up
  the same way. Never edit a snapshot by hand. The snapshots are `.txt`
  files, which keeps ESLint and Prettier away from them.
- **A refactor keeps every snapshot.** Making previously implicit default
  options explicit can add option fields without changing diagnostics or
  fixes, and explicitly disabling previously unconfigured rules can add
  `off` entries. Review those changes and verify their behavior before
  updating the snapshots. Other reorganizations, such as
  moving a rule map or renaming a module, must not change a line of the
  snapshots. When one changes, the refactor changed the policy: fix the
  refactor, and do not update the snapshot.
  `npm run policy:diff -- --base origin/main` checks a whole branch: for
  a refactor, it reports every snapshot unchanged and the same packages
  as the baseline. Keep an intended policy change, such as a dependency
  update, in a commit of its own, so that its snapshot diff has one
  cause.
- **A severity-only entry keeps earlier options.** When a later block
  sets a rule to only `"off"` or `"error"`, ESLint keeps the options from
  an earlier block, and the snapshots record them. Inside one block, an
  object spread replaces the whole entry instead. This is why moving a
  rule between blocks can change a snapshot line even when the rule stays
  off. Keep the explicit core `no-unused-vars` owner and TypeScript's
  severity-only replacement guard: a `javascript.overrides` entry can enable
  the native rule before the TypeScript block turns it off again, preserving
  inherited options. Removing that guard changes TypeScript diagnostics even
  when the default snapshot is unchanged.
- **Rule ownership is static.** Every replacement has an enabled winner and an
  explicitly disabled alternative in the owning rule maps. A `Handled by`
  comment names the winner; reviewed complementary checks retain reciprocal
  `Complemented by` comments and their distinct coverage. Disabling or narrowing
  a feature never enables an alternative. A consumer can still explicitly enable
  one through its feature overrides or a user config. Tests in `tests/policy/overlaps.test.ts`
  verify enabled, disabled, narrowed, ignored, Svelte, and override cases.
  `tests/policy/rule-ownership.test.ts` also checks D8's unique cases, overlaps,
  negative controls, typed guards, and manual-fix boundaries through the public
  factory. Buffer constructor conversion must preserve encoding, coercion, and
  shared memory. Keep TypeScript's execution preference scalar off in both
  maps until inherited global flags, match/exec arrays, computed access, and
  repeated fixes are verified against a corrected dependency combination.
  RegExp preference reports still require manual review of unknown flags.
- **The formatter test guards layout.**
  `tests/policy/formatter.test.ts` fails when a rule that
  `eslint-config-prettier` turns off is on, apart from its listed
  exceptions, or when an @html-eslint plugin has a style rule that is
  neither off as layout nor kept with a reason. A dependency update can
  bring such a rule. Decide its severity and options from the coding principles,
  then document a compatible exception or a specific reason to turn it off.
  A listing in eslint-config-prettier is not sufficient reason to disable it.
  Check compatibility by formatting representative samples with Prettier and
  linting the result, including differing quote, semicolon, indentation, and
  wrapping options. Stylistic's tests also cover generators, comments, JSX,
  and TypeScript syntax through repeated formatting and fixing.

### Files and blocks

- **A `files` pattern also decides which files `eslint .` lints.** ESLint
  lints every file that a block's `files` matches, unless the pattern is
  `*` or ends in `/*` or `/**`. A block for files selected by name, such
  as `**/*.config.*`, therefore needs an AND pattern with an extension
  glob, as `configs/exceptions/index.ts` does. Without it, `eslint .` parses
  the `.txt` snapshots as JavaScript and fails. ESLint's own default
  config also matches `**/*.js`, `**/*.mjs`, and `**/*.cjs`, so such a
  file is linted even when no block of this config matches it, with only
  the blocks that have no `files`. That is why `.cjs` files are still
  parsed, while `.cts` files are skipped.
- **A feature's `files` narrows its default files.** A block takes
  `narrowFiles(defaults, files)` from `src/utilities/file-scope.ts`,
  never `files ?? defaults`: it reaches a file that matches one of its
  default patterns and one of `files`.
  `files` usually names a directory, such as `src/**`. On its own, that
  pattern would reach the files of other languages there, and a rule
  that cannot read a file's language stops the whole run, with "The
  following rules do not support the language" or an error of its own.
  It would also select no file for linting, as any pattern that ends in
  `/**`, so ESLint would skip the HTML, JSON, and Markdown files that no
  other block matches. A feature with more than one default narrows each
  of them, as `json` does for its three languages and `react` for its
  two scopes. A new feature goes into the table of
  `tests/factory/feature-toggles.test.ts`, which gives every feature a
  directory as its `files`.
- **Svelte components are sources too.** While the Svelte feature is on,
  the features for JavaScript and TypeScript sources take
  `withSvelteComponents(sourceFiles, context.svelteComponents)`, or
  `typescriptFiles` for the TypeScript scopes, as their default files. The
  shared source-plugin builder supplies this for setup/rules pairs; other
  source blocks must do the same: with `sourceFiles` alone it
  misses components, and with `**/*.svelte` alone it reaches components
  that svelte-eslint-parser does not read, which espree then fails to
  parse.
  The resolved component scope uses `withoutIgnores(narrowFiles(...), ignores)`
  so ordered Svelte ignore negations restore the same script rules and component
  exceptions as ordinary components, within every feature's own scope.
- **A rule that is on needs its plugin in every file it reaches.** ESLint
  rejects the configuration of a file where a rule is on but no block
  registers its plugin, with `Could not find plugin`; a rule that is only
  `"off"` passes. A feature whose plugins are registered in different
  blocks must therefore not spread all of its `overrides` into each of
  them. A block can reach more files than the blocks of the other
  plugins, as `react/hooks` does, and a block can be missing, as
  `react/refresh` is while React Refresh is off. Each block of the React
  feature takes only the overrides of its own plugin's rules, and
  `react/html` also those of any other rule. `calculateConfigForFile`
  shows the error, so a test of the resolved configuration catches it.

### Parsing and type information

- **Typed linting is on by default.** `createConfig()` reads type
  information for TypeScript files, and so does `defaultContext`, which a
  builder falls back to. A TypeScript file that no tsconfig includes,
  such as a path that `lintText` makes up, then fails with a parsing
  error that says it "was not found by the project service". A test of
  rules that need no type information sets
  `typescript: { typeChecked: false }`, or gives a builder a context with
  `typeAware: undefined`. A test of typed linting lints a file on disk,
  as `tests/configs/plugins/typescript/rules.test.ts` does with
  `tests/support/lint.ts`.
- **Type information follows the type-aware scope.** Only
  `typescript/parser-type-aware` sets `projectService`, over
  `context.typeAware`, which stays within the files that
  `typescript/parser` parses and leaves out Svelte components. A rule
  that needs type information crashes the whole run in a file without
  it, with "You have used a rule which requires type information", so a
  feature's type-aware block takes its files from `narrowTypeAwareScope`,
  through `typeAwareConfig`, and never from its own `files` alone. The
  scope is a list of `files` patterns, and a type-aware block has no
  `ignores`: ESLint reads an ignore list in order, so a negated pattern
  such as `!scripts/**` brings back files that the patterns before it
  left out, also those of another list that it is appended to.
  `withoutIgnores` turns each list of ignores into `files` patterns on
  its own; use it for every list that limits such a block. A feature's
  `overrides` can turn such a rule on as well, so a block that reaches
  files without type information takes them through
  `overridesWithoutTypeInformation`, which leaves out the override of
  such a rule when it turns the rule on. The feature's type-aware block
  takes every override.
- **TypeScript files outside the TypeScript feature do not parse.** The
  JavaScript and code-quality blocks match `.ts` files through
  `sourceFiles`, but only `typescript/parser` reads TypeScript. With
  `typescript: false`, or for a file outside `typescript.files` or in
  `typescript.ignores`, ESLint lints the file with espree and reports
  `Parsing error: Unexpected token :`. A test of those options that only
  compares resolved configurations does not show this; lint real
  TypeScript source with `lintText`.
- **import-x parses imported modules with the importing file's parser.**
  For a Svelte file, that is svelte-eslint-parser, which reads every file
  but a rune module as a component, so the Svelte block maps `.js`,
  `.mjs`, and `.cjs` to espree with `import-x/parsers`. A block that sets
  a parser which cannot read plain JavaScript modules needs the same
  setting.
- **Workspace aliases use the import resolver's tsconfig.** Typed linting
  reads each file's nearest tsconfig, but the import resolver starts at
  `tsconfigRootDir` and follows its `references`. Reproduce a workspace's
  `paths` with an import in a real file: without a root reference,
  `import-x/no-unresolved` reports it. A user config scoped to that workspace
  can set `import-x/resolver-next` to a resolver for its tsconfig, as
  described in the README's "Monorepos" section.
- **JSX parsing depends on the extension.** `.jsx`, `.mjsx`, and `.tsx`
  parse JSX. `.js` does not, even with React on, and `.mtsx` does not,
  despite appearing in the TypeScript and React globs. Lint JSX source to
  check parsing; a matching feature block alone does not prove it parses.

### Dependencies and peers

- **TypeScript support follows typescript-eslint's peer range.** Read
  `peerDependencies.typescript` in
  `node_modules/typescript-eslint/package.json` when updating the README's
  requirements. A TypeScript version outside that range can install with
  a peer warning yet stop ESLint while loading the config, as TypeScript 7
  does.
- **A missing peer needs a consumer.** Every optional peer is a dev
  dependency of this repository, so a test that runs in this repository
  always finds them. A test of a missing or partial peer set runs in a
  consumer from `tests/package/smoke.test.ts`, whose `node_modules` links
  only the packages the test lists, or in one from
  `tests/package/install.test.ts`, which installs them from the registry.
  The links point into this repository, so a linked peer still finds its
  own dependencies here, and npm installs the required peers of a peer,
  as it does `svelte-eslint-parser` with
  `@html-eslint/eslint-plugin-svelte`. Check a peer set that npm can
  produce with a real install.

### Code in this repository

- **Resolved test configurations share one boundary.**
  `tests/support/resolved-config.ts` owns the assertion around ESLint's untyped
  `calculateConfigForFile` result. It models normalized rule severities and
  inspected metadata, leaves rule options unknown, and preserves undefined for
  ignored or unmatched files. It does not validate plugin metadata or arbitrary
  option shapes. Use `getResolvedConfig` or `getResolvedRules`; keep specialized
  description, snapshot, map, and assertion wrappers only for their different
  responsibilities. `tests/support/lint.ts` accepts `typeChecked` and `refresh`;
  its typed-linting default remains false and all framework features remain on.
  Its assertions reject ignored files and fatal parser diagnostics.
- **Review signals apply to opaque returns and test operations too.**
  Keep `promise-function-async`'s `allowAny: false`, all function-kind checks,
  and the existing typed scope. Clarify return contracts or explain a local
  synchronous-data exception, as in `src/utilities/plugin-policy.ts`; do not
  convert a synchronous API to async just to satisfy the diagnostic. Keep
  Security's filesystem-path and computed-key warnings in tests as well as
  production. Operation-level comments must state the inspected path or key
  boundary and leave later unrelated operations visible. Contract fixture
  ordering retains its three file-wide sort exceptions, and smoke subprocesses
  retain their synchronous-operation exceptions at each call; these do not
  suppress Security.
- **`functional/prefer-immutable-types` shares a cache across files.** It
  checks parameters shallowly, which gives the same result whatever files
  are linted together, except for a parameter whose type is a mapped type
  that copies modifiers, such as `Partial<Readonly<T>>`. Write
  `Readonly<Partial<T>>` instead, and do not add a disable comment: in
  the runs where the rule stays silent, the comment is reported as
  unused. The cache is off while `NODE_ENV` is `test`, so a Vitest test
  that lints in its own process cannot show such a difference;
  `tests/policy/parameter-immutability.test.ts` lints in a child process.
  Check both `npx eslint .` and `npx eslint <the files you changed>`
  before committing.
- **`eslint --fix` reorders literals.** Perfectionist sorts object keys
  and some arrays. Do not encode meaning in the order of an array literal
  that a fix may sort.
- **Functions and documentation have separate owners.**
  `@cravingmaker/prefer-arrow-functions` requires arrow expressions with semantic
  exceptions; it never converts functions automatically. Keep its constructor,
  scope, recursion, and overload regressions when extending it. Core
  `arrow-body-style` still requires block bodies. The documentation-only internal
  rule requires leading asterisks in multiline `/** ... */` comments and preserves
  paragraph breaks, code indentation, ordinary grouped `//` comments, and ordinary
  blocks. Stylistic's selector-based padding rule separates direct function
  variables and named exports, including multiple declarators and transparent
  TypeScript wrappers. Its selectors must reject functions nested inside data
  objects or calls. Perfectionist retains declaration ordering with module-member
  spacing ignored until its documentation-paragraph fixer is corrected. Do not
  restore that spacing without the original and mixed convergence regressions.
- **Descriptions use starred documentation; implementation reasons use line comments.**
  Describe builders and APIs with `/** ... */`, leading asterisks, and prose paragraphs
  kept intact. Let Prettier and `unicorn/no-manually-wrapped-comments` handle
  wrapping; preserve paragraph breaks and examples. Use `//` for local
  implementation explanations and grouped policy reasons, with a final period.
  Do not convert ordinary grouped line comments merely to normalize their style.
  tsdown retains documentation in emitted JavaScript and public declarations;
  review comment-only artifact changes separately from executable code and types.
- **Compiler ownership names its diagnostic and contract.**
  State the relevant compiler diagnostic only when the documented compiler
  options guarantee it. Duplicate declarations and implicit-any `this` checks
  must retain valid overloads, declaration merging, and explicitly or contextually
  typed receivers. Keep semantic exceptions and `Complemented by` explanations
  where rules cover different cases; do not claim compiler equivalence from a
  rule name alone.
- **The tsconfig is the one that the README asks for.** `tsconfig.json`
  and `tests/fixtures/tsconfig.json` set `strict`, `noImplicitReturns`,
  and `allowUnreachableCode: false`, and `tests/package/readme.test.ts`
  checks them against the README. With `noImplicitReturns`, a function
  that returns a value on some paths ends with `return;` where it would
  otherwise reach its end; `no-useless-return` is off in TypeScript files
  so that it does not remove it.
  This contract does not add `noUncheckedIndexedAccess`, `verbatimModuleSyntax`,
  or `noFallthroughCasesInSwitch`; none substitutes for Security trust review.
  The repository's `tsconfig.json` adds only checks that report errors without
  changing type information, so its lint results still match a consumer's:
  `erasableSyntaxOnly`, which keeps every file runnable by Node.js type
  stripping as `npm run gen` and `npm run policy:diff` run the scripts,
  `isolatedModules`, `moduleDetection: "force"`, `noImplicitOverride`, and
  `noUncheckedSideEffectImports`. Its `target` and `lib` describe Node.js
  24.15, the minimum runtime: ES2025 with `Array.fromAsync`, explicit resource
  management, and `Error.isError`. The compiler therefore rejects APIs that
  this runtime lacks, such as Temporal. tsdown builds `dist/`, so the
  compiler only checks (`noEmit`).

The repository's own `eslint.config.js` permits explicit unset values in
rule-option maps. Core and plugin modules follow the same lint rules. Test
harnesses also allow explicit undefined values and exclude registration groups and
fixture matrices from size/nesting limits. These local exceptions do not
change the published configuration or its fixture checks. Runtime helpers
follow the selected core syntax and complexity limits.

## Validation

Before opening a pull request, run:

```bash
npm run validate
```

This runs `npm run validate:static`, then the tests. The static phase runs
formatting checks, a build, typechecking, Knip, linting, the
[workflow checks](#workflow-checks), and the
[package checks](#check-the-published-package). Package tests exercise the
tarball in temporary consumer projects. Some install it from the npm
registry, so the tests need network access.

Vitest runs at most two test files at once to limit memory pressure: each
worker loads ESLint and TypeScript, and the package tests also start child
processes. README consumer examples run sequentially within their suite because
each starts additional TypeScript and ESLint processes. These limits apply to
local tests, validation, CI, and the pre-push hook.

Focused tests fail locally as well as in CI (`allowOnly: false`), so a
pre-push run cannot pass by running only one test, and every test needs at
least one assertion (`expect.requireAssertions`). Before each test, Vitest
restores spies, stubbed environment variables, and stubbed globals
(`restoreMocks`, `unstubEnvs`, and `unstubGlobals`), so no test depends on what
an earlier test replaced. Each test file still runs in its own worker. Plugins
cache state across the files that they lint, and sharing
workers (`isolate: false`) would save only about 6% of a full run; most of the
time goes to typed linting and the package tests' npm installations.

For faster feedback, run `npm run test:unit` for unit tests or
`npm run test:package` for package consumer tests. Both commands build the
package first; their `:built` variants reuse an existing build.

The pre-commit hook runs `npm run lint:staged`, which builds the package
and runs lint-staged. It applies ESLint fixes and then Prettier to the
staged files of the formats that ESLint lints, and Prettier alone to every
other staged file that Prettier can format. A remaining ESLint warning
fails the commit, as it fails validation. The pre-push hook runs the full
test suite through `npm test`. Full validation runs through
`npm run validate` and in CI.

CI runs the static phase once on the development Node.js version in
`.nvmrc`, after verifying registry signatures. The tests run on Node.js
24.15.0, the minimum, and on the newest Node.js 26 release. "Minimum peer
versions" installs the packed package with every advertised minimum peer.
"Dependency audit" runs `npm audit --audit-level=low` on the lockfile in its
own job, so an advisory published after the last dependency change does not
hide the other results. Pull requests also run Dependency Review. All jobs
run in parallel. The `CI result` job fails unless every one of them
succeeds, and it is the status that the repository rules require.

### Workflow checks

Check the GitHub Actions workflows locally with:

```bash
npm run lint:workflows
```

This installs actionlint from its pinned GitHub release into the ignored
`.tools/` cache on first use, verifies the archive and binary SHA-256 pins
in `scripts/actionlint-reference.json`, and rechecks the cached binary on
each run. It never uses a global actionlint. The first run needs access to
GitHub releases, and later runs work offline. actionlint also checks `run`
scripts with ShellCheck when it is installed, as it is in CI. prettier-config
uses the same pins and checks.

The zizmor workflow audits the workflows and the Dependabot configuration
for security problems, such as template injection or broad permissions,
when they change and weekly. It reports findings to code scanning, next to
CodeQL's analysis of the workflows. Suppress a finding only with an inline
`zizmor: ignore[...]` comment that explains why the code is safe.

### Interactive test UI

Use [Vitest UI](https://vitest.dev/guide/ui) to browse results, inspect timings
and snapshot diffs, and rerun individual tests while developing:

```bash
npm run test:ui
```

This builds the package and watches the same regular tests as `npm run test:unit`.
Packed-consumer tests have their own opt-in command because they pack the package
and create temporary consumer projects, including npm installations:

```bash
npm run test:package:ui
```

Open the URL printed in the terminal, normally
`http://localhost:51204/__vitest__/`, including its token when present. Use
`-- --no-open` to prevent automatic browser opening. To run both commands at
once, give the second command a different port:

```bash
npm run test:package:ui -- --api.port=51205
```

File and test-name filters also work with the UI:

```bash
npm run test:ui -- tests/configs/plugins/unicorn/index.test.ts -t "filename-case"
```

After editing `src/`, run `npm run build` in another terminal. The tests that
import `dist/` and the packed consumers need the new build; the UI commands build
once at startup. Watch mappings in `vitest.config.ts` rerun the selected suite
after build output changes and rerun affected tests for fixtures, generated rule
types, the README, the lockfile, and the modules of the policy report. These
inputs are read through the filesystem or subprocesses rather than ordinary test
imports. The regular UI excludes
package tests, and the package UI stays limited to `tests/package/`. Verify watch
mapping changes with `npx vitest run tests/vitest-watch.test.ts`.

Review snapshot changes before accepting them. Keep `vitest` and `@vitest/ui` on
the same exact version; Dependabot groups their updates. Finish with
`npm run validate` and `git diff --check`.

## Releases

Before preparing a release, run:

```bash
npm run release:check
```

This runs a dependency security audit, full validation, and a dry run of the
package tarball. `prepublishOnly` runs the same check, but npm runs it only
when lifecycle scripts are enabled: `.npmrc` disables them, so it guards an
`npm publish --ignore-scripts=false`, and the publishing workflow runs the
check as its own step.

Update `package.json` and `package-lock.json` to the intended version.
Include consumer-facing migration guidance when rule defaults or
configuration behavior change.

Create a matching `vX.Y.Z` tag from a commit on `main` and publish a GitHub
Release. The [npm publishing workflow](.github/workflows/publish.yml)
verifies the tag matches `package.json`, confirms the tagged commit is
reachable from `main`, and checks that the version has not already been
published. It then verifies registry signatures, runs the release check,
and publishes the packed artifact using npm Trusted Publishing, on the
Node.js version in `.nvmrc`. Prereleases do not trigger publishing.

## Reporting issues

For linting bugs, open a
[GitHub issue](https://github.com/cravingmaker/eslint-config/issues) with a
minimal input, the configuration used, actual and expected diagnostics or
fixes, and the package, Node.js, ESLint, and optional plugin versions.

Report vulnerabilities privately as described in the
[security policy](https://github.com/cravingmaker/.github/blob/main/SECURITY.md).
