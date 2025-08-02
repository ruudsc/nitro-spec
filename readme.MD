# nitro-spec

## Toy project: Strongly typed specifications for Nitro.js

Use zod to define your routes and generate a swagger spec.

# installation

`npm install nitro-spec @asteasolutions/zod-to-openapi --save-dev`

In `nitro.config.ts` add the following:

```ts
import nitroSpec from "nitro-spec/rollup";

export default defineNitroConfig({
  rollupConfig: {
    plugins: [nitroSpec()],
  },
});
```

Create a plugin in your project. E.g. `/server/plugins/1.nitroSpec.ts` and add the following contents:

```ts
import { z } from "zod";
extendZodWithOpenApi(z);

import { createNitroSpecPlugin } from "nitro-spec";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    version: "1.0.0",
    baseUrl: "/api/",
  });
});
```

# usage

Defining a route

```ts
import { defineMeta } from "nitro-spec";
import { z } from "zod";

const { defineEventHandler } = defineMeta({
  operationId: "foo",
  title: "Test title",
  path: z.object({ foo: z.string() }).openapi("TestPath"),
  query: z.object({ bar: z.string() }).openapi("TestQuery"),
  body: z.object({ baz: z.string() }).openapi("TestBody"),
  response: z.object({ message: z.string() }).openapi("TestResponse"),
});

export default defineEventHandler((event, path, query, body) => {
  const message = `Hello ${path.foo} ${query.bar} ${body.baz}`;

  return {
    message,
  };
});
```
