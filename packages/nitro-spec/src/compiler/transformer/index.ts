import type { UnpluginFactory } from "unplugin";

import { createUnplugin } from "unplugin";
import { scanPathMeta } from "./scanPathMeta";
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

      const isRoute = id.includes("/routes/");
      return isRoute;
    },

    async transform(code, id) {
      const meta = await scanPathMeta(id);
      const result = transformer(code, meta);

      return {
        code: result.code,
        map: result.sourcemap,
      };
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
