import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "../validations/auth.schema";
import { authenticate } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// Public routes with brute-force rate limiting
router.post("/register", authLimiter, validate(registerSchema), AuthController.register);
router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);

// Protected routes
router.get("/me", authenticate, AuthController.getMe);

export const authRoutes = router;

