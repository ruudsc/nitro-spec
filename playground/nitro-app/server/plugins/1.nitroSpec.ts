import { z } from "nitro-spec";
import { createNitroSpecPlugin } from "nitro-spec";

export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
  });
});
