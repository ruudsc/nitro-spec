import type { Options } from "tsup";

export default <Options>{
  entry: ["src/compiler/factories/*.ts", "src/index.ts"],
  clean: true,
  format: ["esm"],
  dts: true,
  sourcemap: true,
  minify: false,

  splitting: true,
};
