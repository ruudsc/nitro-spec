import { H3Event, createError, getQuery, getHeader } from "h3";
import type { CustomMiddleware } from "nitro-spec";

type Event = H3Event<Request>;

/**
 * Creates a custom middleware with a given name and handler function
 * @param name - The name of the middleware
 * @param handler - The middleware handler function
 * @param description - Optional description for the middleware
 * @returns CustomMiddleware instance
 */
export function createCustomMiddleware(
  name: string,
  handler: (event: H3Event<Request>) => Promise<void> | void,
  description?: string,
): CustomMiddleware {
  return {
    type: "custom",
    name,
    handler,
    description: description || `Custom middleware: ${name}`,
  };
}

/**
 * Configuration for request logging
 */
export interface LoggingConfig {
  includeBody?: boolean;
  includeHeaders?: boolean;
  includeQuery?: boolean;
  excludeHeaders?: string[];
  logLevel?: "debug" | "info" | "warn" | "error";
  onLog?: (logData: any) => void;
}

/**
 * Configuration for request tracing
 */
export interface TracingConfig {
  headerName?: string;
  generateTraceId?: () => string;
  propagateHeaders?: string[];
}

/**
 * Configuration for caching
 */
export interface CacheConfig {
  maxAge?: number;
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  etag?: boolean;
  lastModified?: boolean;
}

/**
 * Configuration for compression
 */
export interface CompressionConfig {
  threshold?: number; // Minimum size to compress
  algorithms?: ("gzip" | "deflate" | "br")[];
  level?: number; // Compression level
}

/**
 * Creates a request logging middleware
 */
export function createLoggingMiddleware(
  config: LoggingConfig = {},
): CustomMiddleware {
  return {
    type: "custom",
    name: "request-logger",
    description: "Logs request and response information",
    handler: async (event: Event) => {
      const startTime = Date.now();

      const logData: any = {
        timestamp: new Date().toISOString(),
        method: event.node.req.method,
        url: event.node.req.url,
        userAgent: getHeader(event, "user-agent"),
        ip: event.node.req.socket.remoteAddress,
        traceId: event.context.traceId,
      };

      if (config.includeQuery) {
        logData.query = getQuery(event);
      }

      if (config.includeHeaders) {
        const headers = { ...event.node.req.headers };

        // Remove excluded headers
        if (config.excludeHeaders) {
          config.excludeHeaders.forEach((header) => {
            delete headers[header.toLowerCase()];
          });
        }

        logData.headers = headers;
      }

      // Log on response finish
      event.node.res.on("finish", () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const responseLogData = {
          ...logData,
          statusCode: event.node.res.statusCode,
          duration: `${duration}ms`,
          responseSize: event.node.res.getHeader("content-length"),
        };

        if (config.onLog) {
          config.onLog(responseLogData);
        } else {
          console.log(JSON.stringify(responseLogData, null, 2));
        }
      });
    },
  };
}

/**
 * Creates a request tracing middleware
 */
export function createTracingMiddleware(
  config: TracingConfig = {},
): CustomMiddleware {
  const headerName = config.headerName || "x-trace-id";
  const generateTraceId =
    config.generateTraceId ||
    (() => Math.random().toString(36).substring(2) + Date.now().toString(36));

  return {
    type: "custom",
    name: "request-tracer",
    description: "Adds tracing information to requests",
    handler: async (event: Event) => {
      // Get or generate trace ID
      let traceId = getHeader(event, headerName);
      if (!traceId) {
        traceId = generateTraceId();
      }

      // Store in context
      event.context.traceId = traceId;

      // Add to response headers
      event.node.res.setHeader(headerName, traceId);

      // Propagate other headers if specified
      if (config.propagateHeaders) {
        config.propagateHeaders.forEach((header) => {
          const value = getHeader(event, header);
          if (value) {
            event.node.res.setHeader(header, value);
          }
        });
      }
    },
  };
}

/**
 * Creates a cache control middleware
 */
export function createCacheControlMiddleware(
  config: CacheConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "cache-control",
    description: "Sets cache control headers",
    handler: async (event: Event) => {
      const directives: string[] = [];

      if (config.public) directives.push("public");
      if (config.private) directives.push("private");
      if (config.noCache) directives.push("no-cache");
      if (config.noStore) directives.push("no-store");
      if (config.mustRevalidate) directives.push("must-revalidate");
      if (config.maxAge !== undefined)
        directives.push(`max-age=${config.maxAge}`);

      if (directives.length > 0) {
        event.node.res.setHeader("Cache-Control", directives.join(", "));
      }

      // Set ETag if enabled
      if (config.etag) {
        event.node.res.on("finish", () => {
          // Simple ETag generation based on content length and last modified
          const contentLength = event.node.res.getHeader("content-length");
          const lastModified =
            event.node.res.getHeader("last-modified") || Date.now();

          if (contentLength) {
            const etag = `"${contentLength}-${
              typeof lastModified === "string" ?
                new Date(lastModified).getTime()
              : lastModified
            }"`;
            event.node.res.setHeader("ETag", etag);
          }
        });
      }

      // Set Last-Modified if enabled
      if (config.lastModified) {
        event.node.res.setHeader("Last-Modified", new Date().toUTCString());
      }
    },
  };
}

/**
 * Creates a request timeout middleware
 */
export function createTimeoutMiddleware(timeoutMs: number): CustomMiddleware {
  return {
    type: "custom",
    name: "request-timeout",
    description: `Request timeout: ${timeoutMs}ms`,
    handler: async (event: Event) => {
      const timeout = setTimeout(() => {
        if (!event.node.res.headersSent) {
          throw createError({
            statusCode: 408,
            statusMessage: "Request Timeout",
            data: { timeout: timeoutMs },
          });
        }
      }, timeoutMs);

      // Clear timeout when response finishes
      event.node.res.on("finish", () => {
        clearTimeout(timeout);
      });

      // Clear timeout on error
      event.node.res.on("error", () => {
        clearTimeout(timeout);
      });
    },
  };
}

/**
 * Creates a request ID middleware
 */
export function createRequestIdMiddleware(
  headerName = "x-request-id",
): CustomMiddleware {
  return {
    type: "custom",
    name: "request-id",
    description: "Adds unique request ID",
    handler: async (event: Event) => {
      const requestId = crypto.randomUUID();
      event.context.requestId = requestId;
      event.node.res.setHeader(headerName, requestId);
    },
  };
}

/**
 * Creates a health check middleware
 */
export interface HealthCheckConfig {
  path?: string;
  checks?: Array<{
    name: string;
    check: () => Promise<boolean> | boolean;
  }>;
}

export function createHealthCheckMiddleware(
  config: HealthCheckConfig = {},
): CustomMiddleware {
  const path = config.path || "/health";

  return {
    type: "custom",
    name: "health-check",
    description: `Health check endpoint: ${path}`,
    handler: async (event: Event) => {
      if (event.node.req.url !== path) {
        return; // Not a health check request
      }

      const results: any = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      if (config.checks) {
        results.checks = {};

        for (const check of config.checks) {
          try {
            const result = await check.check();
            results.checks[check.name] = { status: result ? "ok" : "fail" };
          } catch (error) {
            results.checks[check.name] = {
              status: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }

        // Set overall status based on checks
        const hasFailures = Object.values(results.checks).some(
          (check: any) => check.status !== "ok",
        );

        if (hasFailures) {
          results.status = "degraded";
          event.node.res.statusCode = 503;
        }
      }

      event.node.res.setHeader("Content-Type", "application/json");
      event.node.res.end(JSON.stringify(results, null, 2));
    },
  };
}

/**
 * Creates a graceful shutdown middleware
 */
export function createGracefulShutdownMiddleware(): CustomMiddleware {
  let isShuttingDown = false;

  // Listen for shutdown signals
  process.on("SIGTERM", () => {
    isShuttingDown = true;
  });

  process.on("SIGINT", () => {
    isShuttingDown = true;
  });

  return {
    type: "custom",
    name: "graceful-shutdown",
    description: "Handles graceful shutdown",
    handler: async (event: Event) => {
      if (isShuttingDown) {
        event.node.res.setHeader("Connection", "close");
        throw createError({
          statusCode: 503,
          statusMessage: "Service Unavailable - Server is shutting down",
        });
      }
    },
  };
}

/**
 * Creates a request metrics middleware
 */
export interface MetricsConfig {
  onMetric?: (metric: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    timestamp: number;
  }) => void;
}

export function createMetricsMiddleware(
  config: MetricsConfig = {},
): CustomMiddleware {
  return {
    type: "custom",
    name: "metrics",
    description: "Collects request metrics",
    handler: async (event: Event) => {
      const startTime = Date.now();

      event.node.res.on("finish", () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const metric = {
          method: event.node.req.method || "unknown",
          path: event.node.req.url || "/",
          statusCode: event.node.res.statusCode,
          duration,
          timestamp: endTime,
        };

        if (config.onMetric) {
          config.onMetric(metric);
        }
      });
    },
  };
}
