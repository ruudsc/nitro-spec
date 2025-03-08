// import "zod-openapi/extend";
import { z, ZodType } from "zod";
import {
  H3Event,
  getValidatedQuery,
  getValidatedRouterParams,
  readValidatedBody,
  _ResponseMiddleware,
  createError,
  defineEventHandler,
  _RequestMiddleware,
  EventHandler,
} from "h3";
import consola from "consola";
import { colors } from "consola/utils";
import { registerRoute } from "../utils/registerRoute";
import { isValidMethod, Method } from "../utils/isValidMethod";

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
  TBody extends z.ZodAny = z.ZodAny,
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
  TBody extends z.ZodAny = z.ZodAny,
  TResponse extends ValidatorResponseTypes = z.ZodNull,
  TPathData = z.infer<TPath>,
  TQueryData = z.infer<TQuery>,
  TBodyData = z.infer<TBody>,
>(meta: RouteMeta<TPath, TQuery, TBody, TResponse>) {
  const {
    body = z.object({}),
    query = z.object({}),
    path = z.object({}),
    response = z.null(),
  } = meta;

  /** values injected by the rollup plugin */
  const { __path, __method } = meta as unknown as {
    __path: string;
    __method: Method;
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
    const hasBody = ["POST", "PUT", "PATCH"].includes(event.method);

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

  return {
    defineEventHandler: (
      handler: Handler<TPathData, TQueryData, TBodyData, TResponse>,
    ) =>
      defineEventHandler({
        onBeforeResponse: responseValidator,
        handler: async (event) => {
          const { query, body, path } = await requestValidator(event);

          return handler(event, path, query, body);
        },
      }),
  };
}

export type MaybePromise<T> = T | Promise<T>;
export type Handler<
  TPath,
  TQuery,
  TBody,
  TResponse extends ValidatorResponseTypes,
> = (
  event: Event,
  params: TPath,
  query: TQuery,
  body: TBody,
) => Expand<
  MaybePromise<TResponse extends z.ZodAny ? z.infer<TResponse> : null>
>;

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type DefineEventHandler = (handler: Handler<any, any, any, any>) => any;

export type InferResponseType<T extends DefineEventHandler> =
  DefineEventHandler;
