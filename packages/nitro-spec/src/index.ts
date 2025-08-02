import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export { defineMeta } from "./hooks/defineMeta";
export { defineMetaRaw } from "./hooks/defineMetaRaw";
export { toZodResponse } from "./utils/toZodResponse ";
export { createNitroSpecPlugin } from "./plugin";
export { FormatOpenApiResponse } from "./utils/registerRoute";
export { registry } from "./utils/registry";

// New advanced features
export * from "./utils/errorSchemas";
export * from "./utils/transformers";

// Export types for user convenience
export type {
  RouteMeta,
  ValidatorResponseTypes,
  ResponseSchema,
  StatusCodeResponses,
  MiddlewareConfig,
  CustomMiddleware,
  ResponseTransformer,
  ErrorSchema,
  HandlerFn,
  HandlerObject,
  Handler,
} from "./hooks/defineMeta";

extendZodWithOpenApi(z);

export { z };
