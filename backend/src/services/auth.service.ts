import { User, IUser } from "../models/User.model";
import { RegisterInput, LoginInput } from "../validations/auth.schema";
import { AppError } from "../utils/AppError";
import { generateToken } from "../utils/token";

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  token: string;
}

export class AuthService {
  /**
   * Registers a new user account and returns signed JWT
   */
  public static async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError("An account with this email address already exists", 409);
    }

    // Create user (password is automatically hashed by pre-save hook)
    const user = await User.create(input);

    // Generate JWT
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Verifies user credentials and returns signed JWT
   */
  public static async login(input: LoginInput): Promise<AuthResponse> {
    // Must explicitly select password because select: false is set in schema
    const user = await User.findOne({ email: input.email }).select("+password");

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Retrieves profile data for the authenticated user
   */
  public static async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
}

