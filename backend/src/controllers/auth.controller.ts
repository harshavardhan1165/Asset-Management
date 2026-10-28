import { Request, Response, CookieOptions } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthService } from "../services/auth.service";
import { env } from "../config/env";

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: "/",
});

export class AuthController {
  /**
   * POST /api/auth/register
   */
  public static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    // Set secure HttpOnly session cookie
    res.cookie("assetflow_token", result.token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  });

  /**
   * POST /api/auth/login
   */
  public static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    // Set secure HttpOnly session cookie
    res.cookie("assetflow_token", result.token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  });

  /**
   * POST /api/auth/logout
   */
  public static logout = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("assetflow_token", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });

  /**
   * GET /api/auth/me
   */
  public static getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.getMe(req.user!.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  });
}


