import { EventHandler, H3Event } from "h3";
import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";

const { defineEventHandler } = defineMeta({
  operationId: "get-handler-object",
  response: z.object({
    message: z.string(),
  }),
});

export default defineEventHandler({
  onBeforeResponse: [
    (event) => {
      console.log("before response");
    },
  ],
  handler: (event, path, query, body) => {
    return {
      message: "Hello World",
    };
  },
});
