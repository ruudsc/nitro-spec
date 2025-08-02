import { defineMeta } from "nitro-spec";
import { z } from "zod";

const { defineEventHandler } = defineMeta({
  operationId: "getTest",
  title: "Test title",
  path: z.object({ id: z.string() }).openapi("TestPath"),
  response: z.null().openapi("TestResponse"),
});

export default defineEventHandler((event, _query, _body) => {
  return null;
});
