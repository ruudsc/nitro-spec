import {
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import consola from "consola";
import { createError, defineEventHandler, EventHandler } from "h3";
import { merge, isErrorResult } from "openapi-merge";
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
        additionalJsonUrls = [],
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

      // If no additional URLs, return the base document
      if (!additionalJsonUrls.length) {
        return document;
      }

      // Fetch additional OpenAPI documents
      const additionalDocs = await Promise.allSettled(
        additionalJsonUrls.map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
          }
          return await response.json();
        }),
      );

      // Filter successful responses and log errors
      const validDocs = additionalDocs
        .map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            consola.warn(
              `Failed to fetch additional OpenAPI doc from ${additionalJsonUrls[index]}: ${result.reason}`,
            );
            return null;
          }
        })
        .filter(Boolean);

      // Merge documents if we have additional ones
      if (validDocs.length > 0) {
        const mergeResult = merge([
          {
            oas: document,
          },
          ...validDocs.map((doc) => ({ oas: doc })),
        ]);

        if (isErrorResult(mergeResult)) {
          consola.warn(
            "Failed to merge OpenAPI documents:",
            mergeResult.message,
          );
        } else {
          return mergeResult.output;
        }
      }

      return document;
    } catch (e) {
      consola.error(e);
      // return JSON.stringify(registry, null, 2);
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  });
