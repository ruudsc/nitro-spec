import { type NitroApp } from "nitropack";
import { openApiJsonEndpoint } from "./routes/openapi.json";
import { openapiYamlRoute } from "./routes/openapi.yaml";
import { createOpenApiRoute } from "./routes/openapi";
type NitroSpecOptions = {
  app: NitroApp;
  base?: string;
};

export const createNitroSpecPlugin = (args: NitroSpecOptions) => {
  const { app, base = "" } = args;

  app.router.add(`${base}/openapi.json`, openApiJsonEndpoint);
  app.router.add(`${base}/openapi.yaml`, openapiYamlRoute);
  app.router.add(
    `${base}/openapi`,
    createOpenApiRoute({
      url: `${base}/openapi`,
      title: "Nitro Server Routes",
      description: "OpenAPI documentation for Nitro Server Routes",
    }),
  );
};
