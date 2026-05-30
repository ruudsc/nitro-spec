export interface ApiSpecOptions {
  /**
   * Whether to inject the OpenAPI preload in production builds.
   * When false (default), the preload is only injected during development (watch mode).
   */
  enableInBuild?: boolean;
}

export interface Options {
  /**
   * Path to the routes directory to scan for route files.
   * Defaults to `server/routes` relative to `process.cwd()`.
   */
  routesDir?: string;

  /**
   * Controls OpenAPI spec behaviour.
   */
  apiSpec?: ApiSpecOptions;
}
