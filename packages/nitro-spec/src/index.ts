import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export { defineMeta } from "./hooks/defineMeta";
export { defineMetaRaw } from "./hooks/defineMetaRaw";
export { toZodResponse } from "./utils/toZodResponse ";
export { createNitroSpecPlugin } from "./plugin";
export { FormatOpenApiResponse } from "./utils/registerRoute";
export { registry } from "./utils/registry";

extendZodWithOpenApi(z);
