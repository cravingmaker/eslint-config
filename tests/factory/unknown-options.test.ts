import type { FeatureOptions, Options } from "../../src/types.js";

import process from "node:process";

import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";

/*
Every option of `createConfig` with a value, and every key of the options object of a feature.
The compiler rejects an object that leaves one out, so `everyOption` cannot miss a new option.
*/
type EveryOption = {
  readonly [Option in keyof Options]-?: Required<
    Exclude<Options[Option], boolean | "auto" | undefined>
  >;
};
// An option that takes an options object.
type FeatureName = Exclude<
  keyof Options,
  "environments" | "globals" | "ignores" | "projectRootDirectory"
>;

const header = "createConfig() does not know these options:";
const migration = 'See "Migrating from 0.1.0" in the README.';
// The options of `createConfig`, as the message lists them.
const options =
  "`comments`, `environments`, `express`, `functional`, `globals`, `html`, `ignores`, `imports`, `javascript`, `json`, `markdown`, `node`, `packageJson`, `perfectionist`, `projectRootDirectory`, `promise`, `react`, `regexp`, `security`, `svelte`, `typescript`, `unicorn`, and `unusedImports`";
// The keys that every feature takes, and those of the features that take more.
const featureKeys = "`files`, `ignores`, and `overrides`";
const jsonKeys =
  "`files`, `ignores`, `overrides`, `overridesJson5`, and `overridesJsonc`";
const reactKeys = "`files`, `ignores`, `overrides`, and `refresh`";
const typescriptKeys =
  "`files`, `filesTypeAware`, `ignores`, `ignoresTypeAware`, `overrides`, `overridesTypeAware`, `tsconfigRootDir`, and `typeChecked`";
const keysByFeature = {
  comments: featureKeys,
  express: featureKeys,
  functional: featureKeys,
  html: featureKeys,
  imports: featureKeys,
  javascript: featureKeys,
  json: jsonKeys,
  markdown: featureKeys,
  node: featureKeys,
  packageJson: featureKeys,
  perfectionist: featureKeys,
  promise: featureKeys,
  react: reactKeys,
  regexp: featureKeys,
  security: featureKeys,
  svelte: featureKeys,
  typescript: typescriptKeys,
  unicorn: featureKeys,
  unusedImports: featureKeys,
} as const satisfies Record<FeatureName, string>;
// Each option of 0.1.0 that is gone, with a value that 0.1.0 took and what the message names instead.
const replacedOptions = [
  [
    "plugins",
    {},
    "a user config that registers the plugin, passed after the options",
  ],
  ["reactRefreshVariant", "vite", "`react.refresh`"],
  [
    "rules",
    { js: { "no-console": "error" } },
    "the `overrides` of each feature: `javascript.overrides` for core rules, and the `overrides` of a plugin's feature for the plugin's rules",
  ],
  ["tsconfigRootDir", process.cwd(), "`typescript.tsconfigRootDir`"],
  ["tsTypeChecked", true, "`typescript.typeChecked`"],
] as const;

// The options that every feature takes, for the files with `extensions` in `src/`.
function scopeTo(extensions: string): Required<FeatureOptions> {
  return {
    files: [`src/**/*.${extensions}`],
    ignores: ["src/generated/**"],
    overrides: {},
  };
}

const sources = scopeTo("{js,ts}");
const everyOption = {
  comments: sources,
  environments: ["node"],
  express: sources,
  functional: sources,
  globals: { myGlobal: "readonly" },
  html: scopeTo("html"),
  ignores: ["vendor/**"],
  imports: sources,
  javascript: sources,
  json: { ...scopeTo("json"), overridesJson5: {}, overridesJsonc: {} },
  markdown: scopeTo("md"),
  node: sources,
  packageJson: { ...sources, files: ["src/**/package.json"] },
  perfectionist: sources,
  projectRootDirectory: process.cwd(),
  promise: sources,
  react: { ...scopeTo("{jsx,tsx}"), refresh: "vite" },
  regexp: sources,
  security: sources,
  svelte: scopeTo("svelte"),
  typescript: {
    ...scopeTo("ts"),
    filesTypeAware: ["src/**"],
    ignoresTypeAware: ["src/**/*.test.ts"],
    overridesTypeAware: {},
    tsconfigRootDir: process.cwd(),
    typeChecked: true,
  },
  unicorn: sources,
  unusedImports: sources,
} as const satisfies EveryOption;

/*
The message that `createConfig` rejects with for `given`, or `undefined` when it resolves. The
options are a record, as a config file without `// @ts-check` passes them: the compiler would
reject an unknown key in an object literal.
*/
async function rejectionOf(
  given: Readonly<Record<string, unknown>>,
): Promise<string | undefined> {
  try {
    await createConfig(given);
    return undefined;
  } catch (error) {
    return Error.isError(error) ? error.message : String(error);
  }
}

describe("createConfig with an option that it does not know", () => {
  it("rejects the options of 0.1.0 and names what replaces each of them", async () => {
    expect(
      await rejectionOf({
        reactRefreshVariant: "vite",
        rules: { js: { "no-console": "error" } },
        tsTypeChecked: true,
      }),
    ).toBe(
      [
        header,
        "- `reactRefreshVariant`: an option of 0.1.0, now `react.refresh`.",
        "- `rules`: an option of 0.1.0, now the `overrides` of each feature: `javascript.overrides` for core rules, and the `overrides` of a plugin's feature for the plugin's rules.",
        "- `tsTypeChecked`: an option of 0.1.0, now `typescript.typeChecked`.",
        migration,
      ].join("\n"),
    );
  });

  it.each(replacedOptions)(
    "rejects %s, an option of 0.1.0, and names what replaces it",
    async (option, value, replacement) => {
      expect(await rejectionOf({ [option]: value })).toBe(
        [
          header,
          `- \`${option}\`: an option of 0.1.0, now ${replacement}.`,
          migration,
        ].join("\n"),
      );
    },
  );

  it("rejects an unknown option and names the options", async () => {
    expect(await rejectionOf({ typscript: { typeChecked: true } })).toBe(
      [header, `- \`typscript\`: the options are ${options}.`].join("\n"),
    );
  });

  it("names every option", () => {
    expect(
      Object.keys(everyOption).filter(
        (option) => !options.includes(`\`${option}\``),
      ),
    ).toEqual([]);
  });

  it("rejects an unknown key in the object of a feature and names the keys of that feature", async () => {
    expect(await rejectionOf({ typescript: { typechecked: true } })).toBe(
      [
        header,
        `- \`typescript.typechecked\`: the options of \`typescript\` are ${typescriptKeys}.`,
      ].join("\n"),
    );
  });

  // `rules` is an option of 0.1.0 at the top level only. In a feature, it is a key like any other.
  it.each(Object.entries(keysByFeature))(
    "rejects an unknown key in the object of %s",
    async (feature, keys) => {
      expect(await rejectionOf({ [feature]: { rules: {} } })).toBe(
        [
          header,
          `- \`${feature}.rules\`: the options of \`${feature}\` are ${keys}.`,
        ].join("\n"),
      );
    },
  );

  it("lists every unknown option in one message, and the options of each object once", async () => {
    expect(
      await rejectionOf({
        linterOptions: {},
        plugins: {},
        react: { refesh: "vite", variant: "vite" },
        tsTypeChecked: true,
        typescript: { typechecked: true },
        typscript: {},
      }),
    ).toBe(
      [
        header,
        `- \`linterOptions\` and \`typscript\`: the options are ${options}.`,
        "- `plugins`: an option of 0.1.0, now a user config that registers the plugin, passed after the options.",
        `- \`react.refesh\` and \`react.variant\`: the options of \`react\` are ${reactKeys}.`,
        "- `tsTypeChecked`: an option of 0.1.0, now `typescript.typeChecked`.",
        `- \`typescript.typechecked\`: the options of \`typescript\` are ${typescriptKeys}.`,
        migration,
      ].join("\n"),
    );
  });

  it("lists the options in the order in which they are given", async () => {
    expect(
      await rejectionOf(
        Object.fromEntries<unknown>([
          ["unicorn", { rules: {} }],
          ["tsTypeChecked", true],
          ["comments", { rules: {} }],
          ["reactRefreshVariant", "vite"],
        ]),
      ),
    ).toBe(
      [
        header,
        `- \`unicorn.rules\`: the options of \`unicorn\` are ${featureKeys}.`,
        "- `tsTypeChecked`: an option of 0.1.0, now `typescript.typeChecked`.",
        `- \`comments.rules\`: the options of \`comments\` are ${featureKeys}.`,
        "- `reactRefreshVariant`: an option of 0.1.0, now `react.refresh`.",
        migration,
      ].join("\n"),
    );
  });

  it("rejects an unknown option whatever its value", async () => {
    expect(await rejectionOf({ tsTypeChecked: undefined })).toBe(
      [
        header,
        "- `tsTypeChecked`: an option of 0.1.0, now `typescript.typeChecked`.",
        migration,
      ].join("\n"),
    );
    expect(await rejectionOf({ typescript: { typechecked: undefined } })).toBe(
      [
        header,
        `- \`typescript.typechecked\`: the options of \`typescript\` are ${typescriptKeys}.`,
      ].join("\n"),
    );
  });

  it("does not take a property that every object inherits for an option", async () => {
    expect(
      await rejectionOf({ toString: true, unicorn: { valueOf: true } }),
    ).toBe(
      [
        header,
        `- \`toString\`: the options are ${options}.`,
        `- \`unicorn.valueOf\`: the options of \`unicorn\` are ${featureKeys}.`,
      ].join("\n"),
    );
  });

  it("reports an unknown option before it reads any other", async () => {
    // The globals package has no such environment, so resolving the globals fails.
    const environments = ["no-such-environment"];
    const withoutUnknownOption = await rejectionOf({ environments });

    expect(withoutUnknownOption).toBeDefined();
    expect(withoutUnknownOption).not.toContain(header);
    expect(await rejectionOf({ environments, tsTypeChecked: true })).toBe(
      [
        header,
        "- `tsTypeChecked`: an option of 0.1.0, now `typescript.typeChecked`.",
        migration,
      ].join("\n"),
    );
  });
});

describe("createConfig with the options that it knows", () => {
  it("resolves with every option and every key of every feature", async () => {
    await expect(createConfig(everyOption)).resolves.not.toHaveLength(0);
  });

  it("does not check the names of globals, which are the user's", async () => {
    expect(
      await rejectionOf({
        globals: { rules: "readonly", tsTypeChecked: "readonly" },
      }),
    ).toBeUndefined();
  });
});
