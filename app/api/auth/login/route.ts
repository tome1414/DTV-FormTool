import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: { email: string; password: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "メールアドレスとパスワードを入力してください。" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません。" },
      { status: 401 }
    );
  }

  // profiles からロール・名前情報を取得
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const displayName = profile
    ? [profile.last_name, profile.first_name].filter(Boolean).join(" ")
    : email;

  const authUser = {
    userId: data.user.id,
    email: data.user.email!,
    role: profile?.role ?? "applicant",
    name: displayName || undefined,
    lastName: profile?.last_name ?? undefined,
    firstName: profile?.first_name ?? undefined,
    middleName: profile?.middle_name ?? undefined,
    nationality: profile?.nationality ?? undefined,
    consulateId: profile?.consulate_id ?? undefined,
  };

  return NextResponse.json({ user: authUser }, { status: 200 });
}
