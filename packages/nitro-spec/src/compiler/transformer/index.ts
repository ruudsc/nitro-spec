import type { UnpluginFactory } from "unplugin";

import { createUnplugin } from "unplugin";
import { scanFileMeta } from "./routes";
import { catchAllRouteRegex } from "./utils";
import { createJitiInstance, type JitiInstance } from "./runner";
import acorn from "acorn";
import { Options } from "../factories/types";
export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options,
) => {
  let jiti: JitiInstance;

  return {
    name: "nitro-openapi-plugin",
    sourcemap: false,
    async buildStart() {
      // jiti = await createJitiInstance();
    },
    transformInclude(id) {
      if (id.startsWith("\0")) {
        return false;
      }

      if (catchAllRouteRegex.test(id)) {
        console.warn("Catch-all routes are not supported");
        return false;
      }

      const isRoute = id.includes("/routes/");
      return isRoute && id.includes("nitro-test");
    },

    async transform(code, id) {
      const meta = await scanFileMeta(id, code);

      const program = acorn.parse(code, {
        ecmaVersion: 2020,
        sourceType: "module",
        locations: true,
        onComment: (block, text, start, end) => {
          console.log(block, text, start, end);
        },
      });

      return code;
    },
    buildEnd() {
      console.log("buildEnd");
    },
  };
};

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
