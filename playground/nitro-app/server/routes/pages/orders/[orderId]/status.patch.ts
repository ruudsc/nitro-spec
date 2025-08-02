import { defineMeta } from "nitro-spec";
import { z } from "zod";

// Simple order status update example
const OrderParamsSchema = z
  .object({
    orderId: z.string(),
  })
  .openapi("OrderParams");

const OrderStatusUpdateSchema = z
  .object({
    status: z.enum([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    notes: z.string().optional(),
  })
  .openapi("OrderStatusUpdate");

const OrderSchema = z
  .object({
    id: z.string(),
    status: z.enum([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    updatedAt: z.string().datetime(),
    notes: z.string().optional(),
  })
  .openapi("Order");

const { defineEventHandler } = defineMeta({
  operationId: "updateOrderStatus",
  title: "Update Order Status",
  description: "Update the status of an existing order",
  summary: "Update order status",
  path: OrderParamsSchema,
  body: OrderStatusUpdateSchema,
  response: OrderSchema,
});

export default defineEventHandler(async (event, params, query, body) => {
  const { orderId } = params;
  const { status, notes } = body;

  // Simulate async database operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  const updatedOrder = {
    id: orderId,
    status,
    updatedAt: new Date().toISOString(),
    ...(notes && { notes }),
  };

  console.log(`Order ${orderId} status updated to ${status}`);

  return updatedOrder;
});
