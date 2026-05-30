import nitroSpec from "nitro-spec/rolldown";

//https://nitro.unjs.io/config
export default defineNitroConfig({
  serverDir: "server",
  sourceMap: true,
  rollupConfig: {
    plugins: [nitroSpec()],
  },
  compatibilityDate: "2025-03-06",
} as any);
