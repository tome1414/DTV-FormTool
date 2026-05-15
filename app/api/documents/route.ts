import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DocumentKey } from "@/lib/supabase";

// PATCH /api/documents
// 書類レコードの個別フィールドを更新（警告メモ・承認状態・アップロード状態・自動検出警告）
export async function PATCH(request: NextRequest) {
  let body: {
    applicationId: string;
    documentKey: DocumentKey;
    isUploaded?: boolean;
    isApproved?: boolean;
    warning?: string | null;
    autoWarning?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { applicationId, documentKey, isUploaded, isApproved, warning, autoWarning } = body;

  if (!applicationId || !documentKey) {
    return NextResponse.json(
      { error: "applicationId and documentKey are required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (isUploaded  !== undefined) updates.is_uploaded  = isUploaded;
  if (isApproved  !== undefined) updates.is_approved  = isApproved;
  if (warning     !== undefined) updates.warning      = warning;
  if (autoWarning !== undefined) updates.auto_warning = autoWarning;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("documents")
    .update(updates)
    .eq("application_id", applicationId)
    .eq("document_key", documentKey);

  if (error) {
    console.error("[documents PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
