import { defineMeta } from "nitro-spec";
import { defineMetaRaw } from "nitro-spec";
import { z } from "nitro-spec";

defineMetaRaw({
  operationId: "getTestCatchAllRaw",
  summary: "Catch-all route",
  responses: {
    200: {
      description: "Catch-all response",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
  },
});

const { defineEventHandler } = defineMeta({
  operationId: "getTest",
  title: "Test title",
  response: z
    .object({ message: z.string() })
    .meta({ id: "ApiV1CatchtsCatchAllResponse" }),
});

export default defineEventHandler((event, _query, _body) => {
  return { message: "catch all" };
});
