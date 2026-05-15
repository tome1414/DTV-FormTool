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

  const roleOk = !requiredRole ||
    user?.role === requiredRole ||
    (requiredRole === "admin" && user?.role === "superadmin");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!roleOk) {
      router.replace(user.role === "applicant" ? "/mypage" : "/admin");
    }
  }, [user, roleOk, router]);

  if (!user) return null;
  if (!roleOk) return null;

  return <>{children}</>;
}
