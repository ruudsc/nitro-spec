import { createEsbuildPlugin } from "unplugin";
import { unpluginFactory } from "../transformer/unpluginFactory";

export default createEsbuildPlugin(unpluginFactory);
