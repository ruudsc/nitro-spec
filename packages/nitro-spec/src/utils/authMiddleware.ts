// This file is only for type definitions used in the core package
// Middleware implementations are in @nitro-spec/middlewares

/** Custom middleware configuration */
export type CustomMiddleware = {
  type: 'custom';
  name: string;
  handler: (event: any) => Promise<void> | void;
  description?: string;
};

/** General middleware configuration */
export type MiddlewareConfig = CustomMiddleware;
