import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger";
import { env } from "./config/env";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import { authRoutes } from "./routes/auth.routes";
import { productRoutes } from "./routes/product.routes";
import { requestRoutes } from "./routes/request.routes";
import { apiLimiter } from "./middlewares/rateLimiter.middleware";

export const createApp = (): Application => {
  const app: Application = express();

  // Security HTTP headers (CSP disabled so Swagger UI assets load without policy block)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  // CORS configuration with credentials support for HttpOnly cookies
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );

  // Cookie parser middleware
  app.use(cookieParser());

  // HTTP request logger
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  // Body parsers (1MB limit for standard JSON payloads)
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Static uploads serving
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  // Swagger Documentation UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Global API Rate Limiter
  app.use("/api", apiLimiter);

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/requests", requestRoutes);

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: "AssetFlow API",
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Root welcome endpoint
  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Welcome to AssetFlow - Asset & Equipment Allocation API",
      documentation: "/api-docs",
      healthCheck: "/api/health",
    });
  });

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

