import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case 1: Problematic schema with field-level .meta() param metadata
const ProblematicQuerySchema = z
  .object({
    sessionToken: z.string().meta({
      param: {
        name: "sessionToken",
        description: "Session token for authentication",
      },
      description: "User session token",
    }),
    userId: z.string().meta({
      param: {
        name: "userId",
        description: "User identifier",
      },
    }),
    includeDetails: z.coerce
      .boolean()
      .default(false)
      .meta({
        param: {
          name: "includeDetails",
          description: "Whether to include detailed information",
        },
      }),
  })
  .meta({ id: "TestOpenapi-paramsgettsProblematicQuery" });

const { defineEventHandler } = defineMeta({
  operationId: "testOpenApiParams",
  title: "Test OpenAPI Parameter Fix",
  description:
    "This route tests the automatic fixing of problematic OpenAPI parameter metadata",
  query: ProblematicQuerySchema,
  response: z
    .object({
      message: z.string(),
      receivedParams: z.object({
        sessionToken: z.string(),
        userId: z.string(),
        includeDetails: z.boolean(),
      }),
      fixApplied: z.boolean(),
    })
    .meta({ id: "TestOpenapi-paramsgettsOpenApiParamsTestResponse" }),
});

export default defineEventHandler(async (event, params, query, body) => {
  return {
    message: "OpenAPI parameter metadata was automatically fixed!",
    receivedParams: {
      sessionToken: query.sessionToken,
      userId: query.userId,
      includeDetails: query.includeDetails,
    },
    fixApplied: true,
  };
});
