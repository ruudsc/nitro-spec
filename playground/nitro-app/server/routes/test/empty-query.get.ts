import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case: Empty query schema with .meta() metadata
const EmptyQuerySchema = z
  .object({
    // Empty object - this used to cause "Missing parameter data" error
  })
  .meta({ id: "TestEmpty-querygettsEmptyQuery" });

// Test case: Query schema that becomes empty when fields are commented out
const ConditionalQuerySchema = z
  .object({
    // If all fields are commented out, this becomes an empty object
    // userId: z.string(),
    // type: z.enum(["life", "savings"]).optional(),
  })
  .meta({ id: "TestEmpty-querygettsConditionalQuery" });

const GoalSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(["life", "savings"]),
    targetAmount: z.number().positive(),
    currentAmount: z.number().min(0).default(0),
    targetDate: z.string().datetime().optional(),
  })
  .meta({ id: "TestEmpty-querygettsGoal" });

const PaginationResponse = z
  .object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  })
  .meta({ id: "TestEmpty-querygettsPaginationResponse" });

const GoalsListResponse = z
  .object({
    goals: z.array(GoalSchema),
    pagination: PaginationResponse,
  })
  .meta({ id: "TestEmpty-querygettsGoalsListResponse" });

// Test with empty query schema
const { defineEventHandler: defineEmptyQueryHandler } = defineMeta({
  operationId: "testEmptyQuery",
  title: "Test Empty Query Schema",
  description: "Tests handling of empty query schemas with OpenAPI metadata",
  query: EmptyQuerySchema,
  response: GoalsListResponse,
});

// Test with conditional query schema (currently empty)
const { defineEventHandler: defineConditionalQueryHandler } = defineMeta({
  operationId: "testConditionalQuery",
  title: "Test Conditional Query Schema",
  description: "Tests handling of conditionally empty query schemas",
  query: ConditionalQuerySchema,
  response: GoalsListResponse,
});

// Export the empty query test
export const emptyQueryTest = defineEmptyQueryHandler(
  async (event, params, query, body) => {
    // Mock data since no query parameters are expected
    return {
      goals: [
        {
          id: "goal-1",
          title: "Emergency Fund",
          description: "Build up emergency savings",
          type: "savings" as const,
          targetAmount: 10000,
          currentAmount: 2500,
          targetDate: "2024-12-31T23:59:59Z",
        },
        {
          id: "goal-2",
          title: "Learn TypeScript",
          type: "life" as const,
          targetAmount: 1,
          currentAmount: 0.7,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    };
  }
);

// Export the conditional query test (default export)
export default defineConditionalQueryHandler(
  async (event, params, query, body) => {
    // Same mock data - no query parameters are processed since object is empty
    return {
      goals: [
        {
          id: "goal-3",
          title: "Travel Fund",
          description: "Save for vacation",
          type: "savings" as const,
          targetAmount: 5000,
          currentAmount: 1200,
          targetDate: "2025-06-01T00:00:00Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };
  }
);
