import { defineMeta } from "nitro-spec";
import {
  createFieldFilterTransformer,
  createResponseFormatTransformer,
  composeTransformers,
} from "nitro-spec";
import { z } from "nitro-spec";

// Schema definitions
const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(18),
    role: z.enum(["user", "admin", "moderator"]),
    createdAt: z.string().datetime(),
  })
  .meta({ id: "PagesUsersgettsUser" });

const UsersQuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    role: z.enum(["user", "admin", "moderator"]).optional(),
    search: z.string().optional(),
  })
  .meta({ id: "PagesUsersgettsUsersQuery" });

const UsersResponseSchema = z
  .object({
    users: z.array(UserSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  })
  .meta({ id: "PagesUsersgettsUsersResponse" });

// Custom middleware example
const loggingMiddleware = {
  type: "custom" as const,
  name: "logging",
  description: "Logs incoming requests",
  handler: async (event: any) => {
    console.log(
      `[${new Date().toISOString()}] ${event.method} ${event.node.req.url}`
    );
  },
};

// Response transformer example
const responseTransformer = composeTransformers(
  createFieldFilterTransformer(),
  createResponseFormatTransformer("envelope")
);

const { defineEventHandler } = defineMeta({
  operationId: "getUsers",
  title: "Get Users",
  description: "Retrieve a paginated list of users with optional filtering",
  summary: "List users",
  query: UsersQuerySchema,
  response: UsersResponseSchema,
  middleware: [loggingMiddleware],
  transformResponse: responseTransformer,
});

// Mock data
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    age: 25,
    role: "user" as const,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    age: 30,
    role: "admin" as const,
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@example.com",
    age: 28,
    role: "moderator" as const,
    createdAt: "2024-01-03T00:00:00Z",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    age: 32,
    role: "user" as const,
    createdAt: "2024-01-04T00:00:00Z",
  },
];

export default defineEventHandler(async (event, params, query, body) => {
  const { page, limit, role, search } = query;

  // Filter users based on query parameters
  let filteredUsers = mockUsers;

  if (role) {
    filteredUsers = filteredUsers.filter((user) => user.role === role);
  }

  if (search) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    users: paginatedUsers,
    total: filteredUsers.length,
    page,
    limit,
  };
});
