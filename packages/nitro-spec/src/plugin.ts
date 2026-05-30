import type { NitroApp } from "nitropack";
import { toEventHandler } from "h3";

import { createOpenApiRoute } from "./routes/openapi";
import { createOpenApiJsonEndpoint } from "./routes/openapi.json";
import { createOpenapiYamlRoute } from "./routes/openapi.yaml";
import { OpenApiOptions } from "./routes/openApiOptions";
import { CreateRedocRoute } from "./routes/redoc";
import { Logger, type LogLevel } from "./logger";

type NitroSpecOptions = OpenApiOptions & {
  app: NitroApp;
  logLevel?: LogLevel;
};

/**
 * Registers OpenAPI documentation routes with a Nitro app.
 * Uses the H3 internal ~addRoute API to register routes, compatible with both
 * H3 and H3Core (used by Nitro's dev server).
 */
export const createNitroSpecPlugin = (
  args: NitroSpecOptions & {
    hooks?: NonNullable<NitroApp["hooks"]>;
  }
): void => {
  const { app, baseUrl, logLevel = "info" } = args;
  const logger = new Logger(logLevel);

  const normalised = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  if (!("h3" in app) || !app.h3) {
    throw new Error(
      "[nitro-spec] H3 router not found on Nitro app. " +
      "nitro-spec currently only supports H3-based servers."
    );
  }

  const h3App = app.h3 as any;

  const registerRoute = (path: string, handler: any) => {
    try {
      const eventHandler = toEventHandler(handler);
      h3App["~middleware"].push((event: any, next: () => any) => {
        if (event.req.method !== "GET") return next();
        if (event.url.pathname !== path) return next();
        return eventHandler(event);
      });
      logger.verbose(`Registered route: ${path}`);
    } catch (error) {
      logger.error(`Failed to register route ${path}:`, error);
    }
  };

  // Register OpenAPI documentation routes
  registerRoute(`${normalised}/openapi.json`, createOpenApiJsonEndpoint(args));
  registerRoute(`${normalised}/openapi.yaml`, createOpenapiYamlRoute(args));
  registerRoute(
    `${normalised}/openapi/redoc`,
    CreateRedocRoute({
      title: args.title ?? "Nitro Server Routes",
      description: "OpenAPI documentation for Nitro Server Routes",
      baseUrl: `${normalised}`,
    })
  );

  registerRoute(
    `${normalised}/openapi`,
    createOpenApiRoute({
      baseUrl: `${normalised}/openapi.json`,
      title: args.title ?? "Nitro Server Routes",
      description: args.description ?? "OpenAPI documentation for Nitro Server Routes",
    })
  );

  logger.info("OpenAPI documentation available at:");
  logger.info(`  - OpenAPI JSON: ${normalised}/openapi.json`);
  logger.info(`  - OpenAPI YAML: ${normalised}/openapi.yaml`);
  logger.info(`  - Swagger UI: ${normalised}/openapi`);
  logger.info(`  - ReDoc: ${normalised}/openapi/redoc`);

  if (args.additionalJsonUrls && args.additionalJsonUrls.length > 0) {
    logger.verbose("Additional OpenAPI spec URLs:");
    args.additionalJsonUrls.forEach((url) => {
      logger.verbose(`  - ${url}`);
    });
  }
};
