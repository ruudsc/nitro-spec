import { z } from "nitro-spec";
import { defineMeta } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  response: z
    .object({
      message: z.string(),
    })
    .meta({ id: "IndexgettsMyResponse" }),
});

export default defineEventHandler((_event, _query, _body) => {
  return {
    message: "Hello World",
  };
});
