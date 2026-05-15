import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, ApplicationStatus } from "@/lib/supabase";

type Params = { params: { id: string } };

// GET /api/applications/[id]
// documents + status_history を含む詳細取得
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = params;

  const [appResult, historyResult] = await Promise.all([
    supabaseAdmin
      .from("applications")
      .select(`*, documents(*)`)
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("status_history")
      .select("*")
      .eq("application_id", id)
      .order("timestamp", { ascending: true }),
  ]);

  if (appResult.error) {
    const status = appResult.error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: appResult.error.message }, { status });
  }

  return NextResponse.json(
    { data: { ...appResult.data, statusHistory: historyResult.data ?? [] } },
    { status: 200 }
  );
}

// PATCH /api/applications/[id]
// 更新可能フィールド: status, notes, nationality, consulateId,
//                    documentWarnings, documentApprovals, changedBy
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = params;

  let body: {
    status?: ApplicationStatus;
    notes?: string;
    nationality?: string;
    consulateId?: string;
    changedBy?: string;
    // 書類単位の更新は /api/documents/[id] で行うが利便のためここでも受け付ける
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 現在のアプリケーションを取得
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("applications")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) {
    const status = fetchError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: fetchError.message }, { status });
  }

  // applications テーブルの更新
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined)      updates.status       = body.status;
  if (body.notes !== undefined)       updates.notes        = body.notes;
  if (body.nationality !== undefined) updates.nationality  = body.nationality;
  if (body.consulateId !== undefined) updates.consulate_id = body.consulateId;

  let updatedApp = current;

  if (Object.keys(updates).length > 0) {
    const { data, error: updateError } = await supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[applications PATCH]", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    updatedApp = data;
  }

  // ステータスが変わった場合のみ status_history に追記
  if (body.status && body.status !== current.status) {
    await supabaseAdmin.from("status_history").insert({
      application_id: id,
      status: body.status,
      changed_by: body.changedBy ?? null,
    });
  }

  return NextResponse.json({ data: updatedApp }, { status: 200 });
}

// DELETE /api/applications/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = params;

  // 関連ストレージファイルを先に削除
  const { data: docs } = await supabaseAdmin
    .from("documents")
    .select("storage_path")
    .eq("application_id", id)
    .not("storage_path", "is", null);

  if (docs && docs.length > 0) {
    const paths = docs.map((d) => d.storage_path as string);
    await supabaseAdmin.storage.from("documents").remove(paths);
  }

  const { error } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[applications DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
