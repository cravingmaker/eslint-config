import type {
  ReactRefreshVariant,
  RuleOptionOf,
  Rules,
} from "../../../types.js";

import { bestPracticeRules } from "./rules/html-best-practice.js";
import { stylisticIssuesRules } from "./rules/html-stylistic-issues.js";

const htmlReactRules: Rules = {
  ...stylisticIssuesRules, // 1/10 rules, 1 automatically fixable, 0 editor suggestions fixable.
  ...bestPracticeRules, // 9/10 rules, 2 automatically fixable, 0 editor suggestions fixable.
} as const;

const recommendedHooksRules: Rules = {
  // --- Rules with default options (16/16) ---------------------------------------------------------------------------------------------------------.
  "react-hooks/config": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/error-boundaries": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/exhaustive-deps": [
    "error",
    {
      additionalHooks: "",
      enableDangerousAutofixThisMayCauseInfiniteLoops: false,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- This is the option name defined by eslint-plugin-react-hooks.
      experimental_autoDependenciesHooks: [],
      requireExplicitEffectDeps: false,
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/gating": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/globals": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/immutability": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/incompatible-library": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/preserve-manual-memoization": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/purity": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/refs": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/rules-of-hooks": ["error", { additionalHooks: undefined }],
  "react-hooks/set-state-in-effect": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/set-state-in-render": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/static-components": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/unsupported-syntax": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/use-memo": ["error", {}], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

const otherHooksRules: Rules = {
  // --- Turned off rules (12/12) -------------------------------------------------------------------------------------------------------------------.
  "react-hooks/capitalized-calls": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/exhaustive-effect-dependencies": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/fbt": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/hooks": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/invariant": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/memo-dependencies": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/memoized-effect-dependencies": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/no-deriving-state-in-effects": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/rule-suppression": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/syntax": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/todo": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "react-hooks/void-use-memo": "off", // Not part of the enabled policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

const hooksRules: Rules = {
  ...recommendedHooksRules, // 16/28 rules, 15 automatically fixable, 15 editor suggestions fixable.
  ...otherHooksRules, // 12/28 rules, 12 automatically fixable, 12 editor suggestions fixable.
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
      // https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config.
      "dynamic",
      "dynamicParams",
      "experimental_ppr",
      "fetchCache",
      "maxDuration",
      "preferredRegion",
      "revalidate",
      "runtime",
      // https://nextjs.org/docs/app/api-reference/functions/generate-metadata.
      "generateMetadata",
      "metadata",
      // https://nextjs.org/docs/app/api-reference/functions/generate-viewport.
      "generateViewport",
      "viewport",
      // https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata.
      "generateImageMetadata",
      // https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps.
      "generateSitemaps",
      // https://nextjs.org/docs/app/api-reference/functions/generate-static-params.
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

// Next and Vite override the generic variant's default options.
const refreshRules = (variant: ReactRefreshVariant): Rules => {
  return {
    // --- Rules with overridden options (1/1) ------------------------------------------------------------------------------------------------------.
    "react-refresh/only-export-components": [
      "warn",
      // eslint-disable-next-line security/detect-object-injection -- The variant is a string-literal union, not user-controlled input.
      { ...refreshOptions[variant] },
    ],
  } as const;
};

export {
  hooksRules,
  htmlReactRules,
  refreshRules, // 1 rule, 0 automatically fixable, 0 editor suggestions fixable.
};
