"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialized = useRef(false);

  /* =========================
     LOAD USER (SAFE REFRESH)
  ========================= */
  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  }, []);

  /* =========================
     INIT APP (RUN ONCE ONLY)
  ========================= */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        await refreshUser();
      } catch (e) {
        console.error("Failed to load user:", e);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [refreshUser]);

  /* =========================
     LOGIN (OPTIMISTIC UPDATE)
  ========================= */
  const login = async (email: string, password: string) => {
    await authApi.login(email, password);

    // immediately refresh user session
    await refreshUser();

    router.push("/dashboard");
  };

  /* =========================
     LOGOUT (CLEAN STATE RESET)
  ========================= */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setUser(null);
      router.replace("/login");
    }
  };

  /* =========================
     VALUE
  ========================= */
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user?._id, // stronger check than Boolean(user)
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}