import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

/**
 * Generic database interface
 * Services should extend this with their specific database type
 */
export interface Database {
  query: Record<string, any>;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
  select: (...fields: any[]) => any;
}

export interface ServiceConfig<T = Database> {
  name: string;
  port: number;
  database: T;
  corsOrigins?: string[];
}

export interface ServiceContext<T = Database> {
  database: T;
  serviceName: string;
}

export type HonoService<T = Database> = Hono<{ Variables: ServiceContext<T> }>;

/**
 * Creates a standardized Hono service with common middleware
 */
export function createBaseService<T = Database>(config: ServiceConfig<T>): HonoService<T> {
  const app = new Hono<{ Variables: ServiceContext<T> }>();

  // Attach service context
  app.use(async (c, next) => {
    c.set("database", config.database);
    c.set("serviceName", config.name);
    await next();
  });

  // Common middleware
  app.use(logger());
  app.use(prettyJSON());
  app.use(
    cors({
      origin: config.corsOrigins || ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization", "X-Organization-Id", "X-User-Id"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    })
  );

  return app;
}

/**
 * Standard health check endpoint
 */
export function addHealthCheck<T = Database>(app: HonoService<T>, serviceName: string): void {
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      service: serviceName,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Standard error handlers
 */
export function addErrorHandlers<T = Database>(app: HonoService<T>): void {
  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Endpoint not found",
        },
      },
      404
    );
  });

  // Global error handler
  app.onError((err, c) => {
    const serviceName = c.get("serviceName");
    console.error(`[${serviceName}] Error:`, err);

    return c.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        },
      },
      500
    );
  });
}
