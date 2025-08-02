# Nitro-Spec New Features Guide

This document demonstrates the four new advanced features that have been added to nitro-spec.

## 1. Response Unions - Multiple Response Types

You can now define multiple response types based on different status codes:

```typescript
import { defineMeta } from "nitro-spec";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export default defineMeta(
  {
    method: "GET",
    summary: "Get user by ID",
    responses: {
      200: UserSchema,
      404: z.object({
        error: z.string(),
        code: z.literal("USER_NOT_FOUND"),
      }),
      500: z.object({
        error: z.string(),
        code: z.literal("INTERNAL_ERROR"),
      }),
    },
  },
  async (event) => {
    const userId = getRouterParam(event, "id");

    // Your handler logic here
    if (!userId) {
      return {
        status: 404,
        body: { error: "User not found", code: "USER_NOT_FOUND" },
      };
    }

    return {
      status: 200,
      body: { id: userId, name: "John Doe", email: "john@example.com" },
    };
  }
);
```

## 2. Better Error Handling

Pre-built error schemas for common HTTP status codes with custom validation:

```typescript
import { defineMeta } from "nitro-spec";
import {
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  ValidationErrorSchema,
  TooManyRequestsErrorSchema,
  InternalServerErrorSchema,
} from "nitro-spec/utils/errorSchemas";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18),
});

export default defineMeta(
  {
    method: "POST",
    summary: "Create a new user",
    body: CreateUserSchema,
    responses: {
      201: z.object({
        id: z.string(),
        message: z.string(),
      }),
      400: BadRequestErrorSchema,
      401: UnauthorizedErrorSchema,
      422: ValidationErrorSchema,
      429: TooManyRequestsErrorSchema,
      500: InternalServerErrorSchema,
    },
  },
  async (event) => {
    // Your validation and creation logic here
    return {
      status: 201,
      body: { id: "123", message: "User created successfully" },
    };
  }
);
```

## 3. Middleware Support

Authentication, rate limiting, and CORS middleware:

```typescript
import { defineMeta } from "nitro-spec";
import {
  createJWTMiddleware,
  createRateLimitMiddleware,
  createCORSMiddleware,
} from "nitro-spec/utils/middleware";
import { z } from "zod";

// Define middleware
const authMiddleware = createJWTMiddleware({
  secretKey: "your-secret-key",
  algorithms: ["HS256"],
});

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

const corsMiddleware = createCORSMiddleware({
  origin: ["https://example.com"],
  methods: ["GET", "POST"],
  credentials: true,
});

export default defineMeta(
  {
    method: "GET",
    summary: "Protected endpoint with middleware",
    middleware: [corsMiddleware, rateLimitMiddleware, authMiddleware],
    responses: {
      200: z.object({
        message: z.string(),
        user: z.object({
          id: z.string(),
          email: z.string(),
        }),
      }),
      401: UnauthorizedErrorSchema,
      429: TooManyRequestsErrorSchema,
    },
  },
  async (event) => {
    // Access authenticated user from middleware
    const user = event.context.user;

    return {
      status: 200,
      body: {
        message: "Access granted",
        user: { id: user.id, email: user.email },
      },
    };
  }
);
```

## 4. Response Transformation

Transform responses with pagination, filtering, and caching:

```typescript
import { defineMeta } from "nitro-spec";
import {
  createPaginationTransformer,
  createFieldFilterTransformer,
  createCacheTransformer,
  composeTransformers,
} from "nitro-spec/utils/transformers";
import { z } from "zod";

// Define transformers
const paginationTransformer = createPaginationTransformer({
  defaultLimit: 10,
  maxLimit: 100,
});

const fieldFilterTransformer = createFieldFilterTransformer({
  allowedFields: ["id", "name", "email", "createdAt"],
});

const cacheTransformer = createCacheTransformer({
  ttl: 300, // 5 minutes
  key: (event) => `users:${getQuery(event).page || 1}`,
});

// Compose multiple transformers
const combinedTransformer = composeTransformers([
  cacheTransformer,
  paginationTransformer,
  fieldFilterTransformer,
]);

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export default defineMeta(
  {
    method: "GET",
    summary: "Get users with transformation",
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      fields: z.string().optional(),
    }),
    responses: {
      200: z.object({
        data: z.array(UserSchema),
        pagination: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          totalPages: z.number(),
        }),
      }),
    },
    transformResponse: combinedTransformer,
  },
  async (event) => {
    // Your data fetching logic
    const users = [
      {
        id: "1",
        name: "John",
        email: "john@example.com",
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        name: "Jane",
        email: "jane@example.com",
        createdAt: "2024-01-02",
      },
    ];

    return {
      status: 200,
      body: {
        data: users,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
    };
  }
);
```

## Combined Example

Here's a complete example using all four features together:

```typescript
import { defineMeta } from "nitro-spec";
import { z } from "zod";
import {
  createJWTMiddleware,
  createRateLimitMiddleware,
} from "nitro-spec/utils/middleware";
import {
  createPaginationTransformer,
  createCacheTransformer,
  composeTransformers,
} from "nitro-spec/utils/transformers";
import {
  UnauthorizedErrorSchema,
  TooManyRequestsErrorSchema,
  ValidationErrorSchema,
} from "nitro-spec/utils/errorSchemas";

// Middleware setup
const authMiddleware = createJWTMiddleware({
  secretKey: process.env.JWT_SECRET || "fallback-secret",
  algorithms: ["HS256"],
});

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

// Response transformation
const responseTransformer = composeTransformers([
  createCacheTransformer({
    ttl: 300,
    key: (event) => `products:store:${getRouterParam(event, "storeId")}`,
  }),
  createPaginationTransformer({
    defaultLimit: 20,
    maxLimit: 100,
  }),
]);

// Schemas
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  inStock: z.boolean(),
});

const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  category: z.string(),
  inStock: z.boolean().default(true),
});

export default defineMeta(
  {
    method: "POST",
    summary: "Create product in store",
    description:
      "Creates a new product in the specified store with authentication and rate limiting",
    tags: ["products", "stores"],
    middleware: [rateLimitMiddleware, authMiddleware],
    params: z.object({
      storeId: z.string().uuid(),
    }),
    body: CreateProductSchema,
    responses: {
      201: z.object({
        success: z.literal(true),
        data: ProductSchema,
        message: z.string(),
      }),
      400: ValidationErrorSchema,
      401: UnauthorizedErrorSchema,
      429: TooManyRequestsErrorSchema,
    },
    transformResponse: responseTransformer,
  },
  async (event) => {
    const storeId = getRouterParam(event, "storeId");
    const body = await readBody(event);
    const user = event.context.user; // Set by JWT middleware

    // Your business logic here
    const newProduct = {
      id: crypto.randomUUID(),
      ...body,
    };

    return {
      status: 201,
      body: {
        success: true,
        data: newProduct,
        message: "Product created successfully",
      },
    };
  }
);
```

## Key Benefits

1. **Type Safety**: All responses, errors, and transformations are fully typed
2. **OpenAPI Integration**: Automatically generates comprehensive OpenAPI documentation
3. **Middleware Composability**: Stack multiple middleware functions with proper typing
4. **Response Flexibility**: Support for different response types based on status codes
5. **Error Standardization**: Consistent error schemas across your API
6. **Performance**: Built-in caching and response transformation capabilities

All features work seamlessly together and maintain full TypeScript support while generating accurate OpenAPI specifications.
