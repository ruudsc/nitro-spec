
import { z } from "zod";

/* const { defineEventHandler } = defineMeta({
  operationId: "getById",
  title: "getById",
  path: z.object({
    page: z.string(),
  }),
  response: z.object({
    message: z.string(),
  }),
}); */

export default defineEventHandler((_event, path) => {
  return { message: path.page };
});
