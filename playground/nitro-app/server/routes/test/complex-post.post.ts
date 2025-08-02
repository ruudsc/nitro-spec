import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case 6: POST request with complex validation
const CreatePostSchema = z
  .object({
    title: z.string().min(1).max(200),
    content: z.string().min(10).max(10000),
    tags: z.array(z.string()).min(1).max(10),
    category: z.enum(["tech", "business", "lifestyle", "science"]),
    publishAt: z.string().datetime().optional(),
    metadata: z
      .object({
        author: z.string().meta({
          description: "Author name (safe metadata)",
        }),
        priority: z.coerce
          .number()
          .min(1)
          .max(5)
          .default(3)
          .meta({
            param: {
              name: "priority",
              description: "Post priority level",
            },
          }),
        featured: z.coerce.boolean().default(false),
      })
      .optional(),
  })
  .meta({ id: "TestComplex-postposttsCreatePostRequest" });

const PostResponseSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    publishAt: z.string().datetime().nullable(),
    metadata: z
      .object({
        author: z.string(),
        priority: z.number(),
        featured: z.boolean(),
      })
      .nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "TestComplex-postposttsPostResponse" });

const { defineEventHandler } = defineMeta({
  operationId: "testComplexPostValidation",
  title: "Test Complex POST Validation",
  description: "Tests complex request body validation with nested objects",
  body: CreatePostSchema,
  response: PostResponseSchema,
});

export default defineEventHandler(async (event, params, query, body) => {
  const { title, content, tags, category, publishAt, metadata } = body;

  // Simulate post creation
  const now = new Date().toISOString();
  const postId = `post-${Date.now()}`;

  return {
    id: postId,
    title,
    content,
    tags,
    category,
    publishAt: publishAt || null,
    metadata: metadata || null,
    createdAt: now,
    updatedAt: now,
  };
});
