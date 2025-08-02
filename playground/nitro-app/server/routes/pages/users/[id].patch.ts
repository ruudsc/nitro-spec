import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Schema definitions
const UserParamsSchema = z
  .object({
    id: z.string().min(1, "User ID is required"),
  })
  .meta({ id: "PagesUsersIdpatchtsUserParams" });

const UpdateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    age: z.number().min(18).max(100).optional(),
    role: z.enum(["user", "admin", "moderator"]).optional(),
  })
  .meta({ id: "PagesUsersIdpatchtsUpdateUser" });

const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
    role: z.enum(["user", "admin", "moderator"]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "PagesUsersIdpatchtsUser" });

// Audit logging middleware
const auditMiddleware = {
  type: "custom" as const,
  name: "audit",
  description: "Logs user modifications for audit trail",
  handler: async (event: any) => {
    const timestamp = new Date().toISOString();
    const userAgent = event.node.req.headers["user-agent"] || "unknown";
    console.log(`[AUDIT ${timestamp}] User update attempt from ${userAgent}`);
  },
};

const { defineEventHandler } = defineMeta({
  operationId: "updateUser",
  title: "Update User",
  description: "Update an existing user's information",
  summary: "Update user",
  path: UserParamsSchema,
  body: UpdateUserSchema,
  response: UserSchema,
  middleware: [auditMiddleware],
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
      updatedAt: "2024-01-01T00:00:00Z",
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
      updatedAt: "2024-01-02T00:00:00Z",
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
      updatedAt: "2024-01-03T00:00:00Z",
    },
  ],
]);

export default defineEventHandler(async (event, params, query, body) => {
  const { id } = params;

  // Check if user exists
  const existingUser = mockUsers.get(id);
  if (!existingUser) {
    throw new Error(`User with ID ${id} not found`);
  }

  // Validate that email is unique (if provided)
  if (body.email && body.email !== existingUser.email) {
    const emailExists = Array.from(mockUsers.values()).some(
      (user) => user.id !== id && user.email === body.email
    );
    if (emailExists) {
      throw new Error(`Email ${body.email} is already in use`);
    }
  }

  // Create updated user object
  const updatedUser = {
    ...existingUser,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  // Update in mock database
  mockUsers.set(id, updatedUser);

  // Simulate async database operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  return updatedUser;
});
