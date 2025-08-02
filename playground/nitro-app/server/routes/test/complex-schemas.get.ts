import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Test case 3: Complex nested schemas with transformation
const PaginationSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(["name", "created", "updated"]).default("created"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .meta({ id: "TestComplex-schemasgettsPaginationParams" });

const CategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .meta({ id: "TestComplex-schemasgettsCategory" });

const ProductSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    price: z.number().positive(),
    category: CategorySchema,
    tags: z.array(z.string()),
    inStock: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "TestComplex-schemasgettsProduct" });

const ProductListResponseSchema = z
  .object({
    products: z.array(ProductSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    filters: z.object({
      search: z.string().optional(),
      sortBy: z.string(),
      sortOrder: z.string(),
    }),
  })
  .meta({ id: "TestComplex-schemasgettsProductListResponse" });

const { defineEventHandler } = defineMeta({
  operationId: "testComplexSchemas",
  title: "Test Complex Nested Schemas",
  description: "Tests complex nested object validation and transformation",
  query: PaginationSchema,
  response: ProductListResponseSchema,
});

export default defineEventHandler(async (event, params, query, body) => {
  const { page, limit, search, sortBy, sortOrder } = query;

  // Mock data generation
  const mockProducts = Array.from({ length: 50 }, (_, i) => ({
    id: `product-${i + 1}`,
    name: `Product ${i + 1}`,
    description: `Description for product ${i + 1}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    category: {
      id: `cat-${(i % 5) + 1}`,
      name: ["Electronics", "Clothing", "Books", "Home", "Sports"][i % 5],
      slug: ["electronics", "clothing", "books", "home", "sports"][i % 5],
    },
    tags: [`tag${(i % 3) + 1}`, `tag${(i % 4) + 1}`],
    inStock: Math.random() > 0.3,
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Apply search filter
  let filteredProducts = mockProducts;
  if (search) {
    filteredProducts = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply sorting
  filteredProducts.sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortBy) {
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "created":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "updated":
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Apply pagination
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      search,
      sortBy,
      sortOrder,
    },
  };
});
