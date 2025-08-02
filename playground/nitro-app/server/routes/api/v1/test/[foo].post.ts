import { defineMeta } from "nitro-spec";
import { z } from "zod";

const { defineEventHandler } = defineMeta({
  operationId: "foo",
  title: "Test title",
  path: z.object({ foo: z.string() }).openapi("TestPath"),
  query: z.object({ bar: z.string() }).openapi("TestQuery"),
  body: z.object({ baz: z.string() }).openapi("TestBody"),
  response: z.object({ message: z.string() }).openapi("TestResponse"),
});

export default defineEventHandler((event, path, query, body) => {
  const message = `Hello ${path.foo} ${query.bar} ${body.baz}`;

  return {
    message,
  };
});
