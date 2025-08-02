import { defineEventHandler, setResponseHeader } from "h3";
import yaml from "yaml";

export const openapiYamlRoute = defineEventHandler(async (event) => {
  const document = await $fetch("/openapi.json");

  setResponseHeader(event, "Content-Type", "application/yaml");

  return yaml.stringify(document, { indent: 2 });
});
