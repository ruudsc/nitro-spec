type PreloadFn = () => Promise<void>;

let preloadFn: PreloadFn | undefined;

export function setNitroSpecPreload(fn: PreloadFn): void {
  preloadFn = fn;
}

export async function runNitroSpecPreload(): Promise<void> {
  if (preloadFn) {
    await preloadFn();
    preloadFn = undefined;
  }
}
