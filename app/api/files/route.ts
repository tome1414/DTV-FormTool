import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "documents";
const SIGNED_URL_EXPIRES_IN = 60 * 60; // 1時間

// GET /api/files?path=<storage_path>
// 署名付きURL（1時間有効）を返す
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

  if (error) {
    console.error("[files] signed url error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl }, { status: 200 });
}

// DELETE /api/files?path=<storage_path>
// ストレージからファイルを削除し、documentsレコードをリセット
export async function DELETE(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const { error: storageError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path]);

  if (storageError) {
    console.error("[files] delete error:", storageError);
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  // documentsレコードのストレージ情報をリセット
  await supabaseAdmin
    .from("documents")
    .update({
      storage_path: null,
      file_name: null,
      mime_type: null,
      file_size: null,
      is_uploaded: false,
      is_approved: false,
      uploaded_at: null,
    })
    .eq("storage_path", path);

  return NextResponse.json({ success: true }, { status: 200 });
}
