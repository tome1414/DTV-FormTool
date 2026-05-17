import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, ApplicationStatus } from "@/lib/supabase";
import { getSessionUser, isAdmin, unauthorized } from "@/lib/api-auth";

const DOC_SELECT = `document_key, is_uploaded, is_approved, warning, auto_warning, storage_path, file_name, mime_type, uploaded_at`;

// GET /api/applications
export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as ApplicationStatus | null;
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  // ── 管理者: supabaseAdmin（RLSバイパス）で全件取得 ──────────────
  if (isAdmin(sessionUser)) {
    let query = supabaseAdmin
      .from("applications")
      .select(
        `*, documents(${DOC_SELECT}), status_history(status, timestamp)`,
        { count: "exact" }
      )
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (search) {
      query = query.or(
        `last_name.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%,application_number.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, count }, { status: 200 });
  }

  // ── 申請者: supabaseAdmin + user_id フィルター（RLSネストクエリ問題を回避）──
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select(`*, documents(${DOC_SELECT}), status_history(status, timestamp)`)
    .eq("user_id", sessionUser.userId)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 }, { status: 200 });
}

// POST /api/applications
export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

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

  const { lastName, firstName, middleName, email, nationality, consulateId } = body;

  if (!lastName || !firstName || !email) {
    return NextResponse.json(
      { error: "lastName, firstName, email are required" },
      { status: 400 }
    );
  }

  // 申請者は自分のユーザーIDのみ設定可、管理者は指定IDを使用可
  const userId = isAdmin(sessionUser) ? (body.userId ?? sessionUser.userId) : sessionUser.userId;

  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .insert({
      last_name: lastName,
      first_name: firstName,
      middle_name: middleName ?? null,
      email,
      nationality: nationality ?? null,
      consulate_id: consulateId ?? null,
      user_id: userId,
    })
    .select()
    .single();

  if (appError) {
    console.error("[applications POST]", appError);
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  const DOCUMENT_KEYS = [
    "passport", "bankStatement", "photo", "driverLicense",
    "flightTicket", "pgaLicense", "acceptanceLetter", "invoice", "existingPdfBundle",
  ];

  await supabaseAdmin.from("documents").insert(
    DOCUMENT_KEYS.map((key) => ({ application_id: app.id, document_key: key }))
  );

  await supabaseAdmin.from("status_history").insert({
    application_id: app.id,
    status: "レビュー中",
    changed_by: userId,
  });

  return NextResponse.json({ data: app }, { status: 201 });
}
