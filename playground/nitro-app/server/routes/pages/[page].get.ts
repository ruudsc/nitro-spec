import { defineMeta, z } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  path: z.object({
    page: z.string(),
  }),
  response: z.object({
    message: z.string(),
  }),
});

export default defineEventHandler((event, query, path) => {
  return {
    message: path.page,
  };
});
