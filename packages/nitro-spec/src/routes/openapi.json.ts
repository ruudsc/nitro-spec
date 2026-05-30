import consola from "consola";
import { createError, defineEventHandler, EventHandler } from "h3";

import { generateOpenApiDocument } from "../utils/generateOpenApiDocument";
import { OpenApiOptions } from "./openApiOptions";

const unsupportedTypesUrl =
  "https://github.com/asteasolutions/zod-to-openapi#unsupported-types";

const logUnsupportedZodTypeError = (error: unknown): boolean => {
  const maybeError = error as {
    message?: string;
    data?: {
      schemaName?: string;
      currentSchema?: {
        def?: { type?: string };
        _def?: { typeName?: string; type?: string };
        constructor?: { name?: string };
      };
    };
  };

  if (!maybeError.message?.includes("Unknown zod object type")) {
    return false;
  }

  const schema = maybeError.data?.currentSchema;
  const schemaName = maybeError.data?.schemaName ?? "unnamed schema";
  const schemaType =
    schema?.def?.type ?? schema?._def?.typeName ?? schema?._def?.type ?? schema?.constructor?.name;

  consola.error(
    `Unsupported Zod schema type used in OpenAPI generation (${schemaName}${
      schemaType ? `, type: ${schemaType}` : ""
    }).`,
  );
  consola.error(maybeError.message);
  consola.warn(`See supported alternatives: ${unsupportedTypesUrl}`);

  return true;
};

export const createOpenApiJsonEndpoint = (
  options: OpenApiOptions,
): EventHandler<Request, unknown> =>
  defineEventHandler(async () => {
    try {
      return await generateOpenApiDocument(options);
    } catch (e) {
      if (!logUnsupportedZodTypeError(e)) {
        consola.error(e);
      }
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  });
