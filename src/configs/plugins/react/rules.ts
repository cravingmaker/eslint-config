import type {
  ReactRefreshVariant,
  RuleOptionOf,
  Rules,
} from "../../../types.js";

import { bestPracticeRules } from "./html-best-practice.js";
import { bestPracticesRules } from "./html-best-practices.js";
import { stylisticIssuesRules } from "./html-stylistic-issues.js";

// Explicit policy grouped by the upstream rule categories.
const htmlReactRules: Rules = {
  ...stylisticIssuesRules,
  ...bestPracticesRules,
  ...bestPracticeRules,
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

export { hooksRules, htmlReactRules, refreshRules };
