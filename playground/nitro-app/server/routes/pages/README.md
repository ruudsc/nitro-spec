# Nitro-Spec Playground Examples

This directory contains comprehensive examples demonstrating the most common use-cases of nitro-spec.

## Available Examples

### 1. **Basic Page Route** - `[page].get.ts`

Simple route with path parameters.

- Basic path parameter extraction
- Simple response schema

### 2. **User List with Filtering** - `users.get.ts`

Demonstrates advanced querying and response transformation.

- Query parameter validation with defaults and coercion
- Custom middleware (logging)
- Response transformers (field filtering + envelope format)
- Pagination simulation
- Multiple filter options

**Try it:**

```bash
GET /api/pages/users?page=1&limit=5&role=admin&fields=id,name,email
```

### 3. **User Creation** - `users.post.ts`

Shows POST request handling with validation.

- Request body validation with detailed error messages
- Multiple response schemas by status code
- Custom validation middleware
- Response envelope transformation
- Async operations simulation

**Try it:**

```bash
POST /api/pages/users
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "age": 25,
  "role": "user"
}
```

### 4. **Get User by ID** - `users/[id].get.ts`

Demonstrates path parameters and error handling.

- Path parameter validation
- Rate limiting middleware
- 404 error handling
- Mock database simulation

**Try it:**

```bash
GET /api/pages/users/1
GET /api/pages/users/999  # Returns 404
```

### 5. **Update User** - `users/[id].patch.ts`

Shows PATCH requests with partial updates.

- Path and body parameter validation
- Audit logging middleware
- Partial update logic
- Email uniqueness validation
- Async database operations

**Try it:**

```bash
PATCH /api/pages/users/1
Content-Type: application/json

{
  "name": "Updated Name",
  "age": 30
}
```

### 6. **Cached Statistics** - `stats.get.ts`

Demonstrates cached event handlers.

- `defineCachedEventHandler` usage
- Cache configuration (5-minute TTL)
- Expensive computation simulation
- Cache warming middleware

**Try it:**

```bash
GET /api/pages/stats  # First call takes 1 second
GET /api/pages/stats  # Subsequent calls are cached
```

### 7. **Product Catalog with Advanced Features** - `products.get.ts`

Complex example with multiple filters and transformations.

- Complex nested schemas
- Multiple query filters
- Performance monitoring middleware
- Composed response transformers
- Field filtering support

**Try it:**

```bash
GET /api/pages/products?category=electronics&inStock=true&fields=id,name,price
GET /api/pages/products?minPrice=50&maxPrice=150
```

### 8. **Order Status Update** - `orders/[orderId]/status.patch.ts`

Business logic with validation and error handling.

- Nested path parameters
- Status validation
- Simple error responses
- Audit logging

**Try it:**

```bash
PATCH /api/pages/orders/123/status
Content-Type: application/json

{
  "status": "shipped",
  "notes": "Shipped via FastShip"
}
```

## Key Features Demonstrated

### 🔧 **Core Features**

- ✅ Route definition with `defineMeta`
- ✅ Zod schema validation for all inputs/outputs
- ✅ Automatic OpenAPI generation
- ✅ Path parameter extraction from filenames
- ✅ Method extraction from filenames

### 🛠️ **Advanced Features**

- ✅ Custom middleware system
- ✅ Response transformers
- ✅ Cached event handlers
- ✅ Multiple response schemas
- ✅ Error handling patterns
- ✅ Complex nested schemas
- ✅ Query parameter coercion

### 📝 **Best Practices Shown**

- ✅ Schema naming with `.openapi()`
- ✅ Proper error handling
- ✅ Async operation patterns
- ✅ Middleware composition
- ✅ Response transformation chains
- ✅ Mock data patterns

## Testing the Examples

1. **Start the development server:**

   ```bash
   cd playground/nitro-app
   npm run dev
   ```

2. **View OpenAPI Documentation:**

   - Swagger UI: http://localhost:3000/api/openapi
   - ReDoc: http://localhost:3000/api/openapi/redoc
   - JSON spec: http://localhost:3000/api/openapi.json

3. **Test the endpoints:**
   Use any HTTP client (curl, Postman, Thunder Client) to test the routes.

## Middleware Examples

### Custom Middleware Pattern

```typescript
const customMiddleware = {
  type: "custom" as const,
  name: "middleware-name",
  description: "What this middleware does",
  handler: async (event: any) => {
    // Your middleware logic here
  },
};
```

### Response Transformer Pattern

```typescript
const transformer = composeTransformers(
  createFieldFilterTransformer(),
  createResponseFormatTransformer("envelope")
);
```

### Cached Handler Pattern

```typescript
export default defineCachedEventHandler(
  async (event, params, query, body) => {
    // Your handler logic
  },
  {
    maxAge: 300, // 5 minutes
    name: "cache-key",
  }
);
```

## Schema Patterns

### Input Validation

```typescript
const QuerySchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    search: z.string().optional(),
  })
  .openapi("QueryParams");
```

### Response Schemas

```typescript
const ResponseSchema = z
  .object({
    data: z.array(ItemSchema),
    total: z.number(),
  })
  .openapi("ListResponse");
```

### Error Schemas

```typescript
const ErrorSchema = z
  .object({
    statusCode: z.number(),
    message: z.string(),
  })
  .openapi("Error");
```

These examples showcase the full power of nitro-spec for building type-safe, well-documented APIs with minimal boilerplate!
