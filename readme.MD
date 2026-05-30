# nitro-spec

> **Note:** This is a toy project for fun and experimentation. Not intended for production use.

### Installing

Create the OpenAPI plugin at `server/plugins/nitroSpec.ts`:

```typescript
import "virtual:nitro-spec/preload";
import { createNitroSpecPlugin } from "nitro-spec";
import { definePlugin } from "nitro";

export default definePlugin((app) => {
  createNitroSpecPlugin({
    app,
    baseUrl: "/api",
    title: "Nitro API",
    description: "OpenAPI documentation for the backend",
    version: "1.0.0",
  });
});
```

**Important:** The `import "virtual:nitro-spec/preload";` line must be included at the top of your plugin file to properly initialize the nitro-spec plugin system.

### Your First Route

Create `server/routes/users.get.ts`:

```typescript
import { defineMeta, z } from "nitro-spec";

// Define reusable schemas
const UserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
    createdAt: z.string().datetime(),
  })
  .meta({ id: "User" });

// Type-safe route definition
const { defineEventHandler } = defineMeta({
  operationId: "getUsers",
  title: "List Users",
  description: "Retrieve all users with optional filtering",
  query: z.object({
    search: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    offset: z.coerce.number().min(0).default(0),
  }),
  response: z
    .object({
      users: z.array(UserSchema),
      total: z.number(),
      hasMore: z.boolean(),
    })
    .meta({ id: "UserListResponse" }),
});

// Fully typed handler with automatic validation
export default defineEventHandler(async (event, params, query, body) => {
  // query is typed: { search?: string, limit: number, offset: number }
  const users = await getUsersFromDatabase(query);

  return {
    users,
    total: users.length,
    hasMore: query.offset + query.limit < users.length,
  };
});
````

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

## 🛡️ Advanced Schema Validation

### Path Parameters & Request Bodies

```typescript
// server/routes/users/[id].patch.ts
const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
  })
  .meta({ id: "UpdateUserRequest" });

const { defineEventHandler } = defineMeta({
  operationId: "updateUser",
  title: "Update User",
  path: z.object({
    id: z.string().uuid(), // Validates route parameter
  }),
  body: UpdateUserSchema,
  responses: {
    200: UserSchema,
    404: z.object({ message: z.string() }).meta({ id: "NotFound" }),
    400: z
      .object({ message: z.string(), errors: z.array(z.string()) })
      .meta({ id: "ValidationError" }),
  },
});

export default defineEventHandler(async (event, params, query, body) => {
  // params.id is typed as string and validated as UUID
  // body is typed as Partial<UpdateUserRequest> and validated

  const user = await updateUser(params.id, body);

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  return user;
});
```

## 🔧 Middleware System

You can define your own middleware functions and use them with `defineMeta`. Custom middleware enables authentication, logging, validation, and more.

```typescript
import { defineMeta } from "nitro-spec";

// Example custom middleware
const auditMiddleware = {
  type: "custom",
  name: "audit-logger",
  handler: async (event) => {
    // Custom audit logic
    const userId = event.context.user?.id;
    const action = `${event.node.req.method} ${event.node.req.url}`;
    await logAuditEvent({ userId, action, timestamp: new Date() });
  },
};

const { defineEventHandler } = defineMeta({
  operationId: "getProtectedData",
  middleware: [auditMiddleware],
  response: z.object({ data: z.string() }).meta({ id: "ProtectedData" }),
});
```

## 📖 Automatic Documentation

Once configured, your API documentation is automatically available:

- **Scalar UI**: `http://localhost:3000/api/openapi`
- **ReDoc**: `http://localhost:3000/api/openapi/redoc`
- **JSON Spec**: `http://localhost:3000/api/openapi.json`
- **YAML Spec**: `http://localhost:3000/api/openapi.yaml`

## 🏗️ Architecture

### Monorepo Structure

```
nitro-spec/
├── packages/
│   └── nitro-spec/              # Core library
└── playground/
    └── nitro-app/              # Example application
```

### Build-Time Magic

- **Route scanning**: Automatically extracts method and path from file structure
- **Type generation**: Creates TypeScript definitions from Zod schemas
- **OpenAPI compilation**: Generates specification during build process
- **Tree-shaking**: Only includes used middleware and schemas

## 🎯 Best Practices

### Schema Organization

```typescript
// schemas/user.ts - Centralized schema definitions
export const UserSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
  })
  .meta({ id: "User" });

export const CreateUserSchema = UserSchema.omit({ id: true }).meta({
  id: "CreateUser",
});
export const UpdateUserSchema = CreateUserSchema.partial().meta({
  id: "UpdateUser",
});
```

### Error Handling

```typescript
// utils/errors.ts - Consistent error schemas
export const ErrorSchemas = {
  400: z
    .object({ message: z.string(), field: z.string().optional() })
    .meta({ id: "BadRequest" }),
  401: z.object({ message: z.string() }).meta({ id: "Unauthorized" }),
  404: z.object({ message: z.string() }).meta({ id: "NotFound" }),
  500: z.object({ error: z.string() }).meta({ id: "ServerError" }),
};
```

## 📚 Ecosystem
