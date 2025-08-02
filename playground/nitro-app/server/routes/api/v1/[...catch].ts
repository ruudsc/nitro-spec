import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  operationId: "getTest",
  title: "Test title",
  path: z.object({ id: z.string() }).meta({ id: "ApiV1CatchtsCatchAllPath" }),
  response: z.null().meta({ id: "ApiV1CatchtsCatchAllResponse" }),
});

export default defineEventHandler((event, _query, _body) => {
  return null;
});
