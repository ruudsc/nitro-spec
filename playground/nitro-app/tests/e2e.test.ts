import { describe, expect, it } from "vitest";

const baseUrl = "http://127.0.0.1:4317";
const uuid = "550e8400-e29b-41d4-a716-446655440000";

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...init?.headers },
    ...init,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  return { response, body };
}

const routeCases: Array<[string, string, RequestInit | undefined, number]> = [
  ["GET /", "/", undefined, 200],
  ["GET /handlerObject", "/handlerObject", undefined, 200],
  ["GET /api/v1/catch-all", "/api/v1/catch-all", undefined, 200],
  ["GET /api/v1/test/:id", "/api/v1/test/123", undefined, 200],
  ["POST /api/v1/test/:foo", "/api/v1/test/bar?bar=query", { method: "POST", body: JSON.stringify({ baz: "body" }) }, 200],
  ["POST /api/v1/test/foo", "/api/v1/test/foo?id=foo", { method: "POST", body: JSON.stringify({ message: "hello" }) }, 200],
  ["GET /pages/users", "/pages/users?page=1&limit=2&role=user", undefined, 200],
  ["POST /pages/users", "/pages/users", { method: "POST", body: JSON.stringify({ name: "E2E User", email: "e2e-user@example.com", age: 34, role: "user" }) }, 200],
  ["GET /pages/users/:id", "/pages/users/1", undefined, 200],
  ["PATCH /pages/users/:id", "/pages/users/1", { method: "PATCH", body: JSON.stringify({ name: "Updated User" }) }, 200],
  ["GET /pages/products", "/pages/products?category=electronics&inStock=true", undefined, 200],
  ["GET /pages/stats", "/pages/stats", undefined, 200],
  ["GET /pages/:page", "/pages/about", undefined, 200],
  ["PATCH /pages/orders/:orderId/status", "/pages/orders/order-1/status", { method: "PATCH", body: JSON.stringify({ status: "shipped" }) }, 200],
  ["GET /test/openapi-params", "/test/openapi-params?sessionToken=abc&userId=user-1&includeDetails=true", undefined, 200],
  ["GET /test/mixed-metadata", `/test/mixed-metadata?token=abc&userId=${uuid}&includeMetadata=true&format=json&filters=%7B%22active%22%3Atrue%7D`, undefined, 200],
  ["GET /test/schema-composition", `/test/schema-composition?sessionId=${uuid}&version=v2&debug=true`, undefined, 200],
  ["GET /test/complex-schemas", "/test/complex-schemas", undefined, 200],
  ["POST /test/complex-post", "/test/complex-post", { method: "POST", body: JSON.stringify({ title: "Stress post", content: "Long enough content", tags: ["e2e"], category: "tech", metadata: { author: "Vitest", priority: 3, featured: true } }) }, 200],
  ["GET /test/empty-query", "/test/empty-query", undefined, 200],
  ["GET /test/responses/:id", `/test/responses/${uuid}`, undefined, 200],
  ["GET /test/raw-metadata", "/test/raw-metadata", undefined, 200],
];

describe("nitro playground e2e", () => {
  it.each(routeCases)("serves %s", async (_name, path, init, status) => {
    const { response, body } = await request(path, init);

    expect(response.status).toBe(status);
    expect(body).toBeTruthy();
  });

  it("generates OpenAPI JSON for every route and metadata mode", async () => {
    const { response, body: spec } = await request("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(spec.openapi).toMatch(/^3\./);

    const expectedPaths = [
      "/",
      "/handlerObject",
      "/api/v1/test/{id}",
      "/api/v1/test/{foo}",
      "/api/v1/test/foo",
      "/pages/users",
      "/pages/users/{id}",
      "/pages/products",
      "/pages/stats",
      "/pages/{page}",
      "/pages/orders/{orderId}/status",
      "/test/openapi-params",
      "/test/mixed-metadata",
      "/test/schema-composition",
      "/test/complex-schemas",
      "/test/complex-post",
      "/test/empty-query",
      "/test/responses/{id}",
      "/test/raw-metadata",
    ];

    for (const path of expectedPaths) {
      expect(spec.paths, path).toHaveProperty(path);
    }

    expect(spec.paths["/test/mixed-metadata"].get.operationId).toBe("testMixedFieldMetadata");
    expect(spec.paths["/test/openapi-params"].get.operationId).toBe("testOpenApiParams");
    expect(spec.paths["/test/raw-metadata"].get.operationId).toBe("testRawMetadataStress");
    expect(spec.paths["/test/raw-metadata"].get.tags).toContain("stress");
  });
});
