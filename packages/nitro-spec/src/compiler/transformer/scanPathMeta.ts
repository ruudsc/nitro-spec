import { dirname, join } from "pathe";
import { filename as getFileName } from "pathe/utils";
import {
  catchAllRouteRegex,
  extractParams,
  fileExtensionRegex,
  getMethodFromFileName,
} from "./utils";

import consola from "consola";

export function replaceBrackets(route: string): string {
  return route.replace(/\[([a-zA-Z0-9_]+)\]/g, "{$1}");
}

export type Meta = {
  id: string;
  filename: string;
  pathParameters: Record<string, string>;
  fileRoute: string;
  urlRoute: string;
  method: string;
};

export const scanPathMeta = (path: string): Meta => {
  const relativePath = path.split("/routes/")?.[1];

  if (!relativePath) {
    throw Error(`Invalid route path: ${path}`);
  }

  const fileName = getFileName(relativePath);
  const noExt = relativePath.replace(fileExtensionRegex, "");

  if (!fileName) {
    throw new Error(`Invalid route path: ${relativePath}`);
  }

  const { routePart, method } = getMethodFromFileName(fileName);
  const fileRoute = join(dirname(noExt), routePart);
  const urlRoute = replaceBrackets(fileRoute)
    .replace("index", "/")
    .replace(/\[\.{3}[^\]]+\]/g, "{path+}");

  const pathParameters = extractParams(fileRoute);

  return {
    id: path,
    filename: fileName,
    fileRoute: fileRoute,
    urlRoute: urlRoute,
    pathParameters: pathParameters,
    method: method,
  };
};
