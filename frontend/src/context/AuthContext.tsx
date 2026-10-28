import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, LoginCredentials, RegisterCredentials } from "../types";
import { authService } from "../api/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      // Calls backend POST /api/auth/logout to clear the HttpOnly cookie
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  }, []);

  // Sync session on mount (Browser automatically sends HttpOnly cookie to /auth/me)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user: profile } = await authService.getMe();
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Catch 401 unauthorized events dispatched by axios interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("assetflow:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("assetflow:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const data = await authService.login(credentials);
    // Backend sets HttpOnly cookie via Set-Cookie header; React updates user state
    setUser(data.user);
    return data.user;
  };

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    const data = await authService.register(credentials);
    // Backend sets HttpOnly cookie via Set-Cookie header; React updates user state
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
