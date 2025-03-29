import { createRollupPlugin } from "unplugin";
import { unpluginFactory } from "../transformer/unpluginFactory";

export default createRollupPlugin(unpluginFactory);
