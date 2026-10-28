import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

// Response Interceptor: Catch 401 Unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't auto-logout if login/register or initial auth check (/auth/me) returned 401
      const isAuthUrl =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register") ||
        error.config?.url?.includes("/auth/me");
      if (!isAuthUrl) {
        window.dispatchEvent(new CustomEvent("assetflow:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);
