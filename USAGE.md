# nitro-spec Usage Guide

> **Note**: Starting from `@asteasolutions/zod-to-openapi` v8.0.0, we use Zod's native `.meta()` method instead of `.openapi()`. This provides better compatibility with Zod v4 and eliminates the need for `extendZodWithOpenApi()`.

**nitro-spec** is a TypeScript-first library for building type-safe, auto-documented Nitro APIs. It provides:

## 🚀 Quick Start

### 1. Installation

```bash
# Core library
npm install nitro-spec zod

# Middleware collection (optional)
npm install @nitro-spec/middlewares
```

### 2. Configure Nitro

Add the nitro-spec plugin to your `nitro.config.ts`:

```typescript
import { defineNitroConfig } from "nitropack/config";
import nitroSpec from "nitro-spec/rollup";

export default defineNitroConfig({
  srcDir: "server",
  rollupConfig: {
    plugins: [nitroSpec()],
  },
});
```

### 3. Setup OpenAPI Plugin

Create `server/plugins/nitroSpec.ts`:

```typescript
import { createNitroSpecPlugin } from "nitro-spec";

export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    title: "My API",
    description: "API documentation",
    baseUrl: "/api",
  });
});
```

### 4. Create Your First Route

Create `server/routes/users.get.ts`:

```typescript
import { defineMeta } from "nitro-spec";
import { z } from "zod";

const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  })
  .meta({ id: "User" });

const { defineEventHandler } = defineMeta({
  operationId: "getUsers",
  title: "List Users",
  description: "Get all users with optional filtering",
  query: z.object({
    search: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
  response: z
    .object({
      users: z.array(UserSchema),
      total: z.number(),
    })
    .meta({ id: "UserListResponse" }),
});

export default defineEventHandler(async (event, params, query, body) => {
  // query is fully typed: { search?: string, limit: number }
  const users = await getUsersFromDB(query);

  return {
    users,
    total: users.length,
  };
});
```

## 📂 File-Based Routing

Routes are automatically mapped from your file structure:

```
server/routes/
├── index.get.ts              → GET /
├── users.get.ts              → GET /users
├── users.post.ts             → POST /users
├── users/[id].get.ts         → GET /users/:id
├── users/[id].patch.ts       → PATCH /users/:id
├── api/v1/products.get.ts    → GET /api/v1/products
└── api/[...slug].get.ts      → GET /api/* (catch-all)
```

## 🛡️ Schema Validation

### Path Parameters

```typescript
// server/routes/users/[id].get.ts
const { defineEventHandler } = defineMeta({
  operationId: "getUserById",
  path: z.object({
    id: z.string().uuid(), // Validates route parameter
  }),
  response: UserSchema,
});

export default defineEventHandler(async (event, params, query, body) => {
  // params.id is typed as string and validated as UUID
  const user = await findUserById(params.id);
  return user;
});
```

### Request Body Validation

```typescript
// server/routes/users.post.ts
const CreateUserSchema = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().min(18).max(120),
  })
  .meta({ id: "CreateUserRequest" });

const { defineEventHandler } = defineMeta({
  operationId: "createUser",
  body: CreateUserSchema,
  response: UserSchema,
});

export default defineEventHandler(async (event, params, query, body) => {
  // body is fully typed and validated
  const user = await createUser(body);
  return user;
});
```

### Multiple Response Schemas

```typescript
const { defineEventHandler } = defineMeta({
  operationId: "getUser",
  responses: {
    200: UserSchema,
    404: z.object({ message: z.string() }).meta({ id: "NotFoundError" }),
    500: z.object({ error: z.string() }).meta({ id: "ServerError" }),
  },
});

export default defineEventHandler(async (event, params, query, body) => {
  const user = await findUser(params.id);

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  return user; // Validated against 200 schema
});
```

## 🔧 Middleware System

### Using Built-in Middleware

```typescript
import {
  createJWTAuthMiddleware,
  createRateLimitMiddleware,
  createLoggingMiddleware,
} from "@nitro-spec/middlewares";

const authMiddleware = createJWTAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  algorithm: "HS256",
});

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

const { defineEventHandler } = defineMeta({
  operationId: "getProtectedData",
  middleware: [
    createLoggingMiddleware("request-logger"),
    authMiddleware,
    rateLimitMiddleware,
  ],
  response: z.object({ data: z.string() }),
});
```

### Creating Custom Middleware

```typescript
import { createCustomMiddleware } from "@nitro-spec/middlewares";

const auditMiddleware = createCustomMiddleware(
  "audit-logger",
  async (event) => {
    const userId = event.context.user?.id;
    const action = `${event.node.req.method} ${event.node.req.url}`;

    await logAuditEvent({ userId, action, timestamp: new Date() });
  },
  "Logs all user actions for compliance"
);

const { defineEventHandler } = defineMeta({
  middleware: [authMiddleware, auditMiddleware],
  // ... rest of route definition
});
```

## 🎛️ Response Transformers

Transform responses automatically:

```typescript
import {
  createResponseFormatTransformer,
  createFieldFilterTransformer,
  composeTransformers,
} from "nitro-spec/transformers";

const { defineEventHandler } = defineMeta({
  operationId: "getUsers",
  query: z.object({
    fields: z.string().optional(), // ?fields=id,name,email
    format: z.enum(["envelope", "minimal"]).default("envelope"),
  }),
  response: z.array(UserSchema),
  transformResponse: composeTransformers(
    createFieldFilterTransformer(),
    createResponseFormatTransformer("envelope")
  ),
});

export default defineEventHandler(async (event, params, query, body) => {
  const users = await getUsers();

  // Response will be automatically:
  // 1. Filtered to requested fields
  // 2. Wrapped in envelope format: { success, statusCode, data, timestamp }
  return users;
});
```

## 🏗️ Advanced Patterns

### Cached Routes

```typescript
import { defineMeta } from "nitro-spec";

const { defineCachedEventHandler } = defineMeta({
  operationId: "getStats",
  response: z.object({
    totalUsers: z.number(),
    activeUsers: z.number(),
  }),
});

export default defineCachedEventHandler(
  async (event, params, query, body) => {
    // Expensive computation
    const stats = await calculateStats();
    return stats;
  },
  {
    maxAge: 60, // Cache for 60 seconds
    name: "stats-cache",
    group: "analytics",
  }
);
```

### Pagination Support

```typescript
const { defineEventHandler } = defineMeta({
  operationId: "getUsers",
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
  }),
  response: z.object({
    users: z.array(UserSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  }),
});

export default defineEventHandler(async (event, params, query, body) => {
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    getUsersPaginated({ offset, limit, search }),
    getTotalUsers({ search }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    },
  };
});
```

## 📖 Available Middleware

### Authentication

- `createJWTAuthMiddleware` - JWT token validation
- `createBasicAuthMiddleware` - Basic HTTP authentication
- `createAPIKeyMiddleware` - API key validation

### Validation

- `createRequestSizeValidator` - Request payload size limits
- `createContentTypeValidator` - Content-type validation
- `createSchemaValidator` - Additional Zod schema validation

### Security

- `createCORSMiddleware` - Cross-origin resource sharing
- `createRateLimitMiddleware` - Request rate limiting
- `createSecurityHeadersMiddleware` - Security headers

### Utilities

- `createLoggingMiddleware` - Request/response logging
- `createCustomMiddleware` - Custom middleware wrapper

## 🌐 OpenAPI Documentation

After setup, your API documentation is automatically available at:

- **Swagger UI**: `http://localhost:3000/api/openapi`
- **JSON Spec**: `http://localhost:3000/api/openapi.json`
- **YAML Spec**: `http://localhost:3000/api/openapi.yaml`

## 🔍 Error Handling

```typescript
import { createError } from "h3";

export default defineEventHandler(async (event, params, query, body) => {
  try {
    const user = await findUser(params.id);

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "User not found",
      });
    }

    return user;
  } catch (error) {
    if (error.statusCode) {
      throw error; // Re-throw H3 errors
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
```

## 🎯 Best Practices

### 1. Schema Organization

```typescript
// schemas/user.ts
export const UserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
  })
  .meta({ id: "User" });

export const CreateUserSchema = UserSchema.omit({ id: true }).openapi(
  "CreateUser"
);
export const UpdateUserSchema =
  CreateUserSchema.partial().meta({ id: "UpdateUser" });
```

### 2. Consistent Error Responses

```typescript
// utils/errors.ts
export const ErrorSchemas = {
  400: z
    .object({ message: z.string(), field: z.string().optional() })
    .meta({ id: "BadRequest" }),
  401: z.object({ message: z.string() }).meta({ id: "Unauthorized" }),
  404: z.object({ message: z.string() }).meta({ id: "NotFound" }),
  500: z.object({ error: z.string() }).meta({ id: "ServerError" }),
};

// In routes
const { defineEventHandler } = defineMeta({
  responses: {
    200: UserSchema,
    ...ErrorSchemas,
  },
});
```

### 3. Reusable Middleware

```typescript
// middleware/common.ts
export const commonMiddleware = [
  createLoggingMiddleware("api-logger"),
  createCORSMiddleware({ origin: true }),
  createRateLimitMiddleware({ windowMs: 60000, maxRequests: 100 }),
];

// In routes
const { defineEventHandler } = defineMeta({
  middleware: [...commonMiddleware, authMiddleware],
  // ...
});
```

## 🚀 Getting Started Checklist

- [ ] Install `nitro-spec` and `zod`
- [ ] Configure the rollup plugin in `nitro.config.ts`
- [ ] Create the OpenAPI plugin in `server/plugins/`
- [ ] Define your first route with `defineMeta`
- [ ] Add middleware from `@nitro-spec/middlewares` if needed
- [ ] View your API documentation at `/api/openapi`
- [ ] Add response transformers for consistent formatting
- [ ] Implement error handling with proper status codes

## 📚 Resources

- **Core Package**: `nitro-spec` - Route definition and OpenAPI generation
- **Middleware Collection**: `@nitro-spec/middlewares` - Authentication, validation, security
- **Documentation**: Auto-generated at `/api/openapi`
- **Type Safety**: Full TypeScript integration with Zod schemas

---

**nitro-spec** provides a complete solution for building type-safe, well-documented APIs with H3/Nitro. The combination of build-time transformations, runtime validation, and automatic documentation generation creates an excellent developer experience
