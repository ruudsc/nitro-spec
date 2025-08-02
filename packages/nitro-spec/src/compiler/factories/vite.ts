import { createVitePlugin } from "unplugin";
import { unpluginFactory } from "../transformer";

export default createVitePlugin(unpluginFactory);
