import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

export const { defineEventHandler } = defineMeta({
  operationId: "getTest2",
  title: "Test title",
  query: z
    .object({ id: z.string() })
    .meta({ id: "ApiV1TestFooposttsTestPath" }),
  response: z.null().meta({ id: "ApiV1TestFooposttsTestResponse" }),
  body: z
    .object({
      message: z.string(),
    })
    .meta({ id: "ApiV1TestFooposttsTestBody" }),
  description: "Test Post Point",
});

export default defineEventHandler(() => {
  return null;
});
