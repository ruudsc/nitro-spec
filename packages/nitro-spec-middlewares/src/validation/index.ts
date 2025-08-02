import { H3Event, createError, getQuery, getRouterParams, readBody } from "h3";
import { z } from "zod";
import type { CustomMiddleware } from "../index";

type Event = H3Event<Request>;

/**
 * Configuration for request size validation
 */
export interface RequestSizeConfig {
  maxBodySize?: number; // in bytes
  maxQueryParams?: number;
  maxHeaders?: number;
}

/**
 * Configuration for content type validation
 */
export interface ContentTypeConfig {
  allowed: string[];
  strict?: boolean; // If true, rejects requests with unsupported content types
}

/**
 * Configuration for request sanitization
 */
export interface SanitizationConfig {
  removeNullBytes?: boolean;
  trimStrings?: boolean;
  removeEmptyStrings?: boolean;
  maxStringLength?: number;
}

/**
 * Creates a middleware to validate request size limits
 */
export function createRequestSizeValidator(
  config: RequestSizeConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "request-size-validator",
    description: "Validates request size limits",
    handler: async (event: Event) => {
      // Check body size
      if (config.maxBodySize && event.node.req.headers["content-length"]) {
        const contentLength = parseInt(
          event.node.req.headers["content-length"],
        );
        if (contentLength > config.maxBodySize) {
          throw createError({
            statusCode: 413,
            statusMessage: "Request body too large",
            data: { maxSize: config.maxBodySize, actualSize: contentLength },
          });
        }
      }

      // Check query parameters count
      if (config.maxQueryParams) {
        const query = getQuery(event) as Record<string, any>;
        const paramCount = Object.keys(query).length;
        if (paramCount > config.maxQueryParams) {
          throw createError({
            statusCode: 400,
            statusMessage: "Too many query parameters",
            data: {
              maxParams: config.maxQueryParams,
              actualParams: paramCount,
            },
          });
        }
      }

      // Check headers count
      if (config.maxHeaders) {
        const headerCount = Object.keys(event.node.req.headers).length;
        if (headerCount > config.maxHeaders) {
          throw createError({
            statusCode: 400,
            statusMessage: "Too many headers",
            data: { maxHeaders: config.maxHeaders, actualHeaders: headerCount },
          });
        }
      }
    },
  };
}

/**
 * Creates a middleware to validate content types
 */
export function createContentTypeValidator(
  config: ContentTypeConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "content-type-validator",
    description: `Validates content type is one of: ${config.allowed.join(", ")}`,
    handler: async (event: Event) => {
      const contentType = event.node.req.headers["content-type"];

      if (!contentType && config.strict) {
        throw createError({
          statusCode: 400,
          statusMessage: "Content-Type header required",
        });
      }

      if (contentType) {
        const baseType = contentType.split(";")[0].trim().toLowerCase();
        const isAllowed = config.allowed.some(
          (allowed) => baseType === allowed.toLowerCase(),
        );

        if (!isAllowed) {
          throw createError({
            statusCode: 415,
            statusMessage: "Unsupported Media Type",
            data: {
              allowed: config.allowed,
              received: baseType,
            },
          });
        }
      }
    },
  };
}

/**
 * Creates a middleware to sanitize request data
 */
export function createRequestSanitizer(
  config: SanitizationConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "request-sanitizer",
    description: "Sanitizes request data",
    handler: async (event: Event) => {
      // Sanitize query parameters
      if (
        config.removeNullBytes ||
        config.trimStrings ||
        config.removeEmptyStrings ||
        config.maxStringLength
      ) {
        const query = getQuery(event) as Record<string, any>;
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === "string") {
            let sanitized = value;

            if (config.removeNullBytes) {
              sanitized = sanitized.replace(/\0/g, "");
            }

            if (config.trimStrings) {
              sanitized = sanitized.trim();
            }

            if (config.removeEmptyStrings && sanitized === "") {
              delete (query as any)[key];
              continue;
            }

            if (
              config.maxStringLength &&
              sanitized.length > config.maxStringLength
            ) {
              sanitized = sanitized.substring(0, config.maxStringLength);
            }

            (query as any)[key] = sanitized;
          }
        }
      }

      // Note: Body and params sanitization would happen after parsing
      // This could be extended to sanitize those as well
    },
  };
}

/**
 * Creates a middleware to validate specific fields using Zod schemas
 */
export function createSchemaValidator<T extends z.ZodSchema>(
  schema: T,
  source: "body" | "query" | "params" = "body",
): CustomMiddleware {
  return {
    type: "custom",
    name: `schema-validator-${source}`,
    description: `Validates ${source} against schema`,
    handler: async (event: Event) => {
      let data: any;

      try {
        switch (source) {
          case "body":
            data = await readBody(event);
            break;
          case "query":
            data = getQuery(event);
            break;
          case "params":
            data = getRouterParams(event);
            break;
        }

        const result = schema.safeParse(data);

        if (!result.success) {
          throw createError({
            statusCode: 400,
            statusMessage: "Validation Error",
            data: {
              source,
              errors: result.error.issues.map((err: any) => ({
                path: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            },
          });
        }

        // Store validated data in context for later use
        event.context[
          `validated${source.charAt(0).toUpperCase() + source.slice(1)}`
        ] = result.data;
      } catch (error: any) {
        if (error?.statusCode) {
          throw error;
        }

        throw createError({
          statusCode: 400,
          statusMessage: `Failed to validate ${source}`,
          data: { source, error: error?.message || "Unknown error" },
        });
      }
    },
  };
}

/**
 * Creates a middleware to validate file uploads
 */
export interface FileUploadConfig {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  requiredFields?: string[];
}

export function createFileUploadValidator(
  config: FileUploadConfig,
): CustomMiddleware {
  return {
    type: "custom",
    name: "file-upload-validator",
    description: "Validates file uploads",
    handler: async (event: Event) => {
      const contentType = event.node.req.headers["content-type"];

      if (!contentType || !contentType.includes("multipart/form-data")) {
        return; // Not a file upload, skip validation
      }

      // This is a simplified example. In practice, you'd need a proper
      // multipart parser to validate files
      if (config.maxFileSize && event.node.req.headers["content-length"]) {
        const contentLength = parseInt(
          event.node.req.headers["content-length"],
        );
        if (contentLength > config.maxFileSize) {
          throw createError({
            statusCode: 413,
            statusMessage: "File too large",
            data: { maxSize: config.maxFileSize, actualSize: contentLength },
          });
        }
      }
    },
  };
}

/**
 * Creates a middleware to validate request timing (prevent replay attacks)
 */
export interface TimingConfig {
  maxAge?: number; // Maximum age in seconds
  clockSkew?: number; // Allowed clock skew in seconds
}

export function createTimingValidator(config: TimingConfig): CustomMiddleware {
  return {
    type: "custom",
    name: "timing-validator",
    description: "Validates request timing to prevent replay attacks",
    handler: async (event: Event) => {
      const timestamp = event.node.req.headers["x-timestamp"];

      if (!timestamp) {
        throw createError({
          statusCode: 400,
          statusMessage: "X-Timestamp header required",
        });
      }

      const requestTime = parseInt(timestamp as string);
      const currentTime = Math.floor(Date.now() / 1000);
      const clockSkew = config.clockSkew || 300; // 5 minutes default
      const maxAge = config.maxAge || 3600; // 1 hour default

      if (isNaN(requestTime)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid timestamp format",
        });
      }

      const timeDiff = Math.abs(currentTime - requestTime);

      if (timeDiff > clockSkew) {
        throw createError({
          statusCode: 400,
          statusMessage: "Request timestamp outside allowed range",
          data: {
            currentTime,
            requestTime,
            timeDiff,
            allowedSkew: clockSkew,
          },
        });
      }

      if (currentTime - requestTime > maxAge) {
        throw createError({
          statusCode: 400,
          statusMessage: "Request too old",
          data: {
            age: currentTime - requestTime,
            maxAge,
          },
        });
      }
    },
  };
}
