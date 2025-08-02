import { createRollupPlugin } from "unplugin";
import { unpluginFactory } from "../transformer";

export default createRollupPlugin(unpluginFactory);
