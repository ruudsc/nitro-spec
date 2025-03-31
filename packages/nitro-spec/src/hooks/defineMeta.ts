// import "zod-openapi/extend";
import { z } from "zod";
import {
  H3Event,
  getValidatedQuery,
  getValidatedRouterParams,
  readValidatedBody,
  _ResponseMiddleware,
  createError,
  defineEventHandler,
  _RequestMiddleware,
  EventHandlerObject,
} from "h3";
import consola from "consola";
import { colors } from "consola/utils";
import { registerRoute } from "../utils/registerRoute";
import { isValidMethod, Method } from "../utils/isValidMethod";
import { methodHasBody } from "../utils/methodHasBody";

type Event = H3Event<Request>;

export type ValidatorResponseTypes =
  | z.ZodNull
  | z.ZodType
  | z.AnyZodObject
  | null
  | z.ZodVoid;

export type RouteMeta<
  TPath extends z.AnyZodObject = z.AnyZodObject,
  TQuery extends z.AnyZodObject = z.AnyZodObject,
  TBody extends z.ZodAny | z.AnyZodObject = z.ZodAny,
  TResponse extends ValidatorResponseTypes = z.ZodNull,
> = {
  operationId?: string;
  title?: string;
  description?: string;
  summary?: string;
  path?: TPath;
  query?: TQuery;
  body?: TBody;
  response: TResponse;
};

export function defineMeta<
  TPath extends z.AnyZodObject = z.AnyZodObject,
  TQuery extends z.AnyZodObject = z.AnyZodObject,
  TBody extends z.ZodAny | z.AnyZodObject = z.ZodAny,
  TResponse extends ValidatorResponseTypes = z.ZodNull,
  TPathData = z.infer<TPath>,
  TQueryData = z.infer<TQuery>,
  TBodyData = z.infer<TBody>,
  TResponseData = TResponse extends z.AnyZodObject ? z.infer<TResponse> : never,
>(meta: RouteMeta<TPath, TQuery, TBody, TResponse>) {
  const {
    body,
    query = z.object({}),
    path = z.object({}),
    response = z.null(),
  } = meta;

  /** values injected by the rollup plugin */
  const { __path, __method } = meta as unknown as {
    __path: string;
    __method: Method;
    __isCatchAll?: boolean;
  };

  if (isValidMethod(__method) === false) {
    throw new Error(`Invalid method: ${__method} for ${__path}`);
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
  });

  const getMeta = (event: Event) => {
    const { method, path } = event;
    return {
      path,
      method,
      prefix: `[${colors.bold(method)}] ${path}`,
    };
  };

  const requestValidator = async (event: Event) => {
    const meta = getMeta(event);
    consola.log(meta.prefix, "Validating request");

    const validatedQuery = await getValidatedQuery(event, query.parse).catch(
      (e) => {
        consola.error(meta.prefix, "Error validating query");
        consola.error(e);
      },
    );

    const validatedParams = await getValidatedRouterParams(
      event,
      path.parse,
    ).catch((e) => {
      consola.error(meta.prefix, "Error validating params");
      consola.error(e);
    });
    const hasBody = body && methodHasBody(event.method);

    let _validatedBody = undefined;

    if (hasBody) {
      _validatedBody = await readValidatedBody(event, body.parse).catch((e) => {
        consola.error(meta.prefix, "Error validating body");
        consola.error(e);
      });
    }

    return {
      query: validatedQuery as TQueryData,
      path: validatedParams as TPathData,
      body: _validatedBody as TBodyData,
    };
  };

  const responseValidator: _ResponseMiddleware = (event, eventResponse) => {
    const meta = getMeta(event);
    consola.log(meta.prefix, "Validating response");

    try {
      if (response == null && eventResponse?.body != null) {
        throw Error("Response is not null but response schema is null");
      } else if (response != null) {
        response.parse(eventResponse.body);
      } else {
        // TODO: Add a warning that response is null and response is not validated
        consola.debug("Response is null and response is not validated");
      }
    } catch (e) {
      consola.error(meta.prefix, "Error validating response");
      consola.error(JSON.stringify(e, null, 2));
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  };
  /* 
  const wrappedHandler: Handler<TPathData, TQueryData, TBodyData, TResponseData> =  async (event: H3Event<EventHandlerRequest>) => {
    const { query, body, path } = await requestValidator(event);

    const response = await handler(event, path, query, body);

    responseValidator(event, response);
  }
 */
  const _defineEventHandler = (
    args: Handler<TPathData, TQueryData, TBodyData, TResponseData>,
  ) => {
    const handlerFn = typeof args === "function" ? args : args.handler;

    const beforeResponse =
      typeof args === "object" && args.onBeforeResponse ?
        Array.isArray(args.onBeforeResponse) ?
          args.onBeforeResponse
        : [args.onBeforeResponse]
      : [];

    beforeResponse.push(responseValidator);

    const handler = defineEventHandler({
      ...(typeof args === "object" ? args : undefined),
      onBeforeResponse: beforeResponse,
      handler: async (event) => {
        const { query, body, path } = await requestValidator(event);
        const response = await handlerFn(event, path, query, body);
        return response;
      },
    });

    return handler;
  };

  return {
    defineEventHandler: _defineEventHandler,
  };
}

export type MaybePromise<T> = T | Promise<T>;

export type HandlerFn<TPath, TQuery, TBody, TResponse> = (
  event: Event,
  params: TPath,
  query: TQuery,
  body: TBody,
) => MaybePromise<
  Expand<TResponse extends z.AnyZodObject ? z.infer<TResponse> : TResponse>
>;

export type HandlerObject<TPath, TQuery, TBody, TResponse> = Omit<
  EventHandlerObject,
  "handler"
> & {
  handler: (
    event: Event,
    params: TPath,
    query: TQuery,
    body: TBody,
  ) => MaybePromise<
    Expand<TResponse extends z.AnyZodObject ? z.infer<TResponse> : TResponse>
  >;
};

export type Handler<TPath, TQuery, TBody, TResponse> =
  | HandlerFn<TPath, TQuery, TBody, TResponse>
  | HandlerObject<TPath, TQuery, TBody, TResponse>;

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
