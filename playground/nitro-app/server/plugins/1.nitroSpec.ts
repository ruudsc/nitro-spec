import { definePlugin } from "nitro";
import { createNitroSpecPlugin } from "nitro-spec";

export default definePlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
    logLevel: "verbose",
  });
});
