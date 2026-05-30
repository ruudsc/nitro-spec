import { z } from "nitro-spec";
import { createNitroSpecPlugin } from "nitro-spec";

export default (app: Parameters<typeof createNitroSpecPlugin>[0]["app"]) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
  });
};
