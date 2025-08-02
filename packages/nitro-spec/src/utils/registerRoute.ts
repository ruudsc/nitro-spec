import { HTTPMethod } from "h3";
import { registry } from "./registry";
import { RouteMeta, ValidatorResponseTypes } from "../hooks/defineMeta";
import { z } from "zod";
import { ResponseConfig } from "@asteasolutions/zod-to-openapi";
import { Method } from "./isValidMethod";
import consola from "consola";

/* import {
  extendZodWithOpenApi,
  ResponseConfig,
} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z); */

export type RegisterRouteOptions = RouteMeta & {
  operationId: string;
  path: string;
  method: Method;
};

export const registerRoute = (options: RegisterRouteOptions) => {
  const responses: Record<number, ResponseConfig> = {
    [200]: FormatOpenApiResponse("OK", options.response),
  };

  consola.debug(`registering ${options.method} ${options.path}`);

  registry.registerPath({
    method: options.method as any,
    path: options.path,
    tags: generateRouteTags(options.path),
    responses: responses,
    request: {
      query: options.query,
      params: pathParameters(options.path, options.operationId),
      body: options.body && {
        content: {
          "application/json": {
            schema: options.body,
          },
        },
      },
    },
  });
};

const generateRouteTags = (path: string) => {
  if (path === "" || path === "/") return ["root"];

  const tags = path
    .split("/")
    .filter((part) => {
      const isParameter = part.startsWith("{") && part.endsWith("}");
      const isEmpty = part.length < 1;
      const ignored = ["api", "v1"].includes(part);

      return !(isParameter || isEmpty || ignored);
    })
    .join(" ")
    .replace("-", " ");

  return [tags];
};

const pathParameters = (path: string, operationId: string) => {
  const parameterNames: string[] = [];

  let anonymouseCounter = 0;

  const route = path
    .replace(/:(\w+)/g, (_, name) => `{${name}}`)
    .replace(/\/(\*)\//g, () => `/{param${++anonymouseCounter}}/`)
    .replace(/\*\*{/, "{")
    .replace(/\/(\*\*)$/g, () => `/{*param${++anonymouseCounter}}`);

  const paramMatches = route.matchAll(/{(\*?\w+)}/g);
  for (const match of paramMatches) {
    const name = match[1];
    parameterNames.push(name);
  }

  return z.object(
    parameterNames.reduce((acc, name) => ({ ...acc, [name]: z.string() }), {}),
  );
};

export const FormatOpenApiResponse = (
  description: string,
  schema: ValidatorResponseTypes,
  mimeType: string = "json",
): ResponseConfig => {
  if (schema instanceof z.ZodObject) {
    return {
      description,
      content: {
        [`application/${mimeType}`]: {
          schema,
        },
      },
    };
  }

  return {
    description,
    content: {},
  };
};

/* 
export const NotAuthorizedResponse = z
  .object({
    code: z.literal(401),
    message: z.literal("Unauthorized"),
  })
  .openapi("Unauthorized");

export const NotFoundResponse = z
  .object({
    message: z.literal("Not Found"),
    code: z.literal(404),
  })
  .openapi("NotFound");
 */
