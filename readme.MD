# nitro-spec

<div align="center">

**🚀 Type-safe OpenAPI route definitions for H3/Nitro with Zod schema validation**

[![npm version](https://img.shields.io/npm/v/nitro-spec.svg)](https://www.npmjs.com/package/nitro-spec)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-v4-green.svg)](https://zod.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

**nitro-spec** is a TypeScript-first library that brings type safety and automatic OpenAPI documentation to H3/Nitro applications. Define your routes once with Zod schemas and get runtime validation, compile-time type safety, and beautiful API documentation automatically.

## ✨ Features

- 🔒 **Type-safe route definitions** with full TypeScript support
- 📝 **Automatic OpenAPI 3.1 generation** from Zod schemas
- 🛡️ **Runtime validation** for requests and responses
- 🗂️ **File-based routing** with automatic path extraction
- 🔧 **Rich middleware system** for auth, validation, and security
- 📚 **Auto-generated documentation** with Swagger UI and ReDoc
- ⚡ **Build-time optimizations** with unplugin architecture
- 🎯 **Zero configuration** - works out of the box

## 🚀 Quick Start

### Installation

```bash
# Core library
npm install nitro-spec zod @asteasolutions/zod-to-openapi

# Optional: Comprehensive middleware collection
npm install @nitro-spec/middlewares
```

### Configuration

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

Create the OpenAPI plugin at `server/plugins/nitroSpec.ts`:

```typescript
import { createNitroSpecPlugin } from "nitro-spec";

export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    title: "My API",
    description: "Type-safe API with automatic documentation",
    baseUrl: "/api",
  });
});
```

### Your First Route

Create `server/routes/users.get.ts`:

```typescript
import { defineMeta } from "nitro-spec";
import { z } from "zod";

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

> **Note:** `@nitro-spec/middlewares` package is still in development and not yet stable.

### Custom Middleware Example

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

### Custom Middleware

```typescript
import { createCustomMiddleware } from "@nitro-spec/middlewares";

const auditMiddleware = createCustomMiddleware(
  "audit-logger",
  async (event) => {
    const userId = event.context.user?.id;
    const action = `${event.node.req.method} ${event.node.req.url}`;

    await logAuditEvent({ userId, action, timestamp: new Date() });
  },
  "Logs user actions for compliance",
);
```

## 📖 Automatic Documentation

Once configured, your API documentation is automatically available:

- **Swagger UI**: `http://localhost:3000/api/openapi`
- **ReDoc**: `http://localhost:3000/api/openapi/redoc`
- **JSON Spec**: `http://localhost:3000/api/openapi.json`
- **YAML Spec**: `http://localhost:3000/api/openapi.yaml`

## 🏗️ Architecture

### Monorepo Structure

```
nitro-spec/
├── packages/
│   ├── nitro-spec/              # Core library
│   └── nitro-spec-middlewares/  # Middleware collection
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

### Reusable Middleware Stack

```typescript
// middleware/common.ts
export const commonMiddleware = [
  createLoggingMiddleware("api-logger"),
  createCORSMiddleware({ origin: process.env.ALLOWED_ORIGINS?.split(",") }),
  createRateLimitMiddleware({ windowMs: 60000, maxRequests: 100 }),
];
```

## 📚 Ecosystem

- **Core**: `nitro-spec` - Route definition and OpenAPI generation
- **Middleware**: `@nitro-spec/middlewares` - Authentication, validation, security
- **Compatible with**: H3, Nitro, Nuxt 3, Analog

## 🛠️ Available Middleware

| Category       | Middleware                        | Description                   |
| -------------- | --------------------------------- | ----------------------------- |
| **Auth**       | `createJWTAuthMiddleware`         | JWT token validation          |
| **Auth**       | `createBasicAuthMiddleware`       | Basic HTTP authentication     |
| **Auth**       | `createAPIKeyMiddleware`          | API key validation            |
| **Security**   | `createCORSMiddleware`            | Cross-origin resource sharing |
| **Security**   | `createRateLimitMiddleware`       | Request rate limiting         |
| **Security**   | `createSecurityHeadersMiddleware` | Security headers (Helmet)     |
| **Validation** | `createRequestSizeValidator`      | Payload size limits           |
| **Validation** | `createContentTypeValidator`      | Content-type validation       |
| **Utils**      | `createLoggingMiddleware`         | Request/response logging      |
| **Utils**      | `createCustomMiddleware`          | Custom middleware wrapper     |

## 🆕 Migration from v7

If you're upgrading from `@asteasolutions/zod-to-openapi` v7:

```typescript
// Before (v7)
const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi("User");

// After (v8)
const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .meta({ id: "User" });
```

Use our migration script: `node scripts/update-to-meta.js`

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) and feel free to submit issues and pull requests.

## 📄 License

MIT © [nitro-spec contributors](LICENSE)

---

<div align="center">

**Built with ❤️ for the TypeScript and Nitro communities**

[Documentation](USAGE.md) • [Troubleshooting](TROUBLESHOOTING.md) • [Examples](playground/nitro-app)

</div>
