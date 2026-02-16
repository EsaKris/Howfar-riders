"use client";

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, getApiError } from "@/lib/api";
import {
  saveTokens, saveUser, clearAuth,
  getStoredUser, getRefreshToken,
} from "@/lib/tokens";
import type { User, AuthTokens } from "@/types";

// ── Context shape ─────────────────────────────────────────────────────────

interface AuthContextValue {
  user:          User | null;
  loading:       boolean;
  login:         (tokens: AuthTokens, user: User) => void;
  logout:        () => Promise<void>;
  refreshUser:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount: hydrate from localStorage, then verify token with backend
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);

    (async () => {
      try {
        const { data } = await authApi.me();
        setUser(data);
        saveUser(data);
      } catch {
        // Token expired or invalid — clear and let middleware redirect
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback((tokens: AuthTokens, userData: User) => {
    saveTokens(tokens);
    saveUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // Best effort
    } finally {
      clearAuth();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data);
    saveUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
