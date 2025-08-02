import type { Options } from "tsup";

export default <Options>{
  entry: [
    "src/index.ts",
    "src/auth/index.ts",
    "src/validation/index.ts",
    "src/security/index.ts",
    "src/utils/index.ts",
  ],
  clean: true,
  format: ["esm", "cjs"],
  dts: true,

  sourcemap: true,
  minify: false,
  splitting: true,
  bundle: true,

  external: [
    "h3",
    "zod",
    "nitro-spec",
    "jsonwebtoken",
    "bcryptjs",
    "cors",
    "helmet",
  ],
};
