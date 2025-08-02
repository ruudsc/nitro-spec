import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case 5: Schema extension and composition
const BaseQuerySchema = z
  .object({
    apiKey: z.string().meta({
      param: {
        name: "apiKey",
        description: "API authentication key",
      },
    }),
    version: z.enum(["v1", "v2"]).default("v1"),
  })
  .meta({ id: "TestSchema-compositiongettsBaseQuery" });

// Extended schema with additional fields
const ExtendedQuerySchema = BaseQuerySchema.extend({
  debug: z.coerce
    .boolean()
    .default(false)
    .meta({
      param: {
        name: "debug",
        description: "Enable debug mode",
      },
    }),
  timeout: z.coerce.number().min(1000).max(30000).default(5000),
}).meta({ id: "TestSchema-compositiongettsExtendedQuery" });

// Composed schema with pick/omit
const ComposedQuerySchema = z
  .object({
    sessionId: z
      .string()
      .uuid()
      .meta({
        param: {
          name: "sessionId",
          description: "Session identifier",
        },
      }),
  })
  .merge(
    ExtendedQuerySchema.pick({
      version: true,
      debug: true,
    })
  )
  .meta({ id: "TestSchema-compositiongettsComposedQuery" });

const DataResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.any(),
    metadata: z.object({
      version: z.string(),
      debug: z.boolean(),
      processingTime: z.number(),
      sessionId: z.string().optional(),
      apiKey: z.string().optional(),
    }),
  })
  .meta({ id: "TestSchema-compositiongettsDataResponse" });

const { defineEventHandler } = defineMeta({
  operationId: "testSchemaComposition",
  title: "Test Schema Extension and Composition",
  description: "Tests complex schema patterns: extend, merge, pick, omit",
  query: ComposedQuerySchema,
  response: DataResponseSchema,
});

export default defineEventHandler(async (event, params, query, body) => {
  const startTime = Date.now();
  const { sessionId, version, debug } = query;

  // Simulate some processing
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

  const processingTime = Date.now() - startTime;

  return {
    success: true,
    data: {
      message: "Schema composition test successful",
      timestamp: new Date().toISOString(),
      randomValue: Math.random(),
    },
    metadata: {
      version,
      debug,
      processingTime,
      sessionId,
    },
  };
});
