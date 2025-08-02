import { ResponseConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export const toZodResponse = (
  schema: z.ZodObject<z.ZodRawShape>,
  description: string = "",
): ResponseConfig => {
  return {
    description,
    content: {
      ["application/json"]: {
        schema,
      },
    },
  };
};
