import { js } from "./codeTemplate";

export function injectPreload(code: string, routeFiles: string[]): string {
  const imports = routeFiles.map((f) => `    import(${JSON.stringify(f)})`).join(",\n");

  const preload = js`
import { setNitroSpecPreload } from "nitro-spec";
setNitroSpecPreload(async () => {
  await Promise.all([
${imports}
  ]);
});
`.trimStart();

  return preload + code;
}
