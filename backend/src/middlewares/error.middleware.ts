import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { cleanupUploadedFiles } from "./fileCleanup.middleware";

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
}

export const errorHandler = (
  err: Error | AppError | MongoError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Purge any orphan files uploaded during the failed request
  cleanupUploadedFiles(req);

  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown = undefined;

  // 1. Handled operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // 2. Mongoose CastError (e.g. invalid ObjectId)
  else if (err.name === "CastError") {
    const castErr = err as MongoError;
    statusCode = 400;
    message = `Invalid format for field '${castErr.path}': ${String(castErr.value)}`;
  }
  // 3. Mongoose Duplicate Key Error (e.g. unique email)
  else if ((err as MongoError).code === 11000) {
    const mongoErr = err as MongoError;
    statusCode = 409;
    const duplicatedKeys = mongoErr.keyValue ? Object.keys(mongoErr.keyValue).join(", ") : "field";
    message = `Duplicate value for unique field: ${duplicatedKeys}. Please provide a different value.`;
  }
  // 4. Mongoose ValidationError
  else if (err.name === "ValidationError") {
    const valErr = err as MongoError;
    statusCode = 400;
    message = "Database validation failed";
    if (valErr.errors) {
      errors = Object.values(valErr.errors).map((e) => e.message);
    }
  }
  // 5. JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired. Please log in again.";
  }
  // 6. Multer errors
  else if (err.name === "MulterError") {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }
  // 7. Unhandled exceptions
  else {
    console.error("💥 Unhandled Error:", err);
    if (env.NODE_ENV === "development") {
      message = err.message || message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

