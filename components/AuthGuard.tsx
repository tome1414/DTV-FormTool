"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin" : "/mypage");
    }
  }, [user, requiredRole, router]);

  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;

  return <>{children}</>;
}
