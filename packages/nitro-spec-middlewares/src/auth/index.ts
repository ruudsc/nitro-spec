import { H3Event, createError } from "h3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { AuthMiddleware, CustomMiddleware } from "../index";

type Event = H3Event<Request>;

// JWT Configuration
export interface JWTConfig {
  secret: string;
  algorithm?: jwt.Algorithm;
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
}

// Basic Auth Configuration
export interface BasicAuthConfig {
  users: Record<string, string>; // username -> password hash
  realm?: string;
}

// API Key Configuration
export interface ApiKeyConfig {
  keys: Set<string> | string[];
  header?: string;
  query?: string;
}

// OAuth2 Configuration
export interface OAuth2Config {
  introspectionEndpoint: string;
  clientId: string;
  clientSecret: string;
  requiredScopes?: string[];
}

/**
 * Creates a JWT authentication middleware
 */
export function createJWTAuthMiddleware(config: JWTConfig): AuthMiddleware {
  return {
    type: "auth",
    scheme: "bearer",
    description: "JWT Bearer token authentication",
    async validate(token: string, event: Event) {
      try {
        const payload = jwt.verify(token, config.secret, {
          algorithms: [config.algorithm || "HS256"],
          issuer: config.issuer,
          audience: config.audience,
        }) as jwt.JwtPayload;

        // Set user context
        event.context.user = payload;
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}

/**
 * Creates a Basic authentication middleware
 */
export function createBasicAuthMiddleware(
  config: BasicAuthConfig,
): AuthMiddleware {
  return {
    type: "auth",
    scheme: "basic",
    description: "HTTP Basic authentication",
    async validate(token: string, event: Event) {
      try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const [username, password] = decoded.split(":");

        if (!username || !password) {
          return false;
        }

        const hashedPassword = config.users[username];
        if (!hashedPassword) {
          return false;
        }

        const isValid = await bcrypt.compare(password, hashedPassword);
        if (isValid) {
          event.context.user = { username };
          return true;
        }

        return false;
      } catch (error) {
        return false;
      }
    },
  };
}

/**
 * Creates an API Key authentication middleware
 */
export function createApiKeyAuthMiddleware(
  config: ApiKeyConfig,
): AuthMiddleware {
  const validKeys = new Set(
    Array.isArray(config.keys) ? config.keys : [...config.keys],
  );

  return {
    type: "auth",
    scheme: "apikey",
    description: "API Key authentication",
    async validate(token: string, event: Event) {
      // Check header
      if (config.header) {
        const headerValue = event.node.req.headers[config.header.toLowerCase()];
        if (headerValue && validKeys.has(headerValue as string)) {
          event.context.apiKey = headerValue;
          return true;
        }
      }

      // Check query parameter
      if (config.query) {
        const url = new URL(
          event.node.req.url!,
          `http://${event.node.req.headers.host}`,
        );
        const queryValue = url.searchParams.get(config.query);
        if (queryValue && validKeys.has(queryValue)) {
          event.context.apiKey = queryValue;
          return true;
        }
      }

      // Check token directly
      return validKeys.has(token);
    },
  };
}

/**
 * Creates an OAuth2 token introspection middleware
 */
export function createOAuth2Middleware(config: OAuth2Config): AuthMiddleware {
  return {
    type: "auth",
    scheme: "bearer",
    description: "OAuth2 token introspection",
    async validate(token: string, event: Event) {
      try {
        const response = await fetch(config.introspectionEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
          },
          body: `token=${encodeURIComponent(token)}`,
        });

        if (!response.ok) {
          return false;
        }

        const result = await response.json();

        if (!result.active) {
          return false;
        }

        // Check required scopes
        if (config.requiredScopes && config.requiredScopes.length > 0) {
          const tokenScopes = result.scope ? result.scope.split(" ") : [];
          const hasRequiredScopes = config.requiredScopes.every((scope) =>
            tokenScopes.includes(scope),
          );

          if (!hasRequiredScopes) {
            return false;
          }
        }

        event.context.user = result;
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}

/**
 * Creates a custom role-based authorization middleware
 */
export function createRoleAuthMiddleware(
  requiredRoles: string[],
): CustomMiddleware {
  return {
    type: "custom",
    name: "role-auth",
    description: `Requires one of: ${requiredRoles.join(", ")}`,
    handler: async (event: Event) => {
      const user = event.context.user;

      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentication required",
        });
      }

      const userRoles = user.roles || [];
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        throw createError({
          statusCode: 403,
          statusMessage: "Insufficient permissions",
        });
      }
    },
  };
}

/**
 * Utility to hash passwords for Basic Auth
 */
export async function hashPassword(
  password: string,
  saltRounds = 10,
): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Utility to generate JWT tokens
 */
export function generateJWT(payload: object, config: JWTConfig): string {
  const options: jwt.SignOptions = {
    algorithm: config.algorithm || "HS256",
  };

  if (config.expiresIn) options.expiresIn = config.expiresIn as any;
  if (config.issuer) options.issuer = config.issuer;
  if (config.audience) options.audience = config.audience;

  return jwt.sign(payload, config.secret, options);
}
