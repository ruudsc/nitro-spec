import { defineMeta } from "nitro-spec";
import { z } from "zod";

const { defineEventHandler } = defineMeta({
  path: z.object({
    page: z.string(),
  }),
  response: z.object({
    message: z.string(),
  }),
});

export default defineEventHandler((_event, _query, path) => {
  return {
    message: path.page,
  };
});
