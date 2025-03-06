import { createNitroSpecPlugin } from "nitro-spec";
export default defineNitroPlugin((app) => {
  createNitroSpecPlugin({
    app,
    base: "/api",
  });
});
