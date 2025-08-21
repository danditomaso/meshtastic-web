import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "mod.ts",
  format: "esm",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: { sourcemap: true, resolve: true },
  target: "es2024",
  external: ["@meshtastic/core"],
  skipNodeModulesBundle: true,
});
