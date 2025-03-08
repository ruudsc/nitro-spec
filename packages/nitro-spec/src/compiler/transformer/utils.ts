import { join } from "node:path";
import { cwd } from "node:process";
import { readTSConfig, resolveTSConfig, TSConfig } from "pkg-types";

export const catchAllRouteRegex =
  /^(.*\/)?\[\.\.\.([a-zA-Z0-9_]+)\](\/.*)?\.(js|jsx|ts|tsx)$/;

export const fileExtensionRegex = /\.[^/.]+$/;

const methods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
  "trace",
];

type Method = (typeof methods)[number];

export const getMethodFromFileName = (fileName: string) => {
  const method: Method =
    methods.find((method) => fileName.includes(method)) ?? "get";

  const routePart = fileName.replace("." + method, "").replace("index", "");

  return {
    method,
    routePart: routePart === "." ? "/" : routePart,
  };
};

export function extractParams(route: string): Record<string, string> {
  const paramPattern = /\[([a-zA-Z0-9_]+)\]/g;
  const params: Record<string, string> = {};
  let match;

  while ((match = paramPattern.exec(route)) !== null) {
    const paramName = match[1];
    params[paramName] = paramName; // You can modify this to assign actual values if needed
  }

  return params;
}

export type ImportAliases = Map<string, string[]>;
export const getTypescriptAliases = async (path?: string) => {
  const aliases: ImportAliases = new Map<string, string[]>();

  let paths = [] as any;
  let file = path ?? (await resolveTSConfig());
  const directory = file.split("/").slice(0, -1).join("/");
  const config = await readTSConfig(file);

  console.log("file", file);
  console.log("tsconfig dir", directory);

  if (config.extends) {
    const extendsArr =
      Array.isArray(config.extends) ? config.extends : [config.extends];

    for (const parentConfig of extendsArr) {
      const extendPath = join(directory, parentConfig);
      const inheritedAliases = await getTypescriptAliases(extendPath);

      /** merge aliases */
      for (const [alias, path] of inheritedAliases) {
        const previousPaths = aliases.get(alias) ?? [];
        aliases.set(alias, [...previousPaths, ...path]);
      }
    }
  }

  if (config.compilerOptions?.paths) {
    const entries = (paths = Object.entries(config.compilerOptions.paths));

    for (const [alias, path] of entries) {
      const previousPaths = aliases.get(alias) ?? [];
      aliases.set(alias, [...previousPaths, ...(path as string[])]);
    }
  }

  return aliases;
};

export const aliasMapToObject = (aliasMap: ImportAliases) => {
  const aliasObj = [...aliasMap.entries()].reduce(
    (acc, [key, value]) => {
      acc[key] = JSON.stringify(value);
      return acc;
    },
    {} as Record<string, string>,
  );
  return aliasObj;
};
