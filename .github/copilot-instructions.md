# GitHub Copilot Instructions for nitro-spec

## Project Overview

**nitro-spec** is a TypeScript monorepo that provides type-safe OpenAPI route definition and middleware for H3/Nitro applications with Zod schema validation. The project consists of core functionality and a comprehensive middleware collection.

### Architecture & Ecosystem

This is a **pnpm workspace monorepo** using **Nx** for task orchestration. The codebase follows modern TypeScript patterns with dual ESM/CJS output and comprehensive type safety.

## Project Structure

```
nitro-spec/
├── packages/
│   ├── nitro-spec/           # Core library - route definition & OpenAPI generation
│   └── nitro-spec-middlewares/ # Middleware collection for auth, validation, security
├── playground/
│   └── nitro-app/            # Demo Nitro application with examples
└── [monorepo config files]
```

## Core Concepts & Patterns

### 1. Route Definition with `defineMeta`

The primary pattern for defining type-safe routes with OpenAPI generation:

```typescript
import { defineMeta } from "nitro-spec";
import { z } from "zod";

const { defineEventHandler } = defineMeta({
  operationId: "getUserById",
  title: "Get User",
  description: "Fetch user by ID",
  path: z.object({ id: z.string() }),
  query: z.object({ include: z.array(z.string()).optional() }),
  body: z.object({ name: z.string() }),
  response: z.object({ id: z.string(), name: z.string() }),
  middleware: [authMiddleware, validationMiddleware], // Optional middleware stack
});

export default defineEventHandler(async (event, params, query, body) => {
  // Type-safe handler with auto-validated params/query/body
  return { id: params.id, name: body.name };
});
```

**Key Points:**

- `defineMeta` wraps H3's `defineEventHandler` with OpenAPI generation
- Zod schemas provide runtime validation AND compile-time types
- Route params automatically extracted from file path (e.g., `[id].ts` → `{ id: string }`)
- Method extracted from filename (e.g., `users.post.ts` → `POST /users`)

### 2. Unplugin Architecture

The core uses unplugin for build-time transformations across bundlers (Vite, Rollup, Webpack, esbuild):

```typescript
// nitro.config.ts
import nitroSpec from "nitro-spec/rollup";

export default defineNitroConfig({
  rollupConfig: {
    plugins: [nitroSpec()],
  },
});
```

**Transformation Process:**

1. **Build-time scanning**: Analyzes route file paths to extract method/path info
2. **AST transformation**: Injects `__path`, `__method`, `__isCatchAll` into `defineMeta` calls
3. **Route registration**: Builds OpenAPI spec during compilation

### Middleware System

The nitro-spec ecosystem provides comprehensive middleware through the `@nitro-spec/middlewares` package. The core `nitro-spec` package focuses on route definition and OpenAPI generation, while all middleware functionality is contained in the dedicated middleware package.

#### Using Middleware from `@nitro-spec/middlewares`

```typescript
import {
  createJWTAuthMiddleware,
  createRateLimitMiddleware,
  createCustomMiddleware,
} from "@nitro-spec/middlewares";

const authMiddleware = createJWTAuthMiddleware({
  secret: process.env.JWT_SECRET,
  algorithm: "HS256",
});

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

const customMiddleware = createCustomMiddleware(
  "my-middleware",
  async (event) => {
    // Custom logic
  }
);

const { defineEventHandler } = defineMeta({
  middleware: [authMiddleware, rateLimitMiddleware, customMiddleware],
  // ... rest of route definition
});
```

### 4. OpenAPI Integration

The plugin automatically creates OpenAPI documentation endpoints:

```typescript
// server/plugins/nitroSpec.ts
import { createNitroSpecPlugin } from "nitro-spec";

export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
  });
});
```

**Generated Endpoints:**

- `/api/openapi.json` - OpenAPI 3.1 specification
- `/api/openapi.yaml` - YAML format
- `/api/openapi` - Swagger UI
- `/api/openapi/redoc` - ReDoc documentation

## Technical Stack

### Core Dependencies

- **Zod v4.0.14**: Schema validation with updated type system (`ZodObject<ZodRawShape>`)
- **H3 v1.15.4**: HTTP framework for event handling
- **@asteasolutions/zod-to-openapi**: OpenAPI generation from Zod schemas
- **TypeScript 5.9.2**: Full type safety
- **tsup 8.5.0**: Build system with ESM/CJS dual output

### Monorepo Tools

- **pnpm**: Package manager with workspace support
- **Nx**: Task orchestration and caching
- **Vitest**: Testing framework

## Development Patterns

### File-based Routing Convention

Routes follow Nitro's file-based routing with auto-extraction:

```
server/routes/
├── index.get.ts              → GET /
├── users.get.ts              → GET /users
├── users/[id].get.ts         → GET /users/:id
├── api/v1/products.post.ts   → POST /api/v1/products
└── api/v1/[...catch].ts      → GET /api/v1/* (catch-all)
```

### Zod Schema Patterns

Always use `.openapi()` extension for proper OpenAPI generation:

```typescript
const UserSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["user", "admin"]),
  })
  .openapi("User");

const CreateUserSchema = UserSchema.omit({ id: true }).openapi("CreateUser");
```

### Error Handling

Use H3's `createError` for consistent error responses:

```typescript
import { createError } from "h3";

if (!user) {
  throw createError({
    statusCode: 404,
    statusMessage: "User not found",
  });
}
```

## Build System

### Package Exports

Both packages use comprehensive export maps:

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./vite": {
      "types": "./dist/compiler/factories/vite.d.ts",
      "import": "./dist/compiler/factories/vite.js"
    },
    "./auth": {
      "types": "./dist/auth/index.d.ts",
      "import": "./dist/auth/index.js"
    }
  }
}
```

### Build Commands

```bash
# Build all packages
pnpm build

# Build specific package
nx run nitro-spec:build
nx run nitro-spec-middlewares:build

# Development mode
pnpm dev
```

## Middleware Categories (@nitro-spec/middlewares)

### Authentication

- `createJWTAuthMiddleware`: JWT token validation
- `createBasicAuthMiddleware`: Basic authentication
- `createAPIKeyMiddleware`: API key validation
- `createOAuth2Middleware`: OAuth2 integration

### Validation

- `createRequestSizeValidator`: Payload size limits
- `createContentTypeValidator`: Content-type validation
- `createSchemaValidator`: Zod schema validation

### Security

- `createCORSMiddleware`: Cross-origin resource sharing
- `createRateLimitMiddleware`: Request rate limiting
- `createSecurityHeadersMiddleware`: Security headers (Helmet)

### Utilities

- `createLoggingMiddleware`: Request/response logging
- `createTracingMiddleware`: Distributed tracing
- `createHealthCheckMiddleware`: Health monitoring

## Common Tasks

### Adding New Routes

1. Create file following naming convention: `[route].[method].ts`
2. Use `defineMeta` with proper Zod schemas
3. Add `.openapi()` extensions to schemas
4. Export `defineEventHandler` result

### Adding Custom Middleware

1. Create middleware factory function
2. Return object with `type`, `name`, `handler`
3. Integrate with `defineMeta` middleware array

### Debugging Build Issues

1. Check unplugin transformation in `.nitro/dev/index.mjs`
2. Verify route file naming matches expected patterns
3. Ensure Zod schemas have `.openapi()` extensions
4. Check TypeScript compilation errors

## Code Conventions

### Imports

```typescript
// Core functionality (no middleware functions)
import { defineMeta } from "nitro-spec";

// All middleware from the dedicated package
import {
  createJWTAuthMiddleware,
  createCustomMiddleware,
  createCORSMiddleware,
} from "@nitro-spec/middlewares";

// Always import Zod
import { z } from "zod";
```

### Schema Naming

```typescript
// Use descriptive names with Schema suffix
const UserSchema = z.object({...}).openapi("User");
const CreateUserRequest = z.object({...}).openapi("CreateUserRequest");
const UserListResponse = z.array(UserSchema).openapi("UserListResponse");
```

### Route Handlers

```typescript
// Use async/await and proper error handling
export default defineEventHandler(async (event, params, query, body) => {
  try {
    // Implementation
    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
```

## Performance Considerations

- **Build-time optimization**: Route metadata extracted at compile time
- **Tree-shaking**: Modular exports enable dead code elimination
- **Type safety**: Runtime validation with compile-time type checking
- **Caching**: Nx provides build caching across the monorepo

## Common Issues & Solutions

1. **Zod v4 type errors**: Use `ZodObject<ZodRawShape>` instead of `ZodObject<any>`
2. **Missing route metadata**: Ensure file follows naming convention
3. **Build failures**: Check unplugin is properly configured for your bundler
4. **Middleware errors**: Verify middleware implements correct interface

---

This codebase emphasizes **type safety**, **developer experience**, and **automatic OpenAPI generation** through build-time transformations and runtime validation.
