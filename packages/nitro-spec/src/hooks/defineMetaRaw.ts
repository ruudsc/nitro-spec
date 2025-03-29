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
  const { __path, __method } = meta as unknown as {
    __path: string;
    __method: Method;
  };

  const copy = {
    ...meta,
    __path: undefined,
    __method: undefined,
    path: __path as any,
    method: __method as any,
  };
  registry.registerPath({
    ...meta,
    path: __path as any,
    method: __method as any,
  });
}
