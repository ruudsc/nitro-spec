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
  const router = (app as any).use ? app : (app as any).h3;
  const registerGet = (path: string, handler: any) => {
    if (typeof router.use === "function") {
      router.use(path, handler);
      return;
    }

    if (typeof router.get === "function") {
      router.get(path, handler);
      return;
    }

    router["~middleware"].push(async (event: any) => {
      if (event.req.method === "GET" && event.url.pathname === path) {
        return handler(event);
      }
    });
  };

  registerGet(`${normalised}/openapi.json`, createOpenApiJsonEndpoint(args));
  registerGet(`${normalised}/openapi.yaml`, createOpenapiYamlRoute());
  registerGet(
    `${normalised}/openapi/redoc`,
    CreateRedocRoute({
      title: args.title ?? "Nitro Server Routes",
      description: "OpenAPI documentation for Nitro Server Routes",
      baseUrl: `${normalised}`,
    }),
  );

  registerGet(
    `${normalised}/openapi`,
    createOpenApiRoute({
      baseUrl: `${normalised}/openapi.json`,
      title: args.title ?? "Nitro Server Routes",
      description: args.description ?? "OpenAPI documentation for Nitro Server Routes",
    }),
  );
};
