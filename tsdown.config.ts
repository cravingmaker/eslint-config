import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  // Do not publish original source through source maps.
  sourcemap: false,
});
