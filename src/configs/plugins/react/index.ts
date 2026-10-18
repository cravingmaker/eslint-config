import type { Linter } from "eslint";
import type pluginReactHooks from "eslint-plugin-react-hooks";
import type { reactRefresh as pluginReactRefresh } from "eslint-plugin-react-refresh";
import type pluginHtmlReact from "@html-eslint/eslint-plugin-react";
import type {
  FeatureOptions,
  ReactRefreshVariant,
  Rules,
} from "../../../types.js";

import { reactFiles, sourceFiles } from "../../../globs.js";
import { hooksRules, htmlReactRules, refreshRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { importPeer } from "../../../utilities/import-peer.js";
import { supportedPluginPolicy } from "../../../utilities/plugin-policy.js";
type ReactFeatureOptions = FeatureOptions & {
  /**
    The React Refresh variant, or `false` for no React Refresh rule.
  */
  readonly refresh?: ReactRefreshVariant | false;
};
// The overrides of the rules of one plugin, which are the ones that its block takes.
const overridesOf = (overrides: Readonly<Rules>, pluginName: string): Rules => {
  return Object.fromEntries(
    Object.entries(overrides).filter(([ruleId]) => {
      return ruleId.startsWith(`${pluginName}/`);
    }),
  );
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- eslint-plugin-react-hooks configs.flat shape is not assignable to Linter.Plugin without assertion.
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
