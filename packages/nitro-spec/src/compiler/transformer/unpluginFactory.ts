import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";

import { Options } from "../factories/types";
import { scanPathMeta } from "./scanPathMeta";
import { transformer } from "./transformer";

export const unpluginFactory: UnpluginFactory<Options | undefined> = (_options) => {
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
      const meta = scanPathMeta(id);
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
