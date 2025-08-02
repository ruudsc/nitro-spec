import { z } from "nitro-spec";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Ensure Zod is extended for backward compatibility
extendZodWithOpenApi(z);

export const testReference = z
  .object({
    message: z.tuple([z.string(), z.number()]),
  })
  .meta({ id: "TestReference" });

export const testResponse = z
  .object({
    message: z.string(),
    data: z.object({
      count: z.number().nullable(),
      message: z.literal("Hello World"),
    }),
    test: testReference.array(),
  })
  .meta({ id: "MyResponse" });
