import { z } from "zod";
import { RouteMeta, ValidatorResponseTypes } from "./defineMeta";
import { Method } from "../utils/isValidMethod";
import { registry } from "../utils/registry";
import { RouteConfig } from "@asteasolutions/zod-to-openapi";

/**
 *
 * Register a route in the registry.
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
