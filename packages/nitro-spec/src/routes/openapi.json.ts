import consola from "consola";
import { createError, defineEventHandler } from "h3";

export const openApiJsonEndpoint = defineEventHandler(async () => {
  // const registry = useApiRegistry();

  try {
    // const generator = new OpenApiGeneratorV3(registry.definitions);

    /*  const document = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Nitro Server Routes", version: "0.1.0" },
      servers: [{ url: "http://localhost:8000" }],
    });
 */

    return document;
  } catch (e) {
    consola.error(e);
    // return JSON.stringify(registry, null, 2);
    createError({ statusCode: 500, statusMessage: "Internal Server Error" });
  }
});
