import { defineMeta } from "nitro-spec";
import { createResponseFormatTransformer } from "nitro-spec";
import { z } from "nitro-spec";

// Schema definitions
const CreateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    age: z
      .number()
      .min(18, "Must be at least 18 years old")
      .max(100, "Must be under 100 years old"),
    role: z.enum(["user", "admin", "moderator"]).default("user"),
  })
  .meta({ id: "PagesUsersposttsCreateUser" });

const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
    role: z.enum(["user", "admin", "moderator"]),
    createdAt: z.string().datetime(),
  })
  .meta({ id: "PagesUsersposttsUser" });

// Multiple response schemas for different status codes
const responseSchemas = {
  201: UserSchema,
  400: z
    .object({
      statusCode: z.literal(400),
      statusMessage: z.literal("Bad Request"),
      message: z.string(),
      errors: z.array(z.string()).optional(),
    })
    .meta({ id: "PagesUsersposttsValidationError" }),
  409: z
    .object({
      statusCode: z.literal(409),
      statusMessage: z.literal("Conflict"),
      message: z.string(),
    })
    .meta({ id: "PagesUsersposttsConflictError" }),
};

// Validation middleware
const validationMiddleware = {
  type: "custom" as const,
  name: "validation",
  description: "Validates user data",
  handler: async (event: any) => {
    // Additional validation logic can go here
    console.log(`Validating user creation request`);
  },
};

const { defineEventHandler } = defineMeta({
  operationId: "createUser",
  title: "Create User",
  description: "Create a new user account",
  summary: "Create user",
  body: CreateUserSchema,
  response: responseSchemas,
  middleware: [validationMiddleware],
  transformResponse: createResponseFormatTransformer("envelope"),
});

// Mock database
let userCounter = 5;
const existingEmails = new Set([
  "john@example.com",
  "jane@example.com",
  "bob@example.com",
]);

export default defineEventHandler(async (event, params, query, body) => {
  // Check if email already exists
  if (existingEmails.has(body.email)) {
    throw new Error(`User with email ${body.email} already exists`);
  }

  // Simulate validation errors (for demo purposes)
  if (body.name.toLowerCase().includes("invalid")) {
    throw new Error("Name cannot contain 'invalid'");
  }

  // Create new user
  const newUser = {
    id: String(userCounter++),
    name: body.name,
    email: body.email,
    age: body.age,
    role: body.role,
    createdAt: new Date().toISOString(),
  };

  // Add to existing emails set
  existingEmails.add(body.email);

  // Simulate async database operation
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Set the response status code to 201 for created
  event.node.res.statusCode = 201;

  return newUser;
});
