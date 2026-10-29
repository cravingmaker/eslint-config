/* eslint-disable unicorn/no-barrel-files -- The package entry point only re-exports the public API. */

export { createConfig } from "./factory.js";
export type {
  Feature,
  FeatureOptions,
  GlobalEnvironment,
  ImportsOptions,
  JsonOptions,
  Options,
  ReactOptions,
  ReactRefreshVariant,
  Rules,
  TypeScriptOptions,
} from "./types.js";
