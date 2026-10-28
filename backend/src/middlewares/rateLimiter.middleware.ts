import rateLimit from "express-rate-limit";
import { AppError } from "../utils/AppError";

/**
 * Strict rate limiter for authentication endpoints (Login, Register)
 * Limits each IP to 10 requests per 15-minute window to prevent brute-force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many authentication attempts from this IP. Please try again after 15 minutes.",
        429
      )
    );
  },
});

/**
 * General API rate limiter
 * Limits each IP to 300 requests per 15-minute window to prevent DoS flooding
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many requests from this IP address. Please slow down.",
        429
      )
    );
  },
});

