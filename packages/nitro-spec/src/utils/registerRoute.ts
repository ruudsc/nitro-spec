import { HTTPMethod } from "h3";
import { registry } from "./registry";
import { RouteMeta, ValidatorResponseTypes } from "../hooks/defineMeta";
import { z } from "zod";
import { ResponseConfig, ZodRequestBody } from "@asteasolutions/zod-to-openapi";
import { Method } from "./isValidMethod";
import consola from "consola";
import { methodHasBody } from "./methodHasBody";

export type RegisterRouteOptions = RouteMeta & {
  operationId: string;
  path: string;
  method: Method;
  contentType?: string;
};

export const registerRoute = (options: RegisterRouteOptions) => {
  const responses: Record<number, ResponseConfig> = {
    [200]: FormatOpenApiResponse("OK", options.response),
  };

  consola.debug(`registering ${options.method} ${options.path}`);
  const hasBody = methodHasBody(options.method);

  if (!hasBody && options.body) {
    consola.warn(
      `Route ${options.path} has a body but the method is not POST, PUT or PATCH. This is not recommended. The body will be ignored.`,
    );
  }

  const requestBody =
    options.body && hasBody ?
      ({
        content: {
          "application/json": {
            schema: options.body,
          },
        },
      } satisfies ZodRequestBody)
    : undefined;

  registry.registerPath({
    method: options.method as any,
    path: options.path,
    operationId: options.operationId,
    tags: generateRouteTags(options.path),
    responses: responses,
    request: {
      query: options.query,
      params: pathParameters(options.path, options.operationId),
      body: requestBody,
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
