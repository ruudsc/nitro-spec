import nitroSpec from "nitro-spec/rollup";

//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  sourceMap: "inline",

  rollupConfig: {
    plugins: [nitroSpec()],
  },

  compatibilityDate: "2025-03-06",
});
