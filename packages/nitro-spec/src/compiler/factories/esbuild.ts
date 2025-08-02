import { createEsbuildPlugin } from "unplugin";
import { unpluginFactory } from "../transformer";

export default createEsbuildPlugin(unpluginFactory);
