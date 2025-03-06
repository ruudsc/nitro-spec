import { dirname, join } from "pathe";
import { filename as getFileName } from "pathe/utils";
import {
  extractParams,
  fileExtensionRegex,
  getMethodFromFileName,
  ImportAliases,
} from "./utils";
import { doJitiStuff } from "./resolver";
import consola from "consola";
import { TSConfig } from "pkg-types";
import { Jiti } from "jiti/lib/types";

export function replaceBrackets(route: string): string {
  return route.replace(/\[([a-zA-Z0-9_]+)\]/g, "{$1}");
}

export const extractRouteMetadata = (fullPath: string) => {
  const fileName = getFileName(fullPath);
  const noExt = fullPath.replace(fileExtensionRegex, "");

  if (!fileName) {
    throw new Error(`Invalid route path: ${fullPath}`);
  }

  const { routePart, method } = getMethodFromFileName(fileName);
  const fileRoute = join(dirname(noExt), routePart);
  const urlRoute = replaceBrackets(fileRoute);

  const pathParameters = extractParams(fileRoute);

  return {
    pathParameters,
    fileRoute,
    urlRoute,
    method,
  };
};

export const scanFileMeta = (path: string, code: string) => {
  const relativePath = path.split("/routes/")?.[1];

  if (!relativePath) {
    throw Error(`Invalid route path: ${path}`);
  }

  const meta = extractRouteMetadata(relativePath);
  consola.log("route-meta:", meta);

  return { meta };
};
