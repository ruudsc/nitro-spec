import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case 4: Mixed field metadata scenarios
const MixedQuerySchema = z
  .object({
    // Field with problematic .meta() param metadata (should be fixed)
    token: z.string().meta({
      param: {
        name: "token",
        description: "Authentication token",
      },
      description: "User auth token",
    }),

    // Field with safe .meta() metadata (should be preserved)
    userId: z.string().uuid().meta({
      description: "User identifier (UUID format)",
    }),

    // Field with .describe() (should work fine)
    includeMetadata: z.coerce
      .boolean()
      .default(false)
      .describe("Include metadata in response"),

    // Field with no metadata (should work fine)
    format: z.enum(["json", "xml", "csv"]).default("json"),

    // Complex field with problematic metadata
    filters: z
      .string()
      .transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      })
      .meta({
        param: {
          name: "filters",
          description: "JSON string of filter criteria",
        },
        description: "Filter criteria as JSON string",
      }),
  })
  .meta({ id: "TestMixed-metadatagettsMixedQuerySchema" });

const { defineEventHandler } = defineMeta({
  operationId: "testMixedFieldMetadata",
  title: "Test Mixed Field Metadata Scenarios",
  description: "Tests a mix of problematic and safe field metadata scenarios",
  query: MixedQuerySchema,
  response: z
    .object({
      message: z.string(),
      parsedQuery: z.object({
        token: z.string(),
        userId: z.string(),
        includeMetadata: z.boolean(),
        format: z.string(),
        filters: z.any(),
      }),
      metadataProcessing: z.object({
        tokenFixed: z.boolean(),
        userIdPreserved: z.boolean(),
        includeMetadataWorked: z.boolean(),
        formatWorked: z.boolean(),
        filtersFixed: z.boolean(),
      }),
    })
    .meta({ id: "TestMixed-metadatagettsMixedFieldTestResponse" }),
});

export default defineEventHandler(async (event, params, query, body) => {
  const { token, userId, includeMetadata, format, filters } = query;

  return {
    message: "Mixed field metadata test completed successfully!",
    parsedQuery: {
      token,
      userId,
      includeMetadata,
      format,
      filters,
    },
    metadataProcessing: {
      tokenFixed: true, // token had problematic param metadata
      userIdPreserved: true, // userId had safe metadata
      includeMetadataWorked: true, // used .describe()
      formatWorked: true, // no metadata
      filtersFixed: true, // filters had problematic param metadata
    },
  };
});
