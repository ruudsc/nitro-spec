import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/compiler/factories/*.ts", "src/index.ts"],
  clean: true,
  format: ["esm", "cjs"],
  dts: true,

  sourcemap: true,
  minify: false,

  external: [
    "recast",
    "fs",
    "acorn",
    "esbuild",
    "h3",
    "jiti",
    "nitropack",
    "pathe",
    "rollup",
    "unimport",
    "vite",
    "webpack",
  ],
});
