import { createJiti } from "jiti";
import { aliasMapToObject, getTypescriptAliases } from "./utils";
import { createUnimport } from "unimport";
import { join } from "path";

export const createJitiInstance = async () => {
  const aliasMap = await getTypescriptAliases();
  const alias = aliasMapToObject(aliasMap);

  const cwd = process.cwd();
  const directories = ["components", "composables", "plugins", "utils"];
  const serverDirs = directories.map((dir) => `server/${dir}`);
  const dirs = [...directories, ...serverDirs].map((dir) => join(cwd, dir));

  const imports = await createUnimport({
    dirs,
  });

  const mapz = await imports.getImportMap();
  const importz = await imports.getImports();

  const jiti = createJiti(import.meta.url, {
    debug: true,
    alias,
  });

  return jiti;
};
export type JitiInstance = Awaited<ReturnType<typeof createJitiInstance>>;
