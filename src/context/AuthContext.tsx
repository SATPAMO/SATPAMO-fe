import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, type DosenUser } from "../lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  dosen: DosenUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("sama_token");
  });
  const [dosen, setDosen] = useState<DosenUser | null>(() => {
    const stored = localStorage.getItem("sama_user");
    return stored ? JSON.parse(stored) : null;
  });

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem("sama_token");
    if (token) {
      authApi.me().then((res) => {
        if (res.success && res.data?.dosen) {
          setDosen(res.data.dosen);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear
          localStorage.removeItem("sama_token");
          localStorage.removeItem("sama_user");
          setIsAuthenticated(false);
          setDosen(null);
        }
      }).catch(() => {
        // Backend tidak tersedia, tetap pakai cached state
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const res = await authApi.login(email, password);

    if (res.success && res.data) {
      const { dosen: dosenData, token } = res.data;
      localStorage.setItem("sama_token", token);
      localStorage.setItem("sama_user", JSON.stringify(dosenData));
      setIsAuthenticated(true);
      setDosen(dosenData);
      return { success: true };
    }

    return {
      success: false,
      message: res.message || "Login gagal. Periksa email dan password.",
    };
  };

  const logout = () => {
    localStorage.removeItem("sama_token");
    localStorage.removeItem("sama_user");
    setIsAuthenticated(false);
    setDosen(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, dosen, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
