import { z } from "zod";
import { createNitroSpecPlugin } from "nitro-spec";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
  });
});
