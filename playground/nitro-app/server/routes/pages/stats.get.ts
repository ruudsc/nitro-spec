import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

// Schema definitions
const StatsSchema = z
  .object({
    totalUsers: z.number(),
    activeUsers: z.number(),
    newUsersToday: z.number(),
    topUsersByRole: z.object({
      admin: z.number(),
      moderator: z.number(),
      user: z.number(),
    }),
    generatedAt: z.string().datetime(),
  })
  .meta({ id: "PagesStatsgettsUserStats" });

// Cache warming middleware
const cacheMiddleware = {
  type: "custom" as const,
  name: "cache-warming",
  description: "Logs cache operations",
  handler: async (event: any) => {
    console.log(
      `Cache check for user statistics at ${new Date().toISOString()}`
    );
  },
};

const { defineCachedEventHandler } = defineMeta({
  operationId: "getUserStats",
  title: "Get User Statistics",
  description: "Retrieve aggregated user statistics (cached for 5 minutes)",
  summary: "Get user stats",
  response: StatsSchema,
  middleware: [cacheMiddleware],
});

// Expensive computation simulation
async function calculateUserStats() {
  // Simulate heavy database queries
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const now = new Date();
  const today = now.toDateString();

  return {
    totalUsers: 1247,
    activeUsers: 892,
    newUsersToday: 23,
    topUsersByRole: {
      admin: 12,
      moderator: 45,
      user: 1190,
    },
    generatedAt: now.toISOString(),
  };
}

// Using defineCachedEventHandler with cache options
export default defineCachedEventHandler(
  async (event, params, query, body) => {
    console.log("Calculating user statistics...");
    return await calculateUserStats();
  },
  {
    // Cache for 5 minutes
    maxAge: 5 * 60,
    name: "user-stats",
    // Cache varies by query parameters (none in this case)
    varies: [],
  }
);
