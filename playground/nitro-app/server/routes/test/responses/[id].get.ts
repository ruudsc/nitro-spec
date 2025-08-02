import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case 2: Multiple response schemas by status code
const UserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    status: z.enum(["active", "inactive", "suspended"]),
  })
  .meta({ id: "TestResponsesIdgettsUser" });

const ErrorSchema = z
  .object({
    error: z.string(),
    code: z.string(),
    details: z.string().optional(),
  })
  .meta({ id: "TestResponsesIdgettsErrorResponse" });

const ValidationErrorSchema = z
  .object({
    message: z.string(),
    field: z.string(),
    value: z.any(),
  })
  .meta({ id: "TestResponsesIdgettsValidationError" });

const { defineEventHandler } = defineMeta({
  operationId: "testMultipleResponses",
  title: "Test Multiple Response Schemas",
  description: "Tests response validation with different status codes",
  path: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    forceError: z.coerce.number().optional(),
  }),
  response: UserSchema, // Default response
  responses: {
    200: UserSchema,
    400: ValidationErrorSchema,
    404: ErrorSchema,
    500: ErrorSchema,
  },
});

export default defineEventHandler(async (event, params, query, body) => {
  const { id } = params;
  const { forceError } = query;

  // Test different response scenarios
  if (forceError === 400) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        message: "Invalid user ID format",
        field: "id",
        value: id,
      },
    });
  }

  if (forceError === 404) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: {
        error: "User not found",
        code: "USER_NOT_FOUND",
        details: `No user exists with ID: ${id}`,
      },
    });
  }

  if (forceError === 500) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        error: "Database connection failed",
        code: "DB_ERROR",
      },
    });
  }

  // Return successful response (200)
  return {
    id,
    name: "Test User",
    email: "test@example.com",
    status: "active" as const,
  };
});
