import { type NitroApp } from "nitropack";

import { createOpenApiRoute } from "./routes/openapi";
import { createOpenApiJsonEndpoint } from "./routes/openapi.json";
import { createOpenapiYamlRoute } from "./routes/openapi.yaml";
import { OpenApiOptions } from "./routes/openApiOptions";
import { CreateRedocRoute } from "./routes/redoc";
type NitroSpecOptions = OpenApiOptions & {
  app: NitroApp;
};

export const createNitroSpecPlugin = (args: NitroSpecOptions) => {
  const { app, baseUrl } = args;

  const normalised = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  app.router.get(`${normalised}/openapi.json`, createOpenApiJsonEndpoint(args));
  app.router.get(`${normalised}/openapi.yaml`, createOpenapiYamlRoute());
  app.router.get(
    `${normalised}/openapi/redoc`,
    CreateRedocRoute({
      title: args.title ?? "Nitro Server Routes",
      description: "OpenAPI documentation for Nitro Server Routes",
      baseUrl: `${normalised}`,
    }),
  );

  app.router.get(
    `${normalised}/openapi`,
    createOpenApiRoute({
      baseUrl: `${normalised}/openapi.json`,
      title: args.title ?? "Nitro Server Routes",
      description: args.description ?? "OpenAPI documentation for Nitro Server Routes",
    }),
  );
};
