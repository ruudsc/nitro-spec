import { defineMeta, z, type InferResponseType } from "nitro-spec";
import { testResponse } from "~/models/models";

export const { defineEventHandler } = defineMeta({
  operationId: "getTest",
  path: z.object({ id: z.string() }),

  title: "Test title",
  response: testResponse,
});

type Test = InferResponseType<typeof defineEventHandler>;
//    ^?

export default defineEventHandler((event, query, params, body) => {
  return {};
});
