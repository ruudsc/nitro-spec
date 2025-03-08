import { z } from "zod";
extendZodWithOpenApi(z);

import { createNitroSpecPlugin } from "nitro-spec";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
  });
});
