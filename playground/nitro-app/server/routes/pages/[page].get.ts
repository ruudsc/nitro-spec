import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  path: z.object({
    page: z.string(),
  }),
  response: z.object({
    message: z.string(),
  }),
});

export default defineEventHandler((event, params) => {
  const { page } = params;

  // Simulate fetching page data
  const pageData = {
    message: `You are viewing page: ${page}`,
  };

  return pageData;
});
