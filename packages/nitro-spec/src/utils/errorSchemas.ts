import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Ensure Zod is extended with OpenAPI functionality
extendZodWithOpenApi(z);

// Common error response schemas
export const ValidationErrorSchema = z.object({
  statusCode: z.literal(400),
  statusMessage: z.literal("Validation Error"),
  message: z.string(),
  data: z.any().optional(),
}).openapi("ValidationError");

export const UnauthorizedErrorSchema = z.object({
  statusCode: z.literal(401),
  statusMessage: z.literal("Unauthorized"),
  message: z.string(),
}).openapi("UnauthorizedError");

export const ForbiddenErrorSchema = z.object({
  statusCode: z.literal(403),
  statusMessage: z.literal("Forbidden"),
  message: z.string(),
}).openapi("ForbiddenError");

export const NotFoundErrorSchema = z.object({
  statusCode: z.literal(404),
  statusMessage: z.literal("Not Found"),
  message: z.string(),
}).openapi("NotFoundError");

export const UnprocessableEntityErrorSchema = z.object({
  statusCode: z.literal(422),
  statusMessage: z.literal("Unprocessable Entity"),
  message: z.string(),
  data: z.any().optional(),
}).openapi("UnprocessableEntityError");

export const InternalServerErrorSchema = z.object({
  statusCode: z.literal(500),
  statusMessage: z.literal("Internal Server Error"),
  message: z.string(),
}).openapi("InternalServerError");

export const TooManyRequestsErrorSchema = z.object({
  statusCode: z.literal(429),
  statusMessage: z.literal("Too Many Requests"),
  message: z.string(),
  retryAfter: z.number().optional(),
}).openapi("TooManyRequestsError");

// Helper function to create common error responses
export const createErrorResponses = (
  includeErrors: (400 | 401 | 403 | 404 | 422 | 429 | 500)[] = [400, 500]
) => {
  const responses: Record<number, any> = {};
  
  if (includeErrors.includes(400)) {
    responses[400] = ValidationErrorSchema;
  }
  if (includeErrors.includes(401)) {
    responses[401] = UnauthorizedErrorSchema;
  }
  if (includeErrors.includes(403)) {
    responses[403] = ForbiddenErrorSchema;
  }
  if (includeErrors.includes(404)) {
    responses[404] = NotFoundErrorSchema;
  }
  if (includeErrors.includes(422)) {
    responses[422] = UnprocessableEntityErrorSchema;
  }
  if (includeErrors.includes(429)) {
    responses[429] = TooManyRequestsErrorSchema;
  }
  if (includeErrors.includes(500)) {
    responses[500] = InternalServerErrorSchema;
  }
  
  return responses;
};
