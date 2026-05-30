import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const routeFilePattern = /\.(ts|mts|js|mjs)$/;

function scanDir(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...scanDir(full));
    } else if (routeFilePattern.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

export function collectRouteFiles(routesDir?: string): string[] {
  const dir = routesDir ? resolve(routesDir) : resolve(process.cwd(), "server/routes");
  return scanDir(dir);
}
