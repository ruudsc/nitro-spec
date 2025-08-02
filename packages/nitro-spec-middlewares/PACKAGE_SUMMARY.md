# @nitro-spec/middlewares Package

## Summary

✅ **Successfully created a new package `@nitro-spec/middlewares` with the same tech stack as nitro-spec!**

### Package Structure

```
packages/nitro-spec-middlewares/
├── package.json           # Package configuration with proper exports
├── tsup.config.ts         # Build configuration (same as nitro-spec)
├── tsconfig.json          # TypeScript configuration
├── eslint.config.js       # ESLint configuration
├── README.md              # Comprehensive documentation
├── LICENSE                # MIT License
└── src/
    ├── index.ts           # Main entry point
    ├── auth/
    │   └── index.ts       # Authentication middlewares
    ├── validation/
    │   └── index.ts       # Validation middlewares
    ├── security/
    │   └── index.ts       # Security middlewares
    └── utils/
        └── index.ts       # Utility middlewares
```

### Key Features Implemented

#### 🔐 Authentication (`/auth`)

- **JWT Authentication**: Bearer token validation with configurable algorithms
- **Basic Authentication**: HTTP Basic auth with bcrypt password hashing
- **API Key Authentication**: Header/query parameter-based API keys
- **OAuth2 Integration**: Token introspection support
- **Role-Based Authorization**: Custom role validation middleware

#### ✅ Validation (`/validation`)

- **Request Size Validation**: Limit body size, query parameters, headers
- **Content Type Validation**: Ensure proper content types
- **Schema Validation**: Zod-based validation for body/query/params
- **File Upload Validation**: Validate file uploads and MIME types
- **Request Timing**: Prevent replay attacks with timestamp validation
- **Request Sanitization**: Clean and sanitize input data

#### 🛡️ Security (`/security`)

- **CORS**: Configurable Cross-Origin Resource Sharing
- **Rate Limiting**: Request rate limiting with customizable windows
- **Security Headers**: Add security headers (CSP, X-Frame-Options, etc.)
- **Request Filtering**: IP and User-Agent based filtering
- **Signature Validation**: HMAC signature verification
- **DDoS Protection**: Basic DDoS protection with IP banning

#### 🔧 Utilities (`/utils`)

- **Request Logging**: Comprehensive request/response logging
- **Request Tracing**: Distributed tracing support
- **Cache Control**: HTTP caching headers
- **Request Timeout**: Automatic request timeouts
- **Health Checks**: Built-in health check endpoints
- **Metrics Collection**: Request metrics and monitoring
- **Graceful Shutdown**: Handle shutdown signals gracefully

### Technical Stack

✅ **Same as nitro-spec package**:

- **TypeScript 5.9.2**: Full type safety
- **tsup 8.5.0**: Build system with ESM/CJS dual output
- **ESLint**: Code linting
- **Vitest**: Testing framework
- **pnpm**: Package manager
- **Nx**: Monorepo support

### Build System

- ✅ **ESM + CJS output**: Dual package format
- ✅ **TypeScript declarations**: Full .d.ts generation
- ✅ **Source maps**: For debugging
- ✅ **Code splitting**: Optimized bundles
- ✅ **Tree shaking**: Dead code elimination

### Dependencies

#### Runtime Dependencies:

- `jsonwebtoken`: JWT token handling
- `bcryptjs`: Password hashing
- `cors`: CORS functionality
- `helmet`: Security headers

#### Peer Dependencies:

- `h3`: H3 event handling (from catalog)
- `zod`: Schema validation (from catalog)
- `nitro-spec`: Core types and functionality (workspace)

### Integration with nitro-spec

The package seamlessly integrates with nitro-spec:

```typescript
import { defineMeta } from "nitro-spec";
import {
  createJWTAuthMiddleware,
  createRateLimitMiddleware,
} from "@nitro-spec/middlewares";

export const { defineEventHandler } = defineMeta(
  {
    middleware: [
      createJWTAuthMiddleware({ secret: "your-secret" }),
      createRateLimitMiddleware({ windowMs: 60000, maxRequests: 100 }),
    ],
    // ... rest of your route definition
  },
  async (event) => {
    // Your handler with middleware protection
  },
);
```

### Example Usage

See `/playground/nitro-app/server/routes/examples/middleware-demo.post.ts` for a comprehensive example showing:

- JWT authentication
- Rate limiting
- CORS handling
- Request logging
- Security headers
- Request size validation

### Benefits

1. **Separation of Concerns**: Middleware logic is separated from core nitro-spec
2. **Reusability**: Can be used across multiple nitro-spec projects
3. **Type Safety**: Full TypeScript support with IntelliSense
4. **Modularity**: Import only what you need
5. **Performance**: Optimized builds with tree shaking
6. **Extensibility**: Easy to add new middleware types

### Next Steps

1. **Add Tests**: Implement comprehensive test suites
2. **Documentation**: Expand usage examples and API docs
3. **CI/CD**: Set up automated testing and publishing
4. **Community**: Open for contributions and feedback

The package is ready for use and provides a solid foundation for middleware functionality in nitro-spec applications!
