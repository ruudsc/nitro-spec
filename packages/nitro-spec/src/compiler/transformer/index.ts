import type { UnpluginFactory } from "unplugin";

import { createUnplugin } from "unplugin";
import { scanFileMeta } from "./routes";
import { catchAllRouteRegex } from "./utils";
import { Options } from "../factories/types";
import { transformer } from "./transformer";
export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options,
) => {
  return {
    name: "nitro-openapi-plugin",
    sourcemap: false,
    async buildStart() {},
    transformInclude(id) {
      if (id.startsWith("\0")) {
        return false;
      }

      if (catchAllRouteRegex.test(id)) {
        console.warn("Catch-all routes are not supported");
        return false;
      }

      const isRoute = id.includes("/routes/");
      return isRoute;
    },

    async transform(code, id) {
      const meta = await scanFileMeta(id, code);
      const result = transformer(code, meta);
      /* 
      this.emitFile({
        type: "asset",
        fileName: meta.filename + ".ts.map",
        source: result.sourcemap,
      }); */

      return result.code;
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
