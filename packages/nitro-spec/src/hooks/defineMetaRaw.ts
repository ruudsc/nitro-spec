import { z } from "zod";
import { RouteMeta, ValidatorResponseTypes } from "./defineMeta";
import { Method } from "../utils/isValidMethod";
import { registry } from "../utils/registry";
import { RouteConfig } from "@asteasolutions/zod-to-openapi";

/**
 * Registers a route in the OpenAPI registry for build-time metadata extraction.
 *
 * This low-level utility is used by the nitro-spec plugin to record route definitions
 * during build/transform time, enabling automatic OpenAPI spec generation.
 * 
 * This is also used as an escape hatch for when you need to define something unsupported.
 *
 * @param meta Route configuration object (excluding path and method, which are injected)
 *
 * @example
 * defineMetaRaw({
 *   operationId: "getUser",
 *   response: UserSchema,
 *   // ...other OpenAPI metadata
 * });
 */
export function defineMetaRaw(meta: Omit<RouteConfig, "path" | "method">) {
  /** values injected by the rollup plugin */
  const { __path, __method, __isCatchAll, ...filteredMeta } =
    meta as unknown as {
      __path: string;
      __method: Method;
      __isCatchAll: boolean;
    };

  registry.registerPath({
    ...(filteredMeta as any),
    path: __path as any,
    method: __method as any,
  });
}
