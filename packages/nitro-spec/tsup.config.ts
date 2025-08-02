import type { Options } from "tsup";

export default <Options>{
  entry: ["src/compiler/factories/*.ts", "src/index.ts"],
  clean: true,
  format: ["esm", "cjs"],
  dts: true,

  sourcemap: true,
  minify: false,
  splitting: true,
  bundle: true,

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
};
