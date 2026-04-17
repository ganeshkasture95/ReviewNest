"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/auth-types";
import { roleHomePath } from "@/lib/auth-types";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (body: {
    name: string;
    email: string;
    password: string;
    address?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (raw && token) {
        setUser(JSON.parse(raw) as AuthUser);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setReady(true);
  }, []);

  const persist = useCallback((token: string, u: AuthUser) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{
        token: string;
        user: AuthUser;
      }>("/auth/login", { email, password });
      persist(data.token, data.user);
      router.push(roleHomePath(data.user.role));
    },
    [persist, router],
  );

  const signup = useCallback(
    async (body: {
      name: string;
      email: string;
      password: string;
      address?: string;
    }) => {
      const { data } = await api.post<{
        token: string;
        user: AuthUser;
      }>("/auth/signup", body);
      persist(data.token, data.user);
      router.push("/user/stores");
    },
    [persist, router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      signup,
      logout,
    }),
    [user, ready, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
