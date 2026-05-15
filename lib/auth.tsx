"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type UserRole = "applicant" | "admin" | "superadmin";

export interface AuthUser {
  email: string;
  role: UserRole;
  userId: string;
  name?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  nationality?: string;
  consulateId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    lastName: string,
    firstName: string,
    middleName: string,
    nationality: string,
    consulateId: string
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  updateProfile: (
    updates: Partial<Pick<AuthUser, "nationality" | "consulateId">>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 初期化: Cookie のセッションから現在ユーザーを復元
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Supabase Auth のセッション変化を監視（タブ間同期）
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser | null> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const { user: u } = await res.json();
      setUser(u);
      return u;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      lastName: string,
      firstName: string,
      middleName: string,
      nationality: string,
      consulateId: string
    ): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, password, lastName, firstName,
          middleName: middleName || undefined,
          nationality, consulateId,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        return { success: false, error: body.error ?? "登録に失敗しました。" };
      }

      // 登録後に自動ログイン
      const loggedIn = await login(email, password);
      return { success: true, user: loggedIn ?? undefined };
    },
    [login]
  );

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<AuthUser, "nationality" | "consulateId">>
    ): Promise<void> => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const { user: u } = await res.json();
        setUser(u);
      }
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
