import { createVitePlugin } from "unplugin";
import { unpluginFactory } from "../transformer/unpluginFactory";

export default createVitePlugin(unpluginFactory);
