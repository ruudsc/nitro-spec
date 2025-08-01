# @nitro-spec/middlewares

A comprehensive collection of pre-built middleware for nitro-spec applications, providing authentication, validation, security, and utility features.

## Installation

```bash
pnpm add @nitro-spec/middlewares
```

## Features

### 🔐 Authentication Middleware

- **JWT Authentication**: Bearer token validation with configurable algorithms
- **Basic Authentication**: HTTP Basic auth with bcrypt password hashing
- **API Key Authentication**: Header or query parameter-based API keys
- **OAuth2 Integration**: Token introspection support
- **Role-Based Authorization**: Custom role validation middleware

### ✅ Validation Middleware

- **Request Size Validation**: Limit body size, query parameters, and headers
- **Content Type Validation**: Ensure proper content types
- **Schema Validation**: Zod-based validation for body, query, and params
- **File Upload Validation**: Validate file uploads and MIME types
- **Request Timing**: Prevent replay attacks with timestamp validation
- **Request Sanitization**: Clean and sanitize input data

### 🛡️ Security Middleware

- **CORS**: Configurable Cross-Origin Resource Sharing
- **Rate Limiting**: Request rate limiting with customizable windows
- **Security Headers**: Add security headers (CSP, X-Frame-Options, etc.)
- **Request Filtering**: IP and User-Agent based filtering
- **Signature Validation**: HMAC signature verification
- **DDoS Protection**: Basic DDoS protection with IP banning

### 🔧 Utility Middleware

- **Request Logging**: Comprehensive request/response logging
- **Request Tracing**: Distributed tracing support
- **Cache Control**: HTTP caching headers
- **Request Timeout**: Automatic request timeouts
- **Health Checks**: Built-in health check endpoints
- **Metrics Collection**: Request metrics and monitoring
- **Graceful Shutdown**: Handle shutdown signals gracefully

## Quick Start

```typescript
import { defineMeta } from "nitro-spec";
import {
  createJWTAuthMiddleware,
  createRateLimitMiddleware,
  createCORSMiddleware,
  createLoggingMiddleware,
} from "@nitro-spec/middlewares";

// Configure middleware
const jwtAuth = createJWTAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  algorithm: "HS256",
});

const rateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

const cors = createCORSMiddleware({
  origin: ["https://example.com"],
  credentials: true,
});

const logging = createLoggingMiddleware({
  includeBody: true,
  includeHeaders: true,
});

// Use in your route
export const { defineEventHandler } = defineMeta(
  {
    method: "POST",
    summary: "Protected endpoint",
    middleware: [cors, rateLimit, jwtAuth, logging],
    // ... rest of your route definition
  },
  async (event) => {
    // Your handler logic
    const user = event.context.user; // Set by JWT middleware
    return { message: "Success", user };
  },
);
```

## Authentication Examples

### JWT Authentication

```typescript
import { createJWTAuthMiddleware } from "@nitro-spec/middlewares/auth";

const jwtAuth = createJWTAuthMiddleware({
  secret: "your-secret-key",
  algorithm: "HS256",
  expiresIn: "1h",
  issuer: "your-app",
  audience: "your-api",
});
```

### Basic Authentication

```typescript
import {
  createBasicAuthMiddleware,
  hashPassword,
} from "@nitro-spec/middlewares/auth";

// Hash passwords beforehand
const hashedPassword = await hashPassword("user-password");

const basicAuth = createBasicAuthMiddleware({
  users: {
    admin: hashedPassword,
    user: await hashPassword("another-password"),
  },
  realm: "Admin Area",
});
```

### API Key Authentication

```typescript
import { createApiKeyAuthMiddleware } from "@nitro-spec/middlewares/auth";

const apiKeyAuth = createApiKeyAuthMiddleware({
  keys: ["api-key-1", "api-key-2", "api-key-3"],
  header: "x-api-key", // Check X-API-Key header
  query: "apikey", // Also check ?apikey= query param
});
```

### Role-Based Authorization

```typescript
import { createRoleAuthMiddleware } from "@nitro-spec/middlewares/auth";

const adminOnly = createRoleAuthMiddleware(["admin", "super-admin"]);
const userOrAdmin = createRoleAuthMiddleware(["user", "admin"]);
```

## Validation Examples

### Schema Validation

```typescript
import { createSchemaValidator } from "@nitro-spec/middlewares/validation";
import { z } from "zod";

const bodyValidator = createSchemaValidator(
  z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(18),
  }),
  "body",
);

const queryValidator = createSchemaValidator(
  z.object({
    page: z.string().transform(Number),
    limit: z.string().transform(Number).optional(),
  }),
  "query",
);
```

### Request Size Validation

```typescript
import { createRequestSizeValidator } from "@nitro-spec/middlewares/validation";

const sizeValidator = createRequestSizeValidator({
  maxBodySize: 1024 * 1024, // 1MB
  maxQueryParams: 50,
  maxHeaders: 100,
});
```

### Content Type Validation

```typescript
import { createContentTypeValidator } from "@nitro-spec/middlewares/validation";

const contentTypeValidator = createContentTypeValidator({
  allowed: ["application/json", "application/xml"],
  strict: true,
});
```

## Security Examples

### CORS Configuration

```typescript
import { createCORSMiddleware } from "@nitro-spec/middlewares/security";

const cors = createCORSMiddleware({
  origin: ["https://app.example.com", "https://admin.example.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
});
```

### Rate Limiting

```typescript
import { createRateLimitMiddleware } from "@nitro-spec/middlewares/security";

const rateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (event) => {
    // Custom key generation (e.g., by user ID)
    return event.context.user?.id || event.node.req.socket.remoteAddress;
  },
  onLimitReached: (event) => {
    console.log(
      `Rate limit exceeded for ${event.node.req.socket.remoteAddress}`,
    );
  },
});
```

### Security Headers

```typescript
import { createSecurityHeadersMiddleware } from "@nitro-spec/middlewares/security";

const securityHeaders = createSecurityHeadersMiddleware({
  contentSecurityPolicy:
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
  xFrameOptions: "DENY",
  xContentTypeOptions: true,
  referrerPolicy: "strict-origin-when-cross-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
});
```

## Utility Examples

### Request Logging

```typescript
import { createLoggingMiddleware } from "@nitro-spec/middlewares/utils";

const logging = createLoggingMiddleware({
  includeBody: true,
  includeHeaders: true,
  includeQuery: true,
  excludeHeaders: ["authorization", "cookie"],
  onLog: (logData) => {
    // Custom logging (e.g., to external service)
    console.log("Request:", JSON.stringify(logData, null, 2));
  },
});
```

### Request Tracing

```typescript
import { createTracingMiddleware } from "@nitro-spec/middlewares/utils";

const tracing = createTracingMiddleware({
  headerName: "x-trace-id",
  generateTraceId: () => crypto.randomUUID(),
  propagateHeaders: ["x-correlation-id", "x-session-id"],
});
```

### Health Checks

```typescript
import { createHealthCheckMiddleware } from "@nitro-spec/middlewares/utils";

const healthCheck = createHealthCheckMiddleware({
  path: "/health",
  checks: [
    {
      name: "database",
      check: async () => {
        // Check database connectivity
        return await checkDatabaseConnection();
      },
    },
    {
      name: "redis",
      check: async () => {
        // Check Redis connectivity
        return await checkRedisConnection();
      },
    },
  ],
});
```

## Advanced Usage

### Combining Multiple Middleware

```typescript
import { defineMeta } from "nitro-spec";
import {
  createCORSMiddleware,
  createRateLimitMiddleware,
  createJWTAuthMiddleware,
  createRoleAuthMiddleware,
  createLoggingMiddleware,
  createSchemaValidator,
} from "@nitro-spec/middlewares";

const middleware = [
  // Security first
  createCORSMiddleware({ origin: ["https://app.com"] }),
  createRateLimitMiddleware({ windowMs: 60000, maxRequests: 60 }),

  // Authentication
  createJWTAuthMiddleware({ secret: process.env.JWT_SECRET! }),
  createRoleAuthMiddleware(["admin"]),

  // Validation
  createSchemaValidator(CreateUserSchema, "body"),

  // Utilities
  createLoggingMiddleware({ includeBody: true }),
];

export const { defineEventHandler } = defineMeta(
  {
    method: "POST",
    summary: "Create user (admin only)",
    middleware,
    // ... rest of configuration
  },
  async (event) => {
    // Handler logic
  },
);
```

### Custom Configuration

```typescript
// Environment-specific configurations
const isDevelopment = process.env.NODE_ENV === "development";

const corsConfig = {
  origin: isDevelopment ? "*" : ["https://production-app.com"],
  credentials: !isDevelopment,
};

const rateLimitConfig = {
  windowMs: isDevelopment ? 60000 : 15 * 60 * 1000,
  maxRequests: isDevelopment ? 1000 : 100,
};
```

## TypeScript Support

All middleware is fully typed with TypeScript, providing excellent IntelliSense and type safety:

```typescript
import type {
  JWTConfig,
  RateLimitConfig,
  CORSConfig,
} from "@nitro-spec/middlewares";

// Type-safe configuration
const jwtConfig: JWTConfig = {
  secret: process.env.JWT_SECRET!,
  algorithm: "HS256", // Autocompleted
  expiresIn: "24h",
};
```

## Contributing

Contributions are welcome! Please see the [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details.
