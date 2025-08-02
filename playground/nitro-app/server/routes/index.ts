import { z } from "zod";
import { defineMeta } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  title: "Home",
  description: "Welcome to your new Nitro app.",
  summary: "Welcome to your new Nitro app.",
  query: z.object({
    name: z.string(),
  }),
  response: z.void(),
});

export default defineEventHandler((event, path, query, body) => {
  return void 0;
});
