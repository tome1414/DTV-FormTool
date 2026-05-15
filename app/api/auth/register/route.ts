import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let body: {
    email: string;
    password: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    nationality: string;
    consulateId: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, lastName, firstName, middleName, nationality, consulateId } = body;

  if (!email || !password || !lastName || !firstName || !nationality || !consulateId) {
    return NextResponse.json({ error: "必須フィールドが不足しています。" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "パスワードは6文字以上で入力してください。" }, { status: 400 });
  }

  // Supabase Auth にユーザー作成（email_confirm: true で即時有効化）
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "applicant",
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName ?? null,
      nationality,
      consulate_id: consulateId,
    },
  });

  if (authError) {
    const message = authError.message.includes("already registered")
      ? "このメールアドレスはすでに登録されています。"
      : authError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // トリガーで profiles は自動作成されるが、念のため確認・作成
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: authData.user.id,
        email,
        role: "applicant",
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName ?? null,
        nationality,
        consulate_id: consulateId,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("[register] profile upsert error:", profileError);
  }

  // 申請者の初期申請レコードを作成
  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .insert({
      user_id: authData.user.id,
      last_name: lastName,
      first_name: firstName,
      middle_name: middleName ?? null,
      email,
      nationality,
      consulate_id: consulateId,
    })
    .select()
    .single();

  if (appError) {
    console.error("[register] application create error:", appError);
  } else {
    // 9種類の書類レコードを初期化
    const DOCUMENT_KEYS = [
      "passport", "bankStatement", "photo", "driverLicense",
      "flightTicket", "pgaLicense", "acceptanceLetter", "invoice", "existingPdfBundle",
    ];
    await supabaseAdmin.from("documents").insert(
      DOCUMENT_KEYS.map((key) => ({ application_id: app.id, document_key: key }))
    );

    await supabaseAdmin.from("status_history").insert({
      application_id: app.id,
      status: "確認待ち",
      changed_by: authData.user.id,
    });
  }

  return NextResponse.json(
    { message: "登録が完了しました。" },
    { status: 201 }
  );
}
