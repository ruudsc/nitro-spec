import {
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import consola from "consola";
import { createError, defineEventHandler, EventHandler } from "h3";
import { registry } from "../utils/registry";
import { OpenApiOptions } from "./openApiOptions";

export const createOpenApiJsonEndpoint = (
  options: OpenApiOptions,
): EventHandler<Request, unknown> =>
  defineEventHandler(async () => {
    try {
      const generator =
        options.openapi ?
          new OpenApiGeneratorV31(registry.definitions)
        : new OpenApiGeneratorV3(registry.definitions);

      const {
        title = "Nitro Server Routes",
        description,
        contact,
        license,
        termsOfService,
        servers,
        version = "1.0.0",
      } = options;

      const document = generator.generateDocument({
        openapi: "3.1.0",
        info: {
          title,
          version,
          description,
          contact,
          license,
          termsOfService,
        },
        servers,
      });

      // Not supported.
      delete document.webhooks;

      return document;
    } catch (e) {
      consola.error(e);
      // return JSON.stringify(registry, null, 2);
      createError({ statusCode: 500, statusMessage: "Internal Server Error" });
    }
  });
