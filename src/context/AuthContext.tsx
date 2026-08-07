import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

const API_BASE = "/api";

export interface AuthUser {
  id: number;
  codeName: string;
  email: string;
  role: "user" | "admin" | "owner";
  status: "pending" | "approved" | "banned";
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; errorType?: string }>;
  signup: (codeName: string, email: string, password: string) => Promise<{ success: boolean; error?: string; errorType?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("gcs_token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("gcs_token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error === "BANNED") {
          setUser({ id: 0, codeName: "", email: "", role: "user", status: "banned" });
        } else {
          logout();
        }
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || data.error, errorType: data.error };
      }

      localStorage.setItem("gcs_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Is the server running?" };
    }
  };

  const signup = async (codeName: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeName, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || data.error, errorType: data.error };
      }

      return { success: true };
    } catch {
      return { success: false, error: "Network error. Is the server running?" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
