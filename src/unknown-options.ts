import type { FeatureOptions, Options } from "./types.js";

/**
The keys of an options object, each as a property. The compiler rejects such an object when it
lacks a key of `Settings`, and an object literal when it names any other key.
*/
type KeysOf<Settings> = Readonly<Record<keyof Settings, true>>;
/**
What each option of `createConfig` takes as keys. An option is a feature when it takes the
options that every feature takes, and it then has the keys of its own options object. Any other
option has `undefined`: it takes a list, a path, or, as `globals` does, a record whose keys are
the user's. The type maps the required options, because `-?` would also remove `undefined` from
the values.
*/
type OptionKeys = {
  [Option in keyof Required<Options>]: FeatureOptions extends Options[Option]
    ? KeysOf<Exclude<Options[Option], boolean | string | undefined>>
    : undefined;
};

// The keys that every feature takes.
const featureKeys = {
  files: true,
  ignores: true,
  overrides: true,
} as const satisfies KeysOf<FeatureOptions>;
/**
Every option of `createConfig`, with the keys of its options object. The compiler checks both
against the types in `types.ts`: a new option, or a new key of a feature's options, does not
compile until it is listed here.
*/
const optionKeys = {
  comments: featureKeys,
  environments: undefined,
  express: featureKeys,
  functional: featureKeys,
  globals: undefined,
  html: featureKeys,
  ignores: undefined,
  imports: featureKeys,
  javascript: featureKeys,
  json: {
    files: true,
    ignores: true,
    overrides: true,
    overridesJson5: true,
    overridesJsonc: true,
  },
  markdown: featureKeys,
  node: featureKeys,
  packageJson: featureKeys,
  perfectionist: featureKeys,
  projectRootDirectory: undefined,
  promise: featureKeys,
  react: { files: true, ignores: true, overrides: true, refresh: true },
  regexp: featureKeys,
  security: featureKeys,
  svelte: featureKeys,
  typescript: {
    files: true,
    filesTypeAware: true,
    ignores: true,
    ignoresTypeAware: true,
    overrides: true,
    overridesTypeAware: true,
    tsconfigRootDir: true,
    typeChecked: true,
  },
  unicorn: featureKeys,
  unusedImports: featureKeys,
} as const satisfies OptionKeys;
// The keys of each option as a list, or `undefined` for an option whose keys are not checked.
const keysByOption: ReadonlyMap<string, readonly string[] | undefined> =
  new Map(
    Object.entries(optionKeys).map(
      ([option, keys]): readonly [string, readonly string[] | undefined] => [
        option,
        keys === undefined ? undefined : Object.keys(keys),
      ],
    ),
  );
// The options of 0.1.0 that are gone, with what the migration table of the README names instead.
// The message names them and nothing reads them: the rewrite has no compatibility adapter.
const replacedOptions = new Map<string, string>([
  [
    "plugins",
    "a user config that registers the plugin, passed after the options",
  ],
  ["reactRefreshVariant", "`react.refresh`"],
  [
    "rules",
    "the `overrides` of each feature: `javascript.overrides` for core rules, and the `overrides` of a plugin's feature for the plugin's rules",
  ],
  ["tsconfigRootDir", "`typescript.tsconfigRootDir`"],
  ["tsTypeChecked", "`typescript.typeChecked`"],
]);

/**
Describes the keys of `options` that `createConfig` does not know, in one message, or returns
`undefined` when it knows them all. An unknown option comes with the options that exist, an
option of 0.1.0 with what replaces it, and an unknown key in the object of a feature with the
keys of that feature. The names of globals and the IDs of rules are the user's, and are not
checked.
*/
function describeUnknownOptions(options: Options): string | undefined {
  const entries = entriesOf(options);
  const unknown = entries
    .map(([option]) => option)
    .filter(
      (option) => !keysByOption.has(option) && !replacedOptions.has(option),
    );
  const lines = [
    // One line for all of them, because they share the list of options.
    ...(unknown.length === 0
      ? []
      : [
          `${list(unknown)}: the options are ${list(Object.keys(optionKeys))}.`,
        ]),
    ...entries.flatMap(([option, value]) => {
      const replacement = replacedOptions.get(option);
      if (replacement !== undefined)
        return [`\`${option}\`: an option of 0.1.0, now ${replacement}.`];

      // None for an unknown option, and for an option whose keys are not checked.
      const keys = keysByOption.get(option);
      if (keys === undefined) return [];

      const unknownKeys = entriesOf(value)
        .map(([key]) => key)
        .filter((key) => !keys.includes(key));
      if (unknownKeys.length === 0) return [];
      return [
        `${list(unknownKeys.map((key) => `${option}.${key}`))}: the options of \`${option}\` are ${list(keys)}.`,
      ];
    }),
  ];
  if (lines.length === 0) return undefined;

  return [
    "createConfig() does not know these options:",
    ...lines.map((line) => `- ${line}`),
    ...(entries.some(([option]) => replacedOptions.has(option))
      ? ['See "Migrating from 0.1.0" in the README.']
      : []),
  ].join("\n");
}
/**
The own properties of `value`, or none when it is not an object. The types do not bind a config
file without `// @ts-check`, so an option can hold any value.
*/
function entriesOf(value: unknown): ReadonlyArray<readonly [string, unknown]> {
  return typeof value === "object" && value !== null
    ? Object.entries(value)
    : [];
}
// `names` as code in a sentence, such as "`files`, `ignores`, and `overrides`".
function list(names: readonly string[]): string {
  const conjunction = new Intl.ListFormat("en", { type: "conjunction" });
  return conjunction.format(names.map((name) => `\`${name}\``));
}
/**
Returns `options` when `createConfig` knows each of their keys, and throws otherwise, with the
message of `describeUnknownOptions`. The factory goes on with what this returns, so it reads no
option before the check.
*/
function rejectUnknownOptions(options: Options): Options {
  const message = describeUnknownOptions(options);
  // eslint-disable-next-line functional/no-throw-statements -- A key that is not read must not pass in silence: the config would not do what its file says.
  if (message !== undefined) throw new Error(message);
  return options;
}

export { rejectUnknownOptions };
