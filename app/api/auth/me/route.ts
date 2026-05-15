import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/auth/me — 現在のログインユーザー情報を返す
export async function GET() {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName = profile
    ? [profile.last_name, profile.first_name].filter(Boolean).join(" ")
    : user.email;

  return NextResponse.json({
    user: {
      userId: user.id,
      email: user.email!,
      role: profile?.role ?? "applicant",
      name: displayName || undefined,
      lastName: profile?.last_name ?? undefined,
      firstName: profile?.first_name ?? undefined,
      middleName: profile?.middle_name ?? undefined,
      nationality: profile?.nationality ?? undefined,
      consulateId: profile?.consulate_id ?? undefined,
    },
  });
}

// PATCH /api/auth/me — プロフィール更新（nationality / consulateId）
export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { nationality?: string; consulateId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.nationality  !== undefined) updates.nationality   = body.nationality;
  if (body.consulateId  !== undefined) updates.consulate_id  = body.consulateId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません。" }, { status: 400 });
  }

  const { data: profile, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const displayName = [profile.last_name, profile.first_name].filter(Boolean).join(" ");

  return NextResponse.json({
    user: {
      userId: user.id,
      email: user.email!,
      role: profile.role,
      name: displayName || undefined,
      lastName: profile.last_name ?? undefined,
      firstName: profile.first_name ?? undefined,
      middleName: profile.middle_name ?? undefined,
      nationality: profile.nationality ?? undefined,
      consulateId: profile.consulate_id ?? undefined,
    },
  });
}
