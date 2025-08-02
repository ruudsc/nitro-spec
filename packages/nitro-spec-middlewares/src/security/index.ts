import { H3Event, createError, getQuery, getHeader } from "h3";
import type { CustomMiddleware } from "nitro-spec";

type Event = H3Event<Request>;

/**
 * Configuration for CORS middleware
 */
export interface CORSConfig {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (event: Event) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  onLimitReached?: (event: Event) => void;
}

/**
 * Configuration for security headers
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  xFrameOptions?: "DENY" | "SAMEORIGIN" | string;
  xContentTypeOptions?: boolean;
  referrerPolicy?: string;
  strictTransportSecurity?: string;
  xXSSProtection?: string;
}

/**
 * Configuration for request filtering
 */
export interface RequestFilterConfig {
  blockedIPs?: string[];
  allowedIPs?: string[];
  blockedUserAgents?: (string | RegExp)[];
  blockedCountries?: string[];
  maxRequestsPerIP?: number;
}

/**
 * Creates a CORS middleware
 */
export function createCORSMiddleware(config: CORSConfig): CustomMiddleware {
  return {
    type: "custom",
    name: "cors",
    description: "Cross-Origin Resource Sharing (CORS) handler",
    handler: async (event: Event) => {
      const origin = getHeader(event, "origin");
      const method = event.node.req.method;

      // Handle preflight requests
      if (method === "OPTIONS") {
        if (config.methods) {
          event.node.res.setHeader(
            "Access-Control-Allow-Methods",
            config.methods.join(", "),
          );
        }

        if (config.allowedHeaders) {
          event.node.res.setHeader(
            "Access-Control-Allow-Headers",
            config.allowedHeaders.join(", "),
          );
        }

        if (config.maxAge) {
          event.node.res.setHeader(
            "Access-Control-Max-Age",
            config.maxAge.toString(),
          );
        }

        if (!config.preflightContinue) {
          event.node.res.statusCode = config.optionsSuccessStatus || 204;
          event.node.res.end();
          return;
        }
      }

      // Handle origin
      if (config.origin) {
        let allowedOrigin: string | boolean = false;

        if (typeof config.origin === "string") {
          allowedOrigin = config.origin === "*" || config.origin === origin;
        } else if (Array.isArray(config.origin)) {
          allowedOrigin = config.origin.includes(origin || "");
        } else if (typeof config.origin === "function") {
          allowedOrigin = config.origin(origin || "");
        }

        if (allowedOrigin) {
          event.node.res.setHeader(
            "Access-Control-Allow-Origin",
            typeof allowedOrigin === "string" ? allowedOrigin : origin || "*",
          );
        }
      }

      // Handle credentials
      if (config.credentials) {
        event.node.res.setHeader("Access-Control-Allow-Credentials", "true");
      }

      // Handle exposed headers
      if (config.exposedHeaders) {
        event.node.res.setHeader(
          "Access-Control-Expose-Headers",
          config.exposedHeaders.join(", "),
        );
      }
    },
  };
}

/**
 * Simple in-memory rate limiter (for production, use Redis or similar)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function createRateLimitMiddleware(
  config: RateLimitConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "rate-limit",
    description: `Rate limit: ${config.maxRequests} requests per ${config.windowMs}ms`,
    handler: async (event: Event) => {
      const key =
        config.keyGenerator ?
          config.keyGenerator(event)
        : event.node.req.socket.remoteAddress || "unknown";

      const now = Date.now();
      const resetTime = now + config.windowMs;

      let record = rateLimitStore.get(key);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime };
        rateLimitStore.set(key, record);
      } else {
        record.count++;
      }

      // Set rate limit headers
      event.node.res.setHeader(
        "X-RateLimit-Limit",
        config.maxRequests.toString(),
      );
      event.node.res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, config.maxRequests - record.count).toString(),
      );
      event.node.res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil(record.resetTime / 1000).toString(),
      );

      if (record.count > config.maxRequests) {
        if (config.onLimitReached) {
          config.onLimitReached(event);
        }

        throw createError({
          statusCode: 429,
          statusMessage: "Too Many Requests",
          data: {
            limit: config.maxRequests,
            windowMs: config.windowMs,
            retryAfter: Math.ceil((record.resetTime - now) / 1000),
          },
        });
      }
    },
  };
}

/**
 * Creates a security headers middleware
 */
export function createSecurityHeadersMiddleware(
  config: SecurityHeadersConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "security-headers",
    description: "Adds security headers to responses",
    handler: async (event: Event) => {
      if (config.contentSecurityPolicy) {
        event.node.res.setHeader(
          "Content-Security-Policy",
          config.contentSecurityPolicy,
        );
      }

      if (config.xFrameOptions) {
        event.node.res.setHeader("X-Frame-Options", config.xFrameOptions);
      }

      if (config.xContentTypeOptions) {
        event.node.res.setHeader("X-Content-Type-Options", "nosniff");
      }

      if (config.referrerPolicy) {
        event.node.res.setHeader("Referrer-Policy", config.referrerPolicy);
      }

      if (config.strictTransportSecurity) {
        event.node.res.setHeader(
          "Strict-Transport-Security",
          config.strictTransportSecurity,
        );
      }

      if (config.xXSSProtection) {
        event.node.res.setHeader("X-XSS-Protection", config.xXSSProtection);
      }
    },
  };
}

/**
 * Creates a request filtering middleware
 */
export function createRequestFilterMiddleware(
  config: RequestFilterConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "request-filter",
    description: "Filters requests based on IP, User-Agent, etc.",
    handler: async (event: Event) => {
      const clientIP = event.node.req.socket.remoteAddress;
      const userAgent = getHeader(event, "user-agent");

      // Check blocked IPs
      if (
        config.blockedIPs &&
        clientIP &&
        config.blockedIPs.includes(clientIP)
      ) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden: IP blocked",
        });
      }

      // Check allowed IPs (if specified, block all others)
      if (
        config.allowedIPs &&
        clientIP &&
        !config.allowedIPs.includes(clientIP)
      ) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden: IP not allowed",
        });
      }

      // Check blocked user agents
      if (config.blockedUserAgents && userAgent) {
        const isBlocked = config.blockedUserAgents.some((pattern) => {
          if (typeof pattern === "string") {
            return userAgent.includes(pattern);
          }
          return pattern.test(userAgent);
        });

        if (isBlocked) {
          throw createError({
            statusCode: 403,
            statusMessage: "Forbidden: User-Agent blocked",
          });
        }
      }
    },
  };
}

/**
 * Creates a request signature validation middleware
 */
export interface SignatureConfig {
  secret: string;
  header?: string;
  algorithm?: "sha256" | "sha1";
  tolerance?: number; // Time tolerance in seconds
}

export function createSignatureValidator(
  config: SignatureConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "signature-validator",
    description: "Validates request signatures",
    handler: async (event: Event) => {
      const headerName = config.header || "x-signature";
      const signature = getHeader(event, headerName);

      if (!signature) {
        throw createError({
          statusCode: 400,
          statusMessage: `Missing ${headerName} header`,
        });
      }

      // This is a simplified example. In practice, you'd:
      // 1. Read the request body
      // 2. Compute HMAC with the secret
      // 3. Compare with the provided signature
      // 4. Handle time-based signatures if needed

      // Placeholder validation
      if (!signature.startsWith("sha256=")) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid signature format",
        });
      }
    },
  };
}

/**
 * Creates a DDoS protection middleware
 */
export interface DDoSConfig {
  maxConcurrentRequests?: number;
  maxRequestsPerWindow?: number;
  windowMs?: number;
  banDuration?: number;
}

const ddosStore = new Map<
  string,
  {
    concurrent: number;
    requests: number[];
    banned: boolean;
    banEnd?: number;
  }
>();

export function createDDoSProtection(config: DDoSConfig): CustomMiddleware {
  return {
    type: "custom",
    name: "ddos-protection",
    description: "DDoS protection middleware",
    handler: async (event: Event) => {
      const clientIP = event.node.req.socket.remoteAddress || "unknown";
      const now = Date.now();

      let record = ddosStore.get(clientIP);
      if (!record) {
        record = { concurrent: 0, requests: [], banned: false };
        ddosStore.set(clientIP, record);
      }

      // Check if currently banned
      if (record.banned && record.banEnd && now < record.banEnd) {
        throw createError({
          statusCode: 429,
          statusMessage: "IP temporarily banned",
          data: { banEnd: record.banEnd },
        });
      } else if (record.banned && record.banEnd && now >= record.banEnd) {
        // Unban
        record.banned = false;
        record.banEnd = undefined;
        record.requests = [];
        record.concurrent = 0;
      }

      // Track concurrent requests
      record.concurrent++;

      // Clean up old request timestamps
      const windowMs = config.windowMs || 60000;
      record.requests = record.requests.filter((time) => now - time < windowMs);
      record.requests.push(now);

      // Check limits
      if (
        config.maxConcurrentRequests &&
        record.concurrent > config.maxConcurrentRequests
      ) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many concurrent requests",
        });
      }

      if (
        config.maxRequestsPerWindow &&
        record.requests.length > config.maxRequestsPerWindow
      ) {
        // Ban the IP
        record.banned = true;
        record.banEnd = now + (config.banDuration || 300000); // 5 minutes default

        throw createError({
          statusCode: 429,
          statusMessage: "Request limit exceeded - IP banned",
          data: { banEnd: record.banEnd },
        });
      }

      // Cleanup on response end
      event.node.res.on("finish", () => {
        if (record) {
          record.concurrent = Math.max(0, record.concurrent - 1);
        }
      });
    },
  };
}
