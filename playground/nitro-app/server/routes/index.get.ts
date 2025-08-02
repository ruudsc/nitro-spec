import { z } from "zod";
import { defineMeta } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  response: z
    .object({
      message: z.string(),
    })
    .openapi("MyResponse"),
});

export default defineEventHandler((_event, _query, _body) => {
  return {
    message: "Hello World",
  };
});
