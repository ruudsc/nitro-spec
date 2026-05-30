import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";

import { Options } from "../factories/types";
import { collectRouteFiles } from "./collectRouteFiles";
import { scanPathMeta } from "./scanPathMeta";
import { transformer } from "./transformer";

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options,
) => {
  let routeFiles: string[] = [];

  return {
    name: "nitro-openapi-plugin",
    sourcemap: false,

    buildStart() {
      routeFiles = collectRouteFiles(options?.routesDir);
    },

    transformInclude(id) {
      if (id.startsWith("\0")) return false;
      return id.includes("/routes/") || id.includes("/plugins/");
    },

    async transform(code, id) {
      if (id.includes("/routes/")) {
        const meta = scanPathMeta(id);
        const result = transformer(code, meta);
        return { code: result.code, map: result.sourcemap };
      }

      if (
        id.includes("/plugins/") &&
        code.includes("createNitroSpecPlugin") &&
        routeFiles.length > 0
      ) {
        const imports = routeFiles
          .map((f) => `import ${JSON.stringify(f)};`)
          .join("\n");
        return { code: `${imports}\n${code}` };
      }
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
