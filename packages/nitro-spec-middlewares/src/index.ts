// Middleware types defined in this package

export type CustomMiddleware = {
  type: "custom";
  name: string;
  handler: (event: any) => Promise<void> | void;
  description?: string;
};

export type AuthMiddleware = {
  type: "auth";
  scheme: "bearer" | "basic" | "apikey" | "oauth2";
  description?: string;
  validate?: (token: string, event: any) => Promise<boolean> | boolean;
};

export type MiddlewareConfig = AuthMiddleware | CustomMiddleware;
