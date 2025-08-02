import { z, defineMeta } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  response: z.object({
    message: z.string(),
  }),
});

export default defineEventHandler((event, query, body) => {
  return {
    message: "Hello World",
  };
});
