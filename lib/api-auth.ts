import { createSupabaseServer } from "./supabase-server";
import { supabaseAdmin } from "./supabase";
import { NextResponse } from "next/server";

export type SessionUser = {
  userId: string;
  email: string;
  role: "applicant" | "admin" | "superadmin";
};

/**
 * API Route からセッションユーザーを取得する。
 * 未認証の場合は null を返す。
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email!,
    role: (profile?.role ?? "applicant") as SessionUser["role"],
  };
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "admin" || user.role === "superadmin";
}

/** 未認証時に返す 401 レスポンス */
export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** 権限不足時に返す 403 レスポンス */
export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

/**
 * 申請者が指定した applicationId を所有しているか検証する。
 * 管理者はすべて許可。未認証・権限なしは false を返す。
 */
export async function canAccessApplication(
  sessionUser: SessionUser,
  applicationId: string
): Promise<boolean> {
  if (isAdmin(sessionUser)) return true;

  const { data } = await supabaseAdmin
    .from("applications")
    .select("id")
    .eq("id", applicationId)
    .eq("user_id", sessionUser.userId)
    .single();

  return data !== null;
}
