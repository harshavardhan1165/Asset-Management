import { apiClient } from "./client";
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", credentials);
    return res.data.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", credentials);
    return res.data.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
    return res.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
