import { defineEventHandler, EventHandler, setResponseHeader } from "h3";
import yaml from "yaml";

import { generateOpenApiDocument } from "../utils/generateOpenApiDocument";
import { OpenApiOptions } from "./openApiOptions";

export const createOpenapiYamlRoute = (options: OpenApiOptions): EventHandler<Request, unknown> =>
  defineEventHandler(async (event) => {
    const document = await generateOpenApiDocument(options);

    setResponseHeader(event, "content-type", "application/yaml; charset=UTF-8");

    return yaml.stringify(document, { indent: 2 });
  });
