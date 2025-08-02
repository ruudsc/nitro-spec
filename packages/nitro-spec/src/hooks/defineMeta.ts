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
} from "h3";
import consola from "consola";
import { colors } from "consola/utils";

type Event = H3Event<Request>;

type ValidatorResponseTypes =
  | z.ZodNull
  | z.ZodType
  | z.AnyZodObject
  | null
  | z.ZodVoid;

type RouteMeta<
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
  TPathData = NoInfer<z.infer<TPath>>,
  TQueryData = NoInfer<z.infer<TQuery>>,
  TBodyData = NoInfer<z.infer<TBody>>,
  TResponseData = NoInfer<
    TResponse extends ZodType ? z.infer<TResponse> : null
  >,
>(meta: RouteMeta<TPath, TQuery, TBody, TResponse>) {
  const {
    body = z.object({}),
    query = z.object({}),
    path = z.object({}),
    response = null,
  } = meta;

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
      if (response == null && eventResponse != null) {
        throw Error("Response is not null but response schema is null");
      } else if (response != null) {
        response.parse(eventResponse);
      } else {
        // TODO: Add a warning that response is null and response is not validated
        consola.debug("Response is null and response is not validated");
      }
    } catch (e) {
      consola.error(meta.prefix, "Error validating response");
      consola.error(e);

      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  };

  return {
    defineEventHandler: (
      handler: Handler<TPathData, TQueryData, TBodyData, TResponseData>,
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
export type Handler<TPath, TQuery, TBody, TResponse> = (
  event: Event,
  params: TPath,
  query: TQuery,
  body: TBody,
) => MaybePromise<TResponse>;
