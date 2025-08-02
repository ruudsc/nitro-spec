import { defineMeta } from "nitro-spec";
import { z } from "zod";

// Schema definitions
const UserParamsSchema = z
  .object({
    id: z.string().min(1, "User ID is required"),
  })
  .openapi("UserParams");

const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
    role: z.enum(["user", "admin", "moderator"]),
    createdAt: z.string().datetime(),
    lastLogin: z.string().datetime().optional(),
  })
  .openapi("User");

const NotFoundErrorSchema = z
  .object({
    statusCode: z.literal(404),
    statusMessage: z.literal("Not Found"),
    message: z.string(),
  })
  .openapi("NotFoundError");

// Multiple response schemas
const responseSchemas = {
  200: UserSchema,
  404: NotFoundErrorSchema,
};

// Rate limiting middleware example
const rateLimitMiddleware = {
  type: "custom" as const,
  name: "rate-limit",
  description: "Simple rate limiting",
  handler: async (event: any) => {
    // Simple rate limiting simulation
    const now = Date.now();
    const userAgent = event.node.req.headers["user-agent"] || "unknown";

    // In a real app, you'd use Redis or a proper rate limiting solution
    console.log(
      `Rate limit check for ${userAgent} at ${new Date(now).toISOString()}`
    );
  },
};

const { defineEventHandler } = defineMeta({
  operationId: "getUserById",
  title: "Get User by ID",
  description: "Retrieve a specific user by their unique identifier",
  summary: "Get user",
  path: UserParamsSchema,
  response: UserSchema,
  middleware: [rateLimitMiddleware],
});

// Mock database
const mockUsers = new Map([
  [
    "1",
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      age: 25,
      role: "user" as const,
      createdAt: "2024-01-01T00:00:00Z",
      lastLogin: "2024-08-01T10:30:00Z",
    },
  ],
  [
    "2",
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      age: 30,
      role: "admin" as const,
      createdAt: "2024-01-02T00:00:00Z",
      lastLogin: "2024-08-01T09:15:00Z",
    },
  ],
  [
    "3",
    {
      id: "3",
      name: "Bob Wilson",
      email: "bob@example.com",
      age: 28,
      role: "moderator" as const,
      createdAt: "2024-01-03T00:00:00Z",
    },
  ],
  [
    "4",
    {
      id: "4",
      name: "Alice Brown",
      email: "alice@example.com",
      age: 32,
      role: "user" as const,
      createdAt: "2024-01-04T00:00:00Z",
      lastLogin: "2024-07-30T14:22:00Z",
    },
  ],
]);

export default defineEventHandler(async (event, params, query, body) => {
  const { id } = params;

  // Simulate async database lookup
  await new Promise((resolve) => setTimeout(resolve, 50));

  const user = mockUsers.get(id);

  if (!user) {
    // Throw an error instead of returning error object
    throw new Error(`User with ID ${id} not found`);
  }

  return user;
});
