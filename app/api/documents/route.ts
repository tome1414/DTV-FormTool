import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DocumentKey } from "@/lib/supabase";
import { getSessionUser, isAdmin, unauthorized, forbidden, canAccessApplication } from "@/lib/api-auth";

// PATCH /api/documents
export async function PATCH(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();

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
    return NextResponse.json({ error: "applicationId and documentKey are required" }, { status: 400 });
  }

  // 申請者は自分の申請のみ更新可。管理者専用フィールド（isApproved/warning/autoWarning）は管理者のみ。
  if (!await canAccessApplication(sessionUser, applicationId)) return forbidden();

  if ((isApproved !== undefined || warning !== undefined || autoWarning !== undefined) && !isAdmin(sessionUser)) {
    return forbidden();
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 200 });
}
