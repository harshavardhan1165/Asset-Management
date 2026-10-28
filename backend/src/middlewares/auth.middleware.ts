import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";
import { AppError } from "../utils/AppError";
import { User } from "../models/User.model";
import { UserRoleType } from "../constants/roles";

/**
 * Middleware: Verifies Bearer JWT and loads user identity onto req.user
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined = undefined;

    // 1. Check HttpOnly cookie first
    if (req.cookies && req.cookies.assetflow_token) {
      token = req.cookies.assetflow_token;
    }
    // 2. Fall back to Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("Authentication required. Please log in or provide a valid Bearer token.", 401)
      );
    }

    // Verify token signature and expiration
    const decoded = verifyToken(token);

    // Verify that the user still exists in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // Attach user payload to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Restricts access to users holding one of the specified roles
 */
export const authorize = (...allowedRoles: UserRoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Unauthorized. Please log in.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Requires one of the following roles: [${allowedRoles.join(", ")}]`,
          403
        )
      );
    }

    next();
  };
};

