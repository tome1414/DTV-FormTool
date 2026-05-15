import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, ApplicationStatus } from "@/lib/supabase";

// GET /api/applications?status=確認待ち&search=田中&limit=50&offset=0
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as ApplicationStatus | null;
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const userId = searchParams.get("userId");

  let query = supabaseAdmin
    .from("applications")
    .select(
      `*,
       documents(document_key, is_uploaded, is_approved, warning, auto_warning, storage_path, file_name, mime_type, uploaded_at),
       status_history(status, timestamp)`,
      { count: "exact" }
    )
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `last_name.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%,application_number.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[applications GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count }, { status: 200 });
}

// POST /api/applications
export async function POST(request: NextRequest) {
  let body: {
    lastName: string;
    firstName: string;
    middleName?: string;
    email: string;
    nationality?: string;
    consulateId?: string;
    userId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lastName, firstName, middleName, email, nationality, consulateId, userId } = body;

  if (!lastName || !firstName || !email) {
    return NextResponse.json(
      { error: "lastName, firstName, email are required" },
      { status: 400 }
    );
  }

  // アプリケーション作成
  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .insert({
      last_name: lastName,
      first_name: firstName,
      middle_name: middleName ?? null,
      email,
      nationality: nationality ?? null,
      consulate_id: consulateId ?? null,
      user_id: userId ?? null,
    })
    .select()
    .single();

  if (appError) {
    console.error("[applications POST]", appError);
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  // 9種類の書類レコードを初期化
  const DOCUMENT_KEYS = [
    "passport", "bankStatement", "photo", "driverLicense",
    "flightTicket", "pgaLicense", "acceptanceLetter", "invoice", "existingPdfBundle",
  ];

  const { error: docsError } = await supabaseAdmin.from("documents").insert(
    DOCUMENT_KEYS.map((key) => ({
      application_id: app.id,
      document_key: key,
    }))
  );

  if (docsError) {
    console.error("[applications POST] docs init error", docsError);
  }

  // 初期ステータス履歴を記録
  await supabaseAdmin.from("status_history").insert({
    application_id: app.id,
    status: "確認待ち",
    changed_by: userId ?? null,
  });

  return NextResponse.json({ data: app }, { status: 201 });
}
