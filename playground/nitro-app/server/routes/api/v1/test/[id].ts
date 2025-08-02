import { defineMeta } from "nitro-spec";
import { z } from "nitro-spec";
import { testResponse } from "~/models/models";

export const { defineEventHandler } = defineMeta({
  operationId: "getTest",
  path: z.object({ id: z.string() }).meta({ id: "ApiV1TestIdtsTestIdPath" }),
  title: "Test title",
  response: testResponse,
});

type Bla = z.infer<typeof testResponse>;
export default defineEventHandler(() => {
  const response: Bla = {
    message: "Hello World",
    data: {
      count: null,
      message: "Hello World",
    },
    test: [
      {
        message: ["Hello", 1],
      },
    ],
  };

  return {
    data: {
      message: "Hello World",
      count: null,
    },
    message: "Hello World",
    test: [
      {
        message: ["Hello", 1],
      },
    ],
  };
});
