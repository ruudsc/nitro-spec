import consola from "consola";
import { colors } from "consola/utils";
// import {defineCachedEventHandler} from 'nitropack/runtime';
import {
  H3Event,
  getValidatedQuery,
  getValidatedRouterParams,
  readValidatedBody,
  createError,
  defineEventHandler,
  _RequestMiddleware,
  EventHandlerObject,
} from "h3";
import { CachedEventHandlerOptions } from "nitropack";
import { z } from "zod";

import { isValidMethod, Method } from "../utils/isValidMethod";
import { methodHasBody } from "../utils/methodHasBody";
import { registerRoute, RouteRequestBodyType } from "../utils/registerRoute";

type Event = H3Event<Request>;

// Middleware types
export type MiddlewareFunction = (event: Event) => Promise<void> | void;
export type CustomMiddleware = {
  type: "custom";
  name: string;
  handler: MiddlewareFunction;
  description?: string;
};
export type MiddlewareConfig = CustomMiddleware;

// Response transformation types
export type ResponseTransformer = (response: any, event: Event, statusCode: number) => any;

// Error schema types
export type ErrorSchema = {
  statusCode: number;
  schema: ValidatorResponseTypes;
  description?: string;
};

export type ValidatorResponseTypes =
  | z.ZodNull
  | z.ZodType
  | z.ZodObject<z.ZodRawShape>
  | null
  | z.ZodVoid;

export type ResponseSchema = ValidatorResponseTypes | Record<number, ValidatorResponseTypes>;

export type StatusCodeResponses = {
  200?: ValidatorResponseTypes;
  201?: ValidatorResponseTypes;
  400?: ValidatorResponseTypes;
  401?: ValidatorResponseTypes;
  403?: ValidatorResponseTypes;
  404?: ValidatorResponseTypes;
  422?: ValidatorResponseTypes;
  500?: ValidatorResponseTypes;
} & Record<number, ValidatorResponseTypes>;

export type ErrorConfig = {
  /** How to handle Zod validation failures on query/params/body. Default: "managed" (returns 400 with issues). */
  onRequestError?: "managed" | "throw";
  /** How to handle errors thrown from the route handler. Default: "throw" (propagates to H3/Nitro). */
  onHandlerError?: "managed" | "throw";
  /** How to handle response schema mismatches. Default: "warn" (logs, passes through). */
  onResponseError?: "warn" | "throw";
};

export type RouteMeta<
  TPath extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
  TQuery extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
  TBody extends z.ZodTypeAny = z.ZodAny,
  TResponse extends ResponseSchema = z.ZodNull,
> = {
  operationId?: string;
  title?: string;
  description?: string;
  summary?: string;
  path?: TPath;
  query?: TQuery;
  body?: TBody;
  response: TResponse;
  responses?: StatusCodeResponses;
  bodyContentType?: RouteRequestBodyType;
  middleware?: MiddlewareConfig[];
  transformResponse?: ResponseTransformer;
} & ErrorConfig;

/**
 * Defines a type-safe Nitro/H3 route with OpenAPI metadata, Zod validation, and middleware support.
 *
 * This function wraps H3's event handler creation, providing:
 * - Automatic OpenAPI route registration and metadata extraction
 * - Zod-based runtime validation and compile-time types for params, query, body, and response
 * - Middleware execution (auth, custom, etc.)
 * - Response transformation (envelope, field filtering, etc.)
 * - Support for both regular and cached event handlers
 *
 * @param meta Route metadata and configuration
 * @returns An object with `defineEventHandler` and `defineCachedEventHandler` for creating handlers
 *
 * @example
 * const { defineEventHandler } = defineMeta({
 *   operationId: "getUser",
 *   path: z.object({ id: z.string() }),
 *   query: z.object({}),
 *   response: UserSchema,
 *   middleware: [authMiddleware],
 *   transformResponse: createResponseFormatTransformer(),
 * });
 *
 * export default defineEventHandler(async ({ event, path, query, body }) => {
 *   // ...handler logic...
 * });
 */
export function defineMeta<
  TPath extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
  TQuery extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
  TBody extends z.ZodTypeAny = z.ZodAny,
  TResponse extends ResponseSchema = z.ZodNull,
  TPathData = z.infer<TPath>,
  TQueryData = z.infer<TQuery>,
  TBodyData = z.infer<TBody>,
  TResponseData = TResponse extends z.ZodObject<z.ZodRawShape> ? z.infer<TResponse> : never,
>(meta: RouteMeta<TPath, TQuery, TBody, TResponse>) {
  const {
    body,
    query = z.object({}) as TQuery,
    path = z.object({}) as TPath,
    response,
    onRequestError = "managed",
    onHandlerError = "throw",
    onResponseError = "warn",
  } = meta;

  /** values injected by the rollup plugin */
  const { __path, __method } = meta as unknown as {
    __path: string;
    __method: Method;
    __isCatchAll?: boolean;
  };

  if (!isValidMethod(__method)) {
    throw new Error(`Invalid method: ${String(__method)} for ${__path}`);
  }

  const operationId = meta.operationId || __path;

  registerRoute({
    method: __method,
    path: __path as any,
    operationId,
    response: response as any,
    query,
    body: body as any,
    description: meta.description,
    summary: meta.summary,
    title: meta.title,
    bodyContentType: meta.bodyContentType,
  });

  // Middleware execution function
  const executeMiddleware = async (middleware: MiddlewareConfig, event: Event, meta: any) => {
    try {
      if (middleware.type === "custom") {
        await middleware.handler(event);
      }
    } catch (error) {
      consola.error(meta.prefix, `Middleware error: ${middleware.type}`, error);
      throw createError({
        statusCode: 500,
        statusMessage: "Middleware Error",
        data: error,
      });
    }
  };

  const getMeta = (event: Event) => {
    const { method, path } = event;
    return {
      path,
      method,
      prefix: `[${colors.bold(method)}] ${path}`,
      transformResponse: meta.transformResponse,
      middleware: meta.middleware,
      responses: meta.responses,
      response: meta.response,
    };
  };

  const requestValidator = async (event: Event) => {
    const meta = getMeta(event);
    consola.log(meta.prefix, "Validating request");

    // Execute middleware before validation
    if (meta.middleware) {
      for (const middleware of meta.middleware) {
        await executeMiddleware(middleware, event, meta);
      }
    }

    const handleRequestError = (field: string, e: unknown): undefined => {
      consola.error(meta.prefix, `Error validating ${field}`);
      consola.error(e);
      if (onRequestError === "throw") throw e;
      throw createError({ statusCode: 400, statusMessage: "Bad Request", data: e });
    };

    const validatedQuery = await getValidatedQuery(event, (data) => query.parse(data)).catch(
      (e) => handleRequestError("query", e),
    );

    const validatedParams = await getValidatedRouterParams(event, (data) => path.parse(data)).catch(
      (e) => handleRequestError("params", e),
    );

    const hasBody = body && methodHasBody(event.method);
    let _validatedBody = undefined;

    if (hasBody) {
      _validatedBody = await readValidatedBody(event, (data) => body.parse(data)).catch(
        (e) => handleRequestError("body", e),
      );
    }

    return {
      query: validatedQuery as TQueryData,
      path: validatedParams as TPathData,
      body: _validatedBody as TBodyData,
    };
  };

  // Common handler wrapper that includes request validation, response validation, and transformation
  const createHandlerWrapper = (
    handlerFn: HandlerFn<TPathData, TQueryData, TBodyData, TResponseData>,
  ) => {
    return async (event: Event) => {
      const { query, body, path } = await requestValidator(event);

      let response: Awaited<ReturnType<typeof handlerFn>>;
      try {
        response = await handlerFn({ event, path, query, body });
      } catch (e) {
        if (onHandlerError === "throw") throw e;
        consola.error(getMeta(event).prefix, "Unhandled handler error");
        consola.error(e);
        throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });
      }

      const meta = getMeta(event);
      const statusCode = event.node.res.statusCode || 200;

      let responseSchema: ValidatorResponseTypes | null = null;
      if (meta.responses && typeof meta.responses === "object" && meta.responses[statusCode]) {
        responseSchema = meta.responses[statusCode] || null;
      } else if (meta.response) {
        responseSchema = meta.response as ValidatorResponseTypes;
      }

      try {
        if (responseSchema == null && response != null) {
          throw Error(`Response is not null but no response schema found for status ${statusCode}`);
        } else if (responseSchema != null && "parse" in responseSchema) {
          responseSchema.parse(response);
        }
      } catch (e) {
        consola.error(meta.prefix, "Response schema mismatch");
        consola.error(JSON.stringify(e, null, 2));
        if (onResponseError === "throw") {
          throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });
        }
        // "warn" — log and fall through with the original response
      }

      let transformedResponse = response;
      if (meta.transformResponse && response != null) {
        transformedResponse = meta.transformResponse(response, event, statusCode);
      }

      return transformedResponse;
    };
  };

  const _defineEventHandler = (args: Handler<TPathData, TQueryData, TBodyData, TResponseData>) => {
    const handlerFn = typeof args === "function" ? args : args.handler;
    const handlerWrapper = createHandlerWrapper(handlerFn);

    const beforeResponse =
      typeof args === "object" && args.onBeforeResponse
        ? Array.isArray(args.onBeforeResponse)
          ? args.onBeforeResponse
          : [args.onBeforeResponse]
        : [];

    const handler = defineEventHandler({
      ...(typeof args === "object" ? args : undefined),
      onBeforeResponse: beforeResponse,
      handler: handlerWrapper,
    });

    return handler;
  };

  const _defineCachedEventHandler = (
    args: Handler<TPathData, TQueryData, TBodyData, TResponseData>,
    _cacheOptions?: CachedEventHandlerOptions,
  ) => {
    const handlerFn = typeof args === "function" ? args : args.handler;
    const handlerWrapper = createHandlerWrapper(handlerFn);

    // const handler = defineCachedEventHandler(handlerWrapper, cacheOptions);
    const handler = defineEventHandler(handlerWrapper);

    return handler;
  };

  return {
    defineEventHandler: _defineEventHandler,
    defineCachedEventHandler: _defineCachedEventHandler,
  };
}

export type MaybePromise<T> = T | Promise<T>;

export type HandlerContext<TPath, TQuery, TBody> = {
  event: Event;
  path: TPath;
  query: TQuery;
  body: TBody;
};

export type HandlerFn<TPath, TQuery, TBody, TResponse> = (
  context: HandlerContext<TPath, TQuery, TBody>,
) => MaybePromise<
  Expand<TResponse extends z.ZodObject<z.ZodRawShape> ? z.infer<TResponse> : TResponse>
>;

export type HandlerObject<TPath, TQuery, TBody, TResponse> = Omit<EventHandlerObject, "handler"> & {
  handler: (
    context: HandlerContext<TPath, TQuery, TBody>,
  ) => MaybePromise<
    Expand<TResponse extends z.ZodObject<z.ZodRawShape> ? z.infer<TResponse> : TResponse>
  >;
};

export type Handler<TPath, TQuery, TBody, TResponse> =
  | HandlerFn<TPath, TQuery, TBody, TResponse>
  | HandlerObject<TPath, TQuery, TBody, TResponse>;

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
