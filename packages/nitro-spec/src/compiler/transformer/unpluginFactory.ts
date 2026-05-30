import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";

import { Options } from "../factories/types";
import { collectRouteFiles } from "./collectRouteFiles";
import { injectPreload } from "./injectPreload";
import { scanPathMeta } from "./scanPathMeta";
import { transformer } from "./transformer";

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  let routeFiles: string[] = [];
  let isWatchMode = false;

  return {
    name: "nitro-openapi-plugin",
    sourcemap: false,

    buildStart() {
      isWatchMode = (this as any).meta?.watchMode ?? false;
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

      const isPluginFile = id.includes("/plugins/") && code.includes("createNitroSpecPlugin");
      const shouldInject = isWatchMode || (options?.apiSpec?.enableInBuild ?? false);

      if (isPluginFile && shouldInject && routeFiles.length > 0) {
        return { code: injectPreload(code, routeFiles) };
      }
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
