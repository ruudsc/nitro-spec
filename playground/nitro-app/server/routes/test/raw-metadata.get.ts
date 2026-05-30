import { defineEventHandler } from "h3";
import { defineMetaRaw, z } from "nitro-spec";

defineMetaRaw({
  operationId: "testRawMetadataStress",
  summary: "Raw metadata stress route",
  description: "Exercises defineMetaRaw with explicit OpenAPI response metadata",
  tags: ["stress", "raw"],
  responses: {
    200: {
      description: "Raw metadata route response",
      content: {
        "application/json": {
          schema: z
            .object({
              ok: z.boolean(),
              source: z.literal("defineMetaRaw"),
            })
            .meta({ id: "TestRawMetadatagettsResponse" }),
        },
      },
    },
  },
});

export default defineEventHandler(() => ({
  ok: true,
  source: "defineMetaRaw" as const,
}));
