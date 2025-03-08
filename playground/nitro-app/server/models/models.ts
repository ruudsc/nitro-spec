import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const testReference = z
  .object({
    message: z.tuple([z.string(), z.number()]),
  })
  .openapi("TestReference");

export const testResponse = z
  .object({
    message: z.string(),
    data: z.object({
      count: z.number().nullable(),
      message: z.literal("Hello World"),
    }),
    test: testReference.array(),
  })
  .openapi("MyResponse");
