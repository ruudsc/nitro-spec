import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  operationId: "foo",
  title: "Test title",
  path: z
    .object({ foo: z.string() })
    .meta({ id: "ApiV1TestFooposttsTestFooPath" }),
  query: z
    .object({ bar: z.string() })
    .meta({ id: "ApiV1TestFooposttsTestFooQuery" }),
  body: z
    .object({ baz: z.string() })
    .meta({ id: "ApiV1TestFooposttsTestFooBody" }),
  response: z
    .object({ message: z.string() })
    .meta({ id: "ApiV1TestFooposttsTestFooResponse" }),
});

export default defineEventHandler((event, path, query, body) => {
  const message = `Hello ${path.foo} ${query.bar} ${body.baz}`;

  return {
    message,
  };
});
