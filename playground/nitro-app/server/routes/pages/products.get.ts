import { defineMeta } from "nitro-spec";
import {
  createFieldFilterTransformer,
  createResponseFormatTransformer,
  composeTransformers,
} from "nitro-spec";
import { z } from "nitro-spec";

// Schema definitions
const ProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    category: z.string(),
    inStock: z.boolean(),
    tags: z.array(z.string()),
    createdAt: z.string().datetime(),
    metadata: z
      .object({
        weight: z.number().optional(),
        dimensions: z
          .object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
          })
          .optional(),
        manufacturer: z.string().optional(),
      })
      .optional(),
  })
  .meta({ id: "PagesProductsgettsProduct" });

const ProductsQuerySchema = z
  .object({
    category: z.string().optional(),
    inStock: z.coerce.boolean().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    fields: z.string().optional(), // For field filtering: ?fields=id,name,price
  })
  .meta({ id: "PagesProductsgettsProductsQuery" });

// Advanced response transformer combining multiple transformations
const productTransformer = composeTransformers(
  createFieldFilterTransformer(),
  createResponseFormatTransformer("envelope")
);

// Performance monitoring middleware
const performanceMiddleware = {
  type: "custom" as const,
  name: "performance",
  description: "Monitors request performance",
  handler: async (event: any) => {
    const startTime = Date.now();
    event.context.startTime = startTime;
    console.log(
      `[PERF] Request started at ${new Date(startTime).toISOString()}`
    );
  },
};

const { defineEventHandler } = defineMeta({
  operationId: "getProducts",
  title: "Get Products",
  description:
    "Retrieve a list of products with optional filtering and field selection",
  summary: "List products with advanced filtering",
  query: ProductsQuerySchema,
  response: z
    .array(ProductSchema)
    .meta({ id: "PagesProductsgettsProductsList" }),
  middleware: [performanceMiddleware],
  transformResponse: productTransformer,
});

// Mock data
const mockProducts = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    category: "electronics",
    inStock: true,
    tags: ["wireless", "audio", "premium"],
    createdAt: "2024-01-01T00:00:00Z",
    metadata: {
      weight: 250,
      dimensions: { length: 20, width: 18, height: 8 },
      manufacturer: "AudioTech",
    },
  },
  {
    id: "2",
    name: "Coffee Mug",
    description: "Ceramic coffee mug with ergonomic handle",
    price: 12.99,
    category: "home",
    inStock: true,
    tags: ["ceramic", "coffee", "kitchen"],
    createdAt: "2024-01-02T00:00:00Z",
    metadata: {
      weight: 300,
      manufacturer: "HomeWare Co",
    },
  },
  {
    id: "3",
    name: "Running Shoes",
    description: "Lightweight running shoes with advanced cushioning",
    price: 129.99,
    category: "sports",
    inStock: false,
    tags: ["running", "shoes", "lightweight"],
    createdAt: "2024-01-03T00:00:00Z",
    metadata: {
      weight: 280,
      manufacturer: "SportsTech",
    },
  },
  {
    id: "4",
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with 360-degree sound",
    price: 79.99,
    category: "electronics",
    inStock: true,
    tags: ["bluetooth", "speaker", "portable"],
    createdAt: "2024-01-04T00:00:00Z",
    metadata: {
      weight: 150,
      dimensions: { length: 10, width: 10, height: 15 },
      manufacturer: "AudioTech",
    },
  },
];

export default defineEventHandler(async (event, params, query, body) => {
  let filteredProducts = [...mockProducts];

  // Apply filters
  if (query.category) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category === query.category
    );
  }

  if (query.inStock !== undefined) {
    filteredProducts = filteredProducts.filter(
      (p) => p.inStock === query.inStock
    );
  }

  if (query.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(
      (p) => p.price >= query.minPrice!
    );
  }

  if (query.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(
      (p) => p.price <= query.maxPrice!
    );
  }

  // Simulate async database operation
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Log performance
  if (event.context.startTime) {
    const duration = Date.now() - event.context.startTime;
    console.log(`[PERF] Request completed in ${duration}ms`);
  }

  return filteredProducts;
});
