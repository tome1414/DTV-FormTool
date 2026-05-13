"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "applicant" | "admin";

export interface AuthUser {
  email: string;
  role: UserRole;
  userId: string; // maps to Applicant.id for applicants; "admin" for admins
}

const MOCK_CREDENTIALS: Array<{ email: string; password: string; role: UserRole; userId: string }> = [
  { email: "applicant@example.com", password: "password123", role: "applicant", userId: "1" },
  { email: "admin@example.com", password: "admin123", role: "admin", userId: "admin" },
];

const LS_KEY = "dtv_auth";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback((email: string, password: string): AuthUser | null => {
    const match = MOCK_CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    );
    if (!match) return null;
    const u: AuthUser = { email: match.email, role: match.role, userId: match.userId };
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
