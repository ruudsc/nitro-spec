/// <reference types="zod-extensions">
import * as zodToOpenApi from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

zodToOpenApi.extendZodWithOpenApi(z);

export { z, zodToOpenApi };
