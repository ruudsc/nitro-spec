import { dirname, join } from "pathe";
import { filename as getFileName } from "pathe/utils";
import {
  extractParams,
  fileExtensionRegex,
  getMethodFromFileName,
} from "./utils";

function removeTrailingngSlash(route: string): string {
  return route.replace(/\/$/, "");
}

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
  isCatchAll: boolean;
};

export const scanPathMeta = (path: string): Meta => {
  const relativePath = path.split("/routes/")?.[1];
  const catchAllRegex = /\[\.{3}[^\]]+\]/g;
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
  const isCatchall = catchAllRegex.test(fileRoute);

  const urlRoute = removeTrailingngSlash(
    replaceBrackets(fileRoute)
      .replace("index", "")
      .replace(catchAllRegex, "{path}"),
  );

  const pathParameters = extractParams(fileRoute);

  return {
    id: path,
    filename: fileName,
    fileRoute: fileRoute,
    urlRoute: `/${urlRoute}`,
    pathParameters: pathParameters,
    method: method,
    isCatchAll: isCatchall,
  };
};
