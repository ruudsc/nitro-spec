import { spawn, type ChildProcess } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const port = 4317;
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let server: ChildProcess | undefined;

async function waitForServer() {
  const url = `http://127.0.0.1:${port}/api/openapi.json`;

  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }

  throw new Error(`Nitro test server did not start on ${url}`);
}

export default async function setup() {
  await new Promise<void>((resolve, reject) => {
    const build = spawn("pnpm", ["exec", "nitro", "build"], {
      cwd: appDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    build.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`nitro build failed with exit code ${code}`));
    });
  });

  server = spawn("node", [".output/server/index.mjs"], {
    cwd: appDir,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: "inherit",
  });

  await waitForServer();

  return () => {
    server?.kill();
  };
}
