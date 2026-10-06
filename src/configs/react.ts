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

import { reactFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";
import { importPeer } from "../utilities/import-peer.js";

type ReactFeatureOptions = FeatureOptions & {
  /**
  The React Refresh variant, or `false` for no React Refresh rule.
  */
  readonly refresh?: ReactRefreshVariant | false;
};

const classNameOptions = {
  callees: ["classnames", "clsx", "cn", "cva", "tw", "twMerge"],
} satisfies RuleOptionOf<"@html-eslint/react/classname-spacing">;

// Settings for @html-eslint/eslint-plugin-react on top of all its rules.
const htmlReactRules: Rules = {
  "@html-eslint/react/classname-spacing": ["error", { ...classNameOptions }],
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ],
} as const;

// Policy for eslint-plugin-react-hooks, including its React Compiler rules.
const hooksRules: Rules = {
  // Core hooks rules
  "react-hooks/exhaustive-deps": "error",
  "react-hooks/rules-of-hooks": "error",

  // React Compiler rules
  "react-hooks/config": "error",
  "react-hooks/error-boundaries": "error",
  "react-hooks/gating": "error",
  "react-hooks/globals": "error",
  "react-hooks/immutability": "error",
  "react-hooks/incompatible-library": "error",
  "react-hooks/preserve-manual-memoization": "error",
  "react-hooks/purity": "error",
  "react-hooks/refs": "error",
  "react-hooks/set-state-in-effect": "error",
  "react-hooks/set-state-in-render": "error",
  "react-hooks/static-components": "error",
  "react-hooks/unsupported-syntax": "error",
  "react-hooks/use-memo": "error",
} as const;

// Options of `react-refresh/only-export-components` for each React Refresh variant.
const refreshOptions = {
  generic: {
    allowConstantExport: false,
    allowExportNames: [],
    checkJS: false,
  },
  next: {
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
  },
  vite: { allowConstantExport: true, allowExportNames: [], checkJS: false },
} satisfies Record<
  ReactRefreshVariant,
  RuleOptionOf<"react-refresh/only-export-components">
>;

// Builds the flat config for React components: one block for the @html-eslint React rules, one
// for the hooks rules, and one for React Refresh unless `refresh` is `false`. A missing plugin
// fails with a message that names it.
async function react({
  files = reactFiles,
  ignores = [],
  overrides = {},
  refresh = "generic",
}: ReactFeatureOptions = {}): Promise<Linter.Config[]> {
  const [htmlReact, hooks, refreshModule] = await Promise.all([
    importPeer<{ readonly default: typeof pluginHtmlReact }>(
      "@html-eslint/eslint-plugin-react",
      "react",
    ),
    importPeer<{ readonly default: typeof pluginReactHooks }>(
      "eslint-plugin-react-hooks",
      "react",
    ),
    refresh === false
      ? undefined
      : importPeer<{ readonly reactRefresh: typeof pluginReactRefresh }>(
          "eslint-plugin-react-refresh",
          "react",
          "refresh",
        ),
  ]);
  const scope = { files: [...files], ignores: [...ignores] };

  return [
    {
      ...scope,
      name: "@cravingmaker/eslint-config/react/html",
      plugins: { "@html-eslint/react": htmlReact.default },
      rules: {
        ...enableAllRules("@html-eslint/react", htmlReact.default.rules ?? {}),
        ...htmlReactRules,
        ...overrides,
      },
    },
    {
      ...scope,
      name: "@cravingmaker/eslint-config/react/hooks",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- eslint-plugin-react-hooks configs.flat shape is not assignable to Linter.Plugin without assertion
        "react-hooks": hooks.default as unknown as NonNullable<
          Linter.Config["plugins"]
        >[string],
      },
      rules: { ...hooksRules, ...overrides },
    },
    ...(refreshModule === undefined || refresh === false
      ? []
      : [
          {
            ...scope,
            name: "@cravingmaker/eslint-config/react/refresh",
            plugins: { "react-refresh": refreshModule.reactRefresh.plugin },
            rules: { ...refreshRules(refresh), ...overrides },
          },
        ]),
  ];
}
// The React Refresh rule for a variant.
function refreshRules(variant: ReactRefreshVariant): Rules {
  return {
    "react-refresh/only-export-components": [
      "warn",
      // eslint-disable-next-line security/detect-object-injection -- The variant is a string-literal union, not user-controlled input.
      { ...refreshOptions[variant] },
    ],
  };
}

export { react };
