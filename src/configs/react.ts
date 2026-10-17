import type { Linter } from "eslint";
import type pluginReactHooks from "eslint-plugin-react-hooks";
import type { reactRefresh as pluginReactRefresh } from "eslint-plugin-react-refresh";
import type pluginHtmlReact from "@html-eslint/eslint-plugin-react";
import type {
  FeatureOptions,
  ReactRefreshVariant,
  RuleOptionOf,
  Rules,
} from "../types.js";

import { reactFiles, sourceFiles } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";
import { importPeer } from "../utilities/import-peer.js";
import { supportedPluginPolicy } from "../utilities/plugin-policy.js";
type ReactFeatureOptions = FeatureOptions & {
  /**
    The React Refresh variant, or `false` for no React Refresh rule.
  */
  readonly refresh?: ReactRefreshVariant | false;
};
const classNameOptions = {
  callees: ["classnames", "clsx", "cn", "cva", "tw", "twMerge"],
} satisfies RuleOptionOf<"@html-eslint/react/classname-spacing">;
// Policy for @html-eslint/eslint-plugin-react.
const htmlReactRules: Rules = {
  "@html-eslint/react/classname-spacing": ["error", { ...classNameOptions }],
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ],
  "@html-eslint/react/no-ineffective-attrs": "error",
  "@html-eslint/react/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/react/no-obsolete-attrs": "error",
  "@html-eslint/react/no-obsolete-tags": "error",
  "@html-eslint/react/no-restricted-attr-values": "error",
  "@html-eslint/react/no-restricted-attrs": "error",
  "@html-eslint/react/require-attrs": "error",
  "@html-eslint/react/use-baseline": ["error", { available: "widely" }],
} as const;
// Policy for eslint-plugin-react-hooks, including its React Compiler rules.
const hooksRules: Rules = {
  "react-hooks/capitalized-calls": "off", // Not part of the enabled policy.
  // React Compiler rules
  "react-hooks/config": ["error", {}],
  "react-hooks/error-boundaries": ["error", {}],
  // Core hooks rules
  "react-hooks/exhaustive-deps": [
    "error",
    {
      additionalHooks: "",
      enableDangerousAutofixThisMayCauseInfiniteLoops: false,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- This is the option name defined by eslint-plugin-react-hooks.
      experimental_autoDependenciesHooks: [],
      requireExplicitEffectDeps: false,
    },
  ],
  "react-hooks/exhaustive-effect-dependencies": "off", // Not part of the enabled policy.
  "react-hooks/fbt": "off", // Not part of the enabled policy.
  "react-hooks/gating": ["error", {}],
  "react-hooks/globals": ["error", {}],
  "react-hooks/hooks": "off", // Not part of the enabled policy.
  "react-hooks/immutability": ["error", {}],
  "react-hooks/incompatible-library": ["error", {}],
  "react-hooks/invariant": "off", // Not part of the enabled policy.
  "react-hooks/memo-dependencies": "off", // Not part of the enabled policy.
  "react-hooks/memoized-effect-dependencies": "off", // Not part of the enabled policy.
  "react-hooks/no-deriving-state-in-effects": "off", // Not part of the enabled policy.
  "react-hooks/preserve-manual-memoization": ["error", {}],
  "react-hooks/purity": ["error", {}],
  "react-hooks/refs": ["error", {}],
  "react-hooks/rule-suppression": "off", // Not part of the enabled policy.
  "react-hooks/rules-of-hooks": ["error", { additionalHooks: undefined }],
  "react-hooks/set-state-in-effect": ["error", {}],
  "react-hooks/set-state-in-render": ["error", {}],
  "react-hooks/static-components": ["error", {}],
  "react-hooks/syntax": "off", // Not part of the enabled policy.
  "react-hooks/todo": "off", // Not part of the enabled policy.
  "react-hooks/unsupported-syntax": ["error", {}],
  "react-hooks/use-memo": ["error", {}],
  "react-hooks/void-use-memo": "off", // Not part of the enabled policy.
} as const;
// Options of `react-refresh/only-export-components` for each React Refresh variant.
const refreshOptions = {
  generic: {
    allowCompoundComponents: false,
    allowConstantExport: false,
    allowExportNames: [],
    checkJS: false,
    extraHOCs: [],
  },
  next: {
    allowCompoundComponents: false,
    allowConstantExport: false,
    allowExportNames: [
      // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
      "dynamic",
      "dynamicParams",
      "experimental_ppr",
      "fetchCache",
      "maxDuration",
      "preferredRegion",
      "revalidate",
      "runtime",
      // https://nextjs.org/docs/app/api-reference/functions/generate-metadata
      "generateMetadata",
      "metadata",
      // https://nextjs.org/docs/app/api-reference/functions/generate-viewport
      "generateViewport",
      "viewport",
      // https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata
      "generateImageMetadata",
      // https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
      "generateSitemaps",
      // https://nextjs.org/docs/app/api-reference/functions/generate-static-params
      "generateStaticParams",
    ],
    checkJS: false,
    extraHOCs: [],
  },
  vite: {
    allowCompoundComponents: false,
    allowConstantExport: true,
    allowExportNames: [],
    checkJS: false,
    extraHOCs: [],
  },
} satisfies Record<
  ReactRefreshVariant,
  RuleOptionOf<"react-refresh/only-export-components">
>;
// The overrides of the rules of one plugin, which are the ones that its block takes.
const overridesOf = (overrides: Readonly<Rules>, pluginName: string): Rules => {
  return Object.fromEntries(
    Object.entries(overrides).filter(([ruleId]) => {
      return ruleId.startsWith(`${pluginName}/`);
    }),
  );
};
// The React Refresh rule for a variant.
const refreshRules = (variant: ReactRefreshVariant): Rules => {
  return {
    "react-refresh/only-export-components": [
      "warn",
      // eslint-disable-next-line security/detect-object-injection -- The variant is a string-literal union, not user-controlled input.
      { ...refreshOptions[variant] },
    ],
  };
};
const loadReactPlugins = async (refresh: ReactRefreshVariant | false) => {
  return await Promise.all([
    importPeer<{
      readonly default: typeof pluginHtmlReact;
    }>("@html-eslint/eslint-plugin-react", "react"),
    importPeer<{
      readonly default: typeof pluginReactHooks;
    }>("eslint-plugin-react-hooks", "react"),
    refresh === false
      ? undefined
      : importPeer<{
          readonly reactRefresh: typeof pluginReactRefresh;
        }>("eslint-plugin-react-refresh", "react", "refresh"),
  ]);
};

const reactRefreshConfigs = (
  scope: Readonly<Pick<Linter.Config, "files" | "ignores">>,
  refresh: ReactRefreshVariant | false,
  module: { readonly reactRefresh: typeof pluginReactRefresh } | undefined,
  overrides: Readonly<Rules>,
): Linter.Config[] => {
  if (refresh === false || typeof module === "undefined") {
    return [];
  }
  return [
    {
      ...scope,
      name: "@cravingmaker/eslint-config/react/refresh",
      plugins: { "react-refresh": module.reactRefresh.plugin },
      rules: {
        ...supportedPluginPolicy(
          "react-refresh",
          refreshRules(refresh),
          module.reactRefresh.plugin.rules,
        ),
        ...overrides,
      },
    },
  ];
};

// Builds the flat config for React: one block for the @html-eslint React rules and one for React
// Refresh, unless `refresh` is `false`, in files that can hold components, and one for the hooks
// rules in every JavaScript and TypeScript source, where custom hooks also live. `files` limits
// each of the two scopes to the files in it that match one of its patterns. Each block takes the
// overrides of its own plugin's rules, and the first one also those of any other rule. A missing
// plugin fails with a message that names it.
const react = async ({
  files,
  ignores = [],
  overrides = {},
  refresh = "generic",
}: ReactFeatureOptions = {}): Promise<Linter.Config[]> => {
  const [htmlReact, hooks, refreshModule] = await loadReactPlugins(refresh);
  const scope = {
    files: narrowFiles(reactFiles, files),
    ignores: [...ignores],
  };
  // ESLint rejects a rule that is on in a file whose configuration lacks its plugin, so the
  // overrides of a plugin's rules go only to the block that registers it. The hooks block reaches
  // modules without JSX, which have no other React plugin, and the React Refresh block is missing
  // while React Refresh is off, so an override of its rule then applies nowhere. The overrides of
  // any other rule keep to component files, in the first block.
  const hooksOverrides = overridesOf(overrides, "react-hooks");
  const refreshOverrides = overridesOf(overrides, "react-refresh");
  const otherOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([ruleId]) => {
      return (
        !Object.hasOwn(hooksOverrides, ruleId) &&
        !Object.hasOwn(refreshOverrides, ruleId)
      );
    }),
  );
  return [
    {
      ...scope,
      name: "@cravingmaker/eslint-config/react/html",
      plugins: { "@html-eslint/react": htmlReact.default },
      rules: {
        ...supportedPluginPolicy(
          "@html-eslint/react",
          htmlReactRules,
          htmlReact.default.rules,
        ),
        ...otherOverrides,
      },
    },
    {
      files: narrowFiles(sourceFiles, files),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/react/hooks",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- eslint-plugin-react-hooks configs.flat shape is not assignable to Linter.Plugin without assertion
        "react-hooks": hooks.default as unknown as NonNullable<
          Linter.Config["plugins"]
        >[string],
      },
      rules: {
        ...supportedPluginPolicy(
          "react-hooks",
          hooksRules,
          hooks.default.rules,
        ),
        ...hooksOverrides,
      },
    },
    ...reactRefreshConfigs(scope, refresh, refreshModule, refreshOverrides),
  ];
};
export { react };
