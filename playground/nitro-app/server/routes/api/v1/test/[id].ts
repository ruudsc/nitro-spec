import { defineMeta } from "nitro-spec";
import { z } from "zod";
import { testResponse } from "~/models/models";

export const { defineEventHandler } = defineMeta({
  operationId: "getTest",
  path: z.object({ id: z.string() }).openapi("TestPath"),
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
    ]
  } ;
});
