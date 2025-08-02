import { createJiti } from "jiti";
import { resolveTSConfig } from "pkg-types";
import { getTypescriptAliases, ImportAliases } from "./utils";

export const doJitiStuff = async (
  filePath: string,
  importAlias: ImportAliases,
) => {
  const aliases = Object.fromEntries(importAlias);
  /*   const module = await jiti.import(filePath, {
    ali,
  }); */

  return {};
};
