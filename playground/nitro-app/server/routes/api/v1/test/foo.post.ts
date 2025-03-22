import { defineMeta } from "nitro-spec";
import { z } from "zod";

export const { defineEventHandler } = defineMeta({
  operationId: "getTest2",
  title: "Test title",
  query: z.object({ id: z.string() }).openapi("TestPath"),
  response: z.null().openapi("TestResponse"),
  body: z
    .object({
      message: z.string(),
    })
    .openapi("TestBody"),
  description: "Test Post Point",
});

export default defineEventHandler(() => {
  return null;
});
