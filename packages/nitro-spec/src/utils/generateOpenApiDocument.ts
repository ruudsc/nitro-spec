import {
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import consola from "consola";
import { merge, isErrorResult } from "openapi-merge";

import { OpenApiOptions } from "../routes/openApiOptions";
import { runNitroSpecPreload } from "./preload";
import { registry } from "./registry";

export const generateOpenApiDocument = async (
  options: OpenApiOptions,
): Promise<any> => {
  await runNitroSpecPreload();
  const generator =
    options.openapi ?
      new OpenApiGeneratorV31(registry.definitions)
    : new OpenApiGeneratorV3(registry.definitions);

  const {
    title = "Nitro Server Routes",
    description,
    contact,
    license,
    termsOfService,
    servers,
    version,
    additionalJsonUrls = [],
  } = options;

  const document = generator.generateDocument({
    openapi: "3.1.0",
    info: { title, version, description, contact, license, termsOfService },
    servers,
  });

  if (!additionalJsonUrls.length) {
    return document;
  }

  const additionalDocs = await Promise.allSettled(
    additionalJsonUrls.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      return await response.json();
    }),
  );

  const validDocs = additionalDocs
    .map((result, index) => {
      if (result.status === "fulfilled") return result.value;
      consola.warn(
        `Failed to fetch additional OpenAPI doc from ${additionalJsonUrls[index]}: ${(result as PromiseRejectedResult).reason}`,
      );
      return null;
    })
    .filter(Boolean);

  if (validDocs.length > 0) {
    const mergeResult = merge([
      { oas: document },
      ...validDocs.map((doc: any) => ({ oas: doc })),
    ]);
    if (isErrorResult(mergeResult)) {
      consola.warn("Failed to merge OpenAPI documents:", mergeResult.message);
    } else {
      return mergeResult.output;
    }
  }

  return document;
};
